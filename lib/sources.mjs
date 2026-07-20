// ============================================================
// Источники вакансий. Каждая функция возвращает массив вакансий
// в едином формате:
// { source, sourceId, title, company, url, description, location,
//   category, salaryMin, salaryMax, salaryCurrency, publishedAt }
// Если один источник упадёт (сайт лежит / поменял формат) — это
// не должно ронять остальные, поэтому каждый fetch обёрнут в try/catch
// в orchestrator'е (scripts/run.mjs), а не здесь.
// ============================================================

const UA =
  "Mozilla/5.0 (compatible; JobFinderBot/1.0; +personal remote job search tool)";

// ---------- RemoteOK ----------
// https://remoteok.com/api — публичный, без ключа
export async function fetchRemoteOK() {
  const res = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`RemoteOK: HTTP ${res.status}`);
  const data = await res.json();
  // Первый элемент — служебная запись (legal notice), пропускаем её
  return data
    .filter((j) => j && j.id && j.position)
    .map((j) => ({
      source: "remoteok",
      sourceId: String(j.id),
      title: j.position,
      company: j.company || "",
      url: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
      description: j.description || "",
      location: j.location || "Worldwide",
      category: (j.tags || []).join(", "),
      salaryMin: j.salary_min || null,
      salaryMax: j.salary_max || null,
      salaryCurrency: "USD",
      publishedAt: j.date || null,
    }));
}

// ---------- Remotive ----------
// https://remotive.com/api/remote-jobs — публичный, без ключа
// Условие источника: при показе вакансий давать ссылку на remotive.com и указывать источник
export async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=200", {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Remotive: HTTP ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((j) => ({
    source: "remotive",
    sourceId: String(j.id),
    title: j.title,
    company: j.company_name || "",
    url: j.url,
    description: j.description || "",
    location: j.candidate_required_location || "Worldwide",
    category: j.category || "",
    salaryMin: null,
    salaryMax: null,
    salaryText: j.salary || null, // Remotive отдаёт зарплату текстом, не числом
    salaryCurrency: "USD",
    publishedAt: j.publication_date || null,
  }));
}

// ---------- Himalayas ----------
// https://himalayas.app/jobs/api — публичный, без ключа, максимум 20 за запрос
// Условие источника: при показе вакансий давать ссылку на himalayas.app и указывать источник
export async function fetchHimalayas({ maxPages = 5 } = {}) {
  const jobs = [];
  let offset = 0;
  const limit = 20;
  for (let page = 0; page < maxPages; page++) {
    const res = await fetch(
      `https://himalayas.app/jobs/api?offset=${offset}&limit=${limit}`,
      { headers: { "User-Agent": UA } }
    );
    if (!res.ok) throw new Error(`Himalayas: HTTP ${res.status}`);
    const data = await res.json();
    for (const j of data.jobs || []) {
      jobs.push({
        source: "himalayas",
        sourceId: j.guid,
        title: j.title,
        company: j.companyName || "",
        url: j.applicationLink,
        description: j.description || j.excerpt || "",
        location: (j.locationRestrictions || [])
          .map((l) => l.name)
          .join(", ") || "Worldwide",
        category: (j.categories || []).join(", "),
        salaryMin: j.minSalary || null,
        salaryMax: j.maxSalary || null,
        salaryCurrency: j.currency || "USD",
        publishedAt: j.pubDate ? new Date(j.pubDate).toISOString() : null,
      });
    }
    offset += limit;
    if (offset >= (data.totalCount || 0)) break;
  }
  return jobs;
}

// ---------- Working Nomads ----------
// https://www.workingnomads.co/api/exposed_jobs/ — публичный, без ключа
// Требует реалистичный User-Agent, иначе может отдавать пустой ответ
export async function fetchWorkingNomads() {
  const res = await fetch("https://www.workingnomads.co/api/exposed_jobs/", {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Working Nomads: HTTP ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((j) => ({
    source: "workingnomads",
    sourceId: j.url,
    title: j.title,
    company: j.company_name || "",
    url: j.url,
    description: j.description || "",
    location: j.location || "Worldwide",
    category: j.category_name || "",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    publishedAt: j.pub_date || null,
  }));
}

export const allSources = [
  { name: "remoteok", fetch: fetchRemoteOK },
  { name: "remotive", fetch: fetchRemotive },
  { name: "himalayas", fetch: fetchHimalayas },
  { name: "workingnomads", fetch: fetchWorkingNomads },
];
