import Link from "next/link";
import { getCompanies, searchCompanies } from "@/lib/sponsors";
import { CompanyCard } from "@/components/CompanyCard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";

  const result = await searchCompanies(query);
  const companies = await getCompanies();

  return (
    <main className="mx-auto max-w-2xl p-10">
      <h1 className="text-3xl font-bold text-center">SponsorScope</h1>
      <form className="relative mt-6">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search a company"
          className="w-full px-3 py-2 pr-10 rounded border border-gray-300"
        />
        {query && (
          <Link
            href="/"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            ✕
          </Link>
        )}
      </form>

      {query && result.length === 0 && (
        <p className="mt-4 text-center text-gray-400">
          No company matches that name.
        </p>
      )}

      {query && (
        <p className="mt-6 text-gray-500">
          {result.length} {result.length === 1 ? "result" : "results"} for
          &quot;{query}&quot;
        </p>
      )}
      <ul className="mt-2 space-y-3">
        {result.map((company) => (
          <CompanyCard key={CompanyCard.name} company={company} />
        ))}
      </ul>
    </main>
  );
}
