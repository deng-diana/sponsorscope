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
  return data ?? [];
}

export function canSponsorSkilledWorker(company: Company): boolean {
  return company.routes.includes(SKILLED_WORKER);
}
