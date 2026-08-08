import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";

  const file = readFileSync("data/snapshot-latest.txt.gz");
  const text = gunzipSync(file).toString();
  const lines = text.trim().split("\n");

  const matches = query
    ? lines.filter((line) => line.toLowerCase().includes(query.toLowerCase()))
    : [];

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
      <p className="mt-4"> You searched for : {query}</p>
      {matches.length > 0 ? (
        <ul className="mt-2">
          {matches.slice(0, 20).map((match) => (
            <li key={match}>{match}</li>
          ))}
        </ul>
      ) : (
        "nothing exist"
      )}

      <p className="mt-2 text-gray-600 text-center">
        {lines.length} companies on the register
      </p>
    </main>
  );
}
