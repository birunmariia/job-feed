import { createClient } from "@supabase/supabase-js";
import { allSources } from "../lib/sources.mjs";
import { filterAndScore } from "../lib/match.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Не заданы SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (переменные окружения / GitHub secrets)."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  let allJobs = [];

  for (const src of allSources) {
    try {
      const jobs = await src.fetch();
      console.log(`[${src.name}] получено вакансий: ${jobs.length}`);
      allJobs = allJobs.concat(jobs);
    } catch (err) {
      // Один упавший источник не должен останавливать остальные
      console.error(`[${src.name}] ОШИБКА: ${err.message}`);
    }
  }

  console.log(`Всего собрано: ${allJobs.length}`);

  const matched = filterAndScore(allJobs);
  console.log(`Подходят под критерии: ${matched.length}`);

  if (matched.length === 0) {
    console.log("Нечего сохранять — выходим.");
    return;
  }

  const rows = matched.map((j) => ({
    source: j.source,
    source_id: j.sourceId,
    title: j.title,
    company: j.company,
    url: j.url,
    description: (j.description || "").slice(0, 5000),
    location: j.location,
    category: j.category,
    salary_min: j.salaryMin,
    salary_max: j.salaryMax,
    salary_text: j.salaryText || null,
    salary_currency: j.salaryCurrency,
    industry_match: j.industryMatch,
    timezone_match: j.timezoneMatch,
    salary_ok: j.salaryOk,
    score: j.score,
    published_at: j.publishedAt,
  }));

  // upsert: если вакансия уже есть (source+source_id), обновляем данные,
  // но не трогаем is_new / first_seen_at — чтобы не сбрасывать пометку "новое"
  const { error } = await supabase
    .from("jobs")
    .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: false });

  if (error) {
    console.error("Ошибка записи в Supabase:", error.message);
    process.exit(1);
  }

  console.log("Готово: данные сохранены в Supabase.");
}

main();
