import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, CalendarCheck, ClipboardList, MapPin, Newspaper, ReceiptText } from "lucide-react";
import { AdminPanel } from "./components/AdminPanel";
import { LanguageSwitch } from "./components/LanguageSwitch";
import { ServiceCard } from "./components/ServiceCard";
import { apiForm, apiJson, coachPhotoUrl, contentPostImageUrl } from "./lib/api";
import { getDevTelegramId, getInitData, openFullscreen } from "./lib/telegram";
import { copy, services, type Direction, type Lang } from "./data/i18n";
import "./styles.css";

type Page = "home" | "direction" | "service" | "book" | "cabinet" | "prices" | "news" | "contacts" | "receipt";
type Notice = { kind: "success" | "error"; message: string };
type Dashboard = {
  hasCabinet: boolean;
  leads: Array<{
    id: string;
    childName: string;
    childAge: string;
    direction: Direction;
    branch: string;
    status: string;
    preferredTime?: string;
    createdAt: string;
    services: Array<{ serviceSlug: string; title?: string | null; direction?: string | null }>;
  }>;
  receipts: Array<{ id: string; fileName: string; status: string; createdAt: string }>;
  enrollments: Array<{
    id: string;
    title: string;
    direction?: string;
    branch?: string;
    totalLessons: number;
    usedLessons: number;
    remainingLessons: number;
    status: string;
    endDate?: string | null;
    lessons: Array<{ id: string; title: string; startsAt: string; status: string; branch?: string }>;
  }>;
  upcomingLessons: Array<{ id: string; title: string; startsAt: string; status: string; branch?: string }>;
};

type ContentFeed = {
  posts: Array<{
    id: string;
    type: "news" | "promo";
    title: string;
    body: string;
    direction?: Direction | null;
    serviceSlugs: string[];
    ctaLabel?: string | null;
    ctaUrl?: string | null;
    createdAt: string;
    hasImage: boolean;
  }>;
  coaches: Array<{
    id: string;
    name: string;
    direction: Direction;
    branch?: string | null;
    serviceSlugs: string[];
    bio?: string | null;
    experience?: string | null;
    interview?: string | null;
    videoUrl?: string | null;
    hasPhoto: boolean;
  }>;
};

type PriceItem = {
  id: string;
  slug: string;
  direction: Direction;
  branch?: string | null;
  titleRu: string;
  titleKa?: string | null;
  titleEn?: string | null;
  ageRu?: string | null;
  ageKa?: string | null;
  ageEn?: string | null;
  packageRu: string;
  packageKa?: string | null;
  packageEn?: string | null;
  priceRu: string;
  priceKa?: string | null;
  priceEn?: string | null;
  noteRu?: string | null;
  noteKa?: string | null;
  noteEn?: string | null;
  lessons?: number | null;
};

const contentCopy: Record<Lang, {
  page: string;
  promo: string;
  coaches: string;
  empty: string;
}> = {
  ru: { page: "?????", promo: "?????", coaches: "???????", empty: "???? ??? ?????????????? ??????????." },
  ka: { page: "???????", promo: "???????", coaches: "?????", empty: "?????????????? ???????? ??? ?? ????." },
  en: { page: "Promos", promo: "Promos", coaches: "Team", empty: "No published materials yet." }
};

