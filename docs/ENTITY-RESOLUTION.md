# Brand to legal entity resolution

The register lists legal entities. Job adverts name brands. Closing that gap
is the only genuinely hard problem in this project, and it is the one worth
explaining out loud.

## Where search fails today

Measured against the committed snapshot, using brands a real applicant would
actually type. `n` is how many rows the current `ilike '%query%'` returns.

| Query | n | Top hits today | Failure |
| --- | ---: | --- | --- |
| `deliveroo` | 1 | Roofoods Ltd t/a Deliveroo | none, works |
| `monzo` | 1 | Monzo Bank Ltd | none, works |
| `revolut` | 13 | Heaven Revolution CIC, ICT Revolutions Ltd | **right answer buried, no ranking** |
| `starling` | 6 | 100Starlings Ltd | **right answer buried, no ranking** |
| `meta` | 175 | 3G Metal Fabrications, AK Metalworks | **substring matches inside unrelated words** |
| `wise` | 131 | Aaron Wise Ltd, CONSTRUCTIONWISE LTD | same |
| `twitter` | 0 | nothing | **brand absent from every legal name** |

Three distinct failure modes, and they need three different fixes. Worth
saying plainly: they are not all "add fuzzy matching".

1. **No ranking.** `searchCompanies` runs `ilike` then `.limit(20)` with no
   `ORDER BY`, so the twenty rows come back in whatever order Postgres
   returns them. `Revolut Ltd` exists and is simply not in the first twenty.
   This is the cheapest fix and it repairs the most queries.
2. **Substring noise.** A short brand matches inside longer unrelated words:
   `meta` inside `Metalworks`, `wise` inside `CONSTRUCTIONWISE`. Ranking
   helps, word-boundary and length-ratio scoring helps more.
3. **Brand is not in the legal name at all.** `twitter` returns nothing.
   No amount of string matching fixes this. It needs an alias table.

## The asymmetry that drives the design

A wrong **no** costs someone an application they should have made.
A wrong **yes** costs them a week of their life on an application that could
never have worked.

Both are bad, so the system should never return a bare boolean. Every answer
carries how it was reached and the register row it was reached from:

```ts
type Resolution = {
  company: Company | null;
  confidence: "exact" | "alias" | "trading-as" | "fuzzy" | "unresolved";
  evidence: Company[];   // the rows behind the answer, or near misses
};
```

When nothing resolves, return the near misses and say so. Never a confident
"this company cannot sponsor you", because that sentence stops someone from
applying.

## The plan

### Stage 1: normalise and rank (about 2 hours)

- Add a `name_normalised` column: lowercase, strip punctuation, collapse
  whitespace, strip corporate suffixes (`ltd`, `limited`, `plc`, `llp`,
  `uk`, `group`, `holdings`).
- Rank results instead of returning them arbitrarily. Order by: exact match
  on the normalised name, then prefix match, then the ratio of query length
  to name length, so `Revolut Ltd` beats `ICT Revolutions Ltd` for `revolut`.
- Expected: fixes `revolut`, `starling`, and most of `meta` and `wise`.

### Stage 2: mine the trading-as names (about 2 hours)

**8,664 of the 127,223 companies already carry their brand in the register
name**, in three formats: ` t/a `, ` T/A `, and ` trading as `. Examples from
the data: `Roofoods Ltd t/a Deliveroo`, `zain hut limited T/A Pizza Hut`,
`108 RETAIL LIMITED T/A SPAR`.

That is a free, human-written, high-quality alias table sitting inside the
dataset. Parse it during ingestion into an `entity_aliases` table
(`alias` -> `company_name`, `source: 'trading-as'`), and search aliases
alongside names.

Then seed the same table by hand from the verified brand-to-entity mappings
already in my own application tracker, with `source: 'manual'`. Manual rows
win over everything else.

### Stage 3: measure it (about 2 hours, and the one people skip)

Build a golden set of about 50 brand-to-entity pairs from companies I have
actually applied to and verified by hand. Then:

- Report **top-1 accuracy** and **top-5 accuracy** before and after each stage
- Report the **false-confident rate**: how often a `high` confidence answer is
  wrong. This is the number that matters, because it is the one that makes
  someone skip an application they should have made.
- Put the numbers in the README, including the bad ones.

Only after this is there any case for adding an LLM to the ambiguous cases,
because without the golden set there is no way to tell whether it helped.

## Deliberately not doing

- **LLM as the first resort.** It is the most expensive layer, the slowest,
  and the hardest to evaluate. Stages 1 and 2 are deterministic, testable and
  free, and they will handle most of it. An LLM belongs at stage 4, scoped to
  cases the earlier stages left ambiguous, and it must return evidence.
- **Scraping Companies House to triangulate**, for now. It would raise
  confidence, but it is a second data source with its own ingestion, and the
  alias table gets most of the benefit for a fraction of the work.
