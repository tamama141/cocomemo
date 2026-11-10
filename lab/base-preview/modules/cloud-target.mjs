// Only these roots are supported. No URL, UI, or arbitrary-path override.
export const PRODUCT_ROOT='users';
export const TRIAL_ROOT='sysTrials/SYS-COMPLETE-20261111/users';
export function resolveCloudTarget(config={}){
 const mode=config.cloudMode??'product',databaseId=config.databaseId??'(default)';
 if(databaseId!=='(default)')throw Error('cloud-database-unverified');
 if(mode==='product'&&(config.cloudRoot===undefined||config.cloudRoot===PRODUCT_ROOT))return Object.freeze({mode,root:PRODUCT_ROOT,databaseId});
 if(mode==='sys-trial'&&config.cloudRoot===TRIAL_ROOT&&config.databaseId==='(default)')return Object.freeze({mode,root:TRIAL_ROOT,databaseId});
 throw Error('cloud-root-unverified');
}
export function validateTarget(target){return resolveCloudTarget({cloudMode:target?.mode,cloudRoot:target?.root,databaseId:target?.databaseId});}
function segment(value){if(typeof value!=='string'||!value||value==='.'||value==='..'||value.includes('/')||/^__.*__$/.test(value)||/[\u0000-\u001f\u007f]/.test(value)||new TextEncoder().encode(value).length>1500)throw Error('cloud-path-invalid');return value;}
export function cloudCollectionPath(target,uid,collection){const checked=validateTarget(target);if(!['recipes','stock','wish','product'].includes(collection))throw Error('cloud-collection-invalid');return checked.root+'/'+segment(uid)+'/'+collection;}
export function cloudDocumentPath(target,uid,collection,id){if(collection==='product'&&id!=='state')throw Error('cloud-document-invalid');return cloudCollectionPath(target,uid,collection)+'/'+segment(id);}
// Keep existing normal scope bytes unchanged. Trial adds a fixed root suffix.
export function cloudEnvironment(projectId,legacyDatabaseId,target){const checked=validateTarget(target),base=projectId+':'+(legacyDatabaseId||'default');return checked.mode==='product'?base:base+':root='+checked.root;}
export function cloudJournalScope(projectId,legacyDatabaseId,uid,target){return cloudEnvironment(projectId,legacyDatabaseId,target)+':'+segment(uid);}
export function cloudCopyBook(projectId,uid,target){const checked=validateTarget(target),base='cloud:'+projectId+':'+segment(uid);return checked.mode==='product'?base:base+':database='+checked.databaseId+':root='+checked.root;}
export function cloudBackupTag(projectId,target){const checked=validateTarget(target);return checked.mode==='sys-trial'?{mode:checked.mode,root:checked.root,databaseId:checked.databaseId,projectId}:undefined;}
export function assertBackupTarget(backup,projectId,target){const checked=validateTarget(target),tag=backup?.backupScope;if(tag!==undefined&&(!tag||tag.mode!=='sys-trial'||checked.mode!=='sys-trial'||tag.root!==checked.root||tag.databaseId!==checked.databaseId||tag.projectId!==projectId))throw Error('backup-scope-mismatch');return backup;}
