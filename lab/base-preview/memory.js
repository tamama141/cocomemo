// Volatile adapter. Identifier substitution is performed BEFORE any original code executes.
// Never shadows/reads browser Storage: the shipped original-core references only this Map.
const demoMemory=(()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})();
demoMemory.setItem('coco-recipes-v1',JSON.stringify(fixtures()));
demoMemory.setItem('pantrymo-inventory-v1','[]');
demoMemory.setItem('pantrymo-shopping-v1','[]');
