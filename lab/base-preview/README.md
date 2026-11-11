# CocoMemo and Pantrymo product candidate

The adopted UI baseline is `bcd622483c53a21c4645793b968df51503e1188b`.
This candidate connects the existing screens to actual local Storage/IndexedDB,
and to an injectable persistent Auth/Firestore implementation. Development uses
isolated fictional data and SDK doubles. No actual Firebase configuration,
connection, deployment, independent QA or owner-device acceptance is included.

## Run locally

From this directory:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ in an isolated browser profile. Local saves persist on
that exact origin. No fictional recipes, stock or wish records are seeded.
Changing host/port/profile creates a separate local book. Never use a personal
browser profile for development tests. `VERSION.json` defines the execution set;
`SHA256SUMS.txt` covers every delivered file except itself. The manifest itself
is verified separately against the fixed Git SHA. Root, older entrances and the
adopted PNGs in unchanged original-core.js remain protected.

## Connected behavior

- The adopted UI, all 21 changes, protected import buffers, duplicates, tags,
  flags, ordering, reviews, quantities/dates, archives and common item editing.
- Local v5 keys, missing/corrupt separation, verified journal rollback, startup
  recovery under Web Locks and an actual IndexedDB revision coordinator. The
  coordinator rejects stale tabs even when their localStorage cache is delayed;
  journal recovery distinguishes a committed head from an aborted transaction. UI callers
  await actual outcomes; a Promise is never treated as synchronous success.
  Browsers without Web Locks stop saving rather than silently risk a write race.
- Photo/text drafts in their own IndexedDB database, environment/book/UID scope,
  ten per subject, JPEG 512 KiB / UTF-8 form 64 KiB, explicit saves, pre-send cloud
  retreat, thirty-second unknown state with no resend, pending-result review and
  version-matched cleanup after two seconds. Older databases remain untouched.
- Persistent email/password Auth, initial restore guidance, password reset,
  same-UID recovery, separate local/cloud books and guarded logout. Login does
  not upload local data. No real SDK/config is loaded in the default local mode.
- Cloud recipes retain legacy schema 1 and binary JPEG photos. Stock/wish and
  metadata share a revision-checked transaction boundary. Changes propagate
  through a server-origin manifest observer; active editors/forms defer refresh.
  Old responses cannot overwrite another book/UID. A read-only/unknown cloud
  session can return to the local book through the unsaved-input guard.
- Current-book v5 JSON export and selected restore: missing preserves, empty
  replaces only selected fields. Cloud restore preflights all changes/photos,
  refuses non-atomic size, saves a real IDB before-backup, and commits one
  transaction. Unknown outcomes stop writes until server reconciliation;
  conflicting outcomes need explicit backups and either guarded adoption of the
  current server content or revision-guarded rollback. New recipe IDs are reserved
  before send and retained in drafts, so confirmed unknown saves never duplicate.
- Explicit one/multiple/all copy UI, same-name candidates, original retained,
  new target IDs, version-keyed atomic copy markers, partial-result reporting and
  retry without duplicate registration. Templates are book-specific and cloud
  templates share only within the same UID. Login never transfers local templates.
- Transfers durably record confirmed destination plus original source before
  source deletion. Reopening the book can finish source deletion without creating
  the destination again; changed source/target stops automatic deletion.
- Device view/order choices and Pantrymo display preferences use separate local
  settings; display slots and IDB drafts never enter ordinary JSON/cloud sharing.

## Limits and later acceptance

The inherited inline-handler UI accepts normal app-generated string IDs. Unsafe
or nonstandard identifiers stop before rendering/writing; arbitrary custom-ID v5
files are not universally supported. Source bytes remain untouched on rejection.
Local JSON retains legacy photo data; cloud accepts legacy JPEG, up to 512 KiB,
without silently converting non-JPEG records. Protected PNG UI assets are unchanged.

Read [config/README.md](config/README.md) for injection, schema, conservative
platform-size budgets, retained restore backups, candidate Rules/index differences,
legacy-writer freeze and apply/rollback prerequisites. Rules are prepared, never
applied or certified by SDK doubles. Live Firebase, free-tier capacity,
three physical devices, storage eviction and long suspension remain separate SYS
and independent QA acceptance. Chrome toolbar color/password suggestions require
owner devices. This candidate does not replace or alter the hosted version.

## Development checks

```sh
node tests/local-repository.test.mjs
node tests/book-safety.test.mjs
node tests/auth-runtime.test.mjs
node tests/cloud-repository.test.mjs
PREVIEW_URL=http://127.0.0.1:8765/ node tests/complete-ui.cjs
```

Use installed Playwright Core/Chromium; set `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`,
`ARTIFACT_DIR` and `CASE_MATCH` as needed. `tests/cloud-ui.cjs` uses only SDK-shaped
fictional doubles; serve this directory at `/app/` on a loopback test server for
its module fixtures, then set PREVIEW_URL. It covers actual browser Storage/IDB
and Web Locks alongside mocked cloud operations. No real Firebase request occurs.
Historical test files remain references to prior memory-only interfaces; do not
repeat them blindly or treat their old assumptions as current acceptance.

## R1 development verification

R1 enforces UTF-8 byte budgets and explicitly configured fixed trial targets.
See [config/R1-REVIEW.md](config/R1-REVIEW.md) for configuration and precautions.
Official Firestore Emulator 1.22.0 reproduced the three baseline unexpected allows;
the corrected candidate passed 74/74 targeted checks. Related Node checks passed
28/28; isolated Chromium scope scenarios passed 4/4 with actual Storage/IDB and
SDK-shaped cloud doubles. These are development checks, not independent SYS QA.
Live Rules/configuration comparison, actual Firebase and deployment remain pending.
