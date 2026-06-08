import { useEffect, useState, type FormEvent } from "react";
import { apiJson, receiptFileUrl } from "../lib/api";
import { copy, type Lang } from "../data/i18n";

type ClientSummary = {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode: string;
  phone?: string;
  lastSeenAt: string;
  leads: Array<{ id: string; childName: string; childAge: string; direction: string; status: string }>;
  enrollments: Array<{ id: string; title: string; totalLessons: number; usedLessons: number; status: string }>;
};

type Overview = {
  stats: { clients: number; leads: number; receipts: number; reminders: number; broadcasts: number; enrollments: number; lessons: number };
  recentClients: ClientSummary[];
  recentLeads: Array<{
    id: string;
    parentName: string;
    phone: string;
    childName: string;
    childAge: string;
    direction: string;
    branch: string;
    status: string;
    client: { telegramId: string; username?: string };
  }>;
  recentReceipts: Array<{ id: string; fileName: string; mimeType: string; status: string; client: { telegramId: string; username?: string } }>;
  recentReminders: Array<{ id: string; type: string; message: string; dueAt: string; status: string; client: { telegramId: string; username?: string } }>;
  recentBroadcasts: Array<{ id: string; title: string; sentCount: number; failedCount: number; sentAt?: string; createdAt: string }>;
  recentEnrollments: Array<{
    id: string;
    title: string;
    branch?: string;
    totalLessons: number;
    usedLessons: number;
    remainingLessons: number;
    status: string;
    client: { id: string; telegramId: string; username?: string; firstName?: string };
  }>;
  recentLessons: Array<{
    id: string;
    title: string;
    branch?: string;
    startsAt: string;
    status: string;
    client: { telegramId: string; username?: string; firstName?: string };
    enrollment?: { id: string; title: string };
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
    await apiJson(`/api/admin/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  async function updateReceipt(id: string, status: string) {
    await apiJson(`/api/admin/receipts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  async function updateLesson(id: string, status: string) {
    await apiJson(`/api/admin/lessons/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  async function updateEnrollment(id: string, status: string, usedLessons: number, totalLessons: number) {
    await apiJson(`/api/admin/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, usedLessons, totalLessons })
    });
    await load();
  }

  async function createEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("enrollment");
    await apiJson("/api/admin/enrollments", {
      method: "POST",
      body: JSON.stringify({
        clientId: form.get("clientId"),
        title: form.get("title"),
        direction: form.get("direction"),
        branch: form.get("branch"),
        totalLessons: Number(form.get("totalLessons") || 0),
        usedLessons: Number(form.get("usedLessons") || 0)
      })
    });
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function createLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("lesson");
    await apiJson("/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify({
        clientId: form.get("clientId"),
        enrollmentId: form.get("enrollmentId") || undefined,
        title: form.get("title"),
        branch: form.get("branch"),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        note: form.get("note")
      })
    });
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function createReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("reminder");
    await apiJson("/api/admin/reminders", {
      method: "POST",
      body: JSON.stringify({
        clientId: form.get("clientId"),
        type: form.get("type"),
        message: form.get("message"),
        dueAt: new Date(String(form.get("dueAt"))).toISOString()
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
      body: JSON.stringify({ title: form.get("title"), message: form.get("message"), audience: "all" })
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

  if (!data) return <main className="screen">Loading...</main>;

  return (
    <main className="screen admin-screen">
      <section className="hero compact">
        <h1>{t.admin}</h1>
        <div className="stats">
          <span>{t.clients}: {data.stats.clients}</span>
          <span>{t.leads}: {data.stats.leads}</span>
          <span>{t.receipts}: {data.stats.receipts}</span>
          <span>Subscriptions: {data.stats.enrollments}</span>
          <span>Lessons: {data.stats.lessons}</span>
          <span>Reminders: {data.stats.reminders}</span>
        </div>
      </section>

      <section className="panel">
        <h2>CRM</h2>
        <div className="admin-list">
          {data.recentClients.map((client) => (
            <article className="admin-item crm-item" key={client.id}>
              <div>
                <strong>{client.firstName || client.username || "Telegram client"}</strong>
                <p>TG {client.telegramId}{client.username ? ` - @${client.username}` : ""}{client.phone ? ` - ${client.phone}` : ""}</p>
                <small>Language {client.languageCode} - leads {client.leads.length} - last seen {new Date(client.lastSeenAt).toLocaleString()}</small>
                {client.leads[0] && <p>Last request: {client.leads[0].childName}, {client.leads[0].childAge} - {client.leads[0].status}</p>}
                {client.enrollments[0] && <p>Subscription: {client.enrollments[0].title} - {client.enrollments[0].usedLessons}/{client.enrollments[0].totalLessons}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Create subscription</h2>
        <form className="form" onSubmit={(event) => void createEnrollment(event)}>
          <ClientSelect clients={data.recentClients} />
          <input name="title" placeholder="Subscription title" required />
          <select name="direction" defaultValue="pool">
            <option value="pool">Pool</option>
            <option value="gym">Gym</option>
            <option value="massage">Massage</option>
          </select>
          <input name="branch" placeholder="Branch" />
          <input min="0" name="totalLessons" placeholder="Total lessons" required type="number" />
          <input min="0" name="usedLessons" placeholder="Used lessons" type="number" />
          <button className="wide-action" disabled={busy === "enrollment"} type="submit">Create subscription</button>
        </form>
      </section>

      <section className="panel">
        <h2>Schedule lesson</h2>
        <form className="form" onSubmit={(event) => void createLesson(event)}>
          <ClientSelect clients={data.recentClients} />
          <select name="enrollmentId">
            <option value="">Without subscription</option>
            {data.recentEnrollments.map((enrollment) => (
              <option key={enrollment.id} value={enrollment.id}>{enrollment.title} - TG {enrollment.client.telegramId}</option>
            ))}
          </select>
          <input name="title" placeholder="Lesson title" required />
          <input name="branch" placeholder="Branch" />
          <input name="startsAt" required type="datetime-local" />
          <textarea name="note" placeholder="Admin note" rows={2} />
          <button className="wide-action" disabled={busy === "lesson"} type="submit">Schedule lesson</button>
        </form>
      </section>

      <section className="panel">
        <h2>Subscriptions</h2>
        <div className="admin-list">
          {data.recentEnrollments.map((enrollment) => (
            <article className="admin-item" key={enrollment.id}>
              <div>
                <strong>{enrollment.title}</strong>
                <p>TG {enrollment.client.telegramId} - used {enrollment.usedLessons} - remaining {enrollment.remainingLessons}</p>
                <small>{enrollment.branch || ""}</small>
              </div>
              <select value={enrollment.status} onChange={(event) => void updateEnrollment(enrollment.id, event.target.value, enrollment.usedLessons, enrollment.totalLessons)}>
                {["ACTIVE", "PAUSED", "COMPLETED", "CANCELED"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Lessons</h2>
        <div className="admin-list">
          {data.recentLessons.map((lesson) => (
            <article className="admin-item" key={lesson.id}>
              <div>
                <strong>{lesson.title}</strong>
                <p>TG {lesson.client.telegramId} - {new Date(lesson.startsAt).toLocaleString()}</p>
                <small>{lesson.branch || ""}{lesson.enrollment ? ` - ${lesson.enrollment.title}` : ""}</small>
              </div>
              <select value={lesson.status} onChange={(event) => void updateLesson(lesson.id, event.target.value)}>
                {["SCHEDULED", "ATTENDED", "MISSED", "CANCELED"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{t.leads}</h2>
        <div className="admin-list">
          {data.recentLeads.map((lead) => (
            <article className="admin-item" key={lead.id}>
              <div>
                <strong>{lead.parentName}</strong>
                <p>{lead.phone} - {lead.childName}, {lead.childAge}</p>
                <small>{lead.direction} - {lead.branch} - TG {lead.client.telegramId}</small>
              </div>
              <select value={lead.status} onChange={(event) => void updateLead(lead.id, event.target.value)}>
                {["NEW", "CONTACTED", "BOOKED", "PAID", "LOST", "ARCHIVED"].map((status) => <option key={status}>{status}</option>)}
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
                <p>{receipt.mimeType} - TG {receipt.client.telegramId}</p>
                <a href={receiptFileUrl(receipt.id)} target="_blank" rel="noreferrer">Open file</a>
              </div>
              <select value={receipt.status} onChange={(event) => void updateReceipt(receipt.id, event.target.value)}>
                {["NEW", "APPROVED", "REJECTED"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Reminder</h2>
        <form className="form" onSubmit={(event) => void createReminder(event)}>
          <ClientSelect clients={data.recentClients} />
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
        <h2>Scheduled reminders</h2>
        <div className="admin-list">
          {data.recentReminders.map((reminder) => (
            <article className="admin-item" key={reminder.id}>
              <div>
                <strong>{reminder.type} - {reminder.status}</strong>
                <p>{reminder.message}</p>
                <small>TG {reminder.client.telegramId} - {new Date(reminder.dueAt).toLocaleString()}</small>
              </div>
              {reminder.status === "SCHEDULED" && <button className="mini-button" onClick={() => void cancelReminder(reminder.id)} type="button">Cancel</button>}
            </article>
          ))}
        </div>
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
        <h2>Broadcast history</h2>
        <div className="admin-list">
          {data.recentBroadcasts.map((broadcast) => (
            <article className="admin-item" key={broadcast.id}>
              <div>
                <strong>{broadcast.title}</strong>
                <p>Sent {broadcast.sentCount} - failed {broadcast.failedCount}</p>
                <small>{new Date(broadcast.sentAt || broadcast.createdAt).toLocaleString()}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ClientSelect({ clients }: { clients: ClientSummary[] }) {
  return (
    <select name="clientId" required>
      <option value="">Select client</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.firstName || client.username || client.telegramId} - TG {client.telegramId}
        </option>
      ))}
    </select>
  );
}
