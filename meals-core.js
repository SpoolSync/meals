/* Meals: the logic with no screen code, so it can be tested on its own. */
(function(root){
"use strict";
var AISLES=["Produce","Meat & fish","Dairy & eggs","Bakery","Pantry","Spices & sauces","Frozen","Drinks","Household","Other"];
var SLOTS=["breakfast","lunch","dinner","snack"];
var UNITS={tsp:"tsp",teaspoon:"tsp",teaspoons:"tsp",tbsp:"tbsp",tablespoon:"tbsp",tablespoons:"tbsp",cup:"cup",cups:"cup",
  g:"g",gram:"g",grams:"g",kg:"kg",ml:"ml",l:"l",litre:"l",liter:"l",litres:"l",liters:"l",oz:"oz",lb:"lb",lbs:"lb",pound:"lb",pounds:"lb",
  can:"can",cans:"can",tin:"can",tins:"can",clove:"clove",cloves:"clove",pinch:"pinch",bunch:"bunch",bunches:"bunch",pack:"pack",packs:"pack",packet:"pack",
  slice:"slice",slices:"slice",piece:"piece",pieces:"piece",pc:"piece",pcs:"piece",dozen:"dozen",bag:"bag",bags:"bag",bottle:"bottle",jar:"jar",head:"head",stalk:"stalk",stalks:"stalk"};
var GUESS=[
  ["Spices & sauces",/salt|pepper ?corn|black pepper|cumin|turmeric|garam masala|masala|chilli powder|chili powder|paprika|cinnamon|cardamom|clove(?!s? of garlic)|oregano|basil|thyme|spice|sauce|ketchup|mustard|mayo|vinegar|soy|bay lea/],
  ["Produce",/onion|garlic|ginger|tomato|potato|carrot|spinach|lettuce|pepper(?!corn)|capsicum|chilli|chili(?! powder)|cilantro|coriander leaves|parsley|mint|lemon|lime|apple|banana|berr|avocado|cucumber|broccoli|cauliflower|cabbage|mushroom|zucchini|eggplant|okra|beans? \(green\)|green beans|(?<!chick)peas|corn(?!flour|starch)|kale|celery|scallion|green onion|fruit|orange|mango|grape|herb/],
  ["Meat & fish",/chicken|beef|pork|lamb|mutton|turkey|fish|salmon|tuna(?! can)|shrimp|prawn|bacon|sausage|mince|ground/],
  ["Dairy & eggs",/milk(?! \(coconut\))|egg(?!plant)|butter|cheese|parmesan|feta|mozzarella|cheddar|paneer|yogurt|yoghurt|curd|cream|ghee/],
  ["Bakery",/bread|bun|tortilla|wrap|naan|roti|pita|bagel/],
  ["Frozen",/frozen|ice cream/],
  ["Drinks",/juice|coffee|tea|soda|water/],
  ["Household",/foil|paper towel|soap|detergent|wrap \(plastic\)|bags?$/],
  ["Pantry",/rice|pasta|noodle|flour|sugar|oil|oats|lentil|dal|chickpea|chana|bean|stock|broth|can|honey|peanut|nut|almond|seed|cereal|quinoa|tomato paste|coconut milk|baking/]
];
function guessAisle(item){var s=String(item||"").toLowerCase();for(var i=0;i<GUESS.length;i++)if(GUESS[i][1].test(s))return GUESS[i][0];return "Other";}
function num(t){
  t=String(t).trim();var m;
  if((m=t.match(/^(\d+)\s+(\d+)\/(\d+)$/)))return +m[1]+ +m[2]/+m[3];
  if((m=t.match(/^(\d+)\/(\d+)$/)))return +m[1]/+m[2];
  var u={"½":.5,"¼":.25,"¾":.75,"⅓":1/3,"⅔":2/3};
  if((m=t.match(/^(\d*)([½¼¾⅓⅔])$/)))return (m[1]?+m[1]:0)+u[m[2]];
  var v=parseFloat(t);return isFinite(v)?v:null;
}
/* "1 1/2 cups basmati rice" -> {q:1.5,u:"cup",item:"basmati rice",aisle:"Pantry"} */
function parseLine(line){
  var s=String(line||"").replace(/^[-•*\s]+/,"").trim();if(!s)return null;
  var m=s.match(/^((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d*[½¼¾⅓⅔])|(?:\d+(?:\.\d+)?))\s*(.*)$/),q=null,rest=s;
  if(m){q=num(m[1]);rest=m[2];}
  var w=rest.match(/^([A-Za-z]+)\.?\s+(.*)$/),u="";
  if(q!=null&&w&&UNITS[w[1].toLowerCase()]){u=UNITS[w[1].toLowerCase()];rest=w[2];}
  else if(q!=null&&(m=rest.match(/^(g|kg|ml|l|oz|lb)\b\.?\s*(.*)$/i))){u=UNITS[m[1].toLowerCase()];rest=m[2];}
  rest=rest.replace(/^of\s+/i,"").trim();
  if(!rest)return null;
  return {q:q,u:u,item:rest.slice(0,80),aisle:u==="can"||u==="jar"?"Pantry":guessAisle(rest)};
}
function fmtQ(q){if(q==null)return "";var r=Math.round(q*100)/100;var f={0.25:"¼",0.5:"½",0.75:"¾",0.33:"⅓",0.67:"⅔"},w=Math.floor(r),d=Math.round((r-w)*100)/100;
  if(f[d])return (w?w:"")+f[d];return String(r);}
var PL={cup:"cups",can:"cans",clove:"cloves",bunch:"bunches",pack:"packs",slice:"slices",piece:"pieces",bag:"bags",bottle:"bottles",jar:"jars",head:"heads",stalk:"stalks"};
/* "2 cup" -> "2 cups", "l" -> "L" for display. */
function unitText(q,u){if(!u)return "";if(u==="l")return "L";return q!=null&&q>1&&PL[u]?PL[u]:u;}
function qtyText(q,u){return [fmtQ(q),unitText(q,u)].filter(Boolean).join(" ");}
function lineText(i){return [qtyText(i.q,i.u),i.item].filter(Boolean).join(" ");}
/* Words in an item that don't change what you buy. "2 large onions, chopped" -> "onion" */
function key(item){
  var s=String(item||"").toLowerCase().replace(/\(.*?\)/g,"").split(",")[0]
    .replace(/\b(fresh|large|small|medium|chopped|diced|minced|sliced|grated|finely|roughly|boneless|skinless|ripe|optional|to taste|whole)\b/g,"")
    .replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
  return s.replace(/(oes|ies|s)$/,function(x){return x==="ies"?"y":x==="oes"?"o":"";});
}
function z(n){return String(n).padStart(2,"0");}
function iso(d){return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());}
function addDays(s,n){var p=s.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()+n);return iso(d);}
function weekStart(s,startDay){var p=s.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]),off=(d.getDay()-(startDay==null?1:startDay)+7)%7;d.setDate(d.getDate()-off);return iso(d);}
/* The grocery list for a run of days: every planned recipe, scaled to its servings, merged by item and unit,
   minus pantry staples. Returns {aisles:[[name,[rows]]], staples:[rows]}. Row: {k,item,q,u,aisle,from:[recipe names]} */
