import "./birthdays.css";

import { getRecords, getJsx } from "./birthdayHelpers.tsx";

function Birthdays() {

  const fullSize = true;
  const records = getRecords();

  const birthdaysJsx = records.length > 5 ? 
    records.map((record, index) => getJsx(record, index, fullSize)) :
    <div className="birthday-item-none">none upcoming</div>;

  return (
      <div className="birthdays-container">
          <div className="touch-ui-sub-panel-header">Birthdays</div>
          <div className="birthdays-items-container">{birthdaysJsx}</div>
      </div>
  );
}

export default Birthdays