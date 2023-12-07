import { getSelectedRecordsInfo } from "../TouchUiMain/birthdays/birthdayHelpers.tsx";

import Forecast from "./forecast/Forecast";
import Clock from "./clock/Clock";
import Temperature from "./temperature/Temperature";
import CompactTimer from "./compactTimer/CompactTimer";
import CompactBirthdays from "./compactBirthdays/CompactBirthdays";
import Scripture from "./scripture/Scripture";



function TouchUiPanel() {
  const birthdayRangeToDisplay = 1;
  const { recordsSelected } = getSelectedRecordsInfo(birthdayRangeToDisplay);
  const showBirthdays = recordsSelected.length > 0;
  return (
      <>
          <Scripture />
          <CompactTimer />
          { showBirthdays && <CompactBirthdays birthdayRangeToDisplay={birthdayRangeToDisplay}/> }
          { !showBirthdays && <Temperature thermometersStartIndex={2} /> }
          <Temperature thermometersStartIndex={0} />
          <Forecast />
          <Clock />
      </>
  );
}

export default TouchUiPanel;