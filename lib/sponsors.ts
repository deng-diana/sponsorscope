import { SKILLED_WORKER, type Company } from "./types";
import { supabase } from "./supabase";

export async function getCompanyCount(): Promise<number> {
  const { count, error } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function searchCompanies(
  query: string,
  limit = 20,
): Promise<Company[]> {
  if (!query) return [];
  const { data, error } = await supabase
    .from("companies")
    .select("name, town, rating, routes")
    .ilike("name", `%${query}%`)
    .limit(limit);

  if (error) throw error;
  // The register carries one row per (organisation, route, sub-type), so a
  // company licensed for Skilled Worker under two sub-types arrives with the
  // route repeated. Collapse it here rather than showing the user
  // "Skilled Worker, Skilled Worker" on the card.
  const rows = (data ?? []) as Company[];
  return rows.map((c) => ({ ...c, routes: [...new Set(c.routes)] }));
}

export function canSponsorSkilledWorker(company: Company): boolean {
  return company.routes.includes(SKILLED_WORKER);
}
