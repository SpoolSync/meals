"use strict";
/* Meals: plan the week, keep recipes, and get a grocery list that builds itself, grouped by aisle.
   Storage, sign-in, the Pixora passcode and encrypted sync come from pixora-kit.js. */
var M=MealsCore,K=PixoraKit,esc=K.esc;
var S=null,tab="plan",week=null,q="",listStatus="";
var SLOTNAME={breakfast:"Breakfast",lunch:"Lunch",dinner:"Dinner",snack:"Snack"};
function $(s){return document.querySelector(s);}
function today(){return M.iso(new Date());}
function rid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function dayName(s,long){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("en-CA",long?{weekday:"long",month:"short",day:"numeric"}:{weekday:"short",day:"numeric"});}
var tt=null;var lastFill=null;
function toastUndo(m){var t=$("#toast");t.innerHTML=esc(m)+' <button class="add" data-act="undofill" style="color:inherit;text-decoration:underline">Undo</button>';t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true;lastFill=null;},8000);}
function toast(m){var t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true;},3500);}
function save(){K.save(S);}
function byId(id){return S.recipes.filter(function(r){return r.id===id;})[0];}

/* A small starter set so the planner is useful on day one. Edit or delete any of them. */
function starters(){
  function r(name,serves,tags,lines,steps){return {id:rid(),name:name,serves:serves,tags:tags,ing:lines.map(M.parseLine).filter(Boolean),steps:steps};}
  return [
    r("Overnight oats",1,["breakfast","quick"],["1/2 cup rolled oats","1/2 cup milk","1/4 cup yogurt","1 tbsp honey","1/2 cup berries"],"Stir everything but the berries in a jar. Chill overnight. Top with berries."),
    r("Masala omelette",1,["breakfast","quick"],["3 eggs","1 small onion","1 tomato","1 green chilli","2 tbsp cilantro","1/4 tsp turmeric","1 tsp butter"],"Chop the vegetables. Whisk with eggs, turmeric and salt. Cook in butter until set, fold."),
    r("Red lentil dal",4,["dinner","vegetarian"],["1 cup red lentils","1 onion","2 tomatoes","4 cloves garlic","1 tbsp ginger","1 tsp cumin seeds","1/2 tsp turmeric","1 tsp garam masala","2 tbsp ghee","2 tbsp cilantro"],"Simmer lentils with turmeric in 3 cups water until soft. Fry cumin, onion, garlic and ginger in ghee, add tomatoes and garam masala, stir into the dal. Finish with cilantro."),
    r("Chana masala",4,["dinner","vegetarian"],["2 cans chickpeas","1 onion","2 tomatoes","3 cloves garlic","1 tbsp ginger","2 tsp chana masala","1/2 tsp turmeric","2 tbsp cooking oil","2 tbsp cilantro","1 lemon"],"Fry onion, garlic and ginger. Add spices, then tomatoes until jammy. Add chickpeas and a cup of water, simmer 15 minutes. Lemon and cilantro to finish."),
    r("Chicken stir-fry",3,["dinner","quick"],["500g chicken breast","1 red bell pepper","1 head broccoli","2 carrots","3 cloves garlic","1 tbsp ginger","3 tbsp soy sauce","1 tbsp honey","1 cup jasmine rice"],"Cook the rice. Brown sliced chicken, set aside. Stir-fry vegetables with garlic and ginger, return chicken, add soy and honey."),
    r("Butter chicken",4,["dinner"],["700g chicken thighs","1 cup yogurt","2 tbsp butter chicken masala","1 can tomato puree","1/2 cup cream","3 tbsp butter","1 onion","4 cloves garlic","1 tbsp ginger","2 cups basmati rice"],"Marinate chicken in yogurt and half the masala. Sear. Soften onion, garlic and ginger in butter, add the rest of the masala and tomato, simmer, add chicken and cream. Serve with rice."),
    r("Pasta with tomato and spinach",2,["dinner","quick","vegetarian"],["250g pasta","1 can diced tomatoes","2 cups spinach","3 cloves garlic","2 tbsp olive oil","1/4 cup parmesan"],"Boil pasta. Fry garlic in oil, add tomatoes and simmer, stir in spinach. Toss with pasta and parmesan."),
    r("Burrito bowls",4,["lunch","meal prep"],["2 cups rice","1 can black beans","500g ground beef","1 packet taco seasoning","1 cup corn","2 tomatoes","1 avocado","1 cup shredded cheese","1 lime"],"Cook rice. Brown beef with seasoning. Warm beans and corn. Build bowls with tomato, avocado, cheese and lime."),
    r("Greek salad wraps",2,["lunch","quick","vegetarian"],["2 large tortillas","1 cucumber","2 tomatoes","1/2 red onion","1/2 cup feta","1/4 cup olives","1/2 cup hummus"],"Spread hummus on the wraps, fill with chopped vegetables, feta and olives, roll."),
    r("Paneer bhurji",3,["dinner","vegetarian","quick"],["400g paneer","1 onion","2 tomatoes","1 green chilli","1/2 tsp turmeric","1 tsp garam masala","1 tbsp butter","3 rotis"],"Crumble paneer. Fry onion and chilli in butter, add tomatoes and spices, then paneer for 3 minutes. Serve with roti.")
  ];
}

