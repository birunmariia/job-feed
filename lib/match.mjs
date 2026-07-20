import { criteria } from "./criteria.mjs";

function includesAny(text, words) {
  const t = (text || "").toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
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
