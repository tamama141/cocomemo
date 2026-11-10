const Lab=(()=>{let templateEditing=false;
const standard='以下の食材や希望に沿って、おいしくて家庭で作りやすい料理のレシピを提案してください。';
let templates=[{id:0,name:'標準テンプレート',body:standard,standard:true},{id:1,name:'時短レシピ用',body:'以下の食材や希望に沿って、20分以内で作れるおいしい家庭料理を提案してください。'},{id:2,name:'作り置き用',body:'以下の食材や希望に沿って、作り置きしやすい料理のレシピを提案してください。'},{id:3,name:'お弁当用',body:'以下の食材や希望に沿って、お弁当に入れやすい料理を提案してください。'}];let dialogTemplateId=null;let selected=0,editing=null,nextId=4;
const el=id=>document.getElementById('l_'+id);function showDemoPage(page){const isLab=page==='lab';el('demoPage').classList.toggle('hidden',isLab);el('lab').classList.toggle('hidden',!isLab);el('editor').classList.add('hidden');if(!isLab)el('demoPageTitle').textContent=page==='list'?'📚 レシピリスト（画面移動デモ）':'🍀 マイセレクト（画面移動デモ）';document.querySelectorAll('.nav button').forEach((b,i)=>b.classList.toggle('on',i===(page==='list'?0:page==='select'?1:2)));window.scrollTo(0,0)}function switchTab(t){if(t==='save'){startNew();return;}el('saveView').classList.toggle('hidden',t!=='save');el('thinkView').classList.toggle('hidden',t!=='think');el('saveTab').classList.toggle('on',t==='save');el('thinkTab').classList.toggle('on',t==='think');el('saveTab').setAttribute('aria-selected',String(t==='save'));el('thinkTab').setAttribute('aria-selected',String(t==='think'))}
function makeRow(t,manage){const row=document.createElement('div');row.className='item';if(!manage){const radio=document.createElement('input');radio.type='radio';radio.className='radio';radio.name='template';radio.checked=selected===t.id;radio.setAttribute('aria-label',t.name+'を選択');radio.onchange=()=>{selected=t.id;render()};row.append(radio)}const name=document.createElement('button');name.className='name';name.textContent=t.name;if(t.standard){const tag=document.createElement('span');tag.className='tag';tag.textContent='標準';name.append(tag)}name.onclick=()=>showDialog(t,manage);row.append(name);const dots=document.createElement('button');dots.className='dots';dots.textContent='⋮';dots.setAttribute('aria-label',t.name+'の操作');dots.onclick=(event)=>openMenu(t,event);row.append(dots);return row}
function render(){for(const [id,manage] of [['labList',false]]){const list=el(id);list.replaceChildren(...templates.map(t=>makeRow(t,manage)))}updateValid()}
function clearField(id){el(id).value="";updateValid();el(id).focus()}
function updateValid(){el('count').hidden=!el('attach').checked;el('count').textContent='現在の食材：'+pantryItems().length+'件';const valid=!!(el('foods').value.trim()||el('wish').value.trim()||(el('attach').checked&&pantryItems().length>0));el('copy').disabled=!valid;el('inputWarning').hidden=valid}
function getLatestPantrySample(){/* Copy-time fictional memory only; real device-copy/sync is unconnected. */return pantryTextNow()}
function compose(t,pantryText=pantryTextNow()){const parts=[t.body];const food=el('foods').value.trim(),wish=el('wish').value.trim();if(food)parts.push('【使いたい食材】\n'+food);if(wish)parts.push('【希望】\n'+wish);if(el('attach').checked&&pantryItems().length>0)parts.push(pantryText);return parts.join('\n\n')}
function showDialog(t,manage){dialogTemplateId=t.id;el('dialogTitle').textContent=t.name;el('dialogText').textContent=manage?t.body:compose(t);el('dialogSelect').textContent=selected===t.id?'選択中':'選択';el('dialogSelect').disabled=selected===t.id;el('overlay').classList.remove('hidden')}
function selectFromDialog(){if(dialogTemplateId===null)return;selected=dialogTemplateId;hideDialog();render()}
function hideDialog(){el('overlay').classList.add('hidden')}function closeDialog(e){if(e.target===el('overlay'))hideDialog()}
function openMenu(t,event){
 const menu=el('menu'),box=el('menuBox');box.replaceChildren();
 const options=t.standard?[['複製',()=>openEditor(t,'copy')]]:[['編集',()=>openEditor(t,'edit')],['複製',()=>openEditor(t,'copy')],['削除',async()=>{if(await UI.ask('依頼文を削除','『'+t.name+'』を削除しますか？\nこの操作は取り消せません。','削除する')){const before=structuredClone(templates),old=selected;templates=templates.filter(x=>x.id!==t.id);if(selected===t.id)selected=0;if(!persist()){templates=before;selected=old;return;}render()}}]];
 for(const [label,action] of options){const b=document.createElement('button');b.textContent=label;b.setAttribute('role','menuitem');b.onclick=()=>{closeMenu();action()};box.append(b)}
 const rect=event.currentTarget.getBoundingClientRect();menu.style.top=Math.min(rect.bottom+3,window.innerHeight-(options.length*40+14))+'px';menu.style.left=Math.max(8,Math.min(rect.right-125,window.innerWidth-135))+'px';menu.classList.remove('hidden');
}
function closeMenu(){el('menu').classList.add('hidden')}
function showLab(){templateEditing=false;el('editor').classList.add('hidden');el('lab').classList.remove('hidden');render();scrollTo(0,0)}
function openEditor(t,mode){editing=mode==='edit'?t.id:null;el('editName').value=t?(mode==='copy'?t.name+'（コピー）':t.name):'';el('editBody').value=t?t.body:'';el('editorTitle').textContent=mode==='edit'?'依頼文を編集':'依頼文を追加';el('lab').classList.add('hidden');el('editor').classList.remove('hidden');templateEditing=true;UI.syncClears();scrollTo(0,0)}
function saveEditor(){const before=structuredClone({templates,selected,nextId});const name=el('editName').value.trim(),body=el('editBody').value.trim();if(!name||!body){appAlert('依頼文の名前と本文を入力してください。');return}if(editing!==null){const t=templates.find(x=>x.id===editing);if(t&&!t.standard){t.name=name;t.body=body}}else templates.push({id:nextId++,name,body});if(!persist()){templates=before.templates;selected=before.selected;nextId=before.nextId;return;}showLab()}
function clearPaste(){el('recipePaste').value=''}
function importRecipe(){importLabRecipe(el('recipePaste').value)}
async function copyTextSafely(value){
  // HTTPS / localhost では標準 Clipboard API を優先する。
  if(navigator.clipboard && typeof navigator.clipboard.writeText==='function'){
    try{await navigator.clipboard.writeText(value);return true}catch(error){}
  }
  // ローカルファイル等で標準APIが使えない場合のフォールバック。
  const temporary=document.createElement('textarea');
  temporary.value=value;
  temporary.setAttribute('readonly','');
  temporary.style.position='fixed';
  temporary.style.left='-9999px';
  temporary.style.top='0';
  temporary.style.opacity='0';
  document.body.appendChild(temporary);
  const selection=document.getSelection();
  const oldRanges=[];
  if(selection)for(let i=0;i<selection.rangeCount;i++)oldRanges.push(selection.getRangeAt(i));
  const active=document.activeElement;
  temporary.focus();temporary.select();temporary.setSelectionRange(0,temporary.value.length);
  let ok=false;
  try{ok=document.execCommand('copy')}catch(error){ok=false}
  temporary.remove();
  if(selection){selection.removeAllRanges();for(const range of oldRanges)selection.addRange(range)}
  if(active&&typeof active.focus==='function')active.focus({preventScroll:true});
  return ok;
}
async function copyFormatPrompt(){const ok=await copyTextSafely(el('formatPrompt').textContent);showToast(ok?'コピーしました':'コピーできませんでした')}
async function copyPrompt(){if(el('copy').disabled)return;if(el('attach').checked&&!await UI.ask('ストックを添付しますか？','現在の端末内ストックを依頼文に含めます。','添付する','取消'))return;const t=templates.find(x=>x.id===selected)||templates[0];const content=compose(t,getLatestPantrySample());const ok=await copyTextSafely(content);showToast(ok?'コピーしました':'コピーできませんでした')}
let toastTimer;function showToast(message){const t=el('toast');t.textContent=message;t.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add('hidden'),2000)}
document.addEventListener('pointerdown',e=>{if(!el('menu').classList.contains('hidden')&&!el('menu').contains(e.target)&&!e.target.closest('.dots'))closeMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();hideDialog()}});el('foods').addEventListener('input',updateValid);el('wish').addEventListener('input',updateValid);render();

return {snapshotTemplates:()=>({templates:structuredClone(templates),nextId}),loadTemplates:value=>{templates=structuredClone(value.templates);selected=templates.some(t=>t.id===selected)?selected:0;nextId=value.nextId;render();},switchTab,clearField,updateValid,openEditor,showLab,saveEditor,clearPaste,importRecipe,copyPrompt,copyFormatPrompt,closeDialog,hideDialog,selectFromDialog,isEditing:()=>templateEditing,refresh:render};})();
