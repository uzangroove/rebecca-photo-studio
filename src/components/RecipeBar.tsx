import {useState} from "react";
import {findItem} from "../../shared/catalog";
import {MAX_RECIPES, MAX_RECIPE_NAME, recipeMatches} from "../../shared/recipes";
import type {Studio} from "../useStudio";
import {Icon, icons} from "./Icon";

// סרגל מתכונים בכותרת: הפעלה בלחיצה, שמירה של המראה הנוכחי, ומחיקה של המתכון הפעיל.
export function RecipeBar({studio}: {studio: Studio}) {
  const {state, dispatch, chooseRecipe, saveRecipe} = studio;
  const [naming, setNaming] = useState(false), [name, setName] = useState(""), [menu, setMenu] = useState(false);
  const active = state.recipes.find(r => recipeMatches(state.selection, r));
  const suggestion = `${findItem("styles", state.selection.style)?.label} ${findItem("palettes", state.selection.palette)?.label}`;
  const full = state.recipes.length >= MAX_RECIPES;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveRecipe(name.trim() || suggestion);
    setName(""); setNaming(false);
  }
  return <div className="recipes-wrap">
    <button type="button" className="recipes-toggle pill small" aria-expanded={menu} onClick={() => setMenu(v => !v)}>
      <Icon d={icons.recipe} size={18}/>{active?.name ?? "מתכונים"}
    </button>
    <nav className={`recipes${menu ? " is-open" : ""}`} aria-label="מתכונים שמורים">
      <span className="recipes-label">מתכונים</span>
      {state.recipes.map(r => {
        const on = active?.id === r.id;
        return <span key={r.id} className="recipe">
          <button type="button" className={`recipe-btn${on ? " is-active" : ""}`} aria-pressed={on} onClick={() => {chooseRecipe(r); setMenu(false);}}>
            <span className="dots">{(findItem("palettes", r.look.palette)?.colors ?? []).map(c => <i key={c} style={{background: c}}/>)}</span>{r.name}
          </button>
          {on && <button type="button" className="recipe-del" aria-label={`מחיקת המתכון ${r.name}`}
            onClick={() => {if (window.confirm(`למחוק את המתכון "${r.name}"?`)) dispatch({type: "deleteRecipe", id: r.id});}}><Icon d={icons.trash} size={18}/></button>}
        </span>;
      })}
      {naming
        ? <form className="recipe-form" onSubmit={submit} onKeyDown={e => {if (e.key === "Escape") setNaming(false);}}>
          <input autoFocus value={name} maxLength={MAX_RECIPE_NAME} placeholder={suggestion} aria-label="שם המתכון" onChange={e => setName(e.target.value)}/>
          <button type="submit" className="pill small">שמירה</button>
        </form>
        : <button type="button" className="recipe-btn dashed" disabled={full} title={full ? "אפשר לשמור עד 20 מתכונים" : undefined} onClick={() => setNaming(true)}>+ שמירת מתכון</button>}
    </nav>
  </div>;
}
