import {ConnectError} from './connect-recipes.mjs';
export function authErrorCode(error){
 const code=error?.code;
 if(['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-email','auth/missing-password'].includes(code))return 'invalid-credentials';
 if(['auth/operation-not-allowed','auth/unauthorized-domain','auth/invalid-api-key','auth/app-not-authorized'].includes(code))return 'auth-config';
 if(code==='auth/network-request-failed')return 'network';
 if(code==='auth/too-many-requests')return 'auth-rate-limited';
 if(code==='permission-denied')return code;
 return 'auth-failed';
}

// Diagnostic vocabulary only: never retain the error object, message or credentials.
const SDK_DIAGNOSTIC_CODES=Object.freeze(['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-email','auth/missing-password','auth/operation-not-allowed','auth/unauthorized-domain','auth/invalid-api-key','auth/app-not-authorized','auth/network-request-failed','auth/too-many-requests']);
export function knownAuthDiagnosticCode(error){try{const code=error?.code;return SDK_DIAGNOSTIC_CODES.includes(code)?code:'unknown';}catch{return 'unknown';}}
export function safeAuthDiagnostic(value={}){
 const pick=(key,allowed)=>{const item=value[key];return allowed.includes(item)?item:'unknown';},sdkCode=value.sdkCode;
 return {stage:pick('stage',['credential-check','auth-call','owner-check','auth-observer','sign-out','initialization','post-auth-book-change','unknown']),phase:pick('phase',['signing-in','signed-in','signing-out','signed-out','error','disposed','unconfigured','checking','authenticated','forbidden','unknown']),sdkCode:SDK_DIAGNOSTIC_CODES.includes(sdkCode)?sdkCode:'unknown',classification:pick('classification',['invalid-credentials','auth-config','network','auth-rate-limited','permission-denied','auth-failed','owner-mismatch','post-auth-failed','unknown']),sdkOutcome:pick('sdkOutcome',['success','failure','not-observed','unknown'])};
}

// Serializes underlying SDK Auth actions so a late sign-in cannot undo logout.
export function createFirebaseAuthAdapter({sdk,instance,ownerUid}){
 let state={uid:null,phase:'signed-out',code:null},generation=0,disposed=false,pending=0,tail=Promise.resolve(),observed;
 let diagnostic=null;
 const remember=value=>{diagnostic=safeAuthDiagnostic(value);};
 const users=new Set(),states=new Set();
 const emit=()=>{for(const fn of states)fn({...state});};
 const publish=(uid,phase,code=null)=>{const previous=state.uid;state={uid,phase,code};if(uid!==previous||uid===null)for(const fn of users)fn(uid);emit();};
 const identity=()=>!disposed&&state.phase==='signed-in'&&instance.currentUser?.uid===ownerUid?Object.freeze({uid:state.uid,generation}):null;
 let initial;const ready=new Promise(resolve=>initial=resolve);
 const unsubscribe=sdk.onAuthStateChanged(instance,user=>{
  const uid=user?.uid||null,changed=uid!==observed;observed=uid;
  if(!disposed&&!pending&&changed){if(uid&&uid!==ownerUid)remember({stage:'owner-check',phase:'error',classification:'owner-mismatch',sdkOutcome:'not-observed'});generation++;publish(uid===ownerUid?uid:null,uid===ownerUid?'signed-in':uid?'error':'signed-out',uid&&uid!==ownerUid?'permission-denied':null);}
  initial();
 },error=>{if(!disposed){remember({stage:'auth-observer',phase:'error',sdkCode:knownAuthDiagnosticCode(error),classification:'auth-failed',sdkOutcome:'not-observed'});generation++;publish(null,'error','auth-failed');}initial();});
 function operate(kind,credentials){
  if(disposed||(kind==='in'&&pending))return Promise.resolve(false);
  const attempt=++generation;pending++;remember({stage:kind==='in'?'credential-check':'sign-out',phase:kind==='in'?'signing-in':'signing-out',sdkOutcome:'not-observed'});publish(null,kind==='in'?'signing-in':'signing-out');
  const action=async()=>{
   let diagnosticStage=kind==='in'?'credential-check':'sign-out',sdkOutcome='not-observed',ownerMismatch=false;
   try{
    if(kind==='in'){
     if(disposed||attempt!==generation)return false;
     if(typeof credentials?.email!=='string'||!credentials.email.trim()||typeof credentials?.password!=='string'||!credentials.password)throw Object.assign(Error(),{code:'auth/invalid-credential'});
     diagnosticStage='auth-call';
     const result=await sdk.signInWithEmailAndPassword(instance,credentials.email.trim(),credentials.password);
     sdkOutcome='success';diagnosticStage='owner-check';
     if(result.user?.uid!==ownerUid){ownerMismatch=true;await sdk.signOut(instance);throw new ConnectError('permission-denied');}
     if(disposed||attempt!==generation)return false;
     if(instance.currentUser?.uid!==ownerUid){ownerMismatch=true;throw new ConnectError('permission-denied');}
     remember({stage:'owner-check',phase:'signed-in',sdkOutcome});publish(ownerUid,'signed-in');return true;
    }
    await sdk.signOut(instance);
    if(disposed||attempt!==generation)return false;
    remember({stage:'sign-out',phase:'signed-out',sdkOutcome:'not-observed'});publish(null,'signed-out');return true;
   }catch(error){if(!disposed&&attempt===generation){const code=authErrorCode(error);remember({stage:diagnosticStage,phase:'error',sdkCode:diagnosticStage==='auth-call'?knownAuthDiagnosticCode(error):'unknown',classification:ownerMismatch?'owner-mismatch':code,sdkOutcome:diagnosticStage==='auth-call'?'failure':sdkOutcome});publish(null,'error',code);}return false;}
   finally{credentials=null;pending--;}
  };
  const result=tail.then(action);tail=result.catch(()=>{});return result;
 }
 return {
  diagnostic:()=>diagnostic?{...diagnostic}:null,
  ready,identity,snapshot:()=>({...state}),
  subscribe(fn){users.add(fn);fn(state.uid);return ()=>users.delete(fn);},
  subscribeState(fn){states.add(fn);fn({...state});return ()=>states.delete(fn);},
  login(credentials){return operate('in',credentials);},logout(){return operate('out');},
  dispose(){if(disposed)return;disposed=true;generation++;unsubscribe();publish(null,'disposed');users.clear();states.clear();}
 };
}
