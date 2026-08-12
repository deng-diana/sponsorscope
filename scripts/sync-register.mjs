import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

const PAGE =
  "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

async function fetchCsvUrl() {
  const html = await fetch(PAGE).then((r) => r.text());
  const match = html.match(/https:\/\/[^"]+\.csv/);
  if (!match) throw new Error("No CSV link found on the GOV.UK page");
  return match[0];
}

async function fetchRows() {
  const csvUrl = await fetchCsvUrl();
  const csv = await fetch(csvUrl).then((r) => r.text());
  return parse(csv, { columns: true, bom: true, skip_empty_lines: true });
}

function groupByCompany(rows) {
  const byName = new Map();
  for (const row of rows) {
    const name = row["Organisation Name"].trim();
    if (!name) continue;

    const route = row["Route"].trim();
    const found = byName.get(name);

    if (found) {
      // One row per (organisation, route, sub-type), so the same route can
      // appear several times for one company. Keep the list distinct.
      if (!found.routes.includes(route)) found.routes.push(route);
    } else {
      byName.set(name, {
        name,
        town: row["Town/City"].trim(),
        county: row["County"].trim(),
        rating: row["Type & Rating"].trim(),
        routes: [route],
      });
    }
  }
  return [...byName.values()];
}

async function upsertCompanies(companies) {
  const today = new Date().toISOString().slice(0, 10);
  const BATCH = 1000;

  for (let i = 0; i < companies.length; i += BATCH) {
    const batch = companies
      .slice(i, i + BATCH)
      .map((c) => ({ ...c, last_seen: today }));

    async function upsertBatch(batch) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error } = await supabase
          .from("companies")
          .upsert(batch, { onConflict: "name" });

        if (!error) return;

        console.log(`Attempt ${attempt} failed: ${error.message}`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      throw new Error("Batch failed after 3 attempts");
    }

    await upsertBatch(batch);
  }
}

const rows = await fetchRows();
const companies = groupByCompany(rows);
console.log(`Parsed ${companies.length} companies`);
await upsertCompanies(companies);
console.log("Synced");
