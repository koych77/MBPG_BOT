import type { Lang } from "../data/i18n";
import { services } from "../data/i18n";

type Props = {
  service: (typeof services)[number];
  lang: Lang;
  onOpen: () => void;
};

export function ServiceCard({ service, lang, onOpen }: Props) {
  const Icon = service.icon;
  return (
    <button className="service-card" onClick={onOpen} type="button">
      <span className="service-icon">
        <Icon size={22} />
      </span>
      <span>
        <strong>{service.title[lang]}</strong>
        <small>{service.age[lang]}</small>
      </span>
    </button>
  );
}
