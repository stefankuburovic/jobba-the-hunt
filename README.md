# Jobba the Hunt

Personal job-hunt companion — pulls frontend job postings from legal,
key-free public APIs, lets you save/dismiss them, and tracks status
(New → Applied → In Progress → Interview → Offer/Rejected) without ever
scraping or auto-submitting on a site whose ToS forbids it.

## Status: Phase 1 + 2 done (Feed + Tracker). Phase 3 (calendar) not started yet.

- **Feed tab** — merges [Remotive](https://remotive.com/api-documentation) and
  [Arbeitnow](https://arbeitnow.com/api/job-board-api) results, dedupes, filters
  by keyword (defaults to frontend/React/Angular/TypeScript). "Save" adds it to
  the tracker; "Apply" opens the real posting in the browser and marks it saved
  so it's never lost.
- **Tracker tab** — every saved job, filterable by status, with one-tap status
  changes and a link back to the original posting.
- Data lives in `AsyncStorage` on-device — nothing is sent anywhere except the
  two public job APIs.

## Run it

```bash
npm install
npm start        # then press "i" for iOS simulator, "a" for Android, or scan
                  # the QR code with Expo Go on your phone
```

Needs Xcode (iOS sim) or Android Studio (Android emulator) locally, or just
the free **Expo Go** app on your phone — scan the QR code from `npm start`
and it runs with zero native build step.

## Project layout

```
App.tsx                        — navigation shell (Feed / Tracker tabs)
src/
  types.ts                     — Job, Application, status enum
  api/
    remotive.ts                — Remotive API client
    arbeitnow.ts                — Arbeitnow API client
    index.ts                   — fetchAllJobs(): merges + dedupes both, never
                                  lets one source's failure kill the feed
    util.ts                    — HTML stripping, keyword matching
  storage/applications.ts      — AsyncStorage read/write for saved jobs
  context/ApplicationsContext.tsx — shared state between Feed and Tracker
  screens/FeedScreen.tsx
  screens/TrackerScreen.tsx
  components/JobCard.tsx
```

## Next up (Phase 3)

- `expo-calendar`: when a job's status flips to "Interview", prompt for a
  date/time and create a device calendar event + reminder.
- Optional Phase 4: pull additional postings from specific companies' public
  Greenhouse/Lever job-board APIs.

## Why no LinkedIn/Indeed scraping or auto-apply

Both explicitly forbid automated scraping and auto-submission in their Terms
of Service — real risk of a permanent account ban, and that account is one of
your most valuable tools in an active job search. This app only pulls from
sources whose public APIs are meant to be consumed this way, and "Apply"
always hands off to a real human click on the real site.
