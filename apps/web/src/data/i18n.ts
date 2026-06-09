import { Baby, Dumbbell, HeartPulse, Waves } from "lucide-react";

export type Lang = "ru" | "ka" | "en";
export type Direction = "pool" | "gym" | "massage";

export const languages: Array<{ code: Lang; label: string }> = [
  { code: "ru", label: "RU" },
  { code: "ka", label: "GE" },
  { code: "en", label: "EN" }
];

export const services = [
  {
    slug: "baby-swim",
    direction: "pool" as Direction,
    icon: Baby,
    title: {
      ru: "Грудничковое плавание",
      ka: "ჩვილების ცურვა",
      en: "Baby swimming"
    },
    age: { ru: "1 мес - 12 мес", ka: "1-12 თვე", en: "1-12 months" },
    duration: { ru: "30 минут", ka: "30 წუთი", en: "30 minutes" },
    description: {
      ru: "Индивидуальные чаши с кристально чистой водой питьевого стандарта 32-34°C. Формат: родитель-малыш или инструктор-малыш.",
      ka: "ინდივიდუალური აბაზანები სუფთა წყლით 32-34°C. ფორმატი: მშობელი-ბავშვი ან ინსტრუქტორი-ბავშვი.",
      en: "Individual tubs with crystal clean drinking-standard water at 32-34°C. Parent-baby or instructor-baby format."
    },
    benefit: {
      ru: "Укрепляет иммунитет, развивает координацию и мышцы, помогает ребенку уверенно чувствовать себя в воде.",
      ka: "აძლიერებს იმუნიტეტს, ავითარებს კოორდინაციას და კუნთებს, ბავშვს წყალში თავდაჯერებულობას მატებს.",
      en: "Supports immunity, coordination, muscles, and confidence in water."
    },
    prices: [
      { ru: "Диагностическое занятие 50 минут - 50 лари", ka: "სადიაგნოსტიკო გაკვეთილი 50 წუთი - 50 ლარი", en: "Diagnostic lesson 50 min - 50 GEL" },
      { ru: "8 индивидуальных занятий - 480 лари", ka: "8 ინდივიდუალური გაკვეთილი - 480 ლარი", en: "8 individual lessons - 480 GEL" },
      { ru: "12 индивидуальных занятий - 660 лари", ka: "12 ინდივიდუალური გაკვეთილი - 660 ლარი", en: "12 individual lessons - 660 GEL" },
      { ru: "8 групповых занятий - 224 лари", ka: "8 ჯგუფური გაკვეთილი - 224 ლარი", en: "8 group lessons - 224 GEL" },
      { ru: "12 групповых занятий - 308 лари", ka: "12 ჯგუფური გაკვეთილი - 308 ლარი", en: "12 group lessons - 308 GEL" }
    ]
  },
  {
    slug: "kids-swim",
    direction: "pool" as Direction,
    icon: Waves,
    title: { ru: "Плавание для детей", ka: "ბავშვების ცურვა", en: "Kids swimming" },
    age: { ru: "1 год - 10 лет", ka: "1-10 წელი", en: "1-10 years" },
    duration: { ru: "30 минут индивидуально, 40-45 минут в группе", ka: "30 წუთი ინდივიდუალურად, 40-45 წუთი ჯგუფში", en: "30 min private, 40-45 min group" },
    description: {
      ru: "Разминка, аква-гимнастика, обучение плаванию и ныркам. Индивидуальные и групповые занятия с тренером.",
      ka: "გახურება, აკვა-გიმნასტიკა, ცურვისა და ყვინთვის სწავლება. ინდივიდუალური და ჯგუფური გაკვეთილები.",
      en: "Warm-up, aqua gymnastics, swimming and diving skills. Private and group trainer-led lessons."
    },
    benefit: {
      ru: "Развивает выносливость, силу, координацию и правильную осанку.",
      ka: "ავითარებს გამძლეობას, ძალას, კოორდინაციას და სწორ ტანადობას.",
      en: "Builds stamina, strength, coordination, and healthy posture."
    },
    prices: [
      { ru: "Диагностическое занятие 30 минут - 50 лари", ka: "სადიაგნოსტიკო გაკვეთილი 30 წუთი - 50 ლარი", en: "Diagnostic lesson 30 min - 50 GEL" },
      { ru: "8 индивидуальных занятий - 480 лари", ka: "8 ინდივიდუალური გაკვეთილი - 480 ლარი", en: "8 individual lessons - 480 GEL" },
      { ru: "12 индивидуальных занятий - 660 лари", ka: "12 ინდივიდუალური გაკვეთილი - 660 ლარი", en: "12 individual lessons - 660 GEL" },
      { ru: "8 групповых занятий - 224 лари", ka: "8 ჯგუფური გაკვეთილი - 224 ლარი", en: "8 group lessons - 224 GEL" }
    ]
  },
  {
    slug: "baby-motor",
    direction: "pool" as Direction,
    icon: Baby,
    title: { ru: "Двигательная моторика для грудных детей", ka: "ჩვილების მოტორიკა", en: "Motor skills for babies" },
    age: { ru: "1 мес - 2 года", ka: "1 თვე - 2 წელი", en: "1 month - 2 years" },
    duration: { ru: "уточняйте у администратора", ka: "დააზუსტეთ ადმინისტრატორთან", en: "ask the administrator" },
    description: {
      ru: "Мягкие развивающие занятия для координации, движений, мышечного тонуса и уверенности малыша.",
      ka: "რბილი განვითარებითი ვარჯიშები კოორდინაციის, მოძრაობისა და კუნთოვანი ტონუსისთვის.",
      en: "Gentle developmental classes for coordination, movement, muscle tone, and baby confidence."
    },
    benefit: {
      ru: "Помогает ребенку лучше чувствовать тело, развивать движения и готовиться к активному росту.",
      ka: "ეხმარება ბავშვს სხეულის შეგრძნებაში, მოძრაობის განვითარებასა და აქტიურ ზრდაში.",
      en: "Helps babies feel their body better, develop movement, and prepare for active growth."
    },
    prices: [
      { ru: "Уточняйте у администратора", ka: "დააზუსტეთ ადმინისტრატორთან", en: "Ask the administrator for details" }
    ]
  },
  {
    slug: "gym-groups",
    direction: "gym" as Direction,
    icon: Dumbbell,
    title: { ru: "Детские спортивные группы", ka: "ბავშვების სპორტული ჯგუფები", en: "Kids sports groups" },
    age: { ru: "3,5 лет - 16 лет", ka: "3.5-16 წელი", en: "3.5-16 years" },
    duration: { ru: "30 минут Бэби фит, 50 минут остальные направления", ka: "30 წუთი Baby Fit, 50 წუთი სხვა მიმართულებები", en: "30 min Baby Fit, 50 min other classes" },
    description: {
      ru: "Бэби фит, кроссфит с навыками самообороны, классическая и художественная гимнастика, хип-хоп.",
      ka: "Baby Fit, კროსფიტი თავდაცვის უნარებით, კლასიკური და მხატვრული гимнастика, ჰიპ-ჰოპი.",
      en: "Baby Fit, crossfit with self-defense skills, classic and rhythmic gymnastics, hip-hop."
    },
    benefit: {
      ru: "Укрепляет здоровье, повышает энергию и помогает ребенку развиваться через движение.",
      ka: "აძლიერებს ჯანმრთელობას, ზრდის ენერგიას და მოძრაობით განვითარებას უწყობს ხელს.",
      en: "Strengthens health, raises energy, and helps children develop through movement."
    },
    prices: [
      { ru: "Пробное занятие - бесплатно", ka: "საცდელი გაკვეთილი - უფასო", en: "Trial lesson - free" },
      { ru: "8 занятий - 160 лари", ka: "8 გაკვეთილი - 160 ლარი", en: "8 lessons - 160 GEL" },
      { ru: "12 занятий - 210 лари", ka: "12 გაკვეთილი - 210 ლარი", en: "12 lessons - 210 GEL" }
    ]
  },
  {
    slug: "massage",
    direction: "massage" as Direction,
    icon: HeartPulse,
    title: { ru: "Детский массаж", ka: "ბავშვის მასაჟი", en: "Child massage" },
    age: { ru: "1 мес - 16 лет", ka: "1 თვე - 16 წელი", en: "1 month - 16 years" },
    duration: { ru: "30 минут", ka: "30 წუთი", en: "30 minutes" },
    description: {
      ru: "Мягкое воздействие на мышцы, кожу и суставы для здоровья, гармоничного развития и хорошего самочувствия.",
      ka: "რბილი ზემოქმედება კუნთებზე, კანზე და სახსრებზე ჯანმრთელობისა და ჰარმონიული განვითარებისთვის.",
      en: "Gentle work with muscles, skin, and joints to support health, development, and wellbeing."
    },
    benefit: {
      ru: "Помогает развитию мышц и опорно-двигательного аппарата, улучшает кровообращение и сон.",
      ka: "ეხმარება კუნთებისა და საყრდენ-მამოძრავებელი სისტემის განვითარებას, აუმჯობესებს სისხლის მიმოქცევას და ძილს.",
      en: "Supports muscles and movement, improves circulation, relaxation, and sleep."
    },
    prices: [
      { ru: "Пробное занятие - 30 лари", ka: "საცდელი სესია - 30 ლარი", en: "Trial session - 30 GEL" },
      { ru: "10 занятий - 350 лари", ka: "10 სესია - 350 ლარი", en: "10 sessions - 350 GEL" }
    ]
  }
];

