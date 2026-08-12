# SponsorScope

Search the UK register of licensed visa sponsors and get a straight answer to
the only question a job seeker actually has: **can this company sponsor a
Skilled Worker visa?**

Live: https://sponsorscope-five.vercel.app

<!-- Screenshot goes here once captured. -->
<!-- ![SponsorScope search results](docs/screenshot.png) -->

## Why this exists

I need visa sponsorship to work in the UK, so before applying anywhere I have to
check whether the employer can legally sponsor me. The Home Office publishes
that information, but as a 142,000 row CSV with no search, no filtering, and a
download link that changes every time it is republished.

The workaround everyone uses is to open the spreadsheet and Ctrl+F the company
name. **That gives the wrong answer for about 5,000 companies.**

## The thing the spreadsheet does not tell you

The register is one row per *(organisation, immigration route)* pair, not one
row per organisation. 142,159 rows collapse to 127,223 companies, and a company
can hold a licence for routes that have nothing to do with hiring a software
engineer:

| Route | Rows |
| --- | ---: |
| Skilled Worker | 122,296 |
| Global Business Mobility: Senior or Specialist Worker | 10,360 |
| Tier 2 Ministers of Religion | 1,935 |
| Creative Worker | 1,578 |
| Charity Worker | 1,528 |
| International Sportsperson | 1,467 |

**5,332 of the 127,223 companies on the register cannot sponsor a Skilled Worker
visa at all.** They are on the list, so Ctrl+F says yes, and the applicant
spends a week on an application that was never going to work.

SponsorScope groups every route a company holds, then answers the real question
instead of the literal one. It also surfaces the **36 companies carrying a B
rating**, which means the Home Office has placed that sponsor on an action plan
and their licence is at risk.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Supabase Postgres · Vercel

Search runs entirely in a React Server Component. The query lives in the URL
(`/?q=deliveroo`), so a result is shareable, survives a reload, and works with
the back button without any client state.

## How the data gets in

GOV.UK republishes the register most working days, and **each publication gets a
new CSV URL**, so a hardcoded link breaks within days. `scripts/sync-register.mjs`
handles this end to end:

1. Fetch the publication page and extract the current `.csv` link from the HTML
2. Stream and parse the CSV (`csv-parse`, BOM tolerant, since the Home Office
   file ships with a byte order mark)
3. Group rows by organisation name into a `routes` array
4. Upsert to Postgres in batches of 1,000, with three attempts per batch and
   linear backoff, so one transient failure does not abandon a 127,000 row load

`scripts/import-register.mjs` does the same load from the committed snapshot in
`data/`, so the project can be run without hitting GOV.UK.

## Running it locally

```bash
git clone https://github.com/deng-diana/sponsorscope.git
cd sponsorscope
npm install
cp .env.example .env.local   # then fill in your Supabase project details
npm run dev
```

Create a `companies` table in Supabase with columns `name` (text, primary key),
`town`, `county`, `rating` (text) and `routes` (text array), then seed it:

```bash
node scripts/import-register.mjs   # from the committed snapshot
node scripts/sync-register.mjs     # or pull today's file from GOV.UK
```

Environment variables:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | app + scripts | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | app | Read only client key |
| `SUPABASE_SECRET_KEY` | scripts | Write access for the ingestion scripts |

## Status

Working today:

- [x] Search 127,223 companies by name
- [x] Skilled Worker eligibility per company, derived from every route it holds
- [x] B rating warning
- [x] Ingestion from the live GOV.UK publication and from a local snapshot

Next, in order:

- [ ] **Brand to legal entity resolution.** The register lists `Roofoods Ltd`,
      the job advert says `Deliveroo`. Planned as normalisation plus trigram
      fuzzy match, returning a confidence level and the matched row rather than
      a bare yes, so a wrong match is visible instead of silent.
- [ ] **Ireland.** Ireland has no licence register. It publishes employment
      permits actually granted, which is stronger evidence than a licence: it
      proves the employer both wanted to and succeeded. Different data shape,
      different question, same product.
- [ ] Scheduled daily sync on Vercel Cron, with a visible last-updated date
- [ ] New sponsors feed, derived from diffing consecutive snapshots. A company
      that has just been granted a licence has concrete hiring intent and almost
      no applicants who know about it yet.

## Data source and accuracy

Register of licensed sponsors: workers, published by the Home Office on
[GOV.UK](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).
Contains public sector information licensed under the
[Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

**This is a snapshot, not live Home Office data, and holding a licence is not a
promise to use it.** Always confirm against the official register before making
a decision that matters.
