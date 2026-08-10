import Link from "next/link";
import { getCompanyCount, searchCompanies } from "@/lib/sponsors";
import { CompanyCard } from "@/components/CompanyCard";
import { SearchIcon, CloseIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";

  const result = await searchCompanies(query);
  const total = await getCompanyCount();

  return (
    <main className="mx-auto max-w-2xl p-10">
      <h1 className="text-3xl font-display font-bold text-center">
        SponsorScope
      </h1>
      <form className="relative mt-6">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <Input
          name="q"
          defaultValue={query}
          placeholder="Search a company"
          className="pl-10 pr-10 py-4 rounded-md"
        />
        {query && (
          <Link
            href="/"
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-600"
          >
            <CloseIcon className="w-4 h-4" />
          </Link>
        )}
      </form>

      {query && result.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">
          No company matches that name.
        </p>
      )}

      {query && (
        <p className="mt-6 text-muted-foreground">
          {result.length} {result.length === 1 ? "result" : "results"} for
          &quot;{query}&quot;
        </p>
      )}
      <ul className="mt-2 space-y-3">
        {result.map((company) => (
          <CompanyCard key={company.name} company={company} />
        ))}
      </ul>
      <p className="mt-8 text-center text-muted-foreground">
        {total} companies on the register
      </p>
    </main>
  );
}
