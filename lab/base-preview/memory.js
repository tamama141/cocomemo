// Volatile adapter. Identifier substitution is performed BEFORE any original code executes.
// Never shadows/reads browser Storage: the shipped original-core references only this Map.
const demoMemory=(()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})();
demoMemory.setItem('coco-recipes-v1',JSON.stringify(fixtures()));
demoMemory.setItem('pantrymo-inventory-v1',JSON.stringify([
{id:'p1',name:'かぼちゃ',qty:'1/4',unit:'個',category:'野菜',frozen:false,addedAt:1792800000000,manualOrder:1},
{id:'p2',name:'鶏もも肉',qty:'2',unit:'枚',category:'肉・魚',frozen:true,addedAt:1792886400000,manualOrder:2}
]));
