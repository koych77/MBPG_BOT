import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiForm, apiJson, coachPhotoUrl, contentPostImageUrl, receiptFileUrl } from "../lib/api";
import { copy, type Lang } from "../data/i18n";

type AdminTab = "work" | "clients" | "payments" | "prices" | "content" | "messages" | "log";

type ClientSummary = {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode: string;
  phone?: string;
  notes?: string;
  lastSeenAt: string;
  leads: Array<{ id: string; childName: string; childAge: string; direction: string; status: string }>;
  enrollments: Array<{ id: string; title: string; totalLessons: number; usedLessons: number; status: string }>;
};

type LeadSummary = {
  id: string;
  parentName: string;
  phone: string;
  childName: string;
  childAge: string;
  direction: string;
  branch: string;
  status: string;
  client: { id?: string; telegramId: string; username?: string };
};

type PriceSummary = {
  id: string;
  slug: string;
  direction: string;
  branch?: string;
  titleRu: string;
  titleKa?: string;
  titleEn?: string;
  ageRu?: string;
  packageRu: string;
  priceRu: string;
  noteRu?: string;
  lessons?: number;
  sortOrder: number;
  isActive: boolean;
};

type Overview = {
  stats: { clients: number; leads: number; receipts: number; reminders: number; broadcasts: number; enrollments: number; lessons: number; coaches: number; posts: number; prices: number; notifications: number };
  recentClients: ClientSummary[];
  recentLeads: LeadSummary[];
  recentReceipts: Array<{ id: string; fileName: string; mimeType: string; status: string; client: { id?: string; telegramId: string; username?: string } }>;
  recentReminders: Array<{ id: string; type: string; message: string; dueAt: string; status: string; client: { id?: string; telegramId: string; username?: string } }>;
  recentBroadcasts: Array<{ id: string; title: string; message: string; type: string; audience: string; direction?: string; branch?: string; status: string; scheduledAt?: string; sentCount: number; failedCount: number; sentAt?: string; createdAt: string }>;
  recentEnrollments: Array<{ id: string; title: string; branch?: string; totalLessons: number; usedLessons: number; remainingLessons: number; status: string; client: { id: string; telegramId: string; username?: string; firstName?: string } }>;
  recentLessons: Array<{ id: string; title: string; branch?: string; startsAt: string; status: string; client: { telegramId: string; username?: string; firstName?: string }; enrollment?: { id: string; title: string } }>;
  recentCoaches: Array<{ id: string; name: string; direction: string; branch?: string; serviceSlugs: string[]; bio?: string; experience?: string; interview?: string; videoUrl?: string; isActive: boolean; hasPhoto: boolean }>;
  recentPosts: Array<{ id: string; type: string; languageCode: string; title: string; body: string; direction?: string; serviceSlugs: string[]; isPublished: boolean; hasImage: boolean; createdAt: string }>;
  recentPrices: PriceSummary[];
  recentNotifications: Array<{ id: string; audience: string; type: string; title?: string; message: string; status: string; error?: string; telegramId?: string; createdAt: string; client?: { telegramId: string; username?: string; firstName?: string } | null }>;
};

