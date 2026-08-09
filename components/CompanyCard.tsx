import { canSponsorSkilledWorker } from "@/lib/sponsors";
import type { Company } from "@/lib/types";

export function CompanyCard({ company }: { company: Company }) {
  const canSponsor = canSponsorSkilledWorker(company);
  const isBRated = company.rating.includes("B rating");
  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-6 ">
        <div>
          <p className="font-medium">{company.name}</p>
          <p className="text-sm text-gray-500">{company.town}</p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium
                ${canSponsor ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
        >
          {canSponsor ? "Skilled Worker" : "No Skilled Worker"}
        </span>
      </div>

      {isBRated && (
        <p className="mt-2 text-xs text-red-600">
          B rating: this sponsor is on a Home Office action plan.
        </p>
      )}
      <p className="mt-2 text-sm text-gray-400">{company.routes.join(", ")} </p>
    </li>
  );
}
