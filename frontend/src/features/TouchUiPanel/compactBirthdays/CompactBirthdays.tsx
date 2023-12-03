import "./compactBirthdays.css";

import { getRecords, getDifference, getJsx } from "../../TouchUiMain/birthdays/birthdayHelpers.tsx";

function CompactBirthdays() {
    const records = getRecords(2);

    const recordsSelected: any[] = [];
    const maxRecords = 3;
    let hiddenBirthdaysToday = 0;
    let hiddenBirthdaysTomorrow = 0;

    records.forEach((record: any) => {
      const difference = getDifference(record);

      if (recordsSelected.length < maxRecords) {
          recordsSelected.push(record);
      } else {
        // No room, but there's more birthdays today
        if (difference === 0) {
          hiddenBirthdaysToday++;
        } if (difference > 0) {
          hiddenBirthdaysTomorrow++;
        }
      }
    })

    if (!recordsSelected.length) { 
      // Nothing to show.
      return
    };

    const fullSize = false;
    const birthdaysJsx = recordsSelected.map((record, index) => getJsx(record, index, fullSize));

    let hiddenBirthdaysJsx;

    if (hiddenBirthdaysToday) {
      hiddenBirthdaysJsx = <div className="hidden-birthdays hidden-birthdays-today">{hiddenBirthdaysToday} more!</div>
    } else if (hiddenBirthdaysTomorrow) {
      hiddenBirthdaysJsx = <div className="hidden-birthdays hidden-birthdays-tomorrow">{hiddenBirthdaysTomorrow} more!</div>

    }

    return (
        <div className="birthdays-compact-container">
            <div className="birthdays-label">
              Birthdays
              {hiddenBirthdaysJsx}
            </div>
            <div className="birthdays-compact-items-container">{birthdaysJsx}</div>
        </div>
    );
}

export default CompactBirthdays;
