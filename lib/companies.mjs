// ============================================================
// Компании для источников Greenhouse и Lever (lib/sources.mjs).
//
// В отличие от remoteok/remotive/himalayas/workingnomads, у Greenhouse
// и Lever нет общего каталога со всеми вакансиями сразу — нужно точечно
// указать токен конкретной компании, и код сходит именно в её борд.
//
// Как найти токен компании:
// — Greenhouse: открой страницу вакансий компании вида
//   https://boards.greenhouse.io/ИМЯ_КОМПАНИИ (или job-boards.greenhouse.io/ИМЯ_КОМПАНИИ) —
//   часть URL после /boards.greenhouse.io/ и есть токен.
// — Lever: открой страницу вакансий компании вида
//   https://jobs.lever.co/ИМЯ_КОМПАНИИ — часть URL после /jobs.lever.co/
//   и есть токен.
//
// Впиши сюда токены компаний, которые хочешь мониторить — сам код искать
// компании не будет (общего каталога у этих двух источников нет).
//
// Стартовый список ниже — реально проверенные токены (fashion/beauty/
// lifestyle DTC-бренды и маркетплейсы, близкие к твоим индустриям из
// criteria.mjs). Добавляй/удаляй по своему усмотрению.
// ============================================================

export const companies = {
  greenhouse: [
    "glossier", // beauty DTC
    "reformation", // fashion DTC
    "cuyana", // fashion DTC
    "mejuri", // jewelry DTC
  ],
  lever: [
    "minted", // design marketplace / wedding stationery
    "houzz", // home & design marketplace
  ],
};
