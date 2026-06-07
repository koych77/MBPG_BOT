import { useEffect, useState, type FormEvent } from "react";
import { apiJson, receiptFileUrl } from "../lib/api";
import { copy, type Lang } from "../data/i18n";

type Overview = {
  stats: { clients: number; leads: number; receipts: number; reminders: number; broadcasts: number };
  recentClients: Array<{
    id: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode: string;
    phone?: string;
    lastSeenAt: string;
    createdAt: string;
    leads: Array<{
      id: string;
      parentName: string;
      phone: string;
      childName: string;
      childAge: string;
      direction: string;
      status: string;
      createdAt: string;
    }>;
  }>;
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
  recentReminders: Array<{
    id: string;
    type: string;
    message: string;
    dueAt: string;
    status: string;
    client: { telegramId: string; username?: string };
  }>;
  recentBroadcasts: Array<{
    id: string;
    title: string;
    sentCount: number;
    failedCount: number;
    sentAt?: string;
    createdAt: string;
  }>;
};

export function AdminPanel({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

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

  async function createReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dueAtRaw = String(form.get("dueAt") ?? "");
    setBusy("reminder");
    await apiJson("/api/admin/reminders", {
      method: "POST",
      body: JSON.stringify({
        clientId: form.get("clientId"),
        type: form.get("type"),
        message: form.get("message"),
        dueAt: new Date(dueAtRaw).toISOString()
      })
    });
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function sendBroadcast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("broadcast");
    await apiJson("/api/admin/broadcasts", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        message: form.get("message"),
        audience: "all"
      })
    });
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function cancelReminder(id: string) {
    await apiJson(`/api/admin/reminders/${id}/cancel`, { method: "PATCH", body: JSON.stringify({}) });
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
          <span>Reminders: {data.stats.reminders}</span>
          <span>Broadcasts: {data.stats.broadcasts}</span>
        </div>
      </section>

      <section className="panel">
        <h2>CRM</h2>
        <div className="admin-list">
          {data.recentClients.map((client) => (
            <article className="admin-item crm-item" key={client.id}>
              <div>
                <strong>{client.firstName || client.username || "Telegram client"}</strong>
                <p>TG {client.telegramId}{client.username ? ` · @${client.username}` : ""}{client.phone ? ` · ${client.phone}` : ""}</p>
                <small>Language {client.languageCode} · leads {client.leads.length} · last seen {new Date(client.lastSeenAt).toLocaleString()}</small>
                {client.leads[0] && (
                  <p>Last: {client.leads[0].childName}, {client.leads[0].childAge} · {client.leads[0].direction} · {client.leads[0].status}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Reminder</h2>
        <form className="form" onSubmit={(event) => void createReminder(event)}>
          <select name="clientId" required>
            <option value="">Select client</option>
            {data.recentClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName || client.username || client.telegramId} · TG {client.telegramId}
              </option>
            ))}
          </select>
          <select name="type" defaultValue="custom">
            <option value="lesson">Lesson reminder</option>
            <option value="payment">Payment reminder</option>
            <option value="promo">Promo</option>
            <option value="news">News</option>
            <option value="custom">Custom</option>
          </select>
          <input name="dueAt" required type="datetime-local" />
          <textarea name="message" placeholder="Message to client" required rows={3} />
          <button className="wide-action" disabled={busy === "reminder"} type="submit">Create reminder</button>
        </form>
      </section>

      <section className="panel">
        <h2>Broadcast</h2>
        <form className="form" onSubmit={(event) => void sendBroadcast(event)}>
          <input name="title" placeholder="Campaign title" required />
          <textarea name="message" placeholder="Message for all saved Telegram clients" required rows={4} />
          <button className="wide-action" disabled={busy === "broadcast"} type="submit">Send to all clients</button>
        </form>
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

      <section className="panel">
        <h2>Scheduled reminders</h2>
        <div className="admin-list">
          {data.recentReminders.map((reminder) => (
            <article className="admin-item" key={reminder.id}>
              <div>
                <strong>{reminder.type} · {reminder.status}</strong>
                <p>{reminder.message}</p>
                <small>TG {reminder.client.telegramId} · {new Date(reminder.dueAt).toLocaleString()}</small>
              </div>
              {reminder.status === "SCHEDULED" && (
                <button className="mini-button" onClick={() => void cancelReminder(reminder.id)} type="button">Cancel</button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Broadcast history</h2>
        <div className="admin-list">
          {data.recentBroadcasts.map((broadcast) => (
            <article className="admin-item" key={broadcast.id}>
              <div>
                <strong>{broadcast.title}</strong>
                <p>Sent {broadcast.sentCount} · failed {broadcast.failedCount}</p>
                <small>{new Date(broadcast.sentAt || broadcast.createdAt).toLocaleString()}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
