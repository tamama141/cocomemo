export const PHOTO_LIMIT=512*1024, FORM_LIMIT=64*1024, MAX_DRAFTS=10;
export const DB_NAME='cocomemo-DEV-20261021-004-isolated-v1';
export const ENV=Object.freeze({projectId:'MOCK-DEV-004',trialId:'photo-drafts-v1'});
export class DraftError extends Error {constructor(code){super(code);this.code=code;}}
export const defaultIdFactory=()=>globalThis.crypto.randomUUID();
export function idCapability(idFactory){return idFactory===defaultIdFactory&&typeof globalThis.crypto?.randomUUID!=='function'?'uuid-unavailable':null;}
const clone=v=>structuredClone(v);
export function groupFor(uid,env=ENV){if(typeof uid!=='string'||!uid)throw new DraftError('login');return [env.projectId,env.trialId,uid];}
export function validateSnapshot(snapshot){
 if(!snapshot||!snapshot.form||typeof snapshot.form!=='object')throw new DraftError('form');
 const size=new TextEncoder().encode(JSON.stringify(snapshot.form)).byteLength;
 if(size>FORM_LIMIT)throw new DraftError('form-limit');
 if(snapshot.photo){const p=snapshot.photo;if(!(p.blob instanceof Blob)||p.blob.type!=='image/jpeg'||p.blob.size===0||p.width<=0||p.height<=0)throw new DraftError('photo');if(p.blob.size>PHOTO_LIMIT)throw new DraftError('photo-limit');}
 return size;
}
export class DraftStore {
 constructor(driver,{env=ENV,idFactory=defaultIdFactory}={}){this.driver=driver;this.env=env;this.idFactory=idFactory;}
 capabilityError(){return idCapability(this.idFactory)||this.driver.capabilityError?.()||null;}
 async save(uid,snapshot,previous=null,attemptId=null,signal){
  const capability=this.capabilityError();if(capability)throw new DraftError(capability);
  validateSnapshot(snapshot);const group=groupFor(uid,this.env),draftId=previous?.draftId||this.idFactory(),key=[...group,draftId];
  const value={schemaVersion:1,key,group,uid,draftId,versionId:this.idFactory(),updatedAt:Date.now(),snapshot:clone(snapshot),attemptId,cloudState:attemptId?'結果未確認':'未送信'};
  return this.driver.run('readwrite',async tx=>{
   const before=await tx.get(key);
   if(previous){if(!before)throw new DraftError('missing');if(before.versionId!==previous.versionId)throw new DraftError('changed');}
   else if(before)throw new DraftError('changed');
   if(!before&&await tx.count(group)>=MAX_DRAFTS)throw new DraftError('full');
   await tx.put(value);return clone(value);
  },signal);
 }
 list(uid,signal){const g=groupFor(uid,this.env);return this.driver.run('readonly',tx=>tx.list(g),signal);}
 async remove(uid,record,{attemptId,signal}={}){
  const group=groupFor(uid,this.env);if(JSON.stringify(record.group)!==JSON.stringify(group))throw new DraftError('owner');
  return this.driver.run('readwrite',async tx=>{
   const live=await tx.get(record.key);if(!live)return 'missing';
   if(live.versionId!==record.versionId||(attemptId!==undefined&&live.attemptId!==attemptId))return 'changed';
   await tx.delete(record.key);return 'deleted';
  },signal);
 }
}
export function createIndexedDBDriver(factory=globalThis.indexedDB,{name=DB_NAME}={}){
 let opening;
 function open(){
  if(typeof factory?.open!=='function')return Promise.reject(new DraftError('unavailable'));
  if(!opening)opening=new Promise((resolve,reject)=>{
   let settled=false;const req=factory.open(name,1);
   req.onupgradeneeded=()=>{const store=req.result.createObjectStore('drafts',{keyPath:'key'});store.createIndex('group','group',{unique:false});};
   req.onblocked=()=>{settled=true;reject(new DraftError('blocked'));};
   req.onerror=()=>{settled=true;reject(req.error||new DraftError('unknown'));};
   req.onsuccess=()=>{if(settled){req.result.close();return;}const db=req.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
  }).catch(e=>{opening=null;throw e;});return opening;
 }
 return {capabilityError:()=>typeof factory?.open==='function'?null:'unavailable',async run(mode,body,signal){
  if(signal?.aborted)throw new DraftError('aborted');const db=await open();if(signal?.aborted)throw new DraftError('aborted');
  return new Promise((resolve,reject)=>{
   const native=db.transaction('drafts',mode),store=native.objectStore('drafts');let result,problem,finished=false;
   const abort=()=>{try{native.abort()}catch{}};signal?.addEventListener('abort',abort,{once:true});
   const end=fn=>{if(finished)return;finished=true;signal?.removeEventListener('abort',abort);fn();};
   const req=request=>new Promise((ok,bad)=>{request.onsuccess=()=>ok(request.result);request.onerror=()=>bad(request.error||new DraftError('unknown'));});
   const tx={get:key=>req(store.get(key)),count:g=>req(store.index('group').count(g)),list:g=>req(store.index('group').getAll(g)),put:v=>req(store.put(v)),delete:key=>req(store.delete(key))};
   native.oncomplete=()=>end(()=>problem?reject(problem):resolve(result));
   native.onabort=()=>end(()=>reject(problem||native.error||new DraftError('aborted')));
   native.onerror=()=>{problem ||= native.error||new DraftError('unknown');};
   Promise.resolve().then(()=>body(tx)).then(value=>{result=value;},error=>{problem=error;abort();});
  });
 }};
}
// Test-only transactional memory model. Not evidence of actual browser IndexedDB.
export function createMemoryDriver(){
 let tail=Promise.resolve();const records=new Map();
 const driver={records,fail:null,async run(mode,body,signal){
  const perform=async()=>{
   if(signal?.aborted)throw new DraftError('aborted');if(driver.fail==='before')throw new DraftError('unknown');
   const copy=new Map([...records].map(([k,v])=>[k,clone(v)]));const key=k=>JSON.stringify(k);
   const tx={get:async k=>clone(copy.get(key(k))),count:async g=>[...copy.values()].filter(v=>key(v.group)===key(g)).length,list:async g=>clone([...copy.values()].filter(v=>key(v.group)===key(g))),put:async v=>{copy.set(key(v.key),clone(v));if(driver.fail==='after-put')throw new DraftError('unknown');},delete:async k=>{copy.delete(key(k));if(driver.fail==='delete')throw new DraftError('unknown');}};
   const result=await body(tx);if(signal?.aborted)throw new DraftError('aborted');
   if(driver.fail==='commit')throw new DraftError('unknown');if(mode==='readwrite'){records.clear();for(const [k,v] of copy)records.set(k,v);}return result;
  };
  const p=tail.then(perform);tail=p.catch(()=>{});return p;
 }};return driver;
}
export function describeError(e){
 const code=typeof e?.code==='string'?e.code:e?.name;
 return ({'service-limit':'保存サービスが利用量の上限を返しました。下書きを保ち、無料枠と容量を管理担当へ確認してください。課金へ自動変更しません。','invalid-credentials':'模擬認証に失敗しました。架空メール・架空パスワードを確認してください。','auth-failed':'認証結果を確認できませんでした。ログイン済みとは扱いません。もう一度明示操作で確認してください。','permission-denied':'アクセス権限が拒否されました。ログイン状態とUIDを確認してください。','service-unavailable':'接続先の保存サービスを利用できません。接続先と通信状態を確認してください。','network':'通信結果を確認できません。保存済みの可能性があります。接続と一覧を確認し、必要なら本人の操作で再保存してください。','document-size':'写真と文章を一体にした文書が送信前の保守的な容量検査を超えました。入力・写真・下書きを残しています。内容を控えて管理担当へ相談してください。','invalid-document':'保存文書または識別子・版を確認できません。入力を残して管理担当へ確認してください。','invalid-photo':'写真データを確認できません。文章だけは送信していません。写真を確認してください。',full:'下書きが10件です。不要な下書きを選んで削除し、もう一度保存してください。',changed:'別の画面で下書きが更新されています。入力を残して確認してください。',missing:'元の下書きが見つかりません。新規保存は下書きを閉じて明示的に選び直してください。',owner:'現在のユーザーの下書きではありません。',login:'模擬UIDを選んでください。','photo-limit':'写真が512KiBを超えています。小さい写真を選び直してください。写真は省略していません。','form-limit':'文章等の保存表現がUTF-8で64KiBを超えています。内容を確認してください。',photo:'写真の読み込み・変換を確認できません。選び直してください。','uuid-unavailable':'この環境では保存に必要なUUID生成機能（crypto.randomUUID）が使えないため、下書き保存とクラウド送信を停止しています。入力・写真・以前の下書きは変更していません。移動や再読込の前に必要な内容を控え、利用環境を管理担当へ伝えて、案内された正規の確認先で機能を再確認してください。別のURLへ入力・写真は自動移行しません。HTTPSでも保存成功は保証されません。',unavailable:'この環境ではIndexedDB保存機能が使えないため、下書き保存とクラウド送信を停止しています。入力・写真・以前の下書きは変更していません。移動や再読込の前に必要な内容を控え、このサイトの保存設定を確認し、利用環境を管理担当へ伝えてください。案内された正規の確認先でも機能と保存結果の確認が必要です。別のURLへ入力・写真は自動移行しません。',blocked:'別のタブが保存領域の準備を妨げています。そのタブを確認してください。',aborted:'下書き保存を中止しました。入力を残しています。',QuotaExceededError:'ブラウザが容量上限エラーを返しました。不要な下書きや端末の空き容量を確認してください。',SecurityError:'ブラウザが保存を拒否しました。このサイトの保存設定を確認してください。'})[code]||'下書き保存を確認できませんでした。理由は不明です。入力を残しています。必要な内容を控えてから再操作してください。';
}
