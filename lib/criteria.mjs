// ============================================================
// ТВОИ КРИТЕРИИ ПОИСКА — редактируй смело, это единственный файл,
// который нужно трогать, чтобы поменять фильтры.
// ============================================================

export const criteria = {
  // Роли — ищем эти слова в названии вакансии (частичное совпадение, без учёта регистра)
  roles: [
    "personal assistant",
    "executive assistant",
    "ea to founder",
    "ea to ceo",
    "brand assistant",
    "studio assistant",
    "community manager",
    "client experience manager",
    "concierge manager",
    "virtual assistant",
  ],

  // Индустрии / контекст — ищем в названии, описании и категории вакансии
  industries: [
    "hospitality",
    "fashion",
    "wellness",
    "food & beverage",
    "food and beverage",
    "restaurant",
    "travel",
    "lifestyle",
    "beauty",
    "skincare",
    "art",
    "culture",
    "media",
    "dtc",
    "direct-to-consumer",
    "creative agency",
    "boutique hotel",
    "retreat",
    "wedding",
    "events",
  ],

  // Явно исключаем — если это слово встречается в названии или категории, вакансия отсеивается
  excludeKeywords: [
    "software engineer",
    "developer",
    "devops",
    "data scientist",
    "backend",
    "frontend",
    "full stack",
    "sre",
    "qa engineer",
    "hr manager",
    "human resources",
    "recruiter",
    "talent acquisition",
    "sysadmin",
    "cybersecurity",
    "blockchain",
    "web3",
    // Розничные/офисные роли, которые случайно ловятся по подстроке
    // (напр. «Multi-Brand Assistant Manager» в магазине L'Oréal)
    "assistant manager",
    "sales assistant",
    "store manager",
    "retail assistant",
  ],

  // Компании — мягкий критерий (не отсеивает, только помечает как "match")
  companySize: { min: 1, max: 30 },

  // Зарплата — минимум в год в USD для full-time (используется только если API отдаёт зарплату)
  minSalaryUsdYearly: 18000, // ≈ $1,500/мес full-time

  // Максимум лет опыта, который вакансия может требовать (жёсткий фильтр).
  // Определяется эвристикой по тексту описания (ищем фразы вида "5+ years
  // experience") — если явного числа лет в тексте нет, вакансия не отсеивается.
  maxExperienceYears: 5,

  // Только удалённые вакансии (жёсткий фильтр). true = офисные отсеиваются.
  // Логика: вакансии с remote-бордов (RemoteOK, Remotive, Working Nomads,
  // Himalayas) проходят всегда — там всё удалённое по определению; вакансии
  // с агрегаторов (Greenhouse, Lever, Jooble, Adzuna) проходят, только если
  // в локации/описании есть признак удалёнки (см. remoteKeywords ниже).
  // Поставь false, если захочешь снова видеть и офисные вакансии.
  remoteOnly: true,

  // Слова-признаки удалённой работы (для источников-агрегаторов)
  remoteKeywords: [
    "remote",
    "work from home",
    "work-from-home",
    "wfh",
    "anywhere",
    "worldwide",
    "distributed",
    "home based",
    "home-based",
    "telecommute",
    "fully remote",
  ],

  // Таймзона — ЖЁСТКИЙ фильтр (true = вакансии не из твоего пояса отсеиваются).
  // Проходит, только если в локации/описании явно указан твой регион (см.
  // timezones ниже) ИЛИ вакансия помечена как всемирная (worldwide/anywhere/
  // global в ЛОКАЦИИ — такая подходит под любой пояс). Работа в ночь по US
  // отсекается. Поставь false, если снова захочешь видеть все remote-вакансии.
  timezoneRequired: true,

  // Метки "работает в любом поясе" — ищем ТОЛЬКО в поле локации (не в описании,
  // где часто шаблонное "worldwide"). Такие вакансии проходят таймзон-фильтр.
  timezoneFlexibleKeywords: ["worldwide", "anywhere", "global"],

  // Таймзоны — ищем эти обозначения в тексте локации/таймзоны вакансии
  timezones: [
    "australia", "sydney", "melbourne", "brisbane", "perth", "aest", "aedt",
    "new zealand", "auckland", "nzst",
    "singapore", "sgt",
    "uae", "dubai", "abu dhabi", "gst",
    "europe", "cet", "cest", "uk", "london", "gmt", "bst", "western europe",
    "ukraine", "kyiv", "kiev", "eet", "eest",
    "poland", "warsaw",
  ],
};
