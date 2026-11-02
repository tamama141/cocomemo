# CocoMemo UI preview

This independent preview uses fictional recipes and a volatile memory adapter. Reloading resets recipes, settings, photos, drafts, ordering and display choices. Do not enter personal recipes, photos or credentials. Real authentication, cloud sync, JSON import/export, Storage, IndexedDB and service workers are not connected.

## Run

From this directory:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ . The title is `CocoMemo｜画面仕様反映・確認用版`.

The runtime consists of `index.html`, `original-core.js`, `fixtures.js`, `memory.js`, `adopted.js`, `adopted.css`, `lab.js`, `lab.css`, `ui.js`, and `ui.css`. Serve these files together. `tests/` and version/hash documents are not needed for the runtime. The existing root app is separate; do not replace its files with this directory.

The inherited brand images remain embedded in the original runtime source. No new app PNGs are included. The application has four main menu entries and retains the existing Pantrymo and shopping interactions.

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
