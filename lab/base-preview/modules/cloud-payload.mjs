// Adopted UTF-8 field budgets, distinct from Firestore document/request size.
export const FORM_BYTE_LIMIT=65536,PHOTO_BYTE_LIMIT=524288,JSON_BYTE_BUDGET=983040,SAFE_INTEGER_MAX=9007199254740991;
const bytes=value=>typeof value==='string'?new TextEncoder().encode(value).length:-1;
const positive=value=>Number.isSafeInteger(value)&&value>0;
function reject(){throw Object.assign(Error('document-size'),{code:'document-size'});}
export function checkCloudPayload(collection,d){
 if(!d||d.schemaVersion!==1||!positive(d.rev))reject();
 const operation=collection==='recipes'?d.lastOperationId:d.operationId;
 if(bytes(operation)<1||bytes(operation)>1500)reject();
 if(collection==='recipes'){
  if(bytes(d.formJson)<1||bytes(d.formJson)>FORM_BYTE_LIMIT||!Number.isSafeInteger(d.updatedAtMillis)||d.updatedAtMillis<0)reject();
  if(d.photo!==null){const p=d.photo;if(!p||!(p.bytes instanceof Uint8Array)||p.bytes.length<1||p.bytes.length>PHOTO_BYTE_LIMIT||p.mime!=='image/jpeg'||!positive(p.width)||!positive(p.height))reject();}
 }else if(collection==='stock'||collection==='wish'){if(bytes(d.json)<1||bytes(d.json)>JSON_BYTE_BUDGET)reject();}
 else if(collection==='product'){if(bytes(d.metadataJson)<1||bytes(d.metadataJson)>JSON_BYTE_BUDGET||typeof d.snapshotHash!=='string'||d.snapshotHash.length!==64)reject();}
 else reject();
 return d;
}
