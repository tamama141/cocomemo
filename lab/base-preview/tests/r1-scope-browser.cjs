// Actual isolated browser Storage/IDB with SDK-shaped cloud; not Rules acceptance.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8787/app/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[],external=[];
 context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
 context.on('request',request=>{if(/^https?:/.test(request.url())&&new URL(request.url()).origin!==new URL(base).origin)external.push(request.url());});
 async function open(mode,records=[]){const page=await context.newPage();page.setDefaultTimeout(15000);await page.addInitScript(({mode,records})=>{
  const trialRoot='sysTrials/SYS-COMPLETE-20261111/users';
  if(mode==='sys-trial')globalThis.CocoMemoProductConfig={enabled:true,allowedOrigin:location.origin,ownerUid:'r1-fictional-owner',firebase:{projectId:'r1-fixture'},databaseId:'(default)',cloudMode:'sys-trial',cloudRoot:trialRoot};
  globalThis.CocoMemoProductRuntimeFactory=async({onState})=>{
   const [{BookContext},{mockFirestore},{resolveCloudTarget}]=await Promise.all([import('/app/modules/book-context.mjs'),import('/app/tests/mock-firestore.mjs'),import('/app/modules/cloud-target.mjs')]);
   const m=mockFirestore();function decode(value){if(value&&Array.isArray(value.r1bytes))return m.sdk.Bytes.fromUint8Array(new Uint8Array(value.r1bytes));if(Array.isArray(value))return value.map(decode);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,decode(v)]));return value;}
   for(const [p,d]of records)m.documents.set(p,decode(d));
   const auth=new BookContext({ownerUid:'r1-fictional-owner',onState});auth.identity({uid:'r1-fictional-owner'});
   globalThis.r1Backend=m;return {context:auth,target:resolveCloudTarget(globalThis.CocoMemoProductConfig||{}),app:{options:{projectId:'r1-fixture'}},db:{databaseId:'fixture'},sdk:{firestore:m.sdk},ready:Promise.resolve(),async login(){auth.identity({uid:'r1-fictional-owner'});return true;},async logout(){auth.identity(null);}};
  };
 },{mode,records});await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.Product?.ready&&window.r1Backend&&Product.controller.getCloud());return page;}
 const records=page=>page.evaluate(()=>{function encode(value){if(value?.toUint8Array)return {r1bytes:[...value.toUint8Array()]};if(Array.isArray(value))return value.map(encode);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,encode(v)]));return value;}return [...r1Backend.documents].map(([p,d])=>[p,encode(d)]);});
 try{
  let page=await open('product');
  const normal=await page.evaluate(async()=>{
   const data=Product.currentSnapshot();data.recipes=[{...fixtures()[0],id:'local-sentinel',title:'LOCAL_SENTINEL',photo:''}];
   await Product.commitSnapshot(data);const repo=Product.controller.getCloud();await repo.load();const cloud=structuredClone(data);cloud.recipes=[{...fixtures()[0],id:'same',title:'NORMAL_SENTINEL',photo:''}];await repo.commit(cloud);
   const {cloudEnvironment,cloudJournalScope,resolveCloudTarget}=await import('/app/modules/cloud-target.mjs'),{createOperationJournal}=await import('/app/modules/operation-journal.mjs');const target=resolveCloudTarget(),environment=cloudEnvironment('r1-fixture','fixture',target),uid='r1-fictional-owner';
   await Product.draftService.save({kind:'cloud',uid,environment},{form:{record:{title:'NORMAL_DRAFT'}},photo:null});
   const j=createOperationJournal(cloudJournalScope('r1-fixture','fixture',uid,target));await j.save({version:1,uid,operationId:'normal-pending-sentinel',retainBackup:true,before:cloud,after:cloud,expectedRev:1,afterHash:'normal-sentinel'});
   return {local:ProductBoot.repository.raw(),drafts:await Product.draftService.list({kind:'cloud',uid,environment}),pending:await j.load(),backups:await j.backups()};
  });
  let all=await records(page);const normalCloud=all.filter(([p])=>p.startsWith('users/'));await page.close();
  page=await open('sys-trial',all);await page.evaluate(()=>Product.controller.change('cloud'));await page.waitForFunction(()=>Product.context.kind==='cloud');
  assert.equal(await page.evaluate(()=>recipes.length),0);assert.equal(await page.evaluate(()=>drafts.cloud.length),0);assert.equal(await page.evaluate(()=>Product.controller.getCloud().pending),null);
  await page.evaluate(()=>{startNew(true);editSession.newRecordId='same';const canvas=document.createElement('canvas');canvas.width=10;canvas.height=8;working.photo=canvas.toDataURL('image/jpeg');showPhoto();});await page.locator('#eTitle').fill('TRIAL_ONLY');assert(await page.evaluate(()=>saveRecipe()));
  assert.equal(await page.evaluate(()=>recipes[0].id),'same');
  await page.evaluate(()=>startNew(true));await page.locator('#eTitle').fill('TRIAL_DRAFT');assert(await page.evaluate(()=>saveDraft(false)));await page.evaluate(()=>{discardEdit();});
  assert.equal(await page.evaluate(()=>Product.context.environment.includes('sysTrials/SYS-COMPLETE-20261111/users')),true);
  console.log('PASS same UID/record ID remains separate; normal pending and draft are not resumed in trial');
  await page.evaluate(()=>Product.controller.change('local'));await page.waitForFunction(()=>Product.context.kind==='local');assert.equal(await page.evaluate(()=>recipes[0].title),'LOCAL_SENTINEL');
  await page.evaluate(()=>Product.controller.copyUI());await page.locator('dialog[open] [data-all]').click();await page.locator('dialog[open] [data-copy]').click();await page.locator('dialog[open] [data-answer=yes]').click();await page.waitForFunction(()=>document.querySelector('[data-result]')?.textContent.includes('コピー済み'));await page.locator('dialog[open] .ui8-close').last().click();
  assert.deepEqual(await page.evaluate(()=>ProductBoot.repository.raw()),normal.local);
  await page.evaluate(()=>Product.controller.change('cloud'));await page.waitForFunction(()=>Product.context.kind==='cloud');
  await page.evaluate(async()=>{pantryInventory.push({id:'move-source',name:'TRIAL_MOVE',categoryId:'pc-1',category:'野菜・きのこ',qty:'2',unit:'個',createdAt:1});await persist();const original=window.persist;let calls=0;window.persist=async()=>++calls===2?false:original();await Pantry.moveToWish(['move-source']);window.persist=original;});
  assert(await page.evaluate(()=>Pantry.hasTransfers()));await page.evaluate(()=>Product.controller.change('local'));await page.waitForFunction(()=>Product.context.kind==='local');await page.evaluate(()=>Product.controller.change('cloud'));await page.waitForFunction(()=>Product.context.kind==='cloud');await page.evaluate(()=>Pantry.resumeTransfers());assert.equal(await page.evaluate(()=>pantryInventory.length),0);assert.equal(await page.evaluate(()=>shoppingItems.filter(r=>r.name==='TRIAL_MOVE').length),1);
  console.log('PASS trial copy and durable source-only move resume leave local keys unchanged');
  const downloading=page.waitForEvent('download');await page.evaluate(()=>exportData());const downloaded=await downloading,trialBackup=JSON.parse(await fs.readFile(await downloaded.path(),'utf8'));assert.equal(trialBackup.backupScope.mode,'sys-trial');assert.equal(trialBackup.backupScope.root,'sysTrials/SYS-COMPLETE-20261111/users');
  await page.evaluate(async()=>{r1Backend.setMode('unknown');const d=Product.currentSnapshot();d.recipes[0].title='TRIAL_UNKNOWN';await Product.commitSnapshot(d,{retainBackup:true});});
  const trialState=await page.evaluate(async()=>{const repo=Product.controller.getCloud();return {pending:await repo.journal.load(),backups:await repo.journal.backups()};});assert.equal(trialState.pending.cloudRoot,'sysTrials/SYS-COMPLETE-20261111/users');assert(trialState.backups.length>0);
  all=await records(page);assert.deepEqual(all.filter(([p])=>p.startsWith('users/')),normalCloud);await page.close();
  page=await open('product',all);
  const after=await page.evaluate(async()=>{const {cloudEnvironment,cloudJournalScope,resolveCloudTarget,TRIAL_ROOT}=await import('/app/modules/cloud-target.mjs'),{createOperationJournal}=await import('/app/modules/operation-journal.mjs'),uid='r1-fictional-owner',target=resolveCloudTarget(),trial=resolveCloudTarget({cloudMode:'sys-trial',cloudRoot:TRIAL_ROOT,databaseId:'(default)'});const normalJ=createOperationJournal(cloudJournalScope('r1-fixture','fixture',uid,target)),trialJ=createOperationJournal(cloudJournalScope('r1-fixture','fixture',uid,trial));return {local:ProductBoot.repository.raw(),drafts:await Product.draftService.list({kind:'cloud',uid,environment:cloudEnvironment('r1-fixture','fixture',target)}),pending:await normalJ.load(),backups:await normalJ.backups(),trialPending:await trialJ.load(),trialBackups:await trialJ.backups(),resumed:Product.controller.getCloud().pending,normalRead:await Product.controller.getCloud().readServer()};});
  assert.deepEqual(after.local,normal.local);assert.deepEqual(after.drafts,normal.drafts);assert.deepEqual(after.pending,normal.pending);assert.deepEqual(after.backups,normal.backups);assert.deepEqual(after.trialPending,trialState.pending);assert.deepEqual(after.trialBackups,trialState.backups);assert.equal(after.resumed.operationId,'normal-pending-sentinel');assert.equal(after.normalRead.snapshot.recipes[0].title,'NORMAL_SENTINEL');
  console.log('PASS actual IDB pending/before-backup/draft scopes survive separate-mode reopen without mixing');
  await page.evaluate(()=>showSettings());await page.locator('#backupSettings summary').click();await page.locator('#restoreFile').setInputFiles({name:'trial-only.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(trialBackup))});await page.getByRole('button',{name:'選択した区分を復元',exact:true}).click();await page.waitForFunction(()=>document.getElementById('messageModalText').textContent.includes('別の検証環境'));assert.deepEqual(await page.evaluate(()=>ProductBoot.repository.raw()),normal.local);console.log('PASS trial backup export is tagged and normal restore rejects it before changing data');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS no page errors or external HTTP requests');
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
