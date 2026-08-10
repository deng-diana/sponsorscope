import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key);
const text = gunzipSync(readFileSync("data/snapshot-latest.txt.gz")).toString();
const byName = new Map();

for (const line of text.trim().split("\n")) {
  const [name, town, county, rating, route] = line.split("\t");
  const found = byName.get(name);
  if (found) {
    found.routes.push(route);
  } else {
    byName.set(name, { name, town, county, rating, routes: [route] });
  }
}

const companies = [...byName.values()];
console.log(`Parsed ${companies.length} companies`);

const BATCH = 1000;

for (let i = 0; i < companies.length; i += BATCH) {
  const batch = companies.slice(i, i + BATCH);
  const { error } = await supabase
    .from("companies")
    .upsert(batch, { onConflict: "name" });

  if (error) {
    console.error(`Failed at row ${i}:`, error.message);
    process.exit(1);
  }
  console.log(`${Math.min(i + BATCH, companies.length)} / ${companies.length}`);
}

console.log("Done");