export const copy = {
  ru: {
    brand: "MBPG",
    subtitle: "Детский бассейн и спортивные занятия в Батуми",
    choose: "Выберите направление",
    pool: "My Baby Pool",
    gym: "My Gymnastics Gym",
    massage: "Массаж",
    book: "Записаться",
    prices: "Прайс",
    contacts: "Контакты",
    receipt: "Отправить чек",
    back: "Назад",
    age: "Возраст",
    duration: "Длительность",
    benefit: "Польза",
    formTitle: "Запись на пробное занятие",
    parentName: "Имя родителя",
    phone: "Телефон",
    childName: "Имя ребенка",
    childAge: "Возраст ребенка",
    branch: "Филиал",
    preferredTime: "Удобный день и время",
    comment: "Комментарий",
    submit: "Отправить заявку",
    sent: "Заявка отправлена администратору",
    receiptTitle: "Загрузка чека",
    receiptHelp: "Чек будет сохранен и отправлен админу на проверку.",
    upload: "Загрузить чек",
    admin: "Админка",
    noAccess: "Нет доступа. Откройте админку из Telegram аккаунта администратора.",
    leads: "Заявки",
    clients: "Клиенты",
    receipts: "Чеки"
  },
  ka: {
    brand: "MBPG",
    subtitle: "ბავშვების აუზი და სპორტული გაკვეთილები ბათუმში",
    choose: "აირჩიეთ მიმართულება",
    pool: "My Baby Pool",
    gym: "My Gymnastics Gym",
    massage: "მასაჟი",
    book: "ჩაწერა",
    prices: "ფასები",
    contacts: "კონტაქტები",
    receipt: "ჩეკის გაგზავნა",
    back: "უკან",
    age: "ასაკი",
    duration: "ხანგრძლივობა",
    benefit: "სარგებელი",
    formTitle: "საცდელ გაკვეთილზე ჩაწერა",
    parentName: "მშობლის სახელი",
    phone: "ტელეფონი",
    childName: "ბავშვის სახელი",
    childAge: "ბავშვის ასაკი",
    branch: "ფილიალი",
    preferredTime: "სასურველი დღე და დრო",
    comment: "კომენტარი",
    submit: "განაცხადის გაგზავნა",
    sent: "განაცხადი გაეგზავნა ადმინისტრატორს",
    receiptTitle: "ჩეკის ატვირთვა",
    receiptHelp: "ჩეკი შეინახება და გადაეგზავნება ადმინისტრატორს შესამოწმებლად.",
    upload: "ჩეკის ატვირთვა",
    admin: "ადმინი",
    noAccess: "წვდომა არ არის. გახსენით ადმინი ადმინისტრატორის Telegram ანგარიშიდან.",
    leads: "განაცხადები",
    clients: "კლიენტები",
    receipts: "ჩეკები"
  },
  en: {
    brand: "MBPG",
    subtitle: "Kids pool and sports classes in Batumi",
    choose: "Choose a direction",
    pool: "My Baby Pool",
    gym: "My Gymnastics Gym",
    massage: "Massage",
    book: "Book",
    prices: "Prices",
    contacts: "Contacts",
    receipt: "Send receipt",
    back: "Back",
    age: "Age",
    duration: "Duration",
    benefit: "Benefit",
    formTitle: "Book a trial lesson",
    parentName: "Parent name",
    phone: "Phone",
    childName: "Child name",
    childAge: "Child age",
    branch: "Branch",
    preferredTime: "Preferred day and time",
    comment: "Comment",
    submit: "Send request",
    sent: "Request sent to admin",
    receiptTitle: "Receipt upload",
    receiptHelp: "The receipt will be saved and sent to admin for review.",
    upload: "Upload receipt",
    admin: "Admin",
    noAccess: "No access. Open admin from the administrator Telegram account.",
    leads: "Leads",
    clients: "Clients",
    receipts: "Receipts"
  }
};
