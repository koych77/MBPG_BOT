import { languages, type Lang } from "../data/i18n";

type Props = {
  value: Lang;
  onChange: (lang: Lang) => void;
};

export function LanguageSwitch({ value, onChange }: Props) {
  return (
    <div className="language-switch" aria-label="Language">
      {languages.map((language) => (
        <button
          className={language.code === value ? "active" : ""}
          key={language.code}
          onClick={() => onChange(language.code)}
          type="button"
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}
