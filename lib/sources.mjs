// ============================================================
// Источники вакансий. Каждая функция возвращает массив вакансий
// в едином формате:
// { source, sourceId, title, company, url, description, location,
//   category, salaryMin, salaryMax, salaryCurrency, publishedAt }
// Если один источник упадёт (сайт лежит / поменял формат) — это
// не должно ронять остальные, поэтому каждый fetch обёрнут в try/catch
// в orchestrator'е (scripts/run.mjs), а не здесь.
// ============================================================

import { companies } from "./companies.mjs";
import { criteria } from "./criteria.mjs";

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

// ---------- Greenhouse ----------
// https://boards-api.greenhouse.io/v1/boards/{token}/jobs — публичный, без ключа.
// Общего каталога вакансий нет — токены компаний берутся из lib/companies.mjs.
// Ошибка одной компании не должна останавливать остальные, поэтому
// try/catch стоит здесь, вокруг каждого токена, а не только в orchestrator'е.
export async function fetchGreenhouse() {
  const jobs = [];
  for (const token of companies.greenhouse) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
        { headers: { "User-Agent": UA } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const j of data.jobs || []) {
        jobs.push({
          source: "greenhouse",
          sourceId: `${token}-${j.id}`,
          title: j.title,
          company: token,
          url: j.absolute_url,
          description: j.content || "",
          location: j.location?.name || "Worldwide",
          category: (j.departments || []).map((d) => d.name).join(", "),
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",
          publishedAt: j.updated_at || null,
        });
      }
    } catch (err) {
      console.error(`[greenhouse:${token}] ОШИБКА: ${err.message}`);
    }
  }
  return jobs;
}

// ---------- Lever ----------
// https://api.lever.co/v0/postings/{token}?mode=json — публичный, без ключа.
// Общего каталога вакансий нет — токены компаний берутся из lib/companies.mjs.
export async function fetchLever() {
  const jobs = [];
  for (const token of companies.lever) {
    try {
      const res = await fetch(
        `https://api.lever.co/v0/postings/${token}?mode=json`,
        { headers: { "User-Agent": UA } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const j of data || []) {
        jobs.push({
          source: "lever",
          sourceId: j.id,
          title: j.text,
          company: token,
          url: j.hostedUrl,
          description: j.descriptionPlain || j.description || "",
          location: j.categories?.location || "Worldwide",
          category: j.categories?.team || "",
          salaryMin: j.salaryRange?.min || null,
          salaryMax: j.salaryRange?.max || null,
          salaryCurrency: j.salaryRange?.currency || "USD",
          publishedAt: j.createdAt
            ? new Date(j.createdAt).toISOString()
            : null,
        });
      }
    } catch (err) {
      console.error(`[lever:${token}] ОШИБКА: ${err.message}`);
    }
  }
  return jobs;
}

// ---------- Jooble ----------
// https://jooble.org/api/{key} — требует бесплатный API-ключ, см.
// https://jooble.org/api/about. Ключ берётся из JOOBLE_API_KEY (env / GitHub Secret).
// Общего поиска "по всем ролям сразу" нет — делаем отдельный запрос на
// каждую роль из criteria.roles и дедуплицируем по id внутри функции
// (иначе Supabase upsert упадёт на дублях внутри одного батча).
export async function fetchJooble() {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.error("[jooble] пропущен: не задан JOOBLE_API_KEY");
    return [];
  }
  const seen = new Map();
  for (const role of criteria.roles) {
    try {
      const res = await fetch(`https://jooble.org/api/${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({ keywords: role, location: "remote" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const j of data.jobs || []) {
        if (!j.id || seen.has(j.id)) continue;
        seen.set(j.id, {
          source: "jooble",
          sourceId: String(j.id),
          title: j.title,
          company: j.company || "",
          url: j.link,
          description: j.snippet || "",
          location: j.location || "Worldwide",
          category: j.type || "",
          salaryMin: null,
          salaryMax: null,
          salaryText: j.salary || null, // Jooble отдаёт зарплату текстом, не числом
          salaryCurrency: "USD",
          publishedAt: j.updated || null,
        });
      }
    } catch (err) {
      console.error(`[jooble:"${role}"] ОШИБКА: ${err.message}`);
    }
  }
  return [...seen.values()];
}

// ---------- Adzuna ----------
// https://api.adzuna.com/v1/api/jobs/{country}/search/1 — требует бесплатные
// app_id + app_key, см. https://developer.adzuna.com. Берутся из
// ADZUNA_APP_ID / ADZUNA_APP_KEY (env / GitHub Secrets).
// У Adzuna нет единого глобального поиска — только по отдельным странам,
// поэтому перебираем страны из ADZUNA_COUNTRIES (подобраны под таймзоны
// из criteria.timezones) и роли из criteria.roles. Если упрёшься в лимит
// бесплатного тарифа — сократи список стран или ролей ниже.
const ADZUNA_COUNTRIES = ["gb", "au", "nz", "sg"];

export async function fetchAdzuna() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    console.error(
      "[adzuna] пропущен: не заданы ADZUNA_APP_ID / ADZUNA_APP_KEY"
    );
    return [];
  }
  const seen = new Map();
  for (const country of ADZUNA_COUNTRIES) {
    for (const role of criteria.roles) {
      try {
        const url =
          `https://api.adzuna.com/v1/api/jobs/${country}/search/1` +
          `?app_id=${appId}&app_key=${appKey}&results_per_page=20` +
          `&what=${encodeURIComponent(role)}`;
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        for (const j of data.results || []) {
          if (!j.id || seen.has(j.id)) continue;
          seen.set(j.id, {
            source: "adzuna",
            sourceId: String(j.id),
            title: j.title,
            company: j.company?.display_name || "",
            url: j.redirect_url,
            description: j.description || "",
            location: j.location?.display_name || "Worldwide",
            category: j.category?.label || "",
            salaryMin: j.salary_min || null,
            salaryMax: j.salary_max || null,
            salaryCurrency: "USD",
            publishedAt: j.created || null,
          });
        }
      } catch (err) {
        console.error(`[adzuna:${country}:"${role}"] ОШИБКА: ${err.message}`);
      }
    }
  }
  return [...seen.values()];
}

export const allSources = [
  { name: "remoteok", fetch: fetchRemoteOK },
  { name: "remotive", fetch: fetchRemotive },
  { name: "himalayas", fetch: fetchHimalayas },
  { name: "workingnomads", fetch: fetchWorkingNomads },
  { name: "greenhouse", fetch: fetchGreenhouse },
  { name: "lever", fetch: fetchLever },
  { name: "jooble", fetch: fetchJooble },
  { name: "adzuna", fetch: fetchAdzuna },
];