const actionCopy: Record<Lang, {
  sending: string;
  uploading: string;
  leadSuccess: string;
  receiptSuccess: string;
  requestError: string;
  cabinet: string;
  addLesson: string;
  myRequests: string;
  subscriptions: string;
  schedule: string;
  payments: string;
  noCabinet: string;
  selectedLessons: string;
  remaining: string;
  used: string;
}> = {
  ru: {
    sending: "Отправляем...",
    uploading: "Загружаем...",
    leadSuccess: "Заявка принята. Администратор уже получил уведомление и скоро свяжется с вами.",
    receiptSuccess: "Чек получен. Администратор уже получил уведомление и проверит оплату.",
    requestError: "Не получилось отправить. Проверьте связь и попробуйте еще раз.",
    cabinet: "Кабинет",
    addLesson: "Добавить занятие",
    myRequests: "Мои заявки",
    subscriptions: "Абонементы",
    schedule: "Расписание",
    payments: "Оплаты",
    noCabinet: "Пока нет заявок. Отправьте первую заявку, и здесь появится кабинет.",
    selectedLessons: "Выберите занятия",
    remaining: "осталось",
    used: "отходил"
  },
  ka: {
    sending: "იგზავნება...",
    uploading: "იტვირთება...",
    leadSuccess: "განაცხადი მიღებულია. ადმინისტრატორმა უკვე მიიღო შეტყობინება და მალე დაგიკავშირდებათ.",
    receiptSuccess: "ჩეკი მიღებულია. ადმინისტრატორმა უკვე მიიღო შეტყობინება და შეამოწმებს გადახდას.",
    requestError: "გაგზავნა ვერ მოხერხდა. შეამოწმეთ კავშირი და სცადეთ კიდევ ერთხელ.",
    cabinet: "კაბინეტი",
    addLesson: "გაკვეთილის დამატება",
    myRequests: "ჩემი განაცხადები",
    subscriptions: "აბონემენტები",
    schedule: "განრიგი",
    payments: "გადახდები",
    noCabinet: "განაცხადები ჯერ არ არის. გაგზავნეთ პირველი განაცხადი და აქ გამოჩნდება კაბინეტი.",
    selectedLessons: "აირჩიეთ გაკვეთილები",
    remaining: "დარჩა",
    used: "გამოყენებულია"
  },
  en: {
    sending: "Sending...",
    uploading: "Uploading...",
    leadSuccess: "Request received. The administrator has already been notified and will contact you soon.",
    receiptSuccess: "Receipt received. The administrator has already been notified and will check the payment.",
    requestError: "Could not send. Check your connection and try again.",
    cabinet: "Cabinet",
    addLesson: "Add lesson",
    myRequests: "My requests",
    subscriptions: "Subscriptions",
    schedule: "Schedule",
    payments: "Payments",
    noCabinet: "No requests yet. Send your first request and your cabinet will appear here.",
    selectedLessons: "Choose lessons",
    remaining: "remaining",
    used: "used"
  }
};

