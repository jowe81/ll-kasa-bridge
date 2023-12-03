import "./birthdays.css";

import { getRecords, getJsx } from "./birthdayHelpers.tsx";

function Birthdays() {

  const fullSize = true;
  const records = getRecords();

  const birthdaysJsx = records.map((record, index) => getJsx(record, index, fullSize));

  return (
      <div className="birthdays-container">
          <div className="touch-ui-sub-panel-header">Birthdays</div>
          <div className="birthdays-items-container">{birthdaysJsx}</div>
      </div>
  );
}

export default Birthdays