import { useAppSelector } from "../../../app/hooks.ts";

import constants from "../../../constants.ts";

import "./birthdays.css";

import { VirtualDevice } from "../devices/dataSlice.ts";

function Birthdays() {

  const devices: VirtualDevice[] = useAppSelector(state => state.data.devices);
  const birthdayService = devices.find(device => device.subType === constants.SUBTYPE_DYNFORMS_SERVICE && device.channel === constants.birthdays?.birthdayServiceChannel);
  
  const records = birthdayService?.state?.api?.data?.records ?? [];

  const birthdaysJsx = records.map((record, index) => {
    let displayName = `${record.first_name} ${record.last_name}`;

    const { date_of_birth_date } = record;

    if (date_of_birth_date) {
      const birthYear = (new Date(date_of_birth_date)).getFullYear();
      const thisYear = (new Date()).getFullYear();
      const age = thisYear - birthYear;

      if (age) {
        displayName += ` (${age})`;
      }      
    }
    const [month, day] = record.date_of_birth_MMDD?.split('-');

    const birthdayDate = new Date();
    birthdayDate.setMonth(parseInt(month) - 1);
    birthdayDate.setDate(parseInt(day));
    birthdayDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const difference = (birthdayDate.getTime() - today.getTime()) / (constants.DAY);

    let displayDate;
    let displayClasses = "birthday-item-container";

    switch (difference) {
      case 0:
        displayDate = 'today';
        displayClasses += ' birthday-item-container-today';
        break;

      case 1:
        displayDate = 'tomorrow';
        displayClasses += " birthday-item-container-tomorrow";
        break;
      
      default:
        displayDate = `${difference} days`;
        displayClasses += " birthday-item-container-later";
        
    }

    return (
        <div key={index} className={displayClasses}>
            <div className="birthday-item-name">{displayName}</div>
            <div className="birthday-item-date">{displayDate}</div>
        </div>
    );
    

  });

  return (
      <div className="birthdays-container">
          <div className="touch-ui-sub-panel-header">Birthdays</div>
          <div className="birthdays-items-container">{birthdaysJsx}</div>
      </div>
  );
}

export default Birthdays