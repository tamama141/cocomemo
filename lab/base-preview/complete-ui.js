/* Product-candidate UI changes. No credentials or network initialization. */
const CompleteUI=(()=>{
'use strict';
const prev={showSettings,renderHome,renderFavorites};
function shortDates(root){root.querySelectorAll('.recipe-card-meta .date').forEach(e=>{const m=e.textContent.match(/\d{4}-\d{2}-\d{2}/);if(m){e.title=e.textContent;e.textContent=m[0]}})}
window.renderHome=function(){prev.renderHome();shortDates($('cards'));};window.renderFavorites=function(){prev.renderFavorites();shortDates($('favoriteCards'));};
window.showSettings=function(){prev.showSettings();for(const id of ['categorySettings','p8FixedSettings']){const summary=$(id)?.querySelector('summary');if(summary)summary.textContent=summary.textContent.replace('食材カテゴリ','アイテムカテゴリ')}const description=$('categorySettings')?.querySelector('p');if(description)description.textContent=description.textContent.replaceAll('食材カテゴリ','アイテムカテゴリ');};
for(const id of ['l_foods','l_wish']){const input=$(id),button=input?.parentElement.querySelector('button');if(button){button.textContent='クリア';button.classList.add('complete-clear');input.parentElement.classList.add('complete-clear-field')}}
for(const id of ['l_copy','l_formatCopy','l_importRecipe'])$(id)?.classList.add('complete-primary');
for(const b of document.querySelectorAll('#labPage button')){if(/^(依頼文をコピー|指示文をコピー|レシピを解析|レシピを取り込む)$/.test(b.textContent.trim())){b.classList.add('complete-primary');if(b.textContent.trim()==='レシピを解析')b.textContent='レシピを取り込む'}}
// A real pointer handle preserves drag resizing where mobile CSS resize is unavailable.
for(const id of ['raw','l_recipePaste']){const input=$(id);if(!input)continue;const grip=document.createElement('button');grip.type='button';grip.className='complete-resize';grip.textContent='↕';grip.setAttribute('aria-label','入力欄の高さを変える');input.after(grip);const resize=h=>input.style.setProperty('height',Math.max(100,Math.min(1600,h))+'px','important');grip.onpointerdown=e=>{e.preventDefault();const start=e.clientY,height=input.getBoundingClientRect().height;grip.setPointerCapture(e.pointerId);grip.onpointermove=e=>resize(height+e.clientY-start);grip.onpointerup=grip.onpointercancel=()=>grip.onpointermove=null};grip.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();resize(input.getBoundingClientRect().height+(e.key==='ArrowDown'?30:-30))}};}
for(const input of document.querySelectorAll('#loginPage input'))input.disabled=true;
renderHome();
return {shortDates};
})();
