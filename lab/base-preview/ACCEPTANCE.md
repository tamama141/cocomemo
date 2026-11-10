# Integrated acceptance checklist

Use the fixed delivery SHA, both apps together, an isolated profile and fictional
data. Development results are not independent QA or actual Firebase acceptance.
Default local startup does not load a Firebase SDK. A concrete private config and
reviewed Rules/index application require the separate SYS authorization.

| Area | Minimum acceptance flow | Development boundary |
|---|---|---|
| CocoMemo | Create/photo/save/reload/edit/duplicate/new ID/search/My Select/cooking | Actual local APIs; cloud UI with SDK double |
| Import | Raw/form roundtrip, parsed edits/photo, replacement cancel, resize | Browser mouse/touch; physical devices pending |
| Pantrymo | Single/bulk/review, zero vs blank, date keep/set/clear, archive/unarchive | Async selected repository; local/browser and cloud double |
| Transfer | Duplicate/archive/non-food protection, destination failure, source failure/reopen/retry, changed source | Durable destination ledger; source-only retry tested |
| Tags/categories | Main membership, mixed/unchanged bulk, IDs/order/fallback/fixed slots | Save failure preserves records and filters; Q02 protected |
| Local save | Existing v5 keys, missing/corrupt, quota/rollback/recovery, two concurrent tabs | Real Web Locks/Storage/IDB head, three concurrent races, native abort and committed-journal recovery; fake Storage failure matrix |
| Drafts | Text/photo IDB transaction, reopen, ten/subject, update at capacity, UID/environment isolation | Actual IDB; old DBs untouched |
| Draft timing | 30s unknown, no resend, captured data while typing, matching-version 2s cleanup | Logic/fake clock and browser; long suspension pending |
| Auth | Persistent restore, actual initial observer/10s, login/reset/logout failure, same UID resume | Injected SDK and UI double; actual Auth pending |
| Book separation | Login no upload, local/cloud roundtrip, unknown cloud return local, old response guard | Browser SDK double; local data never replaced by cloud reconciliation |
| Cloud records | Save/read/update/delete/bulk/order, stale rev, server observer, no background input overwrite | Full SDK-shaped driver and same-UID peer double; real 3 devices pending |
| Templates | Book-specific explicit save; same UID cloud peer update; no login migration | Repository metadata and observer connected |
| Cloud restore | Data/photo size, one atomic transaction, missing/empty, before-backup, denied/unknown/conflict/current-server adoption/guarded rollback | Driver failure tests and actual IDB before-backup/browser UI |
| Copy | One/multiple/all, same-name confirmation, new IDs/photo, source retained, partial retry | UI and atomic version markers tested with cloud double |
| Device settings | View/sort/enlargement/fixed slots persist locally, excluded from cloud/JSON | Separate device settings connected |
| Layout | 360/390/768/iPad portrait-landscape/Echo-equivalent, long name/date/photo, help hit/refocus | Representative viewport checks; hardware acceptance pending |
| Chrome | Toolbar actual color and password suggestions, edge drag/scroll/resize | Search isolation/theme/handle code; actual devices pending |
| Rules/config | Exact UID/project/origin, no provider removal, backup/freeze, indices, rollback | Candidates/instructions prepared; emulator/service acceptance not claimed |

Core product flow: local recipe/photo → save → reload → edit/duplicate → search →
cooking; stock → wish → checked selection → stock → archive/unarchive; then the
same flow on a separately selected cloud book. Verify all groups, not recipes
alone. Keep a second signed-in client and an unauthorised UID for update/conflict
and non-mixing checks. Test while editing, while the network is interrupted and
with a delayed old response. Confirm no automatic local/cloud migration occurs.

For restore, export current and before snapshots, select only one group, compare
unselected groups and photos, induce a lost response, reconcile before any retry,
then force a different server revision and verify rollback refuses a stale rev.
Check retained IDB restore-before backups after a successful restore. For copy,
repeat the same source/version and confirm only its original target ID exists;
change the source version and explicitly confirm a separate copy.

Do not substitute this checklist or mock PASS for actual Firebase, owner hardware,
independent QA or permission to publish. The private task ledger records fixed
source/report SHAs, exact tests, retained limitations and the authorised boundary.

## R1 targeted acceptance

Keep the independent SYS 13/26/27 failures unchanged. Reproduce those old allows
on the baseline Rules, then check ASCII/Japanese/emoji/mixed UTF-8 lower/exact/over
boundaries with the official evaluator. Recheck old numeric/required-field/photo
protections, fixed target/database rejection, exact trial Rules, normal sentinels
and manifest, scoped journal/pending/backup/drafts, copy/observer and transfer
resume. Normal mode must refuse trial-tagged JSON before changing data.
Use isolated profiles and fictional data; a same-origin URL path is not local
isolation. The emulator step is pending in the current LOCAL-PRECHECK revision.