function groceries(state,from,days){
  var byId={},rows={},order=[],staples={};
  (state.staples||[]).forEach(function(s){staples[key(s)]=1;});
  (state.recipes||[]).forEach(function(r){byId[r.id]=r;});
  for(var i=0;i<days;i++){
    (state.plan[addDays(from,i)]||[]).forEach(function(m){
      var r=m.rid&&byId[m.rid];if(!r)return;
      var f=(+m.serves||r.serves||1)/(r.serves||1);
      (r.ing||[]).forEach(function(g){
        var k=key(g.item)+"|"+(g.u||"");if(!key(g.item))return;
        if(!rows[k]){rows[k]={k:k,item:g.item,q:g.q==null?null:0,u:g.u||"",aisle:g.aisle||guessAisle(g.item),from:[]};order.push(k);}
        var row=rows[k];
        if(g.q!=null&&row.q!=null)row.q+=g.q*f;else row.q=null;
        if(row.from.indexOf(r.name)<0)row.from.push(r.name);
      });
    });
  }
  var groups={},st=[];
  order.forEach(function(k){var r=rows[k];if(staples[key(r.item)]){st.push(r);return;}(groups[r.aisle]=groups[r.aisle]||[]).push(r);});
  (state.extras||[]).forEach(function(x){var r={k:"x|"+x.id,item:x.item,q:x.q,u:x.u||"",aisle:x.aisle||guessAisle(x.item),from:[],extra:x.id};(groups[r.aisle]=groups[r.aisle]||[]).push(r);});
  var aisles=AISLES.filter(function(a){return groups[a];}).map(function(a){return [a,groups[a].sort(function(x,y){return x.item.localeCompare(y.item);})];});
  return {aisles:aisles,staples:st};
}
function clean(s){
  s=s&&typeof s==="object"?s:{};
  var out={ts:+s.ts||0,recipes:[],plan:{},checked:{},extras:[],staples:[],startDay:s.startDay===0?0:1,listDays:[3,7,14].indexOf(+s.listDays)>=0?+s.listDays:7,seeded:!!s.seeded};
  function str(v,n){return String(v==null?"":v).slice(0,n);}
  (Array.isArray(s.recipes)?s.recipes:[]).slice(0,1000).forEach(function(r){
    if(!r||!r.id)return;
    out.recipes.push({id:str(r.id,24),name:str(r.name,80)||"Recipe",serves:Math.min(50,Math.max(1,+r.serves||2)),tags:(Array.isArray(r.tags)?r.tags:[]).slice(0,8).map(function(t){return str(t,24);}),
      ing:(Array.isArray(r.ing)?r.ing:[]).slice(0,60).map(function(g){return {q:g&&g.q!=null&&isFinite(+g.q)?+g.q:null,u:str(g&&g.u,10),item:str(g&&g.item,80),aisle:AISLES.indexOf(g&&g.aisle)>=0?g.aisle:guessAisle(g&&g.item)};}).filter(function(g){return g.item;}),
      steps:str(r.steps,6000),fav:!!r.fav,made:+r.made||0});
  });
  if(s.plan&&typeof s.plan==="object")Object.keys(s.plan).forEach(function(d){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Array.isArray(s.plan[d]))return;
    var list=s.plan[d].slice(0,20).map(function(m){return {id:str(m.id,24),slot:SLOTS.indexOf(m.slot)>=0?m.slot:"dinner",rid:m.rid?str(m.rid,24):null,text:str(m.text,80),serves:Math.min(50,Math.max(1,+m.serves||1))};}).filter(function(m){return m.rid||m.text;});
    if(list.length)out.plan[d]=list;
  });
  if(s.checked&&typeof s.checked==="object")Object.keys(s.checked).slice(0,2000).forEach(function(k){if(s.checked[k])out.checked[str(k,120)]=1;});
  (Array.isArray(s.extras)?s.extras:[]).slice(0,300).forEach(function(x){if(x&&x.item)out.extras.push({id:str(x.id,24),item:str(x.item,80),q:x.q!=null&&isFinite(+x.q)?+x.q:null,u:str(x.u,10),aisle:AISLES.indexOf(x.aisle)>=0?x.aisle:guessAisle(x.item)});});
  out.staples=(Array.isArray(s.staples)?s.staples:["salt","black pepper","cooking oil"]).slice(0,100).map(function(x){return str(x,40);}).filter(Boolean);
  return out;
}
var api={qtyText:qtyText,AISLES:AISLES,SLOTS:SLOTS,parseLine:parseLine,lineText:lineText,fmtQ:fmtQ,key:key,guessAisle:guessAisle,groceries:groceries,clean:clean,addDays:addDays,weekStart:weekStart,iso:iso};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.MealsCore=api;
})(typeof self!=="undefined"?self:this);
