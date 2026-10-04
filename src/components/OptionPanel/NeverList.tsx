import {useState} from "react";
import {MAX_NEVER_CHARS, MAX_NEVER_ITEMS} from "../../../shared/settings";
import type {Studio} from "../../useStudio";
import {Icon, icons} from "../Icon";

// רשימת "אף פעם לא": נכנסת לכל פרומפט כ-Strictly avoid, ומסונכרנת בין המכשירים.
export function NeverList({studio}: {studio: Studio}) {
  const {neverList} = studio.state, {dispatch} = studio;
  const [adding, setAdding] = useState(false), [text, setText] = useState("");
  const full = neverList.length >= MAX_NEVER_ITEMS;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim()) dispatch({type: "neverAdd", text});
    setText(""); setAdding(false);
  }
  return <div className="never">
    <span className="never-title"><Icon d={icons.shield} size={18} strokeWidth={1.7}/>אף פעם לא</span>
    <div className="never-items">
      {neverList.map(item => <span key={item} className="chip">{item}
        <button type="button" aria-label={`הסרת ${item}`} onClick={() => dispatch({type: "neverRemove", text: item})}><Icon d={icons.close} size={16} strokeWidth={1.8}/></button>
      </span>)}
      {adding
        ? <form className="never-form" onSubmit={submit} onKeyDown={e => {if (e.key === "Escape") {setText(""); setAdding(false);}}}>
          <input autoFocus value={text} maxLength={MAX_NEVER_CHARS} placeholder="למשל: ורוד" aria-label="מה לא להכניס לתמונה" onChange={e => setText(e.target.value)}/>
          <button type="submit" className="pill small">הוספה</button>
        </form>
        : <button type="button" className="pill dashed small" disabled={full} title={full ? "הרשימה מלאה" : undefined} onClick={() => setAdding(true)}><Icon d={icons.plus} size={16}/>הוספה</button>}
    </div>
  </div>;
}
