# DEV-THREE-DEVICE-SAFETY-R1-20261113-001

基準app e6c0476c0caf2d88db1a9c4aba3571f316a69789。限定候補と開発隔離検証であり、配備/独立QA/実サービス通信障害の実証ではない。実project・本人端末/データ・配信は操作しない。

## 在庫順候補と適用契機

pantry.jsの既存transaction内で、在庫またはordersが実際に変わる明示保存のときだけ、現在存在する在庫ID・現在カテゴリに属するIDを相対順を保って残し、重複/削除済IDを除く。hiddenの既存実recordは残す。カテゴリ順/slots/写真/数量/日付/上限は変更しない。失敗時は在庫・wish・orders等の従前snapshotへ戻る。共通transactionのため単独/一括削除・移動元確定削除・カテゴリ移動を覆う。wishだけの変更には波及しない。

読込/import/exportだけでは既存残留を清掃しない。明示的pantry選択復元だけはselectedSnapshotで在庫に対応するordersを組み立てる。recipes-only等では選択外pantry metadataを完全保持し、元File/backupを改変しない。Setで線形に重複排除し、残留/重複の増大でmetadata容量を広げない。

将来この候補を既存データに適用すると、最初の該当在庫保存/順序保存またはpantry復元に歴史的残留の除去が含まれ得る。今回現物整理・移行はしない。配備の別判断にはこの適用契機を明記し、元の写真付きJSON/共有metadataとscope別before退避を保持する条件を含める。復元確認時は候補が再び正規化するため、旧残留を含む厳密な旧状態へ戻す必要があれば、前版アプリと元退避を使う別の明示復旧判断が必要。コード復旧とデータ復旧は別で、現在データへの自動逆移行は作らない。

## Rulesの最小書込契約

通常候補config/firestore.rules.candidateと固定trial専用config/firestore.trial.rules.candidateを別に保持。owner placeholderは無置換で全拒否、実UIDを公開しない。新root/schema/新必須fieldはない。

- record create/updateは従来shape/rev条件に加え、同じatomic requestのproduct/stateが作成rev1、または既存rev+1かつ別operationIdとなることを要求する。recipe.lastOperationId、stock/wish.operationIdはそのafter-state.operationIdと一致。
- record deleteにも同じstate advanceを必須とする。state deleteは常に拒否。state-onlyの正規共有metadata更新は可能だがrev/opは進める。
- Firestore getAfterでafter-stateを見る。更新前はexists/get、after-stateは同じpathでcacheされる。update/create record条件の構文上呼出は最大5回（重複込み）、distinctなbefore/afterアクセス種は最大3、1文書評価上限10以内。atomic request全体上限20は共通stateへのcached参照が再利用される。24新record+state＝25writeが両候補で受理されたことをemulatorで確認。productionの課金readや全500writeの実測ではない。SDK側既存500write/10MiB/1MiB・UTF8/JPEG上限は変更しない。
- 既存具体旧writer＝createFirebaseRecipeDriver.transactの単一recipe transaction、stock/wish等の単独set/update/deleteを拒否。既存CloudRepository等、同契約を満たす過去版まで一律拒否するversion gateではない。任意の同UID悪意コードがstateを整えて同時writeする場合を識別する保証はなく、JSON全文やsnapshotHashの意味をRulesで再計算するものでもない。
- 不正旧writerのためだけにclient契約/schemaを増設せず、既存CloudRepositoryが既にこのstate連動transactionを実装していることを実SDKで確認した。cloud-repository.mjsは無変更。
- 現live Rulesとの最終合成は後段。古い広いallowに候補を追記するだけではOR評価で旧writerを遮断できない。通常/trialごとの既存allowを精査し、適切な固定本文・owner値・退避と別許可を揃えるまで実適用しない。

## 実SDK結果不明検証の境界

SDK13.1.0＋Firestore emulator1.22.0、demo-cocomemo-safety-r1、架空UID、127.0.0.1:8193のみ。ブラウザは実Chromiumとnative IndexedDB operation journal/draft driver、合成JPEG。SDKへ直接connectFirestoreEmulatorし、liveへfallbackしない。

wrapperが(a) SDK transactionを呼ぶ前にunavailableを返す、(b) emulator受理後にrunTransactionの成功結果を隠してunavailableを返す、という隔離故障を模擬する。実internetのpacket/応答欠落や製品30秒タイマーを測ったものではない。

normalの適用済/未適用/他client更新後競合、trialの適用済の4case。未知結果のnative pending/beforeと入力写真draftを保存→page reloadでSDK/runtime/journal再作成→同pending recover→再commitがoutcome-unresolvedで停止→server照合complete/not-applied/conflict。照合によるtransaction追加0・recipe1件・draft/Blob hash/before保持、競合時pending維持、別UID/rootへのjournal採用拒否を確認。CloudRepositoryの実証不具合はなく、回復ロジックを変更していない。手動accept/rollback全UI・実internet故障・3実機unknown回復を合格としない。

## 再現（専用隔離環境のみ）

package.jsonの開発依存を専用DEPSへ用意する。SDK13.1.0/rules-unit-testing6.0.0/firebase-tools15.36.0/esbuild0.28.2/playwright-core1.61.1、Java21とChromiumを使用。repoにnode_modules/jar/bundleや実configを追加しない。

1. firebase-toolsのemulators:start --only firestore --project demo-cocomemo-safety-r1 --config（本フォルダfirebase.jsonの絶対path）でlocalhost emulatorを起動。deployコマンドは使わない。ownerはテスト内で架空値へ置換する。
2. FIRESTORE_EMULATOR_HOST=127.0.0.1:8193、GCLOUD_PROJECT=demo-cocomemo-safety-r1、SAFETY_DEPS=依存dir、SAFETY_ARTIFACT_DIR=空の一時証拠dirを明示し、emulator.mjsを実行。必要ならSAFETY_PLAYWRIGHT_MODULEへplaywright-coreの絶対module path、CHROMIUM_BINを指定する。
3. 同じ隔離envでrules-supplement.mjs、node orders.mjs。既成功の全面suiteを呼ぶ必要はない。runnerはemulator内の架空データをクリアするが、本人Storage/実Firestoreは対象にならない。
4. 生証拠/resultsを保存しemulatorを停止。bundleは一時artifactだけでrepoに保存しない。emulator jar SHA256:9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c。

保存済みemulator-results.json/rules-supplement-results.json/orders-results.jsonとrecovery-evidence.jsonが今回の証拠。件数ラベルは24新record+stateの25writeへ訂正済み。検査用VMはcross-realm Array比較のassertだけ補正。これらは製品不具合ではない。stock/wishの既成功全検証・Work復旧は反復していない。

旧r1-emulator.mjsの単独writeを許すshape試験の期待値は旧候補に対する過去記録。本候補の新しいstate連動契約へ、そのまま適用して全件PASSとはしない。元試験/証拠は保持し、今回の差分suiteだけを実行した。