function App() {
  const initialLang = (localStorage.getItem("mbpg_lang") as Lang | null) ?? "ru";
  const [lang, setLang] = useState<Lang>(initialLang);
  const [page, setPage] = useState<Page>("home");
  const [direction, setDirection] = useState<Direction>("pool");
  const [serviceSlug, setServiceSlug] = useState("baby-swim");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [content, setContent] = useState<ContentFeed | null>(null);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const t = copy[lang];

  const activeService = useMemo(
    () => services.find((service) => service.slug === serviceSlug) ?? services[0],
    [serviceSlug]
  );
  const visibleServices = services.filter((service) => service.direction === direction);

  useEffect(() => {
    openFullscreen();
  }, []);

  useEffect(() => {
    localStorage.setItem("mbpg_lang", lang);
    if (!getInitData() && !getDevTelegramId()) return;
    void apiJson("/api/clients/me", {
      method: "POST",
      body: JSON.stringify({ languageCode: lang })
    })
      .then(() => refreshDashboard())
      .catch(() => undefined);
  }, [lang]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    void apiJson<ContentFeed>(`/api/content?lang=${lang}`)
      .then(setContent)
      .catch(() => setContent({ posts: [], coaches: [] }));
  }, [lang]);

  useEffect(() => {
    void apiJson<{ prices: PriceItem[] }>("/api/content/prices")
      .then((result) => setPrices(result.prices))
      .catch(() => setPrices([]));
  }, []);

  if (window.location.pathname === "/admin") {
    return (
      <>
        <Header lang={lang} setLang={setLang} />
        <AdminPanel lang={lang} />
      </>
    );
  }

  function openDirection(nextDirection: Direction) {
    setDirection(nextDirection);
    setPage("direction");
  }

  function openService(slug: string) {
    setServiceSlug(slug);
    setPage("service");
  }

  async function refreshDashboard() {
    if (!getInitData() && !getDevTelegramId()) return;
    const result = await apiJson<Dashboard>("/api/clients/me/dashboard");
    setDashboard(result);
  }

  function openCabinetOrBooking() {
    setPage(dashboard?.hasCabinet ? "cabinet" : "book");
  }

  return (
    <>
      <Header lang={lang} setLang={setLang} />
      <main className="screen">
        {page === "home" && (
          <>
            <section className="hero">
              <span className="eyebrow">Batumi · Georgia</span>
              <h1>{t.brand}</h1>
              <p>{t.subtitle}</p>
              <div className="hero-actions">
                <button onClick={() => setPage("book")} type="button"><CalendarCheck size={18} />{t.book}</button>
                <button className="secondary" onClick={openCabinetOrBooking} type="button"><ClipboardList size={18} />{dashboard?.hasCabinet ? actionCopy[lang].cabinet : t.prices}</button>
              </div>
            </section>

            <section className="panel">
              <h2>{t.choose}</h2>
              <div className="direction-grid">
                <button onClick={() => openDirection("pool")} type="button">
                  <span className="location-mark">POOL</span>
                  <strong>{t.pool}</strong>
                  <span>Javakhishvili 28</span>
                </button>
                <button onClick={() => openDirection("gym")} type="button">
                  <span className="location-mark gym">GYM</span>
                  <strong>{t.gym}</strong>
                  <span>Gorgasali 127</span>
                </button>
                <button onClick={() => openDirection("massage")} type="button">
                  <span className="location-mark massage">SPA</span>
                  <strong>{t.massage}</strong>
                  <span>Pool Javakhishvili 28</span>
                </button>
              </div>
            </section>
          </>
        )}

        {page === "direction" && (
          <section className="panel">
            <BackButton onClick={() => setPage("home")} label={t.back} />
            <h2>{direction === "pool" ? t.pool : direction === "gym" ? t.gym : t.massage}</h2>
            <div className="service-list">
              {visibleServices.map((service) => (
                <ServiceCard key={service.slug} service={service} lang={lang} onOpen={() => openService(service.slug)} />
              ))}
            </div>
          </section>
        )}

        {page === "service" && (
          <section className="panel service-detail">
            <BackButton onClick={() => setPage("direction")} label={t.back} />
            <activeService.icon className="detail-icon" size={32} />
            <h2>{activeService.title[lang]}</h2>
            <p>{activeService.description[lang]}</p>
            <div className="facts">
              <span>{t.age}: {activeService.age[lang]}</span>
              <span>{t.duration}: {activeService.duration[lang]}</span>
            </div>
            <h3>{t.benefit}</h3>
            <p>{activeService.benefit[lang]}</p>
            <h3>{t.prices}</h3>
            <ul className="price-list">
              {activeService.prices.map((price) => (
                <li key={price.ru}>{price[lang]}</li>
              ))}
            </ul>
            <button className="wide-action" onClick={() => setPage("book")} type="button">{t.book}</button>
          </section>
        )}

        {page === "book" && <BookingForm lang={lang} serviceSlug={serviceSlug} direction={direction} onDone={setNotice} onSaved={() => void refreshDashboard()} />}
        {page === "cabinet" && <ClientCabinet dashboard={dashboard} lang={lang} onAdd={() => setPage("book")} onReceipt={() => setPage("receipt")} />}
        {page === "prices" && <Prices lang={lang} prices={prices} onBack={() => setPage("home")} />}
        {page === "news" && <NewsPage content={content} lang={lang} onBook={() => setPage("book")} />}
        {page === "contacts" && <Contacts lang={lang} onBack={() => setPage("home")} />}
        {page === "receipt" && <ReceiptUpload lang={lang} onDone={setNotice} />}

        {notice && <div className={`toast ${notice.kind}`}>{notice.message}</div>}
      </main>
      <nav className="bottom-nav">
        <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")} type="button">MBPG</button>
        <button className={page === "prices" ? "active" : ""} onClick={() => setPage("prices")} type="button">{t.prices}</button>
        <button className={page === "book" || page === "cabinet" ? "active" : ""} onClick={openCabinetOrBooking} type="button">{dashboard?.hasCabinet ? actionCopy[lang].cabinet : t.book}</button>
        <button className={page === "news" ? "active" : ""} onClick={() => setPage("news")} type="button">{contentCopy[lang].page}</button>
        <button className={page === "contacts" ? "active" : ""} onClick={() => setPage("contacts")} type="button">{t.contacts}</button>
      </nav>
    </>
  );
}

