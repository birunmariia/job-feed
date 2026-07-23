import { criteria } from "./criteria.mjs";

function includesAny(text, words) {
  const t = (text || "").toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

// Эвристика: ищем в тексте фразы вида "5+ years experience",
// "3-5 years of experience", "minimum 7 years experience" и берём
// наибольшее упомянутое число лет. Возвращает null, если в тексте
// нет явного упоминания лет опыта.
const EXPERIENCE_RE =
  /(\d{1,2})\s*(?:\+|-\s*\d{1,2})?\+?\s*years?\s*(?:of\s+)?(?:relevant\s+|professional\s+|working\s+)?experience/gi;

function extractRequiredYears(text) {
  const matches = [...(text || "").matchAll(EXPERIENCE_RE)].map((m) =>
    Number(m[1])
  );
  if (matches.length === 0) return null;
  return Math.max(...matches);
}

// Источники, где все вакансии удалённые по определению — им признак
// "remote" в тексте не нужен, они проходят remote-фильтр автоматически.
const REMOTE_SOURCES = ["remoteok", "remotive", "workingnomads", "himalayas"];

// true, если вакансию можно считать удалённой (см. criteria.remoteOnly).
// ВАЖНО: признак удалёнки ищем ТОЛЬКО в поле локации, а не в описании —
// у Adzuna в описании почти всегда есть шаблонное "worldwide", из-за чего
// раньше проходили офисные вакансии (L'Oréal в UK-магазинах и т.п.).
function isRemote(job) {
  if (REMOTE_SOURCES.includes(job.source)) return true;
  return includesAny(job.location, criteria.remoteKeywords);
}

/**
 * Возвращает null, если вакансия не подходит вообще (жёсткий фильтр),
 * либо объект с пометками, если подходит (мягкие критерии — только пометки).
 */
export function evaluateJob(job) {
  const haystackTitle = job.title || "";
  const haystackFull = `${job.title} ${job.description} ${job.category}`.slice(
    0,
    4000
  );

  // Жёсткий фильтр 1: роль должна совпадать с одной из целевых
  const roleMatch = includesAny(haystackTitle, criteria.roles);
  if (!roleMatch) return null;

  // Жёсткий фильтр 2: явные исключения (tech/HR/corporate и т.п.)
  if (includesAny(haystackFull, criteria.excludeKeywords)) return null;

  // Жёсткий фильтр 3: требуемый опыт больше допустимого (эвристика по тексту)
  const requiredYears = extractRequiredYears(haystackFull);
  if (requiredYears !== null && requiredYears > criteria.maxExperienceYears) {
    return null;
  }

  // Жёсткий фильтр 4: только удалённые (если включено в criteria)
  if (criteria.remoteOnly && !isRemote(job)) return null;

  // Мягкие критерии — не отсеивают, только помечают
  const industryMatch = includesAny(haystackFull, criteria.industries);
  const timezoneMatch = includesAny(
    `${job.location} ${haystackFull}`,
    criteria.timezones
  );

  let salaryOk = null; // null = неизвестно (API не дал данных)
  if (job.salaryMin || job.salaryMax) {
    const yearly = job.salaryMax || job.salaryMin;
    salaryOk = yearly >= criteria.minSalaryUsdYearly;
  }

  return {
    ...job,
    industryMatch,
    timezoneMatch,
    salaryOk,
    // общий скор для сортировки — чем больше "мягких" совпадений, тем выше
    score:
      (industryMatch ? 1 : 0) +
      (timezoneMatch ? 1 : 0) +
      (salaryOk === true ? 1 : 0),
  };
}

export function filterAndScore(jobs) {
  return jobs
    .map(evaluateJob)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}
