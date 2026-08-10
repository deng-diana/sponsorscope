import { canSponsorSkilledWorker } from "@/lib/sponsors";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function CompanyCard({ company }: { company: Company }) {
  const canSponsor = canSponsorSkilledWorker(company);
  const isBRated = company.rating.includes("B rating");
  return (
    <li className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-6 ">
        <div>
          <p className="font-medium">{company.name}</p>
          <p className="text-sm text-muted-foreground">{company.town}</p>
        </div>

        <Badge
          className={cn(
            "shrink-0 py-3 px-2",
            canSponsor
              ? "bg-eligible text-eligible-foreground"
              : "bg-warning text-warning-foreground",
          )}
        >
          {canSponsor ? "Skilled Worker" : "No Skilled Worker"}
        </Badge>
      </div>

      {isBRated && (
        <p className="mt-2 text-xs text-destructive">
          B rating: this sponsor is on a Home Office action plan.
        </p>
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        {company.routes.join(", ")}{" "}
      </p>
    </li>
  );
}
