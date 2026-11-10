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

// Serializes underlying SDK Auth actions so a late sign-in cannot undo logout.
export function createFirebaseAuthAdapter({sdk,instance,ownerUid}){
 let state={uid:null,phase:'signed-out',code:null},generation=0,disposed=false,pending=0,tail=Promise.resolve(),observed;
 const users=new Set(),states=new Set();
 const emit=()=>{for(const fn of states)fn({...state});};
 const publish=(uid,phase,code=null)=>{const previous=state.uid;state={uid,phase,code};if(uid!==previous||uid===null)for(const fn of users)fn(uid);emit();};
 const identity=()=>!disposed&&state.phase==='signed-in'&&instance.currentUser?.uid===ownerUid?Object.freeze({uid:state.uid,generation}):null;
 let initial;const ready=new Promise(resolve=>initial=resolve);
 const unsubscribe=sdk.onAuthStateChanged(instance,user=>{
  const uid=user?.uid||null,changed=uid!==observed;observed=uid;
  if(!disposed&&!pending&&changed){generation++;publish(uid===ownerUid?uid:null,uid===ownerUid?'signed-in':uid?'error':'signed-out',uid&&uid!==ownerUid?'permission-denied':null);}
  initial();
 },()=>{if(!disposed){generation++;publish(null,'error','auth-failed');}initial();});
 function operate(kind,credentials){
  if(disposed||(kind==='in'&&pending))return Promise.resolve(false);
  const attempt=++generation;pending++;publish(null,kind==='in'?'signing-in':'signing-out');
  const action=async()=>{
   try{
    if(kind==='in'){
     if(disposed||attempt!==generation)return false;
     if(typeof credentials?.email!=='string'||!credentials.email.trim()||typeof credentials?.password!=='string'||!credentials.password)throw Object.assign(Error(),{code:'auth/invalid-credential'});
     const result=await sdk.signInWithEmailAndPassword(instance,credentials.email.trim(),credentials.password);
     if(result.user?.uid!==ownerUid){await sdk.signOut(instance);throw new ConnectError('permission-denied');}
     if(disposed||attempt!==generation)return false;
     if(instance.currentUser?.uid!==ownerUid)throw new ConnectError('permission-denied');
     publish(ownerUid,'signed-in');return true;
    }
    await sdk.signOut(instance);
    if(disposed||attempt!==generation)return false;
    publish(null,'signed-out');return true;
   }catch(error){if(!disposed&&attempt===generation)publish(null,'error',authErrorCode(error));return false;}
   finally{credentials=null;pending--;}
  };
  const result=tail.then(action);tail=result.catch(()=>{});return result;
 }
 return {
  ready,identity,snapshot:()=>({...state}),
  subscribe(fn){users.add(fn);fn(state.uid);return ()=>users.delete(fn);},
  subscribeState(fn){states.add(fn);fn({...state});return ()=>states.delete(fn);},
  login(credentials){return operate('in',credentials);},logout(){return operate('out');},
  dispose(){if(disposed)return;disposed=true;generation++;unsubscribe();publish(null,'disposed');users.clear();states.clear();}
 };
}
