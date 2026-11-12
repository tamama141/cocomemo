# DEV-AUTH-DIAG-UI-20261112-001

診断生成・表示だけの限定追加。実認証の修正/成功や原因確定ではない。成果は固定SHAとVERSION.jsonで識別する。runtime34pathは据置き、変更runtimeはmodules/legacy/firebase-auth.mjsとmodules/book-ui.mjsだけ。試験用fixtureとresultsは配信集合へ加えない。

## 表示と安全語彙

config.enabled===trueかつcloudMode==='sys-trial'時だけ、既存ログインform末尾とアカウント欄の小さなdetails「検証用診断」に表示する。展開すると段階/phase/SDK code/分類/SDK認証結果をtextContentで読める。normalとdisabledには表示しない。

SDK code allowlistはauth/invalid-credential、auth/wrong-password、auth/user-not-found、auth/invalid-email、auth/missing-password、auth/operation-not-allowed、auth/unauthorized-domain、auth/invalid-api-key、auth/app-not-authorized、auth/network-request-failed、auth/too-many-requestsの11件。それ以外はunknown。ローカル入力検査の失敗にはSDK codeを推定しない。owner不一致は実UIDなしのowner-mismatch。任意code/message/stack/本文/config全文/credential等を取り込まない。

段階はcredential-check/auth-call/owner-check/auth-observer/sign-out/initialization/post-auth-book-change/unknownの固定語彙。SDK認証結果はsuccess/failure/not-observed/unknown。成功後の帳切替失敗はpost-auth-book-change＋post-auth-failedとして、SDK codeをcredential誤りと表示しない。unknownや分類は原因確定ではない。

診断はメモリだけ。新DB/Storageキー・診断console/外部送信/永続ログ・自動copyなし。SDK呼出順・引数・observer・ownerチェック・永続化・timeout・SDK版・scope解決・成功条件・通常UI/失敗時保持・送信数/自動retryは変更しない。診断getterはallowlist済の5フィールドだけを返し、既存snapshot/状態通知は変更しない。再描画時も直前の診断を保持するが、page reload/disposeで過去値を復元できない。初回第11版の過去codeは取り戻せず、新版での一回を別試行として扱う。

## 最小確認

```
node tests/auth-diagnostic/adapter.mjs
node tests/auth-diagnostic/unchanged-auth.mjs /path/to/fixed-e9e9ff8/modules/legacy/firebase-auth.mjs
```

ブラウザはローカル静的serverを使い、PLAYWRIGHT_MODULEとAUTH_DIAG_TEST_BASE（http(s) localhost/127.0.0.1だけ）を指定してbrowser.cjsを実行する。AUTH_DIAG_BASELINE_BASEへ原本moduleと同fixtureを配置するとnormal DOM比較も行う。Chromium pathはCHROMIUM_BINで指定可。外部requestは遮断する。fixtureは架空値だけで実SDK/本人認証は実行しない。tests/auth-diagnostic/results.jsonの範囲を超える全面回帰・実Firebase合格にしない。

## SYSへの変更module限定受渡し

管理受領後に固定対象を指定し、本人SYS開始声かけ後に同Site appgprj_6adaff11187c819192789991dfb80643の第11版source5b821191440d4e385f58105adf580983a5bc6841へ変更2moduleだけを統合する。35件集合のindex/bootstrap・CSP・他33件、対象外19静的/hosting/README、Rules/索引/domain/key等は保持する。VERSION/checksum/testは成果metadataであり、新しいruntimeを配信へ足さない。既存33件/対象外の大量再取得・54件全巡回を条件にしない。

必要な変更bytes/hash・入口/cache混在防止を確認して限定配信1回後、同cloud Chromeで新版読込1回。正しい本人認証保持が既に確認できれば再送信省略。unknown/未解決/別UIDなら停止して押し切らず、signed-outで正規入力可能な場合だけ本人email/password認証追加最大1回。入力は本人の正規UIへ、チャットや報告へ求めない。失敗/unknownで停止し、検証用診断の安全な5項目とUI結果のみを収集する。任意SDK例外や入力・実UID・token等を採取しない。再送信/reset/新アカウント/設定緩和なし。

診断は実SDKが返したcodeを新版で受け取れた場合だけ分類できる。認証成功だけでtrial CRUD/保存同期完了にしない。正しいAuth/root等が成立し元SYS停止条件がなければ既承認最小trial CRUDへ続行できるが、開発は実施しない。配信不成立の復旧は第11版 appgprj_6adaff11187c819192789991dfb80643~appgver_348c8951f3dc8191a5091d664c792958/source5b821191440d4e385f58105adf580983a5bc6841へ1回まで。データ巻戻しや第10版/Firebase設定復旧へ広げない。
