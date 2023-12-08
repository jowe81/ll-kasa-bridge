import "./birthdays.css";

import { getRecords, getJsx } from "./birthdayHelpers.tsx";

function Birthdays() {

  const fullSize = true;
  const records = getRecords();

  const birthdaysJsx = records.length ? 
    records.map((record, index) => getJsx(record, index, fullSize)) :
    <div className="birthday-item-none">none upcoming</div>;

  // Show the cake background if there's lots of room...
  const birthdayItemSome = records.length < 3 ? <div className="birthday-item-some"></div> : null;

  return (
      <div className="birthdays-container">
          <div className="touch-ui-sub-panel-header">Birthdays</div>
          <div className="birthdays-items-container">
              {birthdaysJsx}
              {birthdayItemSome}
          </div>
      </div>
  );
}

export default Birthdays