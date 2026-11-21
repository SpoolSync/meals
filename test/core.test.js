var M=require("../meals-core.js"),assert=require("assert"),n=0;
function t(name,fn){fn();n++;console.log("ok  "+name);}
t("parses common ingredient lines",function(){
  assert.deepStrictEqual(M.parseLine("1 1/2 cups basmati rice"),{q:1.5,u:"cup",item:"basmati rice",aisle:"Pantry"});
  assert.deepStrictEqual(M.parseLine("2 large onions, chopped"),{q:2,u:"",item:"large onions, chopped",aisle:"Produce"});
  assert.deepStrictEqual(M.parseLine("500g chicken thighs"),{q:500,u:"g",item:"chicken thighs",aisle:"Meat & fish"});
  assert.deepStrictEqual(M.parseLine("½ tsp turmeric"),{q:.5,u:"tsp",item:"turmeric",aisle:"Spices & sauces"});
  assert.deepStrictEqual(M.parseLine("Salt to taste"),{q:null,u:"",item:"Salt to taste",aisle:"Spices & sauces"});
  assert.deepStrictEqual(M.parseLine("1 can chickpeas"),{q:1,u:"can",item:"chickpeas",aisle:"Pantry"});
  assert.strictEqual(M.parseLine("  "),null);
});
t("item keys merge plurals and prep words",function(){
  assert.strictEqual(M.key("2 large onions, chopped".replace(/^\d+ /,"")),M.key("onion"));
  assert.strictEqual(M.key("Tomatoes"),M.key("tomato"));
  assert.strictEqual(M.key("fresh cilantro (optional)"),"cilantro");
});
t("grocery list scales, merges, skips staples, keeps extras",function(){
  var s=M.clean({recipes:[
    {id:"r1",name:"Dal",serves:4,ing:[{q:1,u:"cup",item:"red lentils"},{q:1,u:"",item:"onion"},{q:1,u:"tsp",item:"salt"}]},
    {id:"r2",name:"Curry",serves:2,ing:[{q:2,u:"",item:"onions, sliced"},{q:null,u:"",item:"cilantro"}]}],
    plan:{"2026-11-23":[{id:"a",slot:"dinner",rid:"r1",serves:2}],"2026-11-24":[{id:"b",slot:"lunch",rid:"r2",serves:4},{id:"c",slot:"dinner",text:"Takeout"}],"2026-12-30":[{id:"d",slot:"dinner",rid:"r1",serves:4}]},
    extras:[{id:"x1",item:"paper towels"}],staples:["salt"]});
  var g=M.groceries(s,"2026-11-23",7),flat={};
  g.aisles.forEach(function(a){a[1].forEach(function(r){flat[r.item]=r;});});
  assert.strictEqual(flat["red lentils"].q,0.5);
  assert.strictEqual(flat["onion"].q,0.5+4);
  assert.deepStrictEqual(flat["onion"].from,["Dal","Curry"]);
  assert.strictEqual(flat["cilantro"].q,null);
  assert.ok(flat["paper towels"]);
  assert.deepStrictEqual(g.staples.map(function(r){return r.item;}),["salt"]);
  assert.deepStrictEqual(g.aisles.map(function(a){return a[0];}),["Produce","Pantry","Household"]);
});
t("weeks start on Monday by default",function(){
  assert.strictEqual(M.weekStart("2026-11-21"),"2026-11-16");
  assert.strictEqual(M.weekStart("2026-11-23"),"2026-11-23");
  assert.strictEqual(M.weekStart("2026-11-21",0),"2026-11-15");
});
t("clean drops junk",function(){
  var c=M.clean({plan:{"bad":[1],"2026-11-23":[{slot:"x",text:"Pizza"},{slot:"lunch"}]},recipes:[{name:"no id"},{id:"r",name:"<b>",ing:[{item:""},{item:"egg",aisle:"Nope"}]}]});
  assert.deepStrictEqual(Object.keys(c.plan),["2026-11-23"]);assert.strictEqual(c.plan["2026-11-23"].length,1);assert.strictEqual(c.plan["2026-11-23"][0].slot,"dinner");
  assert.strictEqual(c.recipes.length,1);assert.strictEqual(c.recipes[0].ing.length,1);assert.strictEqual(c.recipes[0].ing[0].aisle,"Dairy & eggs");
});
console.log("\n"+n+" tests passed");
