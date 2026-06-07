import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, CalendarCheck, MapPin, ReceiptText } from "lucide-react";
import { AdminPanel } from "./components/AdminPanel";
import { LanguageSwitch } from "./components/LanguageSwitch";
import { ServiceCard } from "./components/ServiceCard";
import { apiForm, apiJson } from "./lib/api";
import { getDevTelegramId, getInitData, openFullscreen } from "./lib/telegram";
import { copy, services, type Direction, type Lang } from "./data/i18n";
import "./styles.css";

type Page = "home" | "direction" | "service" | "book" | "prices" | "contacts" | "receipt";

function App() {
  const initialLang = (localStorage.getItem("mbpg_lang") as Lang | null) ?? "ru";
  const [lang, setLang] = useState<Lang>(initialLang);
  const [page, setPage] = useState<Page>("home");
  const [direction, setDirection] = useState<Direction>("pool");
  const [serviceSlug, setServiceSlug] = useState("baby-swim");
  const [notice, setNotice] = useState("");
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
    }).catch(() => undefined);
  }, [lang]);

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
                <button className="secondary" onClick={() => setPage("receipt")} type="button"><ReceiptText size={18} />{t.receipt}</button>
              </div>
            </section>

            <section className="panel">
              <h2>{t.choose}</h2>
              <div className="direction-grid">
                <button onClick={() => openDirection("pool")} type="button">
                  <strong>{t.pool}</strong>
                  <span>Javakhishvili 28</span>
                </button>
                <button onClick={() => openDirection("gym")} type="button">
                  <strong>{t.gym}</strong>
                  <span>Gorgasali 127</span>
                </button>
                <button onClick={() => openDirection("massage")} type="button">
                  <strong>{t.massage}</strong>
                  <span>30 min · 350 GEL</span>
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

        {page === "book" && <BookingForm lang={lang} serviceSlug={serviceSlug} direction={direction} onDone={(msg) => setNotice(msg)} />}
        {page === "prices" && <Prices lang={lang} onBack={() => setPage("home")} />}
        {page === "contacts" && <Contacts lang={lang} onBack={() => setPage("home")} />}
        {page === "receipt" && <ReceiptUpload lang={lang} onDone={(msg) => setNotice(msg)} />}

        {notice && <div className="toast">{notice}</div>}
      </main>
      <nav className="bottom-nav">
        <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")} type="button">MBPG</button>
        <button className={page === "prices" ? "active" : ""} onClick={() => setPage("prices")} type="button">{t.prices}</button>
        <button className={page === "book" ? "active" : ""} onClick={() => setPage("book")} type="button">{t.book}</button>
        <button className={page === "contacts" ? "active" : ""} onClick={() => setPage("contacts")} type="button">{t.contacts}</button>
      </nav>
    </>
  );
}

function Header({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return (
    <header className="topbar">
      <strong>MBPG</strong>
      <LanguageSwitch value={lang} onChange={setLang} />
    </header>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button className="back" onClick={onClick} type="button"><ArrowLeft size={17} />{label}</button>;
}

function BookingForm({ lang, direction, serviceSlug, onDone }: { lang: Lang; direction: Direction; serviceSlug: string; onDone: (message: string) => void }) {
  const t = copy[lang];
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    await apiJson("/api/leads", {
      method: "POST",
      body: JSON.stringify({
        languageCode: lang,
        parentName: form.get("parentName"),
        phone: form.get("phone"),
        childName: form.get("childName"),
        childAge: form.get("childAge"),
        direction,
        serviceSlug,
        branch: form.get("branch"),
        preferredTime: form.get("preferredTime"),
        comment: form.get("comment")
      })
    });
    event.currentTarget.reset();
    setBusy(false);
    onDone(t.sent);
  }

  return (
    <section className="panel">
      <h2>{t.formTitle}</h2>
      <form className="form" onSubmit={(event) => void submit(event)}>
        <input name="parentName" placeholder={t.parentName} required />
        <input name="phone" placeholder={t.phone} required type="tel" />
        <input name="childName" placeholder={t.childName} required />
        <input name="childAge" placeholder={t.childAge} required />
        <select name="branch" required defaultValue={direction === "gym" ? "Gym Gorgasali 127" : "Pool Javakhishvili 28"}>
          <option>Pool Javakhishvili 28</option>
          <option>Gym Gorgasali 127</option>
        </select>
        <input name="preferredTime" placeholder={t.preferredTime} />
        <textarea name="comment" placeholder={t.comment} rows={4} />
        <button className="wide-action" disabled={busy} type="submit">{t.submit}</button>
      </form>
    </section>
  );
}

function ReceiptUpload({ lang, onDone }: { lang: Lang; onDone: (message: string) => void }) {
  const t = copy[lang];
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.append("languageCode", lang);
    setBusy(true);
    await apiForm("/api/receipts", form);
    event.currentTarget.reset();
    setBusy(false);
    onDone(t.receiptHelp);
  }

  return (
    <section className="panel">
      <h2>{t.receiptTitle}</h2>
      <p>{t.receiptHelp}</p>
      <form className="form" onSubmit={(event) => void submit(event)}>
        <input accept="image/*,application/pdf" name="receipt" required type="file" />
        <button className="wide-action" disabled={busy} type="submit">{t.upload}</button>
      </form>
    </section>
  );
}

function Prices({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const t = copy[lang];
  return (
    <section className="panel">
      <BackButton onClick={onBack} label={t.back} />
      <h2>{t.prices}</h2>
      {services.map((service) => (
        <article className="price-block" key={service.slug}>
          <strong>{service.title[lang]}</strong>
          <ul className="price-list">
            {service.prices.map((price) => <li key={price.ru}>{price[lang]}</li>)}
          </ul>
        </article>
      ))}
    </section>
  );
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
