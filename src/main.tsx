import {createRoot} from "react-dom/client";
import AuthGate from "./AuthGate";
import "./styles.css";
import {applyTheme, readLocalTheme} from "./theme";
applyTheme(readLocalTheme());
createRoot(document.getElementById("root")!).render(<AuthGate/>);
