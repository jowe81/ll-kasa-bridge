import "./compactBirthdays.css";

import { getSelectedRecordsInfo, getJsx } from "../../TouchUiMain/birthdays/birthdayHelpers.tsx";

function CompactBirthdays({birthdayRangeToDisplay}) {
    
    const { recordsSelected, hiddenBirthdaysToday, hiddenBirthdaysTomorrow } = getSelectedRecordsInfo(birthdayRangeToDisplay);

    const fullSize = false;

    const haveEntriesToShow = recordsSelected.length > 0;
    
    const birthdaysJsx = recordsSelected
        .slice(0, 3) // Show a max of 3.
        .map((record, index) => getJsx(record, index, fullSize));
    
    let hiddenBirthdaysJsx;

    if (haveEntriesToShow) {
        if (hiddenBirthdaysToday) {
            hiddenBirthdaysJsx = <div className="hidden-birthdays hidden-birthdays-today">{hiddenBirthdaysToday} more!</div>
        } else if (hiddenBirthdaysTomorrow) {
            hiddenBirthdaysJsx = <div className="hidden-birthdays hidden-birthdays-tomorrow">{hiddenBirthdaysTomorrow} more!</div>
        }
    }

    return (
        <div className="touch-ui-panel-item">
            <div className="birthdays-compact-container">
                <div className="birthdays-label">
                    Birthdays
                    {hiddenBirthdaysJsx}
                </div>
                {haveEntriesToShow && <div className="birthdays-compact-items-container">{birthdaysJsx}</div>}
                {!haveEntriesToShow && <div className="compact-birthdays-none">None Imminent</div>}
            </div>
        </div>
    );
}

export default CompactBirthdays;
