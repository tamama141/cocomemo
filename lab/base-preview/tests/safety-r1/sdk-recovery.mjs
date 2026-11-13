import {initializeApp,SDK_VERSION} from 'firebase/app';import * as sdk from 'firebase/firestore';
import {CloudRepository} from '../../modules/cloud-repository.mjs';
import {createOperationJournal} from '../../modules/operation-journal.mjs';
import {createDrafts} from '../../modules/drafts.mjs';
import {resolveCloudTarget,TRIAL_ROOT,cloudJournalScope,cloudEnvironment} from '../../modules/cloud-target.mjs';
import {photoFromDataURL} from '../../modules/legacy/photo.mjs';
const project='demo-cocomemo-safety-r1',uid='safety-fictional-owner',host='127.0.0.1',port=8193;
if(!['127.0.0.1','localhost'].includes(location.hostname)||SDK_VERSION!=='13.1.0')throw Error('isolated SDK fixture only');
const mode=new URL(location.href).searchParams.get('mode')||'normal';
const target=resolveCloudTarget(mode==='trial'?{cloudMode:'sys-trial',cloudRoot:TRIAL_ROOT,databaseId:'(default)'}:{}),scope={kind:'cloud',uid,environment:cloudEnvironment(project,'(default)',target)};
const app=initializeApp({projectId:project,apiKey:'fictional-emulator-only',appId:'fictional'},'isolated');
const db=sdk.initializeFirestore(app,{experimentalForceLongPolling:true});sdk.connectFirestoreEmulator(db,host,port,{mockUserToken:{sub:uid,user_id:uid}});sdk.setLogLevel('silent');
const journal=createOperationJournal(cloudJournalScope(project,'(default)',uid,target)),drafts=createDrafts();let transactions=0,repo;
function make(fault){const wrapped={...sdk,async runTransaction(database,fn,options){transactions++;if(fault==='before')throw Object.assign(Error('isolated before SDK call'),{code:'unavailable'});const result=await sdk.runTransaction(database,fn,options);if(fault==='after')throw Object.assign(Error('isolated after emulator accepted'),{code:'unavailable'});return result;}};return new CloudRepository({sdk:wrapped,db,uid,authorize:()=>uid,journal,target});}
async function plain(x){if(x instanceof Blob){return {type:'Blob',mime:x.type,bytes:x.size,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await x.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('')};}if(Array.isArray(x))return Promise.all(x.map(plain));if(x&&typeof x==='object')return Object.fromEntries(await Promise.all(Object.entries(x).map(async([k,v])=>[k,await plain(v)])));return x;}
async function inspect(){return {sdk:SDK_VERSION,mode,root:target.root,transactions,pending:await plain(await journal.load()),backups:await plain(await journal.backups()),drafts:await plain(await drafts.list(scope))};}
async function seed(){repo=make();await repo.load();const c=document.createElement('canvas');c.width=2;c.height=2;c.getContext('2d').fillRect(0,0,2,2);const photo=c.toDataURL('image/jpeg',.8),snapshot={version:5,recipes:[{id:'same',title:'BASELINE',photo}],labels:[],labelIcons:{},pantryInventory:[{id:'same',name:'STOCK',qty:'1'}],pantryCategories:[],shoppingItems:[{id:'same',name:'WISH'}],productMeta:{}};await repo.commit(snapshot);await drafts.save(scope,{form:{record:{id:'same',title:'INPUT_KEPT'},editorKind:'fields'},photo:await photoFromDataURL(photo)});return inspect();}
async function unknown(fault){repo=make(fault);const data=await repo.load();data.recipes[0].title='PENDING_INPUT';const outcome=await repo.commit(data,{retainBackup:true});return {outcome,...await inspect()};}
async function recover(){repo=make();await repo.recoverPending();const before=await inspect();let blocked;try{await repo.commit(repo.pending.after);}catch(e){blocked=e.code;}const result=await repo.reconcile(),server=await repo.readServer();return {blocked,result,server,before,after:await inspect()};}
async function foreign(){const other=new CloudRepository({sdk,db,uid:'other',authorize:()=>uid,journal,target}),otherRoot=new CloudRepository({sdk,db,uid,authorize:()=>uid,journal,target:resolveCloudTarget(mode==='trial'?{}:{cloudMode:'sys-trial',cloudRoot:TRIAL_ROOT,databaseId:'(default)'})});const errors=[];for(const r of [other,otherRoot])try{await r.recoverPending();}catch(e){errors.push(e.code);}return {errors,state:await inspect()};}
window.safety={seed,unknown,recover,inspect,foreign};window.fixtureReady=true;