/* ---------- screens ---------- */
function render(){
  var app=$("#app");app.hidden=false;$("#tabs").hidden=false;
  document.querySelectorAll("#tabs button").forEach(function(b){b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false");});
  app.innerHTML=(tab==="plan"?planView():tab==="list"?listView():tab==="recipes"?recipesView():settingsView());
  window.scrollTo(0,0);
}
function header(eyebrow,title,right){
  return '<header class="top"><div><p class="eyebrow">'+esc(eyebrow)+'</p><h1>'+esc(title)+'</h1></div><div class="row">'+(right||"")+
    '<button class="btn q s" data-act="settings">Settings</button></div></header><button class="status" id="st" data-act="settings">'+esc(K.status())+'</button>';
}
function planView(){
  var t=today();week=week||M.weekStart(t,S.startDay);
  var end=M.addDays(week,6),h=header("Plan",week===M.weekStart(t,S.startDay)?"This week":dayName(week)+" – "+dayName(end));
  h+='<div class="row"><button class="btn q s" data-act="wk" data-n="-7">← Previous</button><button class="btn q s" data-act="wk" data-n="0">This week</button><button class="btn q s" data-act="wk" data-n="7">Next →</button>'+
    '<button class="btn q s" data-act="copyweek">Copy last week here</button></div>';
  var planned=0;for(var j=0;j<7;j++)planned+=(S.plan[M.addDays(week,j)]||[]).length;
  if(S.recipes.length&&end>=t)h+='<div class="row"><button class="btn '+(planned<3?"p":"q")+' s" data-act="autofill">Fill the week for me</button>'+(planned<3?'<span class="small muted">Picks from your recipes. Change anything after.</span>':"")+'</div>';
  for(var i=0;i<7;i++){
    var d=M.addDays(week,i),list=S.plan[d]||[];
    h+='<section class="card day'+(d===t?" today":"")+'" aria-label="'+esc(dayName(d,true))+'"><div class="dayhead"><h2>'+esc(dayName(d,true))+'</h2>'+(d===t?'<span class="eyebrow">Today</span>':"")+'</div>';
    M.SLOTS.forEach(function(sl){
      list.filter(function(m){return m.slot===sl;}).forEach(function(m){
        var r=m.rid&&byId(m.rid),name=r?r.name:m.text;
        h+='<div class="slot"><span class="k">'+SLOTNAME[sl]+'</span><button class="meal" data-act="meal" data-d="'+d+'" data-id="'+esc(m.id)+'">'+esc(name)+(r&&m.serves!==r.serves?' <span class="muted small">· '+m.serves+' servings</span>':"")+(r||/^Leftover /.test(m.text)?"":' <span class="muted small">· not a recipe</span>')+'</button>'+
          '<button class="x" aria-label="Remove '+esc(name)+'" data-act="unplan" data-d="'+d+'" data-id="'+esc(m.id)+'">×</button></div>';
      });
    });
    h+='<div class="row"><button class="add" data-act="plan" data-d="'+d+'">+ Add a meal</button></div></section>';
  }
  return h;
}
function listRange(){return {from:today(),days:S.listDays};}
function listView(){
  var r=listRange(),g=M.groceries(S,r.from,r.days),total=0,left=0;
  g.aisles.forEach(function(a){a[1].forEach(function(x){total++;if(!S.checked[x.k])left++;});});
  var h=header("Groceries",left?left+" to get":total?"All set":"Nothing yet",'<button class="btn q s" data-act="share">Share list</button>');
  h+='<div class="row"><label class="small muted" for="days">For the next</label><select id="days" data-act="days" style="width:auto;min-height:36px;padding:4px 8px">'+
    [3,7,14].map(function(n){return '<option value="'+n+'"'+(S.listDays===n?" selected":"")+'>'+n+' days</option>';}).join("")+'</select>'+
    '<button class="btn q s" data-act="extra">Add an item</button>'+(total-left?'<button class="btn q s" data-act="clearchecked">Clear ticked</button>':"")+'</div>';
  if(!total&&!g.staples.length)return h+'<div class="empty"><p>Plan meals from your recipes and their ingredients land here, added up and sorted by aisle. You can also add anything else you need.</p><div class="row"><button class="btn p" data-act="tab" data-t="plan">Plan meals</button></div></div>';
  g.aisles.forEach(function(a){
    h+='<section class="card"><p class="aisle">'+esc(a[0])+'</p>';
    a[1].forEach(function(x){
      var done=!!S.checked[x.k],qty=M.qtyText(x.q,x.u);
      h+='<label class="item'+(done?" done":"")+'"><input type="checkbox" data-act="tick" data-k="'+esc(x.k)+'"'+(done?" checked":"")+'>'+
        '<span><span class="nm">'+esc(x.item)+'</span>'+(x.from.length?'<br><span class="small muted">'+esc(x.from.join(", "))+'</span>':x.extra?'<br><span class="small muted">Added by you · <button class="add" data-act="unextra" data-id="'+esc(x.extra)+'" style="font-size:13px;padding:0">remove</button></span>':"")+'</span>'+
        '<span class="qty">'+esc(qty)+'</span></label>';
    });
    h+='</section>';
  });
  if(g.staples.length)h+='<section class="card"><p class="aisle">Probably have · your staples</p><p class="small muted">'+esc(g.staples.map(function(x){return x.item;}).join(", "))+'</p><p class="small muted">Change staples in Settings.</p></section>';
  return h;
}
function recipesView(){
  var h=header("Recipes",S.recipes.length+" saved",'<button class="btn p s" data-act="newrecipe">New recipe</button>');
  h+='<input type="search" id="rq" placeholder="Search recipes, ingredients or tags" value="'+esc(q)+'" aria-label="Search recipes">';
  var qq=q.toLowerCase(),list=S.recipes.filter(function(r){return !qq||(r.name+" "+r.tags.join(" ")+" "+r.ing.map(function(i){return i.item;}).join(" ")).toLowerCase().indexOf(qq)>=0;})
    .sort(function(a,b){return (b.fav-a.fav)||(b.made-a.made)||a.name.localeCompare(b.name);});
  if(!S.recipes.length)return h+'<div class="empty"><p>No recipes yet.</p><div class="row"><button class="btn p" data-act="newrecipe">Add one</button><button class="btn" data-act="seed">Add 10 starter recipes</button></div></div>';
  h+='<section class="card">';
  list.forEach(function(r){h+='<button class="rec" data-act="viewrecipe" data-id="'+esc(r.id)+'"><span><b>'+(r.fav?"★ ":"")+esc(r.name)+'</b><br><span class="small muted">Serves '+r.serves+' · '+r.ing.length+' ingredients</span></span><span class="row">'+r.tags.slice(0,2).map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join("")+'</span></button>';});
  if(!list.length)h+='<p class="muted">Nothing matches.</p>';
  return h+'</section>';
}
function settingsView(){
  var h='<button class="btn q s" data-act="tab" data-t="plan" style="align-self:flex-start">← Back</button><h1>Settings</h1>';
  h+='<section class="card"><h2>Staples</h2><p class="small muted">Things you always have. They stay off the shopping list and show under "Probably have".</p>'+
    '<textarea id="staples" aria-label="Staples, one per line">'+esc(S.staples.join("\n"))+'</textarea><div class="row"><button class="btn" data-act="savestaples">Save staples</button></div></section>';
  h+='<section class="card"><h2>Week starts on</h2><div class="row"><button class="btn'+(S.startDay===1?" p":" q")+' s" data-act="startday" data-n="1">Monday</button><button class="btn'+(S.startDay===0?" p":" q")+' s" data-act="startday" data-n="0">Sunday</button></div></section>';
  h+='<section class="card"><h2>Your copy</h2><p class="small muted">Download everything in Meals as a file you keep, and bring it back here or on a new phone. It\'s a plain file, not encrypted, so keep it somewhere private.</p><div class="row"><button class="btn" data-act="export">Download a copy</button><label class="btn q" style="cursor:pointer">Restore from a copy<input type="file" id="restore" accept=".json,application/json" hidden></label></div></section>';
  h+='<section class="card"><h2>Ideas or problems?</h2><p class="small muted">Tell Sachin what would make Meals better or what went wrong. Nothing from your data is sent.</p><div class="row"><button class="btn" data-act="feedback">Send feedback</button></div></section>';
  h+='<section class="card"><h2>Account</h2>'+(K.local?'<p class="small">On this phone only. Sign in to keep your recipes and plans on all your phones, encrypted.</p><div class="row"><button class="btn" data-act="join">Sign in or create a Pixora account</button></div>':
    '<p class="small">Signed in as '+esc(K.email||"")+'. Recipes, plans and lists are encrypted on this phone before they sync, so nobody else can read them, not even Pixora.</p><div class="row"><button class="btn q" data-act="signout">Sign out</button></div>')+'</section>';
  h+='<section class="card"><h2>Delete my Meals data</h2><p class="small muted">Deletes your recipes, plans and grocery lists from this phone'+(K.local?"":" and your Pixora account")+'. It can\'t be undone. Your Pixora login and other Pixora apps aren\'t affected. To delete the Pixora login itself, email pixora3dstudios@gmail.com.</p>'+
    '<div class="row"><button class="btn d" data-act="delall">Delete my Meals data</button></div></section>';
  return h;
}

/* ---------- dialogs ---------- */
function dlg(html){var d=$("#dlg");d.innerHTML='<div class="form">'+html+'</div>';d.showModal();return d;}
function closeDlg(){var d=$("#dlg");if(d.open)d.close();d.innerHTML="";}
$("#dlg").addEventListener("cancel",function(e){e.preventDefault();closeDlg();});
function planDialog(d){
  var opts=S.recipes.slice().sort(function(a,b){return (b.fav-a.fav)||(b.made-a.made)||a.name.localeCompare(b.name);});
  var hour=new Date().getHours(),slot=hour<10?"breakfast":hour<14?"lunch":"dinner";
  dlg('<h2>'+esc(dayName(d,true))+'</h2><div class="two"><label class="f">Meal<select id="p-slot">'+M.SLOTS.map(function(s){return '<option value="'+s+'"'+(s===slot?" selected":"")+'>'+SLOTNAME[s]+'</option>';}).join("")+'</select></label>'+
    '<label class="f">Servings<input type="number" id="p-serves" min="1" max="50" inputmode="numeric" placeholder="Recipe\'s own"></label></div>'+
    '<input type="search" id="p-q" placeholder="Find a recipe" aria-label="Find a recipe"><div class="pick" id="p-list"></div>'+
    '<label class="f">Or just write it<input type="text" id="p-text" maxlength="80" placeholder="Leftovers, eating out, pizza night"></label>'+
    '<div class="row"><button class="btn p" data-act="p-text">Add</button><button class="btn q" data-act="close">Cancel</button></div>');
  function draw(){var qq=$("#p-q").value.toLowerCase();$("#p-list").innerHTML=opts.filter(function(r){return !qq||r.name.toLowerCase().indexOf(qq)>=0;}).slice(0,40)
    .map(function(r){return '<button data-act="p-pick" data-id="'+esc(r.id)+'">'+(r.fav?"★ ":"")+esc(r.name)+' <span class="small muted">· serves '+r.serves+'</span></button>';}).join("")||'<p class="small muted" style="padding:10px">No recipes match. Write it below, or add the recipe first.</p>';}
  draw();$("#p-q").addEventListener("input",draw);$("#dlg").dataset.day=d;
}
function addPlanned(d,rIdOrNull,text){
  var sv=+$("#p-serves").value||0,r=rIdOrNull&&byId(rIdOrNull);
  (S.plan[d]=S.plan[d]||[]).push({id:rid(),slot:$("#p-slot").value,rid:r?r.id:null,text:r?"":text,serves:r?(sv||r.serves):1});
  if(r)r.made++;save();closeDlg();render();K.track(r?"plan_recipe":"plan_text");
}
function recipeView(r){
  dlg('<h2>'+esc(r.name)+'</h2><div class="row"><label class="small muted" for="v-sv">Servings</label><input type="number" id="v-sv" min="1" max="50" value="'+r.serves+'" style="width:90px;min-height:36px"></div>'+
    '<section id="v-ing"></section>'+(r.steps?'<h3>Method</h3><p style="white-space:pre-wrap">'+esc(r.steps)+'</p>':"")+
    (r.tags.length?'<div class="row">'+r.tags.map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join("")+'</div>':"")+
    '<div class="row"><button class="btn" data-act="editrecipe" data-id="'+esc(r.id)+'">Edit</button><button class="btn q" data-act="fav" data-id="'+esc(r.id)+'">'+(r.fav?"★ Unfavourite":"☆ Favourite")+'</button><button class="btn q" data-act="close">Close</button></div>');
  function draw(){var f=(+$("#v-sv").value||r.serves)/r.serves;$("#v-ing").innerHTML=r.ing.map(function(i){var g={q:i.q==null?null:i.q*f,u:i.u};return '<div class="ing"><span class="mono small">'+esc(M.qtyText(g.q,g.u))+'</span><span>'+esc(i.item)+'</span></div>';}).join("");}
  draw();$("#v-sv").addEventListener("input",draw);K.track("recipe_view");
}
function recipeEdit(r){
  var isNew=!r;r=r||{id:rid(),name:"",serves:2,tags:[],ing:[],steps:"",fav:false,made:0};
  dlg('<h2>'+(isNew?"New recipe":"Edit recipe")+'</h2><label class="f">Name<input type="text" id="e-name" maxlength="80" value="'+esc(r.name)+'"></label>'+
    '<div class="two"><label class="f">Serves<input type="number" id="e-serves" min="1" max="50" value="'+r.serves+'"></label><label class="f">Tags<input type="text" id="e-tags" value="'+esc(r.tags.join(", "))+'" placeholder="dinner, quick"></label></div>'+
    '<label class="f">Ingredients<small>One per line, like "2 cups rice" or "1 onion". Paste a whole list from a website.</small><textarea id="e-ing">'+esc(r.ing.map(M.lineText).join("\n"))+'</textarea></label>'+
    '<label class="f">Method<textarea id="e-steps">'+esc(r.steps)+'</textarea></label><p class="err small" id="e-err" style="color:var(--bad)"></p>'+
    '<div class="row"><button class="btn p" data-act="saverecipe" data-id="'+esc(r.id)+'" data-new="'+(isNew?1:0)+'">Save</button><button class="btn q" data-act="close">Cancel</button>'+
    (isNew?"":'<button class="btn d" data-act="delrecipe" data-id="'+esc(r.id)+'">Delete</button>')+'</div>');
}
function shareText(){
  var r=listRange(),g=M.groceries(S,r.from,r.days),lines=["Groceries"];
  g.aisles.forEach(function(a){var left=a[1].filter(function(x){return !S.checked[x.k];});if(!left.length)return;lines.push("",a[0]);left.forEach(function(x){lines.push("- "+[M.qtyText(x.q,x.u),x.item].filter(Boolean).join(" "));});});
  return lines.join("\n");
}

/* ---------- events ---------- */
document.addEventListener("click",async function(e){
  var b=e.target.closest("[data-act]");if(!b||b.tagName==="SELECT"||(b.tagName==="INPUT"&&b.type!=="checkbox"))return;
  var a=b.dataset.act,d=b.dataset.d,id=b.dataset.id;
  if(a==="tab"){tab=b.dataset.t;render();}
  else if(a==="settings"){tab="settings";render();}
  else if(a==="wk"){var n=+b.dataset.n;week=n?M.addDays(week,n):M.weekStart(today(),S.startDay);render();}
  else if(a==="copyweek"){var c=0;for(var i=0;i<7;i++){var from=S.plan[M.addDays(week,i-7)]||[],to=M.addDays(week,i);if(from.length&&!(S.plan[to]||[]).length){S.plan[to]=from.map(function(m){return Object.assign({},m,{id:rid()});});c++;}}
    if(c){save();render();toast("Copied "+c+(c===1?" day":" days")+". Days you'd already planned were left alone.");K.track("copy_week");}else toast("Nothing to copy: last week was empty, or this week is already planned.");}
  else if(a==="plan")planDialog(d);
  else if(a==="p-pick")addPlanned($("#dlg").dataset.day,id);
  else if(a==="p-text"){var tx=$("#p-text").value.trim();if(!tx){toast("Pick a recipe or write something.");return;}addPlanned($("#dlg").dataset.day,null,tx);}
  else if(a==="unplan"){S.plan[d]=(S.plan[d]||[]).filter(function(m){return m.id!==id;});if(!S.plan[d].length)delete S.plan[d];save();render();}
  else if(a==="meal"){var m=(S.plan[d]||[]).filter(function(x){return x.id===id;})[0],r=m&&m.rid&&byId(m.rid);if(r)recipeView(r);}
  else if(a==="tick"){if(b.checked)S.checked[b.dataset.k]=1;else delete S.checked[b.dataset.k];save();var row=b.closest(".item");if(row)row.classList.toggle("done",b.checked);K.track("tick_item");}
  else if(a==="clearchecked"){var g=M.groceries(S,today(),S.listDays);S.extras=S.extras.filter(function(x){return !S.checked["x|"+x.id];});S.checked={};save();render();K.track("clear_ticked");}
  else if(a==="extra"){dlg('<h2>Add an item</h2><label class="f">What<input type="text" id="x-line" placeholder="2 L milk, paper towels" maxlength="80"></label><div class="row"><button class="btn p" data-act="saveextra">Add</button><button class="btn q" data-act="close">Cancel</button></div>');setTimeout(function(){var x=$("#x-line");if(x)x.focus();},50);}
  else if(a==="saveextra"){var p=M.parseLine($("#x-line").value);if(!p){closeDlg();return;}S.extras.push({id:rid(),item:p.item,q:p.q,u:p.u,aisle:p.aisle});save();closeDlg();render();K.track("extra_item");}
  else if(a==="unextra"){e.preventDefault();S.extras=S.extras.filter(function(x){return x.id!==id;});delete S.checked["x|"+id];save();render();}
  else if(a==="share"){var t=shareText();K.track("share_list");if(navigator.share){try{await navigator.share({text:t});}catch(x){}}else{try{await navigator.clipboard.writeText(t);toast("List copied.");}catch(x){toast("Couldn't copy.");}}}
  else if(a==="newrecipe")recipeEdit(null);
  else if(a==="viewrecipe")recipeView(byId(id));
  else if(a==="editrecipe")recipeEdit(byId(id));
  else if(a==="fav"){var r2=byId(id);r2.fav=!r2.fav;save();closeDlg();render();}
  else if(a==="saverecipe"){
    var nm=$("#e-name").value.trim(),ing=$("#e-ing").value.split(/\n/).map(M.parseLine).filter(Boolean);
    if(!nm){$("#e-err").textContent="Give it a name.";return;}
    var rec=byId(id)||{id:id,fav:false,made:0};
    rec.name=nm.slice(0,80);rec.serves=Math.min(50,Math.max(1,+$("#e-serves").value||2));rec.tags=$("#e-tags").value.split(",").map(function(x){return x.trim().toLowerCase();}).filter(Boolean).slice(0,8);rec.ing=ing.slice(0,60);rec.steps=$("#e-steps").value.slice(0,6000);
    if(b.dataset.new==="1")S.recipes.push(rec);
    save();closeDlg();tab="recipes";render();K.track(b.dataset.new==="1"?"recipe_add":"recipe_edit");
  }
  else if(a==="delrecipe"){if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="Tap again to delete";return;}
    S.recipes=S.recipes.filter(function(r){return r.id!==id;});Object.keys(S.plan).forEach(function(k){S.plan[k]=S.plan[k].filter(function(m){return m.rid!==id;});if(!S.plan[k].length)delete S.plan[k];});save();closeDlg();render();}
  else if(a==="autofill"){
    var people=S.people||2;
    dlg('<h2>Fill the week</h2><p class="note">Fills only empty slots from '+(week<today()?"today":"this week")+' on, from your recipes. Favourites come up more. Nothing you\'ve planned changes.</p>'+
      '<fieldset class="f" style="border:0;padding:0;margin:0"><legend>Which meals</legend><div class="row">'+
      [["breakfast","Breakfast",false],["lunch","Lunch",true],["dinner","Dinner",true]].map(function(x){return '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-slot="'+x[0]+'"'+(x[2]?" checked":"")+'> '+x[1]+'</label>';}).join("")+'</div></fieldset>'+
      '<label class="f">People eating<input type="number" id="af-people" min="1" max="20" value="'+people+'" inputmode="numeric"></label>'+
      '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="af-left" checked> Big dinners cover the next day\'s lunch</label>'+
      '<div class="row"><button class="btn p" data-act="doautofill">Fill it</button><button class="btn q" data-act="close">Cancel</button></div>');
  }
  else if(a==="doautofill"){
    var slots=[].slice.call(document.querySelectorAll("[data-slot]:checked")).map(function(x){return x.dataset.slot;});
    if(!slots.length){toast("Pick at least one meal.");return;}
    var ppl=Math.min(20,Math.max(1,+$("#af-people").value||2));S.people=ppl;
    var from=week<today()?today():week,days=[];for(var k=0;k<7;k++){var dd=M.addDays(week,k);if(dd>=from)days.push(dd);}
    var add=M.autoPlan(S,days,{slots:slots,people:ppl,leftovers:$("#af-left").checked,seed:Date.now()%2147483646+1});
    if(!add.length){closeDlg();toast("Nothing to fill: those slots are planned, or no recipes are tagged for them.");return;}
    var ids=[];add.forEach(function(m){var id=rid();ids.push(id);(S.plan[m.d]=S.plan[m.d]||[]).push({id:id,slot:m.slot,rid:m.rid,text:m.text,serves:m.serves});});
    lastFill=ids;save();closeDlg();render();K.track("autofill_week");
    toastUndo("Added "+add.length+" meals. Your grocery list is updated.");
  }
  else if(a==="undofill"){if(!lastFill)return;Object.keys(S.plan).forEach(function(d){S.plan[d]=S.plan[d].filter(function(m){return lastFill.indexOf(m.id)<0;});if(!S.plan[d].length)delete S.plan[d];});lastFill=null;save();render();$("#toast").hidden=true;K.track("autofill_undo");}
  else if(a==="seed"){S.recipes=S.recipes.concat(starters());S.seeded=true;save();render();K.track("starter_recipes");}
  else if(a==="savestaples"){S.staples=$("#staples").value.split(/\n/).map(function(x){return x.trim();}).filter(Boolean).slice(0,100);save();toast("Staples saved.");K.track("staples_edit");}
  else if(a==="startday"){S.startDay=+b.dataset.n;week=null;save();render();}
  else if(a==="delall"){if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="Tap again: delete everything in Meals";return;}
    b.disabled=true;try{await K.deleteAppData();tab="plan";toast("Your Meals data is deleted. Your Pixora login still works.");}catch(x){b.disabled=false;toast("Couldn't delete. Check the connection and try again.");}}
  else if(a==="export")K.exportCopy();
  else if(a==="feedback"){if(window.PixoraFeedback)PixoraFeedback.open("meals","Meals");}
  else if(a==="join")K.joinAccount();
  else if(a==="signout")K.signOut();
  else if(a==="close")closeDlg();
});
document.addEventListener("change",function(e){if(e.target.id==="days"){S.listDays=+e.target.value;save();render();}});
document.addEventListener("input",function(e){if(e.target.id==="rq"){q=e.target.value;var pos=e.target.selectionStart;render();var n=$("#rq");n.focus();try{n.setSelectionRange(pos,pos);}catch(x){}}});
$("#tabs").addEventListener("click",function(e){var b=e.target.closest("[data-tab]");if(!b)return;tab=b.dataset.tab;render();K.track("tab_"+tab);});
document.addEventListener("visibilitychange",function(){if(!document.hidden&&S&&tab==="plan")render();});

