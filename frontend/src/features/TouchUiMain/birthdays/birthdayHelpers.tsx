import { useAppSelector } from "../../../app/hooks.ts";

import constants from "../../../constants.ts";

import { VirtualDevice } from "../devices/dataSlice.ts";

function getRecords(maxDifference: number = 0) {
    const devices: VirtualDevice[] = useAppSelector(
        (state) => state.data.devices
    );
    const birthdayService = devices.find(
        (device) =>
            device.subType === constants.SUBTYPE_DYNFORMS_SERVICE &&
            device.channel === constants.birthdays?.birthdayServiceChannel
    );

    const records = birthdayService?.state?.api?.data?.records ?? [];

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
            if (difference > 0) {
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
    birthdayDate.setMonth(parseInt(month) - 1);
    birthdayDate.setDate(parseInt(day));
    birthdayDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (birthdayDate.getTime() - today.getTime()) / constants.DAY;
}

function getDisplayName(record, fullSize) {
    let displayName = record.first_name;

    if (fullSize) {
      displayName += ` ${record.last_name}`;
    } else {
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
