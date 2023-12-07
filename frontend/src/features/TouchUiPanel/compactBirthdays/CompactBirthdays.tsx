import "./compactBirthdays.css";

import { getSelectedRecordsInfo, getJsx } from "../../TouchUiMain/birthdays/birthdayHelpers.tsx";

function CompactBirthdays({birthdayRangeToDisplay}) {
    
    const { recordsSelected, hiddenBirthdaysToday, hiddenBirthdaysTomorrow } = getSelectedRecordsInfo(birthdayRangeToDisplay);

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
        <div className="touch-ui-panel-item">
            <div className="birthdays-compact-container">
                <div className="birthdays-label">
                    Birthdays
                    {hiddenBirthdaysJsx}
                </div>
                <div className="birthdays-compact-items-container">
                    {birthdaysJsx}
                </div>
            </div>
        </div>
    );
}

export default CompactBirthdays;
