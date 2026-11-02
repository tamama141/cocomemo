/* Runtime dependencies: none. All repositories and drafts are volatile. */
const clone = value => JSON.parse(JSON.stringify(value));
const DEFAULT_LABELS = ['主菜','副菜','汁物','ごはん','スイーツ','時短','作り置き','お弁当','調理家電'];
const DEFAULT_LABEL_ICONS = {'主菜':'🍳','副菜':'🥗','汁物':'🍲','ごはん':'🍚','スイーツ':'🍰','時短':'⏱️','作り置き':'🥡','お弁当':'🍱','調理家電':'🧑‍🍳'};
const demoDate = () => new Date().toLocaleDateString('sv-SE');
// Canonical demo records keep the original field names and value types.
function legacyRecord(input){return {...clone(input),labels:[...(input.labels||[])],mainLabel:input.mainLabel||''};}
function formValue(recipe,key){return Array.isArray(recipe[key])?recipe[key].join('\n'):recipe[key]||'';}
function assignFormValue(recipe,key,value){recipe[key]=['tools','tips'].includes(key)?value.split('\n'):value;}
let sequence = 100;
function blankRecipe(){return {id:null,title:'',desc:'',time:'',tools:[],servings:1,servingsLabel:'2人分',ingredients:[],steps:[],tips:[],memo:'',memoDate:'',created:'',updated:'',raw:'',unparsed:[],photo:'',labels:[],mainLabel:'',favorite:false,bookmark:false};}
function fixtures(){return [
 ['かぼちゃのほくほくスープ','やさしい甘さを楽しむ、架空のレシピです。','20分','汁物',true,true,[['かぼちゃ','250g'],['玉ねぎ','1/2個'],['牛乳','200ml'],['塩','少々']]],
 ['鶏肉ときのこのフライパン蒸し','忙しい日の夕ごはんに。架空の確認用データです。','25分','主菜',true,true,[['鶏もも肉','1枚'],['しめじ','100g'],['酒','大さじ2'],['こしょう','適量']]],
 ['小松菜のごま和え','あと一品にうれしい、香ばしい副菜。','10分','副菜',false,true,[['小松菜','1束'],['すりごま','大さじ1'],['しょうゆ','小さじ2']]],
 ['りんごの小さなパンケーキ','おやつの時間に作る、架空のレシピ。','15分','スイーツ',true,false,[['りんご','1/2個'],['薄力粉','100g'],['卵','1個']]],
 ['トマトと豆のさっぱりサラダ','火を使わず、さっと混ぜるだけ。','5分','時短',false,false,[['トマト','2個'],['豆','100g'],['オリーブ油','大さじ1']]]
 ].map((x,i)=>({...blankRecipe(),id:'r'+i,title:x[0],desc:x[1],time:x[2],labels:i<2?[x[3],'時短']:[x[3]],mainLabel:x[3],favorite:x[4],bookmark:x[5],ingredients:clone(x[6]),tools:['包丁','まな板','鍋'],steps:['材料を食べやすい大きさに切ります。','器具に材料を入れ、様子を見ながら調理します。','味を調えて、器に盛り付けます。'],tips:['食材の状態に合わせて加熱時間を調整してください。','これは操作確認用の架空レシピです。'],memo:i===0?'次回も温かいうちに。架空のメモです。':'',memoDate:i===0?'2026-10-24':'',created:'2026-10-'+String(25-i).padStart(2,'0'),updated:'2026-10-'+String(26-i).padStart(2,'0'),raw:`料理名：${x[0]}\n紹介文：${x[1]}\n調理時間：${x[2]}\n材料（2人分）：\n${x[6].map(y=>'・'+y[0]+'：'+y[1]).join('\n')}\n手順：\n1. 材料を準備します。\n2. 調理して盛り付けます。`}));}
