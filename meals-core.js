/* Meals: the logic with no screen code, so it can be tested on its own. */
(function(root){
"use strict";
var AISLES=["Produce","Chicken & fish","Dairy & eggs","Bakery","Pantry","Spices & sauces","Frozen","Drinks","Household","Other"];
var SLOTS=["breakfast","lunch","dinner","snack"];
var UNITS={tsp:"tsp",teaspoon:"tsp",teaspoons:"tsp",tbsp:"tbsp",tablespoon:"tbsp",tablespoons:"tbsp",cup:"cup",cups:"cup",
  g:"g",gram:"g",grams:"g",kg:"kg",ml:"ml",l:"l",litre:"l",liter:"l",litres:"l",liters:"l",oz:"oz",lb:"lb",lbs:"lb",pound:"lb",pounds:"lb",
  can:"can",cans:"can",tin:"can",tins:"can",clove:"clove",cloves:"clove",pinch:"pinch",bunch:"bunch",bunches:"bunch",pack:"pack",packs:"pack",packet:"pack",
  slice:"slice",slices:"slice",piece:"piece",pieces:"piece",pc:"piece",pcs:"piece",dozen:"dozen",bag:"bag",bags:"bag",bottle:"bottle",jar:"jar",head:"head",stalk:"stalk",stalks:"stalk"};
var GUESS=[
  ["Spices & sauces",/salt|pepper ?corn|black pepper|cumin|turmeric|garam masala|masala|chilli powder|chili powder|paprika|cinnamon|cardamom|clove(?!s? of garlic)|oregano|basil|thyme|spice|sauce|ketchup|mustard|mayo|vinegar|soy|bay lea/],
  ["Produce",/onion|garlic|ginger|tomato|potato|carrot|spinach|lettuce|pepper(?!corn)|capsicum|chilli|chili(?! powder)|cilantro|coriander leaves|parsley|mint|lemon|lime|apple|banana|berr|avocado|cucumber|broccoli|cauliflower|cabbage|mushroom|zucchini|eggplant|okra|beans? \(green\)|green beans|(?<!chick)peas|corn(?!flour|starch)|kale|celery|scallion|green onion|fruit|orange|mango|grape|herb/],
  ["Chicken & fish",/chicken|fish|salmon|tuna(?! can)|shrimp|prawn|tilapia|cod|basa|mince|ground/],
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
  var byId={},rows={},order=[],staples={},have={};
  (state.staples||[]).forEach(function(s){staples[key(s)]=1;});
  (state.pantry||[]).forEach(function(p){have[key(p.item)]=p;});
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
  var groups={},st=[],hv=[];
  order.forEach(function(k){var r=rows[k];if(staples[key(r.item)]){st.push(r);return;}if(have[key(r.item)]){hv.push(r);return;}(groups[r.aisle]=groups[r.aisle]||[]).push(r);});
  (state.extras||[]).forEach(function(x){var r={k:"x|"+x.id,item:x.item,q:x.q,u:x.u||"",aisle:x.aisle||guessAisle(x.item),from:[],extra:x.id};(groups[r.aisle]=groups[r.aisle]||[]).push(r);});
  var aisles=AISLES.filter(function(a){return groups[a];}).map(function(a){return [a,groups[a].sort(function(x,y){return x.item.localeCompare(y.item);})];});
  return {aisles:aisles,staples:st,have:hv};
}
/* Kitchen items running out of time: use by today+days. Sorted soonest first. */
function expiring(state,today,days){
  var lim=addDays(today,days==null?3:days);
  return (state.pantry||[]).filter(function(p){return p.exp&&p.exp<=lim;}).sort(function(a,b){return a.exp.localeCompare(b.exp);});
}
/* Recipes that use any of these items, most matches first. */
function usesUp(state,items){
  var ks=items.map(function(p){return key(p.item);}).filter(Boolean);
  return (state.recipes||[]).map(function(r){var hit=ks.filter(function(k){return (r.ing||[]).some(function(g){var gk=key(g.item);return gk===k||gk.indexOf(k)>=0||k.indexOf(gk)>=0&&gk.length>2;});});return {r:r,hit:hit};})
    .filter(function(x){return x.hit.length;}).sort(function(a,b){return b.hit.length-a.hit.length;});
}
/* A whole recipe pasted from a website or notes: name, servings, ingredients, method. */
function parseRecipe(text){
  var lines=String(text||"").replace(/\r/g,"").split("\n").map(function(l){return l.replace(/^\s*[-•*▢□☐✓]\s*/,"").trim();});
  var out={name:"",serves:null,ing:[],steps:[]},mode="auto",HEAD_I=/^(ingredients?|you('|’)ll need|what you need)\b:?$/i,HEAD_S=/^(method|instructions?|directions?|steps?|preparation)\b:?$/i;
  lines.forEach(function(l){
    if(!l)return;
    var sv=/^(serves|servings?|yield|makes)\s*:?\s*(\d+)/i.exec(l);if(sv){out.serves=+sv[2];return;}
    if(HEAD_I.test(l)){mode="ing";return;}if(HEAD_S.test(l)){mode="steps";return;}
    if(/^(prep|cook|total|active) time|^(nutrition|calories|notes?)\b/i.test(l))return;
    var step=l.replace(/^(step\s*)?\d+[.)]\s+(?=[A-Za-z])/i,"");
    var p=parseLine(l),looksIng=p&&l.length<90&&(p.q!=null||/^(salt|pepper|oil|water)\b/i.test(l))&&!/[.!]\s+[A-Z]/.test(l);
    if(mode==="steps"||(mode!=="ing"&&!looksIng&&out.ing.length&&l.length>40)){out.steps.push(step);mode=mode==="auto"?"steps":mode;return;}
    if(mode==="ing"||looksIng){if(p)out.ing.push(p);return;}
    if(!out.name&&l.length<80){out.name=l;return;}
    out.steps.push(step);
  });
  return {name:out.name,serves:out.serves,ing:out.ing,steps:out.steps.join("\n")};
}
/* Minutes mentioned in a step: "bake 12 to 15 minutes" -> 15, "simmer 1 hour" -> 60. */
function timerIn(step){
  var s=String(step||"").toLowerCase(),m;
  if((m=/(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*(min|minutes|mins|hours?|hrs?)\b/.exec(s)))return Math.round(+m[2]*(/h/.test(m[3])?60:1));
  if((m=/(\d+(?:\.\d+)?)\s*(min|minutes|mins|hours?|hrs?)\b/.exec(s)))return Math.round(+m[1]*(/h/.test(m[2])?60:1));
  return null;
}
function clean(s){
  s=s&&typeof s==="object"?s:{};
  var out={ts:+s.ts||0,recipes:[],plan:{},checked:{},extras:[],staples:[],startDay:s.startDay===0?0:1,listDays:[3,7,14].indexOf(+s.listDays)>=0?+s.listDays:7,seeded:!!s.seeded,people:Math.min(20,Math.max(1,+s.people||2)),pantry:[]};
  (Array.isArray(s.pantry)?s.pantry:[]).slice(0,300).forEach(function(p){if(p&&p.item)out.pantry.push({id:str(p.id,24),item:str(p.item,80),exp:/^\d{4}-\d{2}-\d{2}$/.test(p.exp)?p.exp:""});});
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
/* Fill empty meal slots from the recipe box. Never touches a slot that already has something.
   Picks recipes tagged for the slot (lunch can fall back to dinner recipes), favourites first, then the
   ones made least, without repeating within the run. With leftovers on, a dinner that makes enough
   for two meals also covers the next day's lunch (as a note, so groceries aren't doubled). */
function autoPlan(state,days,opt){
  opt=opt||{};var slots=opt.slots||["dinner"],people=Math.max(1,+opt.people||2),out=[],used={},seed=+opt.seed||1;
  function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}
  var prefer={};(opt.prefer||[]).forEach(function(id){prefer[id]=1;});
  function pool(slot){
    var p=state.recipes.filter(function(r){return (r.tags||[]).indexOf(slot)>=0;});
    if(!p.length&&slot==="lunch")p=state.recipes.filter(function(r){return (r.tags||[]).indexOf("dinner")>=0;});
    return p;
  }
  function pick(slot){
    var p=pool(slot);if(!p.length)return null;
    var u=used[slot]=used[slot]||{},fresh=p.filter(function(r){return !u[r.id];});if(!fresh.length){u=used[slot]={};fresh=p;}
    fresh=fresh.map(function(r){return {r:r,w:(r.fav?2:0)-Math.min(3,(r.made||0))*0.3+rnd()+(prefer[r.id]?2.5:0)};}).sort(function(a,b){return b.w-a.w;});
    u[fresh[0].r.id]=1;return fresh[0].r;
  }
  function has(d,slot){return (state.plan[d]||[]).some(function(m){return m.slot===slot;})||out.some(function(m){return m.d===d&&m.slot===slot;});}
  days.forEach(function(d,i){
    ["breakfast","lunch","dinner","snack"].forEach(function(slot){
      if(slots.indexOf(slot)<0||has(d,slot))return;
      var r=pick(slot);if(!r)return;
      out.push({d:d,slot:slot,rid:r.id,text:"",serves:people});
      if(opt.leftovers&&slot==="dinner"&&i+1<days.length&&(r.serves||0)>=people*2&&slots.indexOf("lunch")>=0&&!has(days[i+1],"lunch"))
        out.push({d:days[i+1],slot:"lunch",rid:null,text:"Leftover "+r.name.toLowerCase(),serves:people});
    });
  });
  return out;
}
var api={autoPlan:autoPlan,expiring:expiring,usesUp:usesUp,parseRecipe:parseRecipe,timerIn:timerIn,qtyText:qtyText,AISLES:AISLES,SLOTS:SLOTS,parseLine:parseLine,lineText:lineText,fmtQ:fmtQ,key:key,guessAisle:guessAisle,groceries:groceries,clean:clean,addDays:addDays,weekStart:weekStart,iso:iso};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.MealsCore=api;
})(typeof self!=="undefined"?self:this);
