import {resolveCloudTarget,validateTarget,cloudCollectionPath,cloudDocumentPath} from '../cloud-target.mjs';
import {ConnectError,recipePath,estimateDocumentSize,SIZE_RESERVE,DOCUMENT_LIMIT} from './connect-recipes.mjs';
const clone=value=>structuredClone(value);
// Defined storage-size calculation for the fixed schema, before SDK Bytes conversion.
export function firestoreDocumentSize(path,document){
 const storageBytes=estimateDocumentSize(path,document)-SIZE_RESERVE;
 return {storageBytes,budgetBytes:storageBytes+SIZE_RESERVE,photoBytes:document.photo?.bytes.byteLength||0,formUtf8Bytes:new TextEncoder().encode(document.formJson).byteLength};
}
export function toFirestoreDocument(document,Bytes){
 const result=clone(document);if(result.photo)result.photo.bytes=Bytes.fromUint8Array(result.photo.bytes);return result;
}
export function fromFirestoreDocument(document,Bytes){
 if(!document)return null;
 // Do not structuredClone SDK Bytes: cloning would erase its conversion method.
 const {photo,...rest}=document;let portable=null;
 if(photo!==null){if(!photo||!(photo.bytes instanceof Bytes))throw new ConnectError('invalid-photo');portable={...photo,bytes:photo.bytes.toUint8Array()};}
 return {...clone(rest),photo:portable};
}
export function firestoreError(error){
 if(error instanceof ConnectError)return error;
 const code=error?.code;
 if(code==='permission-denied'||code==='unauthenticated')return new ConnectError('permission-denied');
 if(code==='aborted'||code==='already-exists')return new ConnectError('conflict');
 if(code==='resource-exhausted')return new ConnectError('service-limit');
 if(code==='invalid-argument')return new ConnectError('invalid-document');
 return new ConnectError(code==='unavailable'?'unavailable':'network');
}
export function createFirebaseRecipeDriver({sdk,db,auth,authInstance,ownerUid,target,now=()=>Date.now(),online=()=>globalThis.navigator?.onLine!==false}){
 const scope=target?validateTarget(target):resolveCloudTarget();
 function authorize(context){
  const current=auth.identity();
  if(!current||current.uid!==ownerUid||context.uid!==ownerUid||context.identity?.uid!==current.uid||context.identity?.generation!==current.generation||authInstance.currentUser?.uid!==ownerUid)throw new ConnectError('permission-denied');
  if(!online())throw new ConnectError('unavailable');
  if(Number.isFinite(context.deadlineAt)&&now()>=context.deadlineAt)throw new ConnectError('network');
 }
 const reference=context=>sdk.doc(db,cloudDocumentPath(scope,context.uid,'recipes',context.recipeId));
 return {
  async read(context){
   try{authorize(context);const result=await sdk.getDoc(reference(context));authorize(context);return result.exists()?fromFirestoreDocument(result.data(),sdk.Bytes):null;}
   catch(error){throw firestoreError(error);}
  },
  async list(context){
   try{authorize(context);recipePath(context.uid,'validate-path');const result=await sdk.getDocs(sdk.collection(db,cloudCollectionPath(scope,context.uid,'recipes')));authorize(context);
    return result.docs.map(row=>({recipeId:row.id,document:fromFirestoreDocument(row.data(),sdk.Bytes)}));
   }catch(error){throw firestoreError(error);}
  },
  async transact(context,update){
   try{
    authorize(context);const ref=reference(context);
    await sdk.runTransaction(db,async transaction=>{
     authorize(context);const snapshot=await transaction.get(ref);authorize(context);
     const next=update(snapshot.exists()?fromFirestoreDocument(snapshot.data(),sdk.Bytes):null);
     const size=firestoreDocumentSize(ref.path,next);if(size.storageBytes>DOCUMENT_LIMIT||size.budgetBytes>DOCUMENT_LIMIT)throw new ConnectError('document-size');
     const data=toFirestoreDocument(next,sdk.Bytes);authorize(context);transaction.set(ref,data);
    },{maxAttempts:1});
   }catch(error){throw firestoreError(error);}
  }
 };
}
