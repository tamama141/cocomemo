// Portable document values: an SDK bridge must map Uint8Array to Firestore Bytes.
export const DOCUMENT_LIMIT=1024*1024, SIZE_RESERVE=16*1024;
export class ConnectError extends Error {constructor(code){super(code);this.code=code;}}
const clone=value=>structuredClone(value),utf8=value=>new TextEncoder().encode(value).byteLength;
export function recipePath(uid,recipeId){
 for(const part of [uid,recipeId])if(typeof part!=='string'||!part||part==='.'||part==='..'||part.includes('/')||/^__.*__$/.test(part)||utf8(part)>1500)throw new ConnectError('invalid-document');
 return `users/${uid}/recipes/${recipeId}`;
}
function valueSize(value){
 if(value===null||typeof value==='boolean')return 1;
 if(typeof value==='number'&&Number.isFinite(value))return 8;
 if(typeof value==='string')return utf8(value)+1;
 if(value instanceof Uint8Array)return value.byteLength;
 if(value&&Object.getPrototypeOf(value)===Object.prototype)return 32+Object.entries(value).reduce((n,[key,item])=>n+utf8(key)+1+valueSize(item),0);
 throw new ConnectError('invalid-document');
}
export function estimateDocumentSize(path,document){
 // Firestore name/field/value estimates + deliberately reserved uncertainty.
 return path.split('/').reduce((n,part)=>n+utf8(part)+1,16)+valueSize(document)+SIZE_RESERVE;
}
export function checkDocumentSize(path,document){
 const estimatedBytes=estimateDocumentSize(path,document);
 if(estimatedBytes>DOCUMENT_LIMIT)throw new ConnectError('document-size');return estimatedBytes;
}
function formJSON(form){
 if(!form||typeof form!=='object'||Array.isArray(form))throw new ConnectError('invalid-document');
 try{return JSON.stringify(form,(_key,value)=>{
  if(['undefined','function','symbol','bigint'].includes(typeof value)||(typeof value==='number'&&!Number.isFinite(value)))throw new ConnectError('invalid-document');return value;
 });}catch{throw new ConnectError('invalid-document');}
}
function validPhoto(photo){
 if(photo===null)return;
 if(!photo||!(photo.bytes instanceof Uint8Array)||photo.bytes.length<3||photo.bytes[0]!==255||photo.bytes[1]!==216||photo.bytes[2]!==255||photo.mime!=='image/jpeg'||!Number.isSafeInteger(photo.width)||!Number.isSafeInteger(photo.height)||photo.width<=0||photo.height<=0)throw new ConnectError('invalid-photo');
}
export async function encodeRecipe(snapshot,{rev,operationId,now=Date.now()}){
 const formJson=formJSON(snapshot?.form);let photo=null;
 if(snapshot.photo){
  const input=snapshot.photo;
  if(!(input.blob instanceof Blob)||input.blob.type!=='image/jpeg')throw new ConnectError('invalid-photo');
  photo={bytes:new Uint8Array(await input.blob.arrayBuffer()),mime:'image/jpeg',width:input.width,height:input.height};
 }
 validPhoto(photo);
 const document={schemaVersion:1,formJson,photo,rev,updatedAtMillis:now,lastOperationId:operationId};
 validateDocument(document);return document;
}
function validateDocument(document){
 if(!document||document.schemaVersion!==1||!Number.isSafeInteger(document.rev)||document.rev<1||!Number.isSafeInteger(document.updatedAtMillis)||typeof document.lastOperationId!=='string'||!document.lastOperationId||typeof document.formJson!=='string')throw new ConnectError('invalid-document');
 const allowed=['schemaVersion','formJson','photo','rev','updatedAtMillis','lastOperationId'];
 if(Object.keys(document).some(key=>!allowed.includes(key)))throw new ConnectError('invalid-document');
 let form;try{form=JSON.parse(document.formJson);}catch{throw new ConnectError('invalid-document');}formJSON(form);validPhoto(document.photo);return form;
}
export function decodeRecipe(uid,recipeId,document){
 const path=recipePath(uid,recipeId),form=validateDocument(document);checkDocumentSize(path,document);
 const photo=document.photo?{blob:new Blob([document.photo.bytes],{type:'image/jpeg'}),width:document.photo.width,height:document.photo.height}:null;
 return {recipeId,rev:document.rev,lastOperationId:document.lastOperationId,snapshot:{form,photo,mode:'edit',targetRecipeId:recipeId,baseRecipeRev:document.rev}};
}
function matching(a,b){return a&&b&&a.uid===b.uid&&a.generation===b.generation;}
export function createRecipeAdapter({auth,driver,now=()=>Date.now(),maxOperationMs=Infinity}){
 function session(uid){const identity=auth.identity();if(!identity||identity.uid!==uid)throw new ConnectError('permission-denied');return identity;}
 function still(identity){if(!matching(identity,auth.identity()))throw new ConnectError('permission-denied');}
 const codeOf=error=>error?.code==='unavailable'?'service-unavailable':['permission-denied','conflict','document-size','invalid-document','invalid-photo','network','unavailable','service-limit','not-applied'].includes(error?.code)?error.code:'unknown';
 return {
  async save(request){
   let submitted=false,committed=false;
   try{
    const deadlineAt=now()+maxOperationMs;request=clone(request);
    const identity=session(request.uid),path=recipePath(request.uid,request.recipeId),snapshot=clone(request.snapshot);
    if(!['new','edit'].includes(request.mode)||snapshot?.mode!==request.mode||snapshot.targetRecipeId!==request.recipeId||typeof request.operationId!=='string'||!request.operationId)throw new ConnectError('invalid-document');
    if(request.mode==='edit'&&(!Number.isSafeInteger(request.baseRev)||request.baseRev<1||request.baseRev!==snapshot.baseRecipeRev))throw new ConnectError('invalid-document');
    const document=await encodeRecipe(snapshot,{rev:request.mode==='new'?1:request.baseRev+1,operationId:request.operationId,now:now()});
    checkDocumentSize(path,document);still(identity);submitted=true;
    await driver.transact({uid:request.uid,recipeId:request.recipeId,identity,deadlineAt},before=>{
     still(identity);
     if(request.mode==='new'?!!before:!before||before.rev!==request.baseRev)throw new ConnectError('conflict');
     return clone(document);
    });
    committed=true;still(identity);return {kind:'confirmed',recipeId:request.recipeId,operationId:request.operationId,rev:document.rev};
   }catch(error){
    const code=codeOf(error);
    if(code==='conflict')return {kind:'conflict',code};
    // A transport failure after submission may have committed: never call it unsaved.
    const rejected=['permission-denied','document-size','invalid-document','invalid-photo','not-applied'].includes(code);
    return {kind:!submitted||(!committed&&rejected)?'not-applied':'unknown',code};
   }
  },
  async load({uid}){
   try{const identity=session(uid);recipePath(uid,'validate-path');const rows=await driver.list({uid,identity});still(identity);
    const data=rows.map(row=>decodeRecipe(uid,row.recipeId,row.document));return {kind:'complete',data};
   }catch(error){return {kind:'error',code:codeOf(error)};}
  },
  async read({uid,recipeId}){
   try{const identity=session(uid);recipePath(uid,recipeId);const document=await driver.read({uid,recipeId,identity});still(identity);return {kind:'complete',data:document?decodeRecipe(uid,recipeId,document):null};}
   catch(error){return {kind:'error',code:codeOf(error)};}
  }
 };
}

