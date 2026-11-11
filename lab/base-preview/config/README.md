# Runtime and SYS handoff (candidate; no settings applied)

Local startup loads no SDK and makes no Firebase request. A reviewed, private
bootstrap must assign `globalThis.CocoMemoProductConfig` **before** product.mjs:
`{enabled:true, allowedOrigin: exactHttpsOrigin, ownerUid: exactOwnerUid,
firebase: {apiKey,authDomain,projectId,appId}, databaseId: optionalDatabaseId}`.
No project values or credentials are included here. Do not enter passwords in
source or reports. The separate runtime factory is dependency injection for
isolated SDK doubles, not a demo login or an automatic fallback.

Auth uses SDK 13.1.0, IndexedDB local persistence, one allowed UID, email/password
and password reset. Persistence failure stops cloud use. Start on the local book;
restoring Auth does not migrate or merge local records. Cloud is explicitly
selected after login or through the book button. Uncertain Auth keeps the cloud
editor read-only; same-UID reauthentication resumes it. Initial restore guidance
appears after ten seconds. An operation captures Auth epoch separately from the
editable record's book, UID and baseline revision.

## Schema and compatibility

Existing `users/{uid}/recipes/{id}` schemaVersion 1 documents keep their six
original fields and binary JPEG photo. Original forms/unknown form fields remain
inside formJson. No old collection is automatically cleared or copied.
New stock/wish collections store `{schemaVersion:1,json,rev,operationId}` by item
ID. `users/{uid}/product/state` stores revision, operation identity, metadata JSON
(labels/icons, categories, orders, archives via item JSON, templates, copy
markers, incomplete transfer ledger) and shared snapshot hash. Record array order
is explicitly retained in metadata. Device layout slots/preferences and IDB
drafts are excluded from shared metadata. Only changed documents plus the
manifest are written. There is no periodic write or automatic local upload.

A local edit captures the manifest revision. Transaction reads check both that
revision and each changed/deleted document, then perform all writes atomically.
Other new product writers therefore conflict rather than overwrite. **Before
adopting this writer, freeze legacy writers that do not advance the manifest.**
A concurrent legacy insertion cannot be protected by a manifest it ignores.
Read-only legacy entrances remain intact. Retain old Rules/indices/source and
all existing documents before any subsequent SYS operation.

## Capacity, restore, unknown outcomes

Selected JSON groups distinguish missing from empty. Changes, photo bytes,
deletes, manifest and transaction envelope are measured before network mutation.
The implementation uses platform budgets (500 writes, 10 MiB request, 1 MiB
per document), with conservative encoding/overhead reserves; these are upper
bounds, not claims of an exact service-side protobuf measurement. No new record
count cap or generation-based replacement is introduced. An operation that
cannot fit one transaction stops before changing cloud data. JPEG photo/form
limits remain 512 KiB / 64 KiB. Other formats stop without conversion or source
mutation; legacy PNG JSON remains usable locally. Review any non-JPEG cloud
copy/restore incompatibility with the preserved backup before SYS acceptance.

Before submission, a project/database/UID-specific local journal atomically
stores the before snapshot, proposed after snapshot and operation ID/hash.
If device backup storage is unavailable/full, submission stops before mutation.
The journal is not in ordinary JSON exports. Its device capacity is checked by
the actual write; no estimated successful backup is claimed. Current implementation
uses a separate IndexedDB database. The active operation and the retained restore-before backup commit in one transaction. Successful restore retains that backup for download through settings; device quota failure stops before network mutation.

At 30 seconds the UI releases interaction, preserves the input/IDB retreat and
blocks new writes. It does not resend. Server confirmation must match operation
ID and content hash. A still-running SDK operation cannot be declared not applied.
A completed failure can resolve as not applied only against the unchanged base.
A different server state requires explicit current/before backups and a confirmed,
revision-guarded rollback; a newer revision rejects that rollback. Reopening the
same project/UID reads the durable pending operation before permitting writes.
Do not clear its journal to bypass the guard.

## Rules and indices: later SYS procedure

1. Record the exact app SHA, Firebase project/database, existing Auth providers,
   authorised domains, owner UID, deployed Rules/indices and current backups.
   No provider removal, account merge or paid upgrade is proposed.
2. Review the candidates here against the actual retained Rules. The deliberate
   changes are owner-only reads/writes on stock/wish/product and **owner-only
   recipe deletion**, needed for atomic selected replacement. The placeholder
   owner denies access until privately substituted. No actual substitution or
   deployment was performed in development.
3. Run Rules emulator tests for unauthenticated, other UID, valid owner,
   forbidden fields/types, stale revisions, oversized photo/form, allowed delete,
   atomic restore and rollback. SDK doubles do not validate Rules syntax or the
   service's access-call/index/transaction constraints. No emulator pass is
   claimed in this handoff.
4. Only under the separate SYS authorization, freeze legacy writes, retain
   snapshots, privately inject the reviewed config and apply the reviewed exact
   Rules/index difference. No CLI deployment configuration is included to avoid
   accidental selection of an existing project.
5. Independently verify actual persistent login and restart, photo roundtrip,
   three-device updates, conflict/unknown reconciliation, selected restoration,
   copy retry and logout. Confirm free-tier consumption and actual request sizes.
6. If acceptance fails: stop the product writer first, retain journals and current
   cloud export, restore the previously captured Rules/indices/source. Schema
   rollback never deletes the new collections automatically. Restore user data
   only from a reviewed backup with a guarded operation, not by reloading the old
   UI or enabling its legacy full-replace writer. Deployment and data rollback
   are separate actions requiring their concrete later authorization.

No Firebase connection, Rules/index application, hosting change, independent QA
or owner-device result is implied by this preparation.

## Local coordinator and late-response details

Local writes retain existing v5 keys. A separate device IndexedDB head serializes
revision checks together with the Storage journal's operation ID. Web Locks are
retained, but a delayed localStorage cache alone can no longer approve a stale
writer. If the native IDB transaction aborts after Storage writes, the before
snapshot is restored and verified. If IDB committed before journal finalization,
startup verifies matching head/after bytes and finalizes that committed version;
it does not blindly roll it back. Unknown or inconsistent recovery stops writes.
Legacy local writers that ignore this coordinator must also be frozen before
concurrent use; a mismatch is preserved and blocked for review, never silently
imported over the coordinator. No existing local key/database is erased.

A conflicted cloud result can explicitly adopt the server's confirmed revision
while retaining a before-backup and all editor input. This does not rebase an old
editor onto a conflicting record. Drafts retain their original base revision,
local record digest and reserved new ID. A missing original requires confirmation
to resume as new. A new save whose result was unknown reuses its reserved ID
after positive confirmation instead of creating a duplicate. Closed login UI
does not automatically switch books on a late response; logout locks mutations
only until confirmation or the thirty-second unknown deadline, then preserves
input without applying a late logout to another editor.

## R1 development verification update

The earlier emulator-pending descriptions record the original candidate stage.
R1 now passed 74/74 targeted official Firestore Emulator 1.22.0 checks after
reproducing the baseline three unexpected allows. This does not certify live
configuration or independent SYS acceptance. See R1-REVIEW.md for exact scope.