function Header({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <strong>MBPG</strong>
        <span>{copy[lang].subtitle}</span>
      </div>
      <LanguageSwitch value={lang} onChange={setLang} />
    </header>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button className="back" onClick={onClick} type="button"><ArrowLeft size={17} />{label}</button>;
}

function NewsPage({ content, lang, onBook }: { content: ContentFeed | null; lang: Lang; onBook: () => void }) {
  const text = contentCopy[lang];
  const [tab, setTab] = useState<"promo" | "coaches">("promo");
  const posts = content?.posts.filter((post) => post.type === tab) ?? [];
  const coaches = content?.coaches ?? [];

  return (
    <>
      <section className="panel">
        <h2>{text.page}</h2>
        <div className="tabs">
          <button className={tab === "promo" ? "active" : ""} onClick={() => setTab("promo")} type="button"><Newspaper size={16} />{text.promo}</button>
          <button className={tab === "coaches" ? "active" : ""} onClick={() => setTab("coaches")} type="button">{text.coaches}</button>
        </div>
      </section>

      {tab !== "coaches" && (
        <section className="panel">
          <div className="content-list">
            {posts.length === 0 && <p className="muted">{text.empty}</p>}
            {posts.map((post) => (
              <article className="content-card" key={post.id}>
                {post.hasImage && <img alt="" src={contentPostImageUrl(post.id)} />}
                <div>
                  <span className="status-pill">{post.direction || "all"}</span>
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                  <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                  {post.ctaUrl && post.ctaLabel && <a href={post.ctaUrl}>{post.ctaLabel}</a>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "coaches" && (
        <section className="panel">
          <div className="content-list">
            {coaches.length === 0 && <p className="muted">{text.empty}</p>}
            {coaches.map((coach) => (
              <article className="content-card coach-card" key={coach.id}>
                {coach.hasPhoto ? <img alt="" src={coachPhotoUrl(coach.id)} /> : <div className="photo-placeholder">{coach.name.slice(0, 1)}</div>}
                <div>
                  <span className="status-pill">{coach.direction}</span>
                  <h3>{coach.name}</h3>
                  {coach.experience && <strong>{coach.experience}</strong>}
                  {coach.bio && <p>{coach.bio}</p>}
                  {coach.interview && <p>{coach.interview}</p>}
                  <small>{coach.branch || ""}{coach.serviceSlugs.length ? ` - ${coach.serviceSlugs.map((slug) => serviceTitle(slug, lang)).join(", ")}` : ""}</small>
                  {coach.videoUrl && <a href={coach.videoUrl} target="_blank" rel="noreferrer">Видео</a>}
                  <button className="mini-button" onClick={onBook} type="button">{copy[lang].book}</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function BookingForm({ lang, direction, serviceSlug, onDone, onSaved }: { lang: Lang; direction: Direction; serviceSlug: string; onDone: (notice: Notice) => void; onSaved: () => void }) {
  const t = copy[lang];
  const action = actionCopy[lang];
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Notice | null>(null);
  const defaultServiceSlugs = useMemo(() => new Set([serviceSlug]), [serviceSlug]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setStatus(null);

    try {
      const form = new FormData(formElement);
      const serviceSlugs = form.getAll("serviceSlugs").map(String);
      const result = await apiJson<{ message?: string }>("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          languageCode: lang,
          parentName: form.get("parentName"),
          phone: form.get("phone"),
          childName: form.get("childName"),
          childAge: form.get("childAge"),
          direction,
          serviceSlug,
          serviceSlugs,
          branch: form.get("branch"),
          preferredTime: form.get("preferredTime"),
          comment: form.get("comment")
        })
      });
      formElement.reset();
      const nextStatus = { kind: "success" as const, message: result.message ?? action.leadSuccess };
      setStatus(nextStatus);
      onDone(nextStatus);
      onSaved();
    } catch {
      const nextStatus = { kind: "error" as const, message: action.requestError };
      setStatus(nextStatus);
      onDone(nextStatus);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>{t.formTitle}</h2>
      <form className="form" onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy}>
          <input name="parentName" placeholder={t.parentName} required />
          <input name="phone" placeholder={t.phone} required type="tel" />
          <input name="childName" placeholder={t.childName} required />
          <input name="childAge" placeholder={t.childAge} required />
          <select name="branch" required defaultValue={direction === "gym" ? "Gym Gorgasali 127" : "Pool Javakhishvili 28"}>
            <option>Pool Javakhishvili 28</option>
            <option>Gym Gorgasali 127</option>
          </select>
          <div className="choice-group" role="group" aria-label={action.selectedLessons}>
            <strong>{action.selectedLessons}</strong>
            {services.map((service) => (
              <label key={service.slug}>
                <input defaultChecked={defaultServiceSlugs.has(service.slug)} name="serviceSlugs" type="checkbox" value={service.slug} />
                <span>{service.title[lang]}</span>
              </label>
            ))}
          </div>
          <input name="preferredTime" placeholder={t.preferredTime} />
          <textarea name="comment" placeholder={t.comment} rows={4} />
        </fieldset>
        {status && <div className={`form-status ${status.kind}`}>{status.message}</div>}
        <button className="wide-action" disabled={busy} type="submit">{busy ? action.sending : t.submit}</button>
      </form>
    </section>
  );
}

function ClientCabinet({ dashboard, lang, onAdd, onReceipt }: { dashboard: Dashboard | null; lang: Lang; onAdd: () => void; onReceipt: () => void }) {
  const action = actionCopy[lang];

  if (!dashboard?.hasCabinet) {
    return (
      <section className="panel">
        <h2>{action.cabinet}</h2>
        <p className="muted">{action.noCabinet}</p>
        <button className="wide-action" onClick={onAdd} type="button">{action.addLesson}</button>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <h2>{action.cabinet}</h2>
          <button className="mini-button" onClick={onAdd} type="button"><ClipboardList size={16} />{action.addLesson}</button>
        </div>
      </section>

      <section className="panel">
        <h2>{action.myRequests}</h2>
        <div className="cabinet-list">
          {dashboard.leads.map((lead) => (
            <article className="cabinet-item" key={lead.id}>
              <strong>{lead.childName}, {lead.childAge}</strong>
              <p>{lead.branch}{lead.preferredTime ? ` · ${lead.preferredTime}` : ""}</p>
              <small>{lead.services.map((service) => service.title || serviceTitle(service.serviceSlug, lang)).join(", ") || lead.direction}</small>
              <span className={`status-pill ${lead.status.toLowerCase()}`}>{leadStatusLabel(lead.status, lang)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{action.subscriptions}</h2>
        <div className="cabinet-list">
          {dashboard.enrollments.length === 0 && <p className="muted">Администратор еще не добавил абонемент.</p>}
          {dashboard.enrollments.map((enrollment) => (
            <article className="cabinet-item" key={enrollment.id}>
              <strong>{enrollment.title}</strong>
              <p>{action.used}: {enrollment.usedLessons} · {action.remaining}: {enrollment.remainingLessons}</p>
              <div className="progress"><span style={{ width: `${enrollment.totalLessons > 0 ? Math.min((enrollment.usedLessons / enrollment.totalLessons) * 100, 100) : 0}%` }} /></div>
              <small>{enrollment.branch || ""} · {enrollment.status}{enrollment.endDate ? ` · действует до ${new Date(enrollment.endDate).toLocaleDateString()}` : ""}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{action.schedule}</h2>
        <div className="cabinet-list">
          {dashboard.upcomingLessons.length === 0 && (
            <article className="cabinet-item">
              <strong>Ближайшие занятия пока не назначены.</strong>
              <button className="mini-button" onClick={onAdd} type="button">{copy[lang].book}</button>
            </article>
          )}
          {dashboard.upcomingLessons.map((lesson) => (
            <article className="cabinet-item" key={lesson.id}>
              <strong>{lesson.title}</strong>
              <p>{new Date(lesson.startsAt).toLocaleString()}</p>
              <small>{lesson.branch || ""} · {lesson.status}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>{copy[lang].receipt}</h2>
          <button className="mini-button" onClick={onReceipt} type="button"><ReceiptText size={16} />{copy[lang].receipt}</button>
        </div>
        <p className="muted">Если вы уже оплатили абонемент, отправьте чек администратору на проверку.</p>
      </section>
    </>
  );
}

function serviceTitle(slug: string, lang: Lang) {
  return services.find((service) => service.slug === slug)?.title[lang] ?? slug;
}

function leadStatusLabel(status: string, lang: Lang) {
  const labels: Record<string, Record<Lang, string>> = {
    NEW: { ru: "Заявка отправлена", ka: "განაცხადი გაგზავნილია", en: "Request sent" },
    CONTACTED: { ru: "Админ на связи", ka: "ადმინისტრატორი დაგიკავშირდათ", en: "Admin contacted" },
    BOOKED: { ru: "Запись подтверждена", ka: "ჩანაწერი დადასტურდა", en: "Booked" },
    PAID: { ru: "Оплачено", ka: "გადახდილია", en: "Paid" },
    LOST: { ru: "Отменено", ka: "გაუქმებულია", en: "Canceled" },
    ARCHIVED: { ru: "В архиве", ka: "არქივშია", en: "Archived" }
  };
  return labels[status]?.[lang] ?? status;
}

function ReceiptUpload({ lang, onDone }: { lang: Lang; onDone: (notice: Notice) => void }) {
  const t = copy[lang];
  const action = actionCopy[lang];
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Notice | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setStatus(null);

    try {
      const form = new FormData(formElement);
      form.append("languageCode", lang);
      const result = await apiForm<{ message?: string }>("/api/receipts", form);
      formElement.reset();
      const nextStatus = { kind: "success" as const, message: result.message ?? action.receiptSuccess };
      setStatus(nextStatus);
      onDone(nextStatus);
    } catch {
      const nextStatus = { kind: "error" as const, message: action.requestError };
      setStatus(nextStatus);
      onDone(nextStatus);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>{t.receiptTitle}</h2>
      <p>{t.receiptHelp}</p>
      <form className="form" onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy}>
          <input accept="image/*,application/pdf" name="receipt" required type="file" />
        </fieldset>
        {status && <div className={`form-status ${status.kind}`}>{status.message}</div>}
        <button className="wide-action" disabled={busy} type="submit">{busy ? action.uploading : t.upload}</button>
      </form>
    </section>
  );
}

function Prices({ lang, prices, onBack }: { lang: Lang; prices: PriceItem[]; onBack: () => void }) {
  const t = copy[lang];
  const groupedPrices = prices.length > 0
    ? prices.reduce<Record<string, PriceItem[]>>((groups, price) => {
      const key = price.direction;
      groups[key] = [...(groups[key] ?? []), price];
      return groups;
    }, {})
    : {};
  const hasManagedPrices = Object.keys(groupedPrices).length > 0;

  return (
    <section className="panel">
      <BackButton onClick={onBack} label={t.back} />
      <h2>{t.prices}</h2>
      {hasManagedPrices ? (
        Object.entries(groupedPrices).map(([directionKey, items]) => (
          <article className="price-block" key={directionKey}>
            <strong>{directionLabel(directionKey, lang)}</strong>
            <div className="managed-price-list">
              {items.map((price) => (
                <div className="managed-price-row" key={price.id}>
                  <div>
                    <b>{localizedPriceField(price, "title", lang)}</b>
                    {localizedPriceField(price, "age", lang) && <small>{localizedPriceField(price, "age", lang)}</small>}
                    <span>{localizedPriceField(price, "package", lang)}</span>
                  </div>
                  <strong>{localizedPriceField(price, "price", lang)}</strong>
                  {localizedPriceField(price, "note", lang) && <em>{localizedPriceField(price, "note", lang)}</em>}
                </div>
              ))}
            </div>
          </article>
        ))
      ) : (
        services.map((service) => (
          <article className="price-block" key={service.slug}>
            <strong>{service.title[lang]}</strong>
            <ul className="price-list">
              {service.prices.map((price) => <li key={price.ru}>{price[lang]}</li>)}
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function localizedPriceField(price: PriceItem, field: "title" | "age" | "package" | "price" | "note", lang: Lang) {
  const suffix = lang === "ka" ? "Ka" : lang === "en" ? "En" : "Ru";
  const key = `${field}${suffix}` as keyof PriceItem;
  return String(price[key] || price[`${field}Ru` as keyof PriceItem] || "");
}

function directionLabel(directionKey: string, lang: Lang) {
  if (directionKey === "pool") return copy[lang].pool;
  if (directionKey === "gym") return copy[lang].gym;
  return copy[lang].massage;
}

function Contacts({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const t = copy[lang];
  return (
    <section className="panel">
      <BackButton onClick={onBack} label={t.back} />
      <h2>{t.contacts}</h2>
      <div className="contact-list">
        <article>
          <MapPin size={20} />
          <div>
            <strong>My Baby Pool</strong>
            <p>Javakhishvili 28 · +995 591 990 894</p>
            <a href="https://wa.me/995591990894">WhatsApp</a>
          </div>
        </article>
        <article>
          <MapPin size={20} />
          <div>
            <strong>My Gymnastics Gym</strong>
            <p>Gorgasali 127 · +995 599 039 477</p>
            <a href="https://t.me/My_GGym">Telegram</a>
          </div>
        </article>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