// Atomic transactional model only; never evidence of SDK transactions or Rules.
export function createMockRecipeDriver({principal}){
 const documents=new Map(),calls=[];let tail=Promise.resolve();
 const authorize=context=>{if(!matching(context.identity,principal())||context.uid!==context.identity?.uid)throw new ConnectError('permission-denied');};
 const driver={documents,calls,mode:'confirmed',readMode:'complete',
  async list(context){authorize(context);calls.push({kind:'list',uid:context.uid});if(this.readMode!=='complete')throw new ConnectError(this.readMode);
   const prefix=`users/${context.uid}/recipes/`;return [...documents].filter(([path])=>path.startsWith(prefix)).map(([path,document])=>({recipeId:path.slice(prefix.length),document:clone(document)}));
  },
  async read(context){authorize(context);const path=recipePath(context.uid,context.recipeId);calls.push({kind:'read',path});if(this.readMode!=='complete')throw new ConnectError(this.readMode);return clone(documents.get(path)||null);},
  transact(context,update){
   const mode=this.mode;
   if(mode==='hang'){authorize(context);calls.push({kind:'write',path:recipePath(context.uid,context.recipeId)});return new Promise(()=>{});}
   const perform=async()=>{
    authorize(context);const path=recipePath(context.uid,context.recipeId);calls.push({kind:'write',path});
    if(['permission-denied','network','unavailable','not-applied','conflict'].includes(mode))throw new ConnectError(mode);
    if(mode==='unknown')throw new ConnectError('unknown');
    const next=update(clone(documents.get(path)||null));validateDocument(next);checkDocumentSize(path,next);
    if(mode==='fail-before-commit')throw new ConnectError('not-applied');
    authorize(context);documents.set(path,clone(next));
    if(mode==='unknown-applied')throw new ConnectError('unknown');
   };
   const result=tail.then(perform);tail=result.catch(()=>{});return result;
  }
 };return driver;
}
