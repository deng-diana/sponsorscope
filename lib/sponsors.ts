import { readFileSync } from "fs";
import { join } from "path";
import { gunzipSync } from "zlib";
import { SKILLED_WORKER, type Company } from "./types";

const DATA_PATH = join(process.cwd(), "data", "snapshot-latest.txt.gz");
let cache: Company[] | null = null;

function loadCompanies(): Company[] {
  const text = gunzipSync(readFileSync(DATA_PATH)).toString();
  const byName = new Map<string, Company>();

  for (const line of text.trim().split("\n")) {
    const [name, town, , rating, route] = line.split("\t");
    const found = byName.get(name);
    if (found) {
      found.routes.push(route);
    } else {
      byName.set(name, { name, town, rating, routes: [route] });
    }
  }
  return [...byName.values()];
}

export async function getCompanies(): Promise<Company[]> {
  if (!cache) {
    cache = loadCompanies();
  }
  return cache;
}

export async function searchCompanies(
  query: string,
  limit = 20,
): Promise<Company[]> {
  if (!query) return [];
  const needle = query.toLowerCase();
  const companies = await getCompanies();
  return companies
    .filter((company) => company.name.toLowerCase().includes(needle))
    .slice(0, limit);
}

export function canSponsorSkilledWorker(company: Company): boolean {
  return company.routes.includes(SKILLED_WORKER);
}
