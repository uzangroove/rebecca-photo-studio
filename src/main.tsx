import {createRoot} from "react-dom/client";
import Studio from "./Studio";
import "./styles.css";
import {applyTheme, readLocalTheme} from "./theme";
applyTheme(readLocalTheme());
createRoot(document.getElementById("root")!).render(<Studio/>);
