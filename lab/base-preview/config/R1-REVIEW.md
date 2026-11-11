# R1 byte budgets and fixed trial namespace — review only

No live Firebase values, connection, namespace creation, Rules/index deployment
or hosting change is included. The current deployed Rules/configuration have
not been collected. These are review candidates, **not** a confirmed deploy patch.

## Capacity and restored protections

| Check | R1 candidate / client preflight | Live comparison still required |
|---|---|---|
| database | exact `(default)` in Rules and private config validation | Actual database and currently deployed restriction |
| owner | exact private UID; unreplaced placeholder denies all | Match current owner without exposing its value |
| required keys | hasAll + hasOnly for recipe, stock/wish and state | Existing schema and unknown live Rules paths |
| schema / revision | integer schema 1; positive safe-integer rev; next rev exactly +1 | Current numeric protections and actual records |
| timestamp | safe integer, nonnegative | Current updatedAt protection |
| operation ID | nonempty, at most 1500 UTF-8 bytes | Retain the old safe operation-ID protection |
| recipe form | nonempty, at most 65536 **UTF-8 bytes** | Later adopted 64 KiB budget; do not expand to fit a test |
| photo | null or exact JPEG map, nonempty bytes, at most 524288 bytes, positive safe dimensions | Existing data formats; do not convert/delete existing records |
| form + photo | at most 1048576 bytes, plus client whole-document budgeting | Current old aggregate protection and service limits |
| stock/wish json | nonempty, at most 983040 **UTF-8 bytes** | Existing 960 KiB field budget, not an item-count cap |
| metadataJson | nonempty, same 983040 UTF-8 byte field budget | Whole document overhead and current metadata size |
| deletion | owner recipe/stock/wish deletion for adopted atomic restore; state deletion denied | Review this deliberate permission difference from old delete-deny Rules |

Rules use `toUtf8().size()`. The client uses TextEncoder on generated JSON before
journal/network mutation, independently of the unchanged conservative whole-doc
and request budgets. The 983040 value leaves room below the service's document
budget; it is not a new stock-count limit. JSON meaning and image decoding are
checked by code, not certified by a Rules string/map check.

The old safe source provided database/owner, required fields, safe numeric range,
nonempty body/photo and operation-ID safeguards. R1 restores these in the current
candidate while retaining the later adopted 64 KiB/512 KiB budgets and explicit
restore deletion. No live migration, new record-count cap or generation scheme.

## Exact target contract

Normal mode remains `users/{uid}/recipes|stock|wish|product/state`.
Normal configuration may omit the new mode/root fields; its existing normal
journal, draft environment and copy-book identifiers remain unchanged.

Trial mode must be explicitly set in the reviewed **private** bootstrap, before
product initialization:

```js
// Illustrative placeholders only. Keep disabled until the separate SYS approval.
globalThis.CocoMemoProductConfig = {
  enabled: false,
  allowedOrigin: 'https://REVIEWED_PRIVATE_ORIGIN',
  ownerUid: 'REVIEWED_OWNER_UID',
  firebase: {apiKey: 'PRIVATE_VALUE', authDomain: 'PRIVATE_VALUE',
             projectId: 'PRIVATE_VALUE', appId: 'PRIVATE_VALUE'},
  databaseId: '(default)',
  cloudMode: 'sys-trial',
  cloudRoot: 'sysTrials/SYS-COMPLETE-20261111/users'
};
```

The only trial path is
`sysTrials/SYS-COMPLETE-20261111/users/{same owner UID}/...`.
Wrong mode/root, another trial ID, query/encoded/trailing path, missing explicit
trial database, or a nondefault database is rejected before SDK initialization.
There is no URL-query switch, hidden UI toggle or arbitrary path injection.
The trial notice labels the environment; it cannot switch the root.

All repository reads/writes/deletes, collection queries, manifest watches,
recovery/restore/copy and durable transfer completion use the validated target.
Raw responses are root-tagged; foreign raw roots/paths stop before journal/write.
The retained codec's optional target only changes path validation/size accounting,
and the retained driver accepts the same fixed targets. Schema/IDs are unchanged.

## Device scopes and backup provenance

Normal scope bytes are retained. Trial appends the fixed root to the existing
project/database environment. Journal/pending/before-backup and draft subject
keys therefore differ even for the same UID and record ID. Trial pending records
also carry their root and are rejected by a different repository target.
Copy source/target marker identity includes the trial database/root; old normal
markers are not migrated, erased or reinterpreted.

Trial-mode JSON exports (including the local test book) carry a `backupScope`
provenance tag with project/database/root. Normal mode refuses trial-tagged files
before replacement. Trial accepts only its matching tag; ordinary legacy v5
files remain supported for fictional import tests. Normal JSON export format is
unchanged. The tag is accidental-mixing protection, not an authorisation token
or a defence against deliberately edited files/legacy clients.

