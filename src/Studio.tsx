import {ActionBar} from "./components/ActionBar";
import {Header} from "./components/Header";
import {HistoryStrip} from "./components/HistoryStrip";
import {OptionPanel} from "./components/OptionPanel";
import {Stage} from "./components/Stage";
import {TabRail} from "./components/TabRail";
import {useStudio} from "./useStudio";

export default function Studio() {
  const studio = useStudio();
  const {state, dispatch} = studio;
  return <div className="app">
    <Header sync={state.sync}/>
    <div className="body">
      <TabRail tab={state.tab} onTab={tab => dispatch({type: "tab", tab})}/>
      <OptionPanel studio={studio}/>
      <div className="main">
        <Stage studio={studio}/>
        <ActionBar studio={studio}/>
        <HistoryStrip items={state.history} onOpen={studio.openRecent}/>
      </div>
    </div>
  </div>;
}