export function AdminPanel({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState<AdminTab>("work");
  const [query, setQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

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

  async function createCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("coach");
    await apiForm("/api/admin/coaches", new FormData(event.currentTarget));
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("post");
    await apiForm("/api/admin/posts", new FormData(event.currentTarget));
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  function pricePayload(form: FormData) {
    return {
      slug: form.get("slug"),
      direction: form.get("direction"),
      branch: form.get("branch"),
      titleRu: form.get("titleRu"),
      titleKa: form.get("titleKa"),
      titleEn: form.get("titleEn"),
      ageRu: form.get("ageRu"),
      packageRu: form.get("packageRu"),
      priceRu: form.get("priceRu"),
      noteRu: form.get("noteRu"),
      lessons: Number(form.get("lessons") || 0),
      sortOrder: Number(form.get("sortOrder") || 0),
      isActive: form.get("isActive") === "true"
    };
  }

  async function createPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("price");
    await apiJson("/api/admin/prices", { method: "POST", body: JSON.stringify(pricePayload(form)) });
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function updatePrice(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(`price:${id}`);
    await apiJson(`/api/admin/prices/${id}`, { method: "PATCH", body: JSON.stringify(pricePayload(form)) });
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
      body: JSON.stringify({
        title: form.get("title"),
        message: form.get("message"),
        type: form.get("type"),
        audience: form.get("audience"),
        direction: form.get("direction") || undefined,
        branch: form.get("branch") || undefined,
        scheduledAt: form.get("scheduledAt") ? new Date(String(form.get("scheduledAt"))).toISOString() : undefined
      })
    });
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function cancelBroadcast(id: string) {
    await apiJson(`/api/admin/broadcasts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CANCELED" }) });
    await load();
  }

  async function cancelReminder(id: string) {
    await apiJson(`/api/admin/reminders/${id}/cancel`, { method: "PATCH", body: JSON.stringify({}) });
    await load();
  }

  async function sendClientMessage(event: FormEvent<HTMLFormElement>, clientId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(`message:${clientId}`);
    await apiJson(`/api/admin/clients/${clientId}/message`, {
      method: "POST",
      body: JSON.stringify({ message: form.get("message") })
    });
    event.currentTarget.reset();
    setBusy("");
    await load();
  }

  async function saveClientNotes(event: FormEvent<HTMLFormElement>, clientId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(`notes:${clientId}`);
    await apiJson(`/api/admin/clients/${clientId}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ notes: form.get("notes") })
    });
    setBusy("");
    await load();
  }

  const todayLessons = useMemo(() => {
    if (!data) return [];
    const today = new Date().toDateString();
    return data.recentLessons.filter((lesson) => new Date(lesson.startsAt).toDateString() === today && lesson.status === "SCHEDULED");
  }, [data]);

  const newLeads = data?.recentLeads.filter((lead) => lead.status === "NEW") ?? [];
  const newReceipts = data?.recentReceipts.filter((receipt) => receipt.status === "NEW") ?? [];
  const lowEnrollments = data?.recentEnrollments.filter((enrollment) => enrollment.status === "ACTIVE" && enrollment.remainingLessons <= 2) ?? [];
  const filteredClients = data?.recentClients.filter((client) => {
    const text = [client.telegramId, client.username, client.firstName, client.lastName, client.phone].filter(Boolean).join(" ").toLowerCase();
    return text.includes(query.toLowerCase());
  }) ?? [];
  const selectedClient = data?.recentClients.find((client) => client.id === selectedClientId) ?? filteredClients[0];

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
          <button type="button" onClick={() => setTab("work")}>Today {todayLessons.length}</button>
          <button type="button" onClick={() => setTab("work")}>New leads {newLeads.length}</button>
          <button type="button" onClick={() => setTab("payments")}>Receipts {newReceipts.length}</button>
          <button type="button" onClick={() => setTab("clients")}>Clients {data.stats.clients}</button>
          <button type="button" onClick={() => setTab("log")}>Alerts {data.stats.notifications}</button>
        </div>
      </section>

      <section className="panel admin-tabs">
        {[
          ["work", "Работа"],
          ["clients", "Клиенты"],
          ["payments", "Оплаты"],
          ["prices", "Прайс"],
          ["content", "Контент"],
          ["messages", "Рассылки"],
          ["log", "Журнал"]
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id as AdminTab)} type="button">{label}</button>
        ))}
      </section>

      {tab === "work" && (
        <>
          <TaskSection title="Сегодня" empty="На сегодня нет запланированных занятий.">
            {todayLessons.map((lesson) => (
              <article className="admin-item" key={lesson.id}>
                <div>
                  <strong>{new Date(lesson.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {lesson.title}</strong>
                  <p>TG {lesson.client.telegramId} - {lesson.branch || "branch not set"}</p>
                  <small>{lesson.enrollment?.title || "without subscription"}</small>
                </div>
                <div className="quick-actions">
                  <button onClick={() => void updateLesson(lesson.id, "ATTENDED")} type="button">Пришел</button>
                  <button onClick={() => void updateLesson(lesson.id, "MISSED")} type="button">Не пришел</button>
                  <button onClick={() => void updateLesson(lesson.id, "CANCELED")} type="button">Отмена</button>
                </div>
              </article>
            ))}
          </TaskSection>

          <TaskSection title="Новые заявки" empty="Новых заявок нет.">
            {newLeads.map((lead) => (
              <article className="admin-item" key={lead.id}>
                <div>
                  <strong>{lead.parentName}</strong>
                  <p>{lead.phone} - {lead.childName}, {lead.childAge}</p>
                  <small>{lead.direction} - {lead.branch} - TG {lead.client.telegramId}</small>
                </div>
                <div className="quick-actions">
                  <button onClick={() => void updateLead(lead.id, "CONTACTED")} type="button">Связались</button>
                  <button onClick={() => void updateLead(lead.id, "BOOKED")} type="button">Подтвердить</button>
                </div>
              </article>
            ))}
          </TaskSection>

          <TaskSection title="Абонементы требуют внимания" empty="Критичных абонементов нет.">
            {lowEnrollments.map((enrollment) => (
              <article className="admin-item" key={enrollment.id}>
                <div>
                  <strong>{enrollment.title}</strong>
                  <p>TG {enrollment.client.telegramId} - осталось {enrollment.remainingLessons}</p>
                  <small>{enrollment.branch || ""}</small>
                </div>
              </article>
            ))}
          </TaskSection>

          <QuickForms data={data} busy={busy} createEnrollment={createEnrollment} createLesson={createLesson} />
        </>
      )}

      {tab === "clients" && (
        <section className="panel">
          <h2>Клиенты</h2>
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по имени, телефону, Telegram ID" />
          <div className="crm-layout">
            <div className="admin-list crm-client-list">
              {filteredClients.map((client) => (
                <button className={`crm-client-button ${selectedClient?.id === client.id ? "active" : ""}`} key={client.id} onClick={() => setSelectedClientId(client.id)} type="button">
                  <strong>{client.firstName || client.username || "Telegram client"}</strong>
                  <span>TG {client.telegramId}{client.username ? ` - @${client.username}` : ""}</span>
                  <small>{client.phone || "phone not set"}</small>
                </button>
              ))}
            </div>
            {selectedClient ? (
              <ClientCard
                busy={busy}
                client={selectedClient}
                createEnrollment={createEnrollment}
                createLesson={createLesson}
                data={data}
                saveClientNotes={saveClientNotes}
                sendClientMessage={sendClientMessage}
                updateLesson={updateLesson}
              />
            ) : (
              <p className="muted">Клиенты не найдены.</p>
            )}
          </div>
        </section>
      )}

      {tab === "payments" && (
        <section className="panel">
          <h2>Оплаты</h2>
          <div className="admin-list">
            {data.recentReceipts.map((receipt) => (
              <article className="admin-item" key={receipt.id}>
                <div>
                  <strong>{receipt.fileName}</strong>
                  <p>{receipt.mimeType} - TG {receipt.client.telegramId}</p>
                  <a href={receiptFileUrl(receipt.id)} target="_blank" rel="noreferrer">Открыть чек</a>
                </div>
                <div className="quick-actions">
                  <button onClick={() => void updateReceipt(receipt.id, "APPROVED")} type="button">Принять</button>
                  <button onClick={() => void updateReceipt(receipt.id, "REJECTED")} type="button">Отклонить</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "prices" && (
        <section className="panel">
          <h2>Прайс</h2>
          <form className="form" onSubmit={(event) => void createPrice(event)}>
            <input name="titleRu" placeholder="Название: Грудничковое плавание" required />
            <input name="slug" placeholder="Код услуги: baby-swim" required />
            <select name="direction" defaultValue="pool"><option value="pool">Бассейн</option><option value="gym">Зал</option><option value="massage">Массаж</option></select>
            <input name="branch" placeholder="Локация" />
            <input name="ageRu" placeholder="Возраст: 1 мес - 12 мес" />
            <input name="packageRu" placeholder="Пакет: 8 занятий" required />
            <input name="priceRu" placeholder="Цена: 480 лари / от 40 лари" required />
            <input name="noteRu" placeholder="Примечание" defaultValue="Уточняйте у администратора" />
            <input min="0" name="lessons" placeholder="Количество занятий" type="number" />
            <input name="sortOrder" placeholder="Порядок" type="number" />
            <select name="isActive" defaultValue="true"><option value="true">Показывать</option><option value="false">Скрыть</option></select>
            <button className="wide-action" disabled={busy === "price"} type="submit">Добавить строку прайса</button>
          </form>

          <div className="admin-list price-admin-list">
            {data.recentPrices.map((price) => (
              <details key={price.id}>
                <summary>{price.titleRu} - {price.packageRu} - {price.priceRu} {price.isActive ? "" : "(скрыто)"}</summary>
                <form className="form" onSubmit={(event) => void updatePrice(event, price.id)}>
                  <input name="titleRu" defaultValue={price.titleRu} required />
                  <input name="slug" defaultValue={price.slug} required />
                  <select name="direction" defaultValue={price.direction}><option value="pool">Бассейн</option><option value="gym">Зал</option><option value="massage">Массаж</option></select>
                  <input name="branch" defaultValue={price.branch || ""} />
                  <input name="ageRu" defaultValue={price.ageRu || ""} />
                  <input name="packageRu" defaultValue={price.packageRu} required />
                  <input name="priceRu" defaultValue={price.priceRu} required />
                  <input name="noteRu" defaultValue={price.noteRu || ""} />
                  <input min="0" name="lessons" defaultValue={price.lessons ?? 0} type="number" />
                  <input name="sortOrder" defaultValue={price.sortOrder} type="number" />
                  <select name="isActive" defaultValue={String(price.isActive)}><option value="true">Показывать</option><option value="false">Скрыть</option></select>
                  <button className="wide-action" disabled={busy === `price:${price.id}`} type="submit">Сохранить</button>
                </form>
              </details>
            ))}
          </div>
        </section>
      )}

      {tab === "content" && (
        <>
          <section className="panel">
            <h2>Тренеры</h2>
            <form className="form" onSubmit={(event) => void createCoach(event)}>
              <input name="name" placeholder="Coach name" required />
              <select name="direction" defaultValue="pool"><option value="pool">Pool</option><option value="gym">Gym</option><option value="massage">Massage</option></select>
              <input name="branch" placeholder="Branch" />
              <input name="serviceSlugs" placeholder="Service slugs: baby-swim,kids-swim" />
              <input name="experience" placeholder="Experience" />
              <textarea name="bio" placeholder="Coach description" rows={3} />
              <textarea name="interview" placeholder="Interview / characteristics" rows={3} />
              <input name="videoUrl" placeholder="Video URL" />
              <select name="isActive" defaultValue="true"><option value="true">Visible</option><option value="false">Hidden</option></select>
              <input accept="image/*" name="photo" type="file" />
              <button className="wide-action" disabled={busy === "coach"} type="submit">Add coach</button>
            </form>
            <ContentList items={data.recentCoaches.map((coach) => ({ id: coach.id, title: coach.name, meta: `${coach.direction} - ${coach.isActive ? "visible" : "hidden"}`, link: coach.hasPhoto ? coachPhotoUrl(coach.id) : undefined }))} />
          </section>

          <section className="panel">
            <h2>Новости и акции</h2>
            <form className="form" onSubmit={(event) => void createPost(event)}>
              <select name="type" defaultValue="news"><option value="news">News</option><option value="promo">Promo</option></select>
              <select name="languageCode" defaultValue="ru"><option value="ru">RU</option><option value="ka">GE</option><option value="en">EN</option></select>
              <input name="title" placeholder="Title" required />
              <textarea name="body" placeholder="Text" required rows={4} />
              <select name="direction" defaultValue="all"><option value="all">All directions</option><option value="pool">Pool</option><option value="gym">Gym</option><option value="massage">Massage</option></select>
              <input name="serviceSlugs" placeholder="Service slugs, optional" />
              <input name="ctaLabel" placeholder="Button label, optional" />
              <input name="ctaUrl" placeholder="Button URL, optional" />
              <select name="isPublished" defaultValue="true"><option value="true">Published</option><option value="false">Draft</option></select>
              <input accept="image/*" name="image" type="file" />
              <button className="wide-action" disabled={busy === "post"} type="submit">Add publication</button>
            </form>
            <ContentList items={data.recentPosts.map((post) => ({ id: post.id, title: post.title, meta: `${post.type} - ${post.languageCode} - ${post.isPublished ? "published" : "draft"}`, link: post.hasImage ? contentPostImageUrl(post.id) : undefined }))} />
          </section>
        </>
      )}

      {tab === "messages" && (
        <>
          <section className="panel">
            <h2>??????????? ???????</h2>
            <form className="form" onSubmit={(event) => void createReminder(event)}>
              <ClientSelect clients={data.recentClients} />
              <select name="type" defaultValue="custom"><option value="lesson">Lesson reminder</option><option value="payment">Payment reminder</option><option value="promo">Promo</option><option value="news">News</option><option value="custom">Custom</option></select>
              <input name="dueAt" required type="datetime-local" />
              <textarea name="message" placeholder="Message to client" required rows={3} />
              <button className="wide-action" disabled={busy === "reminder"} type="submit">Create reminder</button>
            </form>
          </section>

          <section className="panel">
            <h2>?????????? ?????????????</h2>
            <form className="form" onSubmit={(event) => void sendBroadcast(event)}>
              <input name="title" placeholder="???????? ????????" required />
              <select name="type" defaultValue="custom">
                <option value="lesson">??????????? ? ???????</option>
                <option value="payment">??????????? ?? ??????</option>
                <option value="promo">?????</option>
                <option value="news">???????</option>
                <option value="custom">??????</option>
              </select>
              <select name="audience" defaultValue="all">
                <option value="all">??? ???????</option>
                <option value="active">???????? ??????????</option>
                <option value="low_balance">???????? 0-2 ???????</option>
                <option value="no_schedule">??? ?????????? ???????</option>
                <option value="direction">?? ???????????</option>
                <option value="branch">?? ???????</option>
              </select>
              <select name="direction" defaultValue="">
                <option value="">??????????? ?? ???????</option>
                <option value="pool">???????</option>
                <option value="gym">???</option>
                <option value="massage">??????</option>
              </select>
              <select name="branch" defaultValue="">
                <option value="">??????? ?? ???????</option>
                <option value="Pool Javakhishvili 28">Pool Javakhishvili 28</option>
                <option value="Gym Gorgasali 127">Gym Gorgasali 127</option>
              </select>
              <input name="scheduledAt" type="datetime-local" />
              <textarea name="message" placeholder="????? ???????????" required rows={4} />
              <button className="wide-action" disabled={busy === "broadcast"} type="submit">????????????? ???????????</button>
            </form>
          </section>

          <TaskSection title="??????????????? ???????????" empty="??? ??????????????? ???????????.">
            {data.recentReminders.map((reminder) => (
              <article className="admin-item" key={reminder.id}>
                <div><strong>{reminder.type} - {reminder.status}</strong><p>{reminder.message}</p><small>TG {reminder.client.telegramId} - {new Date(reminder.dueAt).toLocaleString()}</small></div>
                {reminder.status === "SCHEDULED" && <button className="mini-button" onClick={() => void cancelReminder(reminder.id)} type="button">Cancel</button>}
              </article>
            ))}
          </TaskSection>

          <TaskSection title="??????? ????????" empty="???????? ???? ???.">
            {data.recentBroadcasts.map((broadcast) => (
              <article className="admin-item" key={broadcast.id}>
                <div>
                  <strong>{broadcast.title} - {broadcast.status}</strong>
                  <p>{broadcast.message}</p>
                  <small>{broadcast.type} - {broadcast.audience}{broadcast.direction ? ` - ${broadcast.direction}` : ""}{broadcast.branch ? ` - ${broadcast.branch}` : ""} - scheduled {broadcast.scheduledAt ? new Date(broadcast.scheduledAt).toLocaleString() : "now"} - sent {broadcast.sentCount} - failed {broadcast.failedCount}</small>
                </div>
                {broadcast.status === "SCHEDULED" && <button className="mini-button" onClick={() => void cancelBroadcast(broadcast.id)} type="button">????????</button>}
              </article>
            ))}
          </TaskSection>
        </>
      )}

      {tab === "log" && (
        <section className="panel">
          <h2>Журнал уведомлений</h2>
          <div className="admin-list">
            {data.recentNotifications.map((notification) => (
              <article className="admin-item crm-item" key={notification.id}>
                <div>
                  <strong>{notification.type} - {notification.status}</strong>
                  <p>{notification.message}</p>
                  <small>{notification.audience} - TG {notification.telegramId || notification.client?.telegramId || "-"} - {new Date(notification.createdAt).toLocaleString()}{notification.error ? ` - ${notification.error}` : ""}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function TaskSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="admin-list">{hasItems ? children : <p className="muted">{empty}</p>}</div>
    </section>
  );
}

function ClientCard({
  busy,
  client,
  createEnrollment,
  createLesson,
  data,
  saveClientNotes,
  sendClientMessage,
  updateLesson
}: {
  busy: string;
  client: ClientSummary;
  createEnrollment: (event: FormEvent<HTMLFormElement>) => void;
  createLesson: (event: FormEvent<HTMLFormElement>) => void;
  data: Overview;
  saveClientNotes: (event: FormEvent<HTMLFormElement>, clientId: string) => void;
  sendClientMessage: (event: FormEvent<HTMLFormElement>, clientId: string) => void;
  updateLesson: (id: string, status: string) => void;
}) {
  const clientName = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.username || "Telegram client";
  const clientLeads = data.recentLeads.filter((lead) => lead.client.telegramId === client.telegramId);
  const clientEnrollments = data.recentEnrollments.filter((enrollment) => enrollment.client.id === client.id || enrollment.client.telegramId === client.telegramId);
  const clientLessons = data.recentLessons.filter((lesson) => lesson.client.telegramId === client.telegramId);
  const clientReceipts = data.recentReceipts.filter((receipt) => receipt.client.telegramId === client.telegramId);
  const clientReminders = data.recentReminders.filter((reminder) => reminder.client.telegramId === client.telegramId);
  const clientNotifications = data.recentNotifications.filter((notification) => notification.telegramId === client.telegramId || notification.client?.telegramId === client.telegramId);

  return (
    <article className="crm-card">
      <header className="crm-card-header">
        <div>
          <h3>{clientName}</h3>
          <p>TG {client.telegramId}{client.username ? ` - @${client.username}` : ""}</p>
          <small>Language {client.languageCode} - last seen {new Date(client.lastSeenAt).toLocaleString()}</small>
        </div>
        <div className="crm-badges">
          <span>{clientLeads.length} заявки</span>
          <span>{clientEnrollments.length} абонементы</span>
          <span>{clientLessons.length} занятия</span>
        </div>
      </header>

      <div className="crm-grid">
        <section className="crm-block">
          <h4>Связь и заметка</h4>
          <p>{client.phone || "Телефон пока не указан"}</p>
          <form className="form compact-form" onSubmit={(event) => void sendClientMessage(event, client.id)}>
            <textarea name="message" placeholder="Сообщение клиенту в Telegram" required rows={3} />
            <button className="wide-action" disabled={busy === `message:${client.id}`} type="submit">Отправить клиенту</button>
          </form>
          <form className="form compact-form" onSubmit={(event) => void saveClientNotes(event, client.id)}>
            <textarea defaultValue={client.notes || ""} name="notes" placeholder="Внутренняя заметка администратора" rows={4} />
            <button className="mini-button" disabled={busy === `notes:${client.id}`} type="submit">Сохранить заметку</button>
          </form>
        </section>

        <section className="crm-block">
          <h4>Назначить</h4>
          <details>
            <summary>Создать абонемент</summary>
            <form className="form" onSubmit={(event) => void createEnrollment(event)}>
              <input name="clientId" type="hidden" value={client.id} />
              <input name="title" placeholder="Название абонемента" required />
              <select name="direction" defaultValue="pool"><option value="pool">Pool</option><option value="gym">Gym</option><option value="massage">Massage</option></select>
              <input name="branch" placeholder="Филиал" />
              <input min="0" name="totalLessons" placeholder="Всего занятий" required type="number" />
              <input min="0" name="usedLessons" placeholder="Уже отходил" type="number" />
              <button className="wide-action" disabled={busy === "enrollment"} type="submit">Создать</button>
            </form>
          </details>
          <details>
            <summary>Назначить занятие</summary>
            <form className="form" onSubmit={(event) => void createLesson(event)}>
              <input name="clientId" type="hidden" value={client.id} />
              <select name="enrollmentId"><option value="">Без абонемента</option>{clientEnrollments.map((enrollment) => <option key={enrollment.id} value={enrollment.id}>{enrollment.title} - осталось {enrollment.remainingLessons}</option>)}</select>
              <input name="title" placeholder="Название занятия" required />
              <input name="branch" placeholder="Филиал" />
              <input name="startsAt" required type="datetime-local" />
              <textarea name="note" placeholder="Заметка к занятию" rows={2} />
              <button className="wide-action" disabled={busy === "lesson"} type="submit">Назначить</button>
            </form>
          </details>
        </section>
      </div>

      <section className="crm-block">
        <h4>Заявки</h4>
        <MiniList empty="Заявок пока нет.">
          {clientLeads.map((lead) => <p key={lead.id}>{lead.childName}, {lead.childAge} - {lead.direction} - {lead.branch} - {lead.status}</p>)}
        </MiniList>
      </section>

      <section className="crm-block">
        <h4>Абонементы</h4>
        <MiniList empty="Абонементов пока нет.">
          {clientEnrollments.map((enrollment) => <p key={enrollment.id}>{enrollment.title} - {enrollment.usedLessons}/{enrollment.totalLessons}, осталось {enrollment.remainingLessons} - {enrollment.status}</p>)}
        </MiniList>
      </section>

      <section className="crm-block">
        <h4>Занятия</h4>
        <MiniList empty="Занятий пока нет.">
          {clientLessons.map((lesson) => (
            <div className="crm-lesson-row" key={lesson.id}>
              <p>{new Date(lesson.startsAt).toLocaleString()} - {lesson.title} - {lesson.status}</p>
              <div className="quick-actions">
                <button onClick={() => void updateLesson(lesson.id, "ATTENDED")} type="button">Пришел</button>
                <button onClick={() => void updateLesson(lesson.id, "MISSED")} type="button">Не пришел</button>
                <button onClick={() => void updateLesson(lesson.id, "CANCELED")} type="button">Отмена</button>
              </div>
            </div>
          ))}
        </MiniList>
      </section>

      <section className="crm-block">
        <h4>Оплаты и уведомления</h4>
        <MiniList empty="Истории пока нет.">
          {clientReceipts.map((receipt) => <p key={receipt.id}>Чек {receipt.fileName} - {receipt.status}</p>)}
          {clientReminders.map((reminder) => <p key={reminder.id}>Напоминание {reminder.type} - {reminder.status} - {new Date(reminder.dueAt).toLocaleString()}</p>)}
          {clientNotifications.slice(0, 8).map((notification) => <p key={notification.id}>{notification.type} - {notification.status} - {new Date(notification.createdAt).toLocaleString()}</p>)}
        </MiniList>
      </section>
    </article>
  );
}

function MiniList({ empty, children }: { empty: string; children: React.ReactNode[] }) {
  const items = children.filter(Boolean);
  return <div className="mini-list">{items.length ? items : <p className="muted">{empty}</p>}</div>;
}

function QuickForms({ data, busy, createEnrollment, createLesson }: { data: Overview; busy: string; createEnrollment: (event: FormEvent<HTMLFormElement>) => void; createLesson: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="panel">
      <h2>Быстрые действия</h2>
      <details>
        <summary>Создать абонемент</summary>
        <form className="form" onSubmit={(event) => void createEnrollment(event)}>
          <ClientSelect clients={data.recentClients} />
          <input name="title" placeholder="Subscription title" required />
          <select name="direction" defaultValue="pool"><option value="pool">Pool</option><option value="gym">Gym</option><option value="massage">Massage</option></select>
          <input name="branch" placeholder="Branch" />
          <input min="0" name="totalLessons" placeholder="Total lessons" required type="number" />
          <input min="0" name="usedLessons" placeholder="Used lessons" type="number" />
          <button className="wide-action" disabled={busy === "enrollment"} type="submit">Create subscription</button>
        </form>
      </details>
      <details>
        <summary>Назначить занятие</summary>
        <form className="form" onSubmit={(event) => void createLesson(event)}>
          <ClientSelect clients={data.recentClients} />
          <select name="enrollmentId"><option value="">Without subscription</option>{data.recentEnrollments.map((enrollment) => <option key={enrollment.id} value={enrollment.id}>{enrollment.title} - TG {enrollment.client.telegramId}</option>)}</select>
          <input name="title" placeholder="Lesson title" required />
          <input name="branch" placeholder="Branch" />
          <input name="startsAt" required type="datetime-local" />
          <textarea name="note" placeholder="Admin note" rows={2} />
          <button className="wide-action" disabled={busy === "lesson"} type="submit">Schedule lesson</button>
        </form>
      </details>
    </section>
  );
}

function ContentList({ items }: { items: Array<{ id: string; title: string; meta: string; link?: string }> }) {
  return (
    <div className="admin-list">
      {items.map((item) => (
        <article className="admin-item crm-item" key={item.id}>
          <div><strong>{item.title}</strong><p>{item.meta}</p>{item.link && <a href={item.link} target="_blank" rel="noreferrer">Open image</a>}</div>
        </article>
      ))}
    </div>
  );
}

function ClientSelect({ clients }: { clients: ClientSummary[] }) {
  return (
    <select name="clientId" required>
      <option value="">Select client</option>
      {clients.map((client) => <option key={client.id} value={client.id}>{client.firstName || client.username || client.telegramId} - TG {client.telegramId}</option>)}
    </select>
  );
}
