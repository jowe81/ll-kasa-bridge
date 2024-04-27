import { getSelectedRecordsInfo } from "../TouchUiMain/birthdays/birthdayHelpers.tsx";
import constants from "../../constants.ts";
import Forecast from "./forecast/Forecast";
import Clock from "./clock/Clock";
import Temperature from "./temperature/Temperature";
import CompactTimer from "./compactTimer/CompactTimer";
import CompactBirthdays from "./compactBirthdays/CompactBirthdays";
import CompactCalendar from "./compactCalendar/CompactCalendar.tsx";
import Alerts from "./alerts/Alerts.tsx";
import Notes from "./notes/Notes.tsx";
import MasterSwitches from "./masterSwitches/MasterSwitches.tsx";
import DevicePresetButtons from "./devicePresetButtons/devicePresetButtons.tsx";
import Mailbox from "./mailbox/Mailbox.tsx";
import ServerStatus from "./ServerStatus/ServerStatus.tsx";

import { getDeviceByChannel, getAlerts } from "../../devicesHelpers.tsx";

function TouchUiPanel(props: any) {
    const panelMode = props.screenMode === "panel";
    const controlsMode = props.screenMode === "controls";
    const birthdayRangeToDisplay = 2;
    const { recordsSelected } = getSelectedRecordsInfo(birthdayRangeToDisplay);
    const showBirthdays = panelMode && recordsSelected.length >= 0;

    const mailbox = getDeviceByChannel(constants.touchPanel?.mailboxChannel);
    const showMailbox = mailbox?.powerState;

    const alerts = getAlerts().filter(alert => !alert.dismissed);

    return (
        <>
            <MasterSwitches {...props} />
            {!panelMode && <DevicePresetButtons {...props} />}
            {panelMode && <CompactTimer />}
            {panelMode && <CompactCalendar />}
            {showBirthdays && <CompactBirthdays birthdayRangeToDisplay={birthdayRangeToDisplay} />}

            {controlsMode && <Notes />}
            {controlsMode && alerts.length > 0 && <Alerts alerts={alerts} />}
            {controlsMode && !alerts.length && <ServerStatus />}
            {panelMode && alerts.length > 0 && <Alerts alerts={alerts} />}
            {panelMode && alerts.length === 0 && <Notes />}
            <Temperature thermometersStartIndex={2} />

            {showMailbox && <Mailbox />}
            {!showMailbox && <Temperature thermometersStartIndex={0} />}
            <Forecast />
            <Clock />
        </>
    );
}

export default TouchUiPanel;