**Local data keys remain shared on the same origin. A different URL path is not
isolation.** Use a fresh, isolated browser profile with fictional data. Before any
later personal-profile use, retain that origin's existing Storage/IDB and stop or
separate old writers. T01 does not solve all legacy-writer coexistence. Do not
clear journals, databases or personal browser storage to make a test pass.

## Separate Rules review

`firestore.rules.candidate` covers only normal users paths.
`firestore.trial.rules.candidate` covers only the exact trial path, same exact
owner and `(default)`. Its standalone form denies ordinary users paths and other
trial IDs. **Do not replace live Rules with this standalone test candidate.**
Collect and preserve the current deployed Rules first, then review an additive
trial difference without widening or removing existing normal paths. Index
candidates are unchanged; merge necessary field exclusions with the existing
indices, never deploy `indexes: []` as an instruction to delete current indices.
Actual UID/config injection, namespace creation and application need later SYS
permission and retained before/current backups with a reviewed rollback plan.

## Targeted development reproduction

Use Java 21 and an official Firestore emulator with an isolated dependency folder
containing exact `firebase@13.1.0`, `@firebase/rules-unit-testing@6.0.0`, and the
reviewed emulator tooling. Do not inherit real Firebase/GCP credentials.

- `node tests/r1-boundaries.test.mjs`: fixed-target/config, UTF-8 byte budgets,
  before-write rejection, scope identities and SDK-double path checks.
- Serve this directory at loopback `/app/`, then run
  `tests/r1-scope-browser.cjs` with Playwright/Chromium. It uses an isolated profile,
  actual Storage/IDB and SDK-shaped doubles; it is not Rules acceptance.
- `tests/r1-emulator.mjs` requires `FIRESTORE_EMULATOR_HOST=127.0.0.1:8191`,
  `GCLOUD_PROJECT=demo-cocomemo-r1-20261111` and the identical
  `GOOGLE_CLOUD_PROJECT`. Set `R1_EMULATOR_DEPS` to the isolated dependency folder,
  `R1_BASELINE_DIR` to the fixed 67bafa3 `lab/base-preview/` and
  `R1_ARTIFACT_DIR` outside this delivery tree. It verifies the old Rules hash,
  reproduces SYS's three unexpected allows without altering their report,
  checks new ASCII/Japanese/emoji/mixed byte boundaries, restored protections,
  and exact trial paths against normal emulator sentinels. It cannot fall back
  to a real project. The JPEG fixture is a generated 2×2 image, never a user photo.

Development output and independent SYS revalidation remain separate. The later
SYS must receive one fixed SHA, recheck capacity/trial boundaries, collect live
configuration, and specify actual backup/apply/rollback operations before use.

## Executed R1 development evidence

Baseline 67bafa311986f22a1adca433b8b1050fbaa84eec reproduced SYS cases
13/26/27 as unexpected allows. Corrected Rules passed 74/74 targeted checks;
Node suites passed 11+13+4 and isolated Chromium scenarios passed 4/4. Emulator
tests use the actual Firebase SDK and a memory journal; browser tests separately
exercise native Storage/IDB with SDK-shaped cloud doubles. No live Firebase ran.

Official distribution metadata:
https://dl.google.com/dl/cloudsdk/channels/rapid/components-v590.0.0.json

Official component:
https://dl.google.com/dl/cloudsdk/channels/rapid/components/google-cloud-sdk-cloud-firestore-emulator-20260717053915.tar.gz

Archive: 70115087 bytes; SHA256
`e962450b637827664094959571fd92c3680de863936bd481bd0a050f76ca91ba`.
Extracted emulator 1.22.0 jar: 76397398 bytes; SHA256
`6262939c48d3d6b08495931706b8920399e57d5f5918e6af133a3d30cb3ae369`.
Same emulator version as SYS, different Google Cloud SDK packaging from the
Firebase CLI jar; no byte-identity claim. The archive matched official metadata.
The existing package-manager network allowance permitted this official source;
no extra domain or unrestricted access was enabled by development.

Launch with Java 21 classpath (the component jar has no Main-Class manifest):

```sh
java -Duser.language=en -cp /path/firestore-1.22.0.jar \
 com.google.cloud.datastore.emulator.firestore.CloudFirestore \
 --host 127.0.0.1 --port 8191 --project_id demo-cocomemo-r1-20261111 \
 --single_project_mode true --single_project_mode_error true \
 --rules /path/isolated-start.rules
```

Use an environment without real Firebase/GCP credentials. Keep logs/results
outside this public delivery. The private R1 report records the fixed delivery
SHA and complete re-fetch byte/hash verification.