/* ---------- start ---------- */
K.boot({
  app:"meals",title:"Meals",version:"meals-v1",blurb:"Plan the week and get your grocery list.",
  clean:M.clean,
  onOpen:function(s,o){S=s;if(o&&o.fresh){S.seeded=true;save();}else if(!S.recipes.length&&!S.seeded){S.recipes=starters();S.seeded=true;save();}render();},
  onRemote:function(s){S=s;if(!$("#dlg").open)render();},
  onStatus:function(t){var st=$("#st");if(st)st.textContent=t;},
  onGate:function(shown){$("#app").hidden=shown;$("#tabs").hidden=shown;},
  /* For Pixora Today: today's meals and how much is left on the list. */
  summary:function(s){
    var t=today(),by={};s.recipes.forEach(function(r){by[r.id]=r;});
    var meals=(s.plan[t]||[]).map(function(m){return {slot:m.slot,n:m.rid&&by[m.rid]?by[m.rid].name:m.text};});
    var g=M.groceries(s,t,s.listDays),left=0;g.aisles.forEach(function(a){a[1].forEach(function(x){if(!s.checked[x.k])left++;});});
    var planned=0;for(var i=0;i<7;i++)if((s.plan[M.addDays(t,i)]||[]).length)planned++;
    return {d:t,today:meals,left:left,planned7:planned};
  }
});

document.addEventListener("change",function(e){
  if(e.target.id!=="restore"||!e.target.files[0])return;
  var f=e.target.files[0],r=new FileReader();e.target.value="";
  r.onload=function(){
    if(!confirm("Replace what's in Meals now with this copy? What's here now is replaced."))return;
    try{K.restoreCopy(String(r.result));toast("Restored from your copy.");}
    catch(x){toast(x&&x.code==="wrongapp"?"That copy is from "+(x.app||"another app")+", not Meals.":"That file isn't a Meals copy.");}
  };r.readAsText(f);
});
