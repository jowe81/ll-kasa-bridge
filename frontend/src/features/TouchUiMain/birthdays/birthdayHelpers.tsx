import constants from "../../../constants.ts";
import { getDynformsServiceRecords } from "./../../../dynformsHelpers";
import { getBirthdaysService } from "../../../devicesHelpers.tsx";

function getRecords(maxDifference: number = 0) {
    const service = getBirthdaysService();
    
    const allRecords = getDynformsServiceRecords(service?.channel) ?? [];
    const records = allRecords.filter((record) => record.show_birthday);
    
    if (maxDifference) {
      return records.filter(record => getDifference(record) <= maxDifference);
    }

    return records;
}

function getSelectedRecordsInfo(birthdayRangeToDisplay: number = 0) {
    const records = getRecords(birthdayRangeToDisplay);

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
            }
            if (difference > 0 && difference < 2) {
                hiddenBirthdaysTomorrow++;
            }
        }
    });

    return {
        recordsSelected,
        hiddenBirthdaysToday,
        hiddenBirthdaysTomorrow,
    };
}

function getDifference(record) {
    const [month, day] = record.date_of_birth_MMDD?.split("-");
    const birthdayDate = new Date();
    // The order here matters A LOT in a leap year. Call setDate first, then setMonth!
    birthdayDate.setDate(parseInt(day));
    birthdayDate.setMonth(parseInt(month) - 1);    
    birthdayDate.setHours(0, 0, 0, 0);    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // The rounding is necessary if there's a DST change in the timewindow.
    return Math.round((birthdayDate.getTime() - today.getTime()) / constants.DAY);
}

function getDisplayName(record, fullSize) {
    let displayName = record.first_name;

    if (fullSize) {
        if (record.middle_names) {
            if (record.middle_names.length + record.first_name.length > 12) {
                displayName += ` ${record.middle_names.substr(0, 1)}.`;    
            } else {
                displayName += ` ${record.middle_names}`;
            }            
        }
      displayName += ` ${record.last_name}`;
    } else {
        if (record.middle_names) {
            displayName += ` ${record.middle_names.substr(0, 1)}.`;   
        }
      displayName += ` ${record.last_name.substr(0,1)}.`;
    }

    const { date_of_birth_date } = record;

    if (date_of_birth_date) {
        const birthYear = new Date(date_of_birth_date).getFullYear();
        const thisYear = new Date().getFullYear();
        const age = thisYear - birthYear;

        if (age) {
            displayName += ` (${age})`;
        }
    }

    return displayName;
}

function getJsx(record, key, fullSize = true) {
    const displayName = getDisplayName(record, fullSize);
    const difference = getDifference(record);

    const baseClassPrefix = fullSize ? "birthday" : "birthday-compact";
    const baseClassName = `${baseClassPrefix}-item`;

    let displayDate;
    let displayClasses = `${baseClassName}-container`;

    switch (difference) {
        case -1:
            displayDate = "yesterday";
            displayClasses += ` ${baseClassName}-container-yesterday`;
            break;

        case 0:
            displayDate = "today";
            displayClasses += ` ${baseClassName}-container-today`;
            break;

        case 1:
            displayDate = "tomorrow";
            displayClasses += ` ${baseClassName}-container-tomorrow`;
            break;

        default:
            displayDate = `${difference} days`;
            displayClasses += ` ${baseClassName}-container-later`;
    }

    return (
        <div key={key} className={displayClasses}>
            <div className={`${baseClassName}-name`}>{displayName}</div>
            <div className={`${baseClassName}-date`}>{displayDate}</div>
        </div>
    );

}

export {
  getRecords,
  getSelectedRecordsInfo,
  getDifference,
  getDisplayName,
  getJsx,
};
