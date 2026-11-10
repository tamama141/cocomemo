# CocoMemo UI preview

This independent preview uses fictional recipes and a volatile memory adapter. Reloading resets recipes, settings, photos, drafts, ordering and display choices. Do not enter personal recipes, photos or credentials. Real authentication, cloud sync, JSON import/export, Storage, IndexedDB and service workers are not connected.

## Run

From this directory:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ . The title is `CocoMemo｜画面仕様反映・確認用版`.

The runtime consists of `index.html`, `original-core.js`, `fixtures.js`, `memory.js`, `adopted.js`, `adopted.css`, `lab.js`, `lab.css`, `ui.js`, `ui.css`, `pantry.js`, `pantry.css`, `ui8.js`, and `ui8.css`. Serve these files together. `tests/` and version/hash documents are not needed for the runtime. The existing root app is separate; do not replace its files with this directory.

The inherited brand images remain embedded in the original runtime source. No new app PNGs are included. The application has four main menu entries and includes the fictional-memory Pantrymo food, shopping, registration review and two-way transfer UI.

## Source and checks

The UI implementation starts from `1f38fc3f4e5eba3e9bb938abe71a8acd8671b85a`. The publication branch starts separately from public commit `4e25093c5571056bd024612e7190f35aa0fd8162`. Only selected runtime files were copied; previous private documents and history are not part of this branch.

`VERSION.json` identifies both bases and the exact runtime set. `SHA256SUMS.txt` covers the runtime, tests, README and VERSION; it excludes itself to avoid self-reference. The resulting commit SHA identifies the delivered version.

Browser checks require Node, Playwright Core and Chromium. No runtime package installation is required. With a locally running preview, set `PLAYWRIGHT_MODULE` to your installed module, optionally `CHROMIUM_PATH`, `PREVIEW_URL`, and `ARTIFACT_DIR`:

```sh
node tests/ui.cjs
node tests/boundaries.cjs
node tests/viewports.cjs
```

The boundary checks optionally accept `ORIENTED_PHOTO`, a generated JPEG with EXIF orientation, to exercise image orientation. The viewport checks optionally accept `BASELINE_URL`, a separate local memory-only baseline, for before/after captures. Checks write artifacts outside the source tree by default. They are development checks, not independent QA or real-device certification.

Real offline copies, authentication/UID isolation, synchronization, migration, JSON compatibility and failure recovery require separate implementation and validation. A memory update or simulated account error is not proof of cloud persistence or successful authentication.

## Pantrymo targeted development check

Run `node tests/pantry20261104.cjs` with the same environment variables above and `PREVIEW_URL` pointing at this preview (default port 8775 for this check). It checks changed food/shopping flows, transfer failures and retries, and adjacent shared navigation. Transfers retain committed destination IDs so a failed source deletion retries without duplicate registration. Legacy hidden records are retained without conversion. Real persistence and synchronization remain unconnected.

## Combined UI8 revision

Revision `DEV-COCOMEMO-PANTRYMO-UI8-20261110-001` starts from fixed app
`6fb05ac453d0eddfeea7d575753fae8dac37a39f` on dedicated branch
`dev/cocomemo-pantrymo-ui8-20261110-001`. The root app and publication routes
are separate. This branch is a handoff only and does not deploy either app.

Both apps share the compact header, protected embedded PNGs, selection-only
rows and memory-only controls. CocoMemo keeps its five fictional recipes.
Pantrymo starts with zero stock, wish and review items. Add items during the
session to try single forms, multi-item review, quantity panels, categories,
archive and two-way transfers. Reload resets all session changes.

Wish-to-stock and Plus-to-stock never overwrite an existing name/category
pair. Blocked inputs remain available. Destination saves precede source
deletions; a failed deletion retries only that deletion. Stock-to-wish
unarchives a matching wish, blanks quantity, clears its shopping check, and
preserves its existing unit/category/memo. No browser Storage is read or erased.

For this revision run only the targeted development check with a local server:

```sh
PREVIEW_URL=http://127.0.0.1:8765/ node tests/ui8.cjs
```

Set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` if required by your installation.
The test defaults to port 8781; `ARTIFACT_DIR` selects an external output folder.
Earlier tests remain as historical checks for earlier interfaces and are not
an instruction to repeat the full earlier suite against renamed UI8 controls.
Chromium viewport/Silk-UA checks are not Android, iPad, Safari or Echo real-device
approval. Real save/sync, authentication, independent QA and deployment are not
part of this revision. H01/old R2 recipe-date overflow and UI7-16 remain held.

## UI8 R1 focused repair

`DEV-COCOMEMO-PANTRYMO-UI8-20261110-001-R1` starts from fixed
`7b9f9645590483a34fe0cffc0f2e1f84dfb1d6ca` on the same dedicated branch.
Help buttons retain their expanded touch area, anchored to each button rather
than the viewport or tab row. This prevents outside taps and My Select tabs
from triggering help. Initial theme metadata now uses the existing CocoMemo
color, consistent with returning from Pantrymo. Runtime files remain the same 14.

Run the focused check with the existing Playwright/Chromium environment:

```sh
PREVIEW_URL=http://127.0.0.1:8765/ node tests/ui8-r1.cjs
```

It covers explicit help/outside click and touch, close/refocus, sorting/filter
and manual-order boundaries, favorite/bookmark tabs, neighboring search/cooking,
a tablet hit check and theme metadata. It does not repeat the earlier full UI8
checks. Chromium metadata/viewport checks do not certify the physical Chrome
toolbar color or Android/iPad hardware. Deployment and independent QA remain
separate. H01/old R2, UI7-16 and wide-list photo/title overlap remain held.
