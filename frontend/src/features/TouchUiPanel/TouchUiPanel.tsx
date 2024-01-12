import { getSelectedRecordsInfo } from "../TouchUiMain/birthdays/birthdayHelpers.tsx";
import constants from "../../constants.ts";
import Forecast from "./forecast/Forecast";
import Clock from "./clock/Clock";
import Temperature from "./temperature/Temperature";
import CompactTimer from "./compactTimer/CompactTimer";
import CompactBirthdays from "./compactBirthdays/CompactBirthdays";
import Scripture from "./scripture/Scripture";
import MasterSwitches from "./masterSwitches/MasterSwitches.tsx";
import Mailbox from "./mailbox/Mailbox.tsx";

import { getDeviceByChannel } from "../../devicesHelpers.tsx";

function TouchUiPanel(props: any) {  
  const birthdayRangeToDisplay = 1;
  const { recordsSelected } = getSelectedRecordsInfo(birthdayRangeToDisplay);  
  const showBirthdays = recordsSelected.length > 0;
  
  const mailbox = getDeviceByChannel(constants.touchPanel?.mailboxChannel);
  const showMailbox = mailbox?.powerState;
  
  return (
      <>
          <MasterSwitches {...props} />
          <CompactTimer />
          <Scripture {...props} />
              {showBirthdays && (
                  <CompactBirthdays
                      birthdayRangeToDisplay={birthdayRangeToDisplay}
                  />
              )}
              {!showBirthdays && <Temperature thermometersStartIndex={2} />}
              
              {showMailbox && <Mailbox />}
              {!showMailbox && <Temperature thermometersStartIndex={0} />}          
          <Forecast />
          <Clock />
      </>
  );
}

export default TouchUiPanel;