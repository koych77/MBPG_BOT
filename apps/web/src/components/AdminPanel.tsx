import { useEffect, useState } from "react";
import { apiJson, receiptFileUrl } from "../lib/api";
import { copy, type Lang } from "../data/i18n";

type Overview = {
  stats: { clients: number; leads: number; receipts: number };
  recentLeads: Array<{
    id: string;
    parentName: string;
    phone: string;
    childName: string;
    childAge: string;
    direction: string;
    branch: string;
    status: string;
    createdAt: string;
    client: { telegramId: string; username?: string };
  }>;
  recentReceipts: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    status: string;
    createdAt: string;
    client: { telegramId: string; username?: string };
  }>;
};

export function AdminPanel({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await apiJson<Overview>("/api/admin/overview");
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.noAccess);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateLead(id: string, status: string) {
    await apiJson(`/api/admin/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await load();
  }

  async function updateReceipt(id: string, status: string) {
    await apiJson(`/api/admin/receipts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await load();
  }

  if (error) {
    return (
      <main className="screen">
        <section className="hero compact">
          <h1>{t.admin}</h1>
          <p>{t.noAccess}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return <main className="screen">Loading...</main>;
  }

  return (
    <main className="screen admin-screen">
      <section className="hero compact">
        <h1>{t.admin}</h1>
        <div className="stats">
          <span>{t.clients}: {data.stats.clients}</span>
          <span>{t.leads}: {data.stats.leads}</span>
          <span>{t.receipts}: {data.stats.receipts}</span>
        </div>
      </section>

      <section className="panel">
        <h2>{t.leads}</h2>
        <div className="admin-list">
          {data.recentLeads.map((lead) => (
            <article className="admin-item" key={lead.id}>
              <div>
                <strong>{lead.parentName}</strong>
                <p>{lead.phone} · {lead.childName}, {lead.childAge}</p>
                <small>{lead.direction} · {lead.branch} · TG {lead.client.telegramId}</small>
              </div>
              <select value={lead.status} onChange={(event) => void updateLead(lead.id, event.target.value)}>
                {["NEW", "CONTACTED", "BOOKED", "PAID", "LOST", "ARCHIVED"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{t.receipts}</h2>
        <div className="admin-list">
          {data.recentReceipts.map((receipt) => (
            <article className="admin-item" key={receipt.id}>
              <div>
                <strong>{receipt.fileName}</strong>
                <p>{receipt.mimeType} · TG {receipt.client.telegramId}</p>
                <a href={receiptFileUrl(receipt.id)} target="_blank" rel="noreferrer">Open file</a>
              </div>
              <select value={receipt.status} onChange={(event) => void updateReceipt(receipt.id, event.target.value)}>
                {["NEW", "APPROVED", "REJECTED"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
