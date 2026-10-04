import {ActionBar} from "./components/ActionBar";
import {BrandEditor} from "./components/BrandEditor";
import {Header} from "./components/Header";
import {IntroVideo} from "./components/IntroVideo";
import {HistoryStrip} from "./components/HistoryStrip";
import {OptionPanel} from "./components/OptionPanel";
import {Stage} from "./components/Stage";
import {TabRail} from "./components/TabRail";
import {useStudio} from "./useStudio";
import {useCallback, useState} from "react";

export default function Studio() {
  const studio = useStudio();
  const [intro, setIntro] = useState(true), endIntro = useCallback(() => setIntro(false), []);
  const {state, dispatch} = studio;
  if (state.screen === "editor") return <BrandEditor studio={studio}/>;
  return <div className="app">
    {intro && <IntroVideo onDone={endIntro}/>}
    <Header studio={studio}/>
    <div className="body">
      <TabRail tab={state.tab} onTab={tab => dispatch({type: "tab", tab})}/>
      <OptionPanel studio={studio}/>
      <div className="main">
        <Stage studio={studio}/>
        <ActionBar studio={studio}/>
        <HistoryStrip studio={studio}/>
      </div>
    </div>
  </div>;
}
