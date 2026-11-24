var M=require("../meals-core.js"),assert=require("assert"),n=0;
function t(name,fn){fn();n++;console.log("ok  "+name);}
t("parses common ingredient lines",function(){
  assert.deepStrictEqual(M.parseLine("1 1/2 cups basmati rice"),{q:1.5,u:"cup",item:"basmati rice",aisle:"Pantry"});
  assert.deepStrictEqual(M.parseLine("2 large onions, chopped"),{q:2,u:"",item:"large onions, chopped",aisle:"Produce"});
  assert.deepStrictEqual(M.parseLine("500g chicken thighs"),{q:500,u:"g",item:"chicken thighs",aisle:"Chicken & fish"});
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
(function(){
  var M=require("../meals-core.js"),assert=require("assert");
  var st={plan:{"2026-11-24":[{id:"a",slot:"dinner",rid:"x"}]},recipes:[
    {id:"d1",name:"Dal",serves:4,tags:["dinner"]},{id:"d2",name:"Stir-fry",serves:2,tags:["dinner"]},{id:"b1",name:"Oats",serves:1,tags:["breakfast"]},{id:"l1",name:"Wraps",serves:2,tags:["lunch"]}]};
  var days=["2026-11-24","2026-11-25","2026-11-26"];
  var out=M.autoPlan(st,days,{slots:["breakfast","dinner"],people:2,seed:7});
  assert.ok(!out.some(function(m){return m.d==="2026-11-24"&&m.slot==="dinner";}),"keeps planned slot");
  assert.strictEqual(out.filter(function(m){return m.slot==="breakfast";}).length,3);
  var din=out.filter(function(m){return m.slot==="dinner";});assert.strictEqual(din.length,2);assert.notStrictEqual(din[0].rid,din[1].rid,"no repeat");
  var lo=M.autoPlan({plan:{},recipes:[{id:"d1",name:"Dal",serves:4,tags:["dinner"]}]},days,{slots:["lunch","dinner"],people:2,leftovers:true,seed:3});
  assert.ok(lo.some(function(m){return m.text==="Leftover dal"&&m.d==="2026-11-25";}),"leftover lunch");
  console.log("ok  fill the week");
})();
(function(){
  var M=require("../meals-core.js"),assert=require("assert");
  var r=M.parseRecipe("Lemon Herb Chicken\nServes: 4\nPrep time: 10 min\nIngredients\n▢ 4 chicken thighs\n▢ 2 tbsp olive oil\n▢ 1 lemon, juiced\nSalt to taste\nInstructions\n1. Mix the oil, lemon and salt.\n2. Coat the chicken and roast at 220°C for 25 to 30 minutes.");
  assert.strictEqual(r.name,"Lemon Herb Chicken");assert.strictEqual(r.serves,4);assert.strictEqual(r.ing.length,4);assert.strictEqual(r.ing[0].item,"chicken thighs");
  assert.ok(/^Mix the oil/.test(r.steps)&&r.steps.split("\n").length===2);
  var r2=M.parseRecipe("Veg fried rice\n2 cups cooked rice\n1 cup frozen peas\n2 eggs\nHeat a wok until very hot and add oil, then the rice. Fry for 5 minutes.");
  assert.strictEqual(r2.ing.length,3);assert.ok(/Heat a wok/.test(r2.steps));
  assert.strictEqual(M.timerIn("Bake for 12 to 15 minutes"),15);assert.strictEqual(M.timerIn("Simmer 1 hour"),60);assert.strictEqual(M.timerIn("Stir well"),null);
  var st={pantry:[{id:"1",item:"Spinach",exp:"2026-11-25"},{id:"2",item:"rice",exp:""}],recipes:[{id:"a",name:"Dal",ing:[{item:"spinach"}]},{id:"b",name:"Oats",ing:[{item:"oats"}]}],plan:{"2026-11-24":[{id:"m",slot:"dinner",rid:"c",serves:2}]}};
  assert.deepStrictEqual(M.expiring(st,"2026-11-24",3).map(function(p){return p.item;}),["Spinach"]);
  assert.strictEqual(M.usesUp(st,M.expiring(st,"2026-11-24",3))[0].r.id,"a");
  st.recipes.push({id:"c",name:"Fried rice",serves:2,ing:[{item:"rice",q:1,u:"cup"},{item:"peas",q:1,u:"cup"}]});
  var g=M.groceries(st,"2026-11-24",1);assert.deepStrictEqual(g.have.map(function(x){return x.item;}),["rice"]);assert.strictEqual(g.aisles.length,1);
  console.log("ok  paste a recipe, timers, pantry");
})();
