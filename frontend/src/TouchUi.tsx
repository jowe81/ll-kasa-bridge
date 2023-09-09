
import TouchUiMainColumn from "./TouchUiMainColumn";

import './touch.css';

function TouchUi() {
  return (
    <div className='touch-ui-container'>
      <TouchUiMainColumn columnId="1"/>
      <TouchUiMainColumn columnId="2"/>
      <TouchUiMainColumn columnId="3"/>
    </div>
  )
}

export default TouchUi;