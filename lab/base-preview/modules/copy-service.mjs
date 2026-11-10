import {digest} from './restore-copy.mjs';
const clone=x=>structuredClone(x);
export async function copyRecords({source,target,sourceBook,targetBook,selection,commit,loadTarget}){
 if(sourceBook===targetBook)throw Error('same-book');let current=clone(target);const results=[];
 for(const {field,id}of selection){const record=source[field]?.find(r=>r.id===id);if(!record){results.push({field,id,kind:'missing'});continue;}const key=await digest({sourceBook,targetBook,field,id,version:await digest(record)});if(current.productMeta?.copyMarkers?.[key]){results.push({field,id,kind:'already-copied',targetId:current.productMeta.copyMarkers[key]});continue;}
 const next=clone(current),targetId=crypto.randomUUID(),copied={...clone(record),id:targetId};next[field]??=[];
 if(field==='recipes'){next.labels??=[];next.labelIcons??={};for(const label of record.labels||[])if(!next.labels.includes(label)){next.labels.push(label);next.labelIcons[label]=source.labelIcons?.[label]||'🏷️';}}
 if(field!=='recipes'){const sourceCat=source.productMeta?.pantry?.categories?.find(c=>c.id===record.categoryId),cats=next.productMeta?.pantry?.categories;if(sourceCat&&cats){let match=cats.find(c=>c.name===sourceCat.name);if(!match){match={...clone(sourceCat),id:'copy-'+crypto.randomUUID(),protected:false};cats.push(match);next.pantryCategories=cats.map(c=>c.name);}copied.categoryId=match.id;copied.category=match.name;}}
 next[field].push(copied);next.productMeta??={};next.productMeta.copyMarkers={...(next.productMeta.copyMarkers||{}),[key]:targetId};
 try{const result=await commit(next);if(result?.kind==='unknown'){results.push({field,id,kind:'unknown'});break;}current=next;results.push({field,id,kind:'copied',targetId});}catch(e){results.push({field,id,kind:e.code==='conflict'?'conflict':'failed',code:e.code||e.message});if(e.code==='conflict')current=await loadTarget();else break;}
 }
 return {snapshot:current,results};
}
export function copyCandidates(source,target,selection){return selection.map(({field,id})=>{const record=source[field]?.find(x=>x.id===id),name=record?.title??record?.name??'';return {field,id,name,sameName:(target[field]||[]).filter(x=>(x.title??x.name)===name).map(x=>x.id)};});}
