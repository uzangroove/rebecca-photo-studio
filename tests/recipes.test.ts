import {test} from "node:test";
import assert from "node:assert/strict";
import {applyRecipe,builtInRecipes,lookOf,parseRecipe,parseRecipes,recipeMatches,MAX_RECIPES} from "../shared/recipes.ts";
import {buildPrompt} from "../shared/build-prompt.ts";
import {defaultSelection,parseSelection} from "../shared/selection.ts";
import {defaultSettings} from "../shared/settings.ts";

test("there are four built-in recipes with the agreed looks",()=>{
  assert.deepEqual(builtInRecipes.map(r=>r.name),["בוטיק שחור-לבן","בוטיק מדבר","מינימליסטי שחור-לבן","מינימליסטי מדבר"]);
  const [bw,boutiqueDesert,minimalBw,minimalDesert]=builtInRecipes.map(r=>r.look);
  assert.deepEqual([bw.style,bw.palette,bw.surface,bw.props],["boutique","mono","paper","none"]);
  assert.deepEqual([boutiqueDesert.style,boutiqueDesert.palette,boutiqueDesert.surface,boutiqueDesert.props],["boutique","desert","plaster","subtle"]);
  assert.deepEqual([minimalBw.style,minimalBw.palette,minimalBw.surface,minimalBw.props],["minimal","mono","paper","none"]);
  assert.deepEqual([minimalDesert.style,minimalDesert.palette,minimalDesert.surface,minimalDesert.props,minimalDesert.light],["minimal","desert","linen","none","window"]);
});
test("the opening selection is the minimalist black-and-white recipe",()=>{
  const opening=builtInRecipes.find(r=>r.id==="minimal-bw")!;
  assert.ok(recipeMatches(defaultSelection,opening));
  assert.equal(defaultSelection.product,"soap");
});
test("every recipe produces a valid selection and a prompt, on top of any product",()=>{
  for(const recipe of builtInRecipes)for(const product of ["soap","candle"]){
    const selection=applyRecipe({...defaultSelection,product,wish:"בקשה"},recipe);
    assert.deepEqual(parseSelection(selection),selection,recipe.id);
    assert.equal(selection.product,product);
    assert.equal(selection.wish,"בקשה","a recipe never touches the special request");
    assert.ok(buildPrompt(selection,defaultSettings).includes("Strictly avoid: שיש, עומס."));
  }
});
test("a recipe is active only while the selection matches it exactly",()=>{
  const recipe=builtInRecipes[3];
  const applied=applyRecipe(defaultSelection,recipe);
  assert.ok(recipeMatches(applied,recipe));
  assert.ok(!recipeMatches({...applied,palette:"mono"},recipe));
  assert.ok(!recipeMatches({...applied,light:null},recipe));
  assert.deepEqual(lookOf(applied),recipe.look);
});
test("saved recipes are validated against the catalog",()=>{
  const good={id:"r-1",name:" שלי ",look:builtInRecipes[0].look};
  assert.equal(parseRecipe(good)?.name,"שלי");
  assert.equal(parseRecipe({...good,name:""}),null);
  assert.equal(parseRecipe({...good,name:"x".repeat(41)}),null);
  assert.equal(parseRecipe({...good,name:"a\nb"}),null);
  assert.equal(parseRecipe({...good,id:"bad id!"}),null);
  assert.equal(parseRecipe({...good,look:{...good.look,style:"nope"}}),null);
  assert.equal(parseRecipe({...good,look:{...good.look,surface:"gold"}}),null);
  assert.equal(parseRecipes([good,good]),null,"duplicate ids");
  assert.equal(parseRecipes(Array.from({length:MAX_RECIPES+1},(_,i)=>({...good,id:`r-${i}`}))),null);
  assert.deepEqual(parseRecipes([]),[]);
});
