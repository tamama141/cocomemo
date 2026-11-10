# Integrated acceptance checklist

This checkpoint is local-only in operation. It has not passed independent QA or
owner-device acceptance. Use an isolated browser/profile and fictional records.
The cloud sections are blocked until the later UI/repository/Rules integration
and a concrete SYS configuration are delivered at a new fixed SHA.

| Area | Minimum acceptance flow | Current checkpoint |
|---|---|---|
| CocoMemo | Create with photo, explicit save, reload, edit, duplicate to a distinct ID, search, My Select and cooking | Local connected; independent QA pending |
| Import | Raw/form roundtrip, edited parsed values/photo preserved, replacement cancel, resize with mouse/touch | Development tested; owner devices pending |
| Pantrymo | Single/multiple entry, quantity zero/blank, stock-date keep/set/clear, review edit before commit | Local connected; broader failure regression pending |
| Transfer | Name/category duplicate blocked, archive/non-food restriction, destination-save failure, source-delete failure and retry | Existing safeguards retained; new persistence failure matrix pending |
| Categories | Rename keeps ID, deletion preserves items in fallback, fixed display choices, protected fallback | Connected local metadata; independent QA pending |
| Local save | Existing v5 keys/unknown fields/photo retained, missing/corrupt distinction, denied write, rollback and interrupted recovery | Journal adapter tested; true concurrent multi-tab races still open |
| Drafts | Text/photo one IDB transaction, reopen, ten per subject, update at capacity, other UID invisible | Local IDB connected; browser/eviction QA pending |
| Draft timing | 30-second unknown without resend, input edits during save remain dirty, matched version only after two seconds | Logic and targeted tests; long real-device suspension pending |
| Authentication | Persistent restore, 10-second unknown, login/logout failure, same-UID recovery, reset password, no login migration | SDK-injected module mock-tested; product UI pending |
| Cloud record | Save/read/update/delete/bulk/order from one UID on three devices, stale revision, old response after book/UID change | UI/complete repository/Rules integration pending |
| Cloud restore | All selected data/photos measured first; reject before any mutation if not atomic; unknown server reconcile; guarded recovery | Preflight/reconciliation contract mock-tested; actual driver pending |
| Copy | Explicit one/many/all confirmation, original retained, new IDs/photos, duplicate candidates, partial success/retry | Idempotency contract mock-tested; transaction/UI pending |
| Templates | Book separation and same-UID cloud sharing without automatic local migration | Local definitions saved; cloud sharing pending |
| Display settings | Retained device settings excluded from shared data/JSON; fixed display slots protected on restore | Slot exclusion implemented; full preference persistence pending |
| Devices | 360/390, iPad portrait/landscape, Echo-equivalent; long name/date/photo/enlarged forms and close/refocus | Representative development viewports; owner hardware pending |
| Chrome | Toolbar actual color and password-suggestion behavior, native vs custom resize, right-edge touch drag/scroll | Metadata/search mitigation/code changes; actual device result pending |

Never use a successful mock/viewport test as proof of Firebase Rules, real Auth,
physical toolbar color, three-device updates or final product completion.
Use the task's private plan/results for the current per-item completion ledger,
known limits, exact fixed SHA, configuration prerequisites and recovery steps.
