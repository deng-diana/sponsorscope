# SCRATCHPAD

Working log of decisions and their reasoning. Latest session on top.
Things `git log` does not capture: why a choice was made, what was rejected,
and what was actually verified rather than assumed.

---

## 2026-08-12 — Made the repo presentable, and fixed two things the screenshot would have immortalised

**Landed**

| Commit | What |
| --- | --- |
| `4deaefd` | Committed `scripts/sync-register.mjs` and the `csv-parse` dep it needs; removed `app/Untitled` |
| `fe69d5e` | README, MIT licence, `.env.example` |
| `865cdf6` | Page title and route de-duplication |
| `62c1d86` | Screenshot |

Live: https://sponsorscope-five.vercel.app

**The number that became the README's opening argument**

Computed from the committed snapshot, not estimated:

- 142,159 register rows collapse to 127,223 companies, because the register
  is one row per *(organisation, route, sub-type)*, not per organisation
- **5,332 of those companies hold no Skilled Worker route at all**
- 36 companies carry a B rating, meaning a Home Office action plan

That middle number is the product's whole reason to exist. Searching the
government spreadsheet by name finds those 5,332 companies and returns a
false yes. The screenshot in the README leads with a real instance of it:
`1 MODEL MANAGEMENT LONDON LIMITED` is on the register, licensed only for
Creative Worker.

**Two bugs fixed because they were about to be photographed**

1. Page title was still `Create Next App`. That is what a browser tab and
   every link preview showed.
2. Cards rendered `Skilled Worker, Skilled Worker`. Same root cause as the
   row-count finding above: one row per sub-type. De-duplicated on read so
   the 127k rows already in Postgres are fixed without a re-import, **and**
   in both ingestion scripts so the source is clean going forward. Fixing
   only the scripts would have left the live data wrong until a re-run.

**Production had been failing for two days**

`supabaseUrl is required` at build time. The env vars had been added to
Vercel after the failing build, and nothing had triggered a redeploy since.
The push above rebuilt it. Verified by curling the live URL for a known
company rather than trusting the build's green tick.

**Deployment protection: no change needed**

Project has `ssoProtection: all_except_custom_domains`, which reads as if the
site is gated. It is not: `sponsorscope-five.vercel.app` serves publicly.
Confirmed with an unauthenticated request returning real search results.
Worth remembering before "fixing" it again.

**Note on the domain**

`sponsorscope.vercel.app` belongs to an unrelated project. The production
alias is `sponsorscope-five.vercel.app`.

---

## Next: brand to legal entity resolution

The highest-value thing left, and the part that is actually interesting to
talk through in an interview. See `docs/ENTITY-RESOLUTION.md` for the design
and the staged plan.
