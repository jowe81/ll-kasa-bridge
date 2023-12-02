import { useAppSelector } from "../../../app/hooks.ts";

import constants from "../../../constants.ts";

import "./birthdays.css";

import { VirtualDevice } from "../devices/dataSlice.ts";

function Birthdays() {

  const devices: VirtualDevice[] = useAppSelector(state => state.data.devices);
  const birthdays = devices.find(device => device.subType === constants.SUBTYPE_DYNFORMS_SERVICE && device.channel === constants.birthdays?.birthdayServiceChannel);
  
  const records = birthdays?.state.data.records;

  console.log(records);
  return (
    <div>Birthdays: {birthdays ? "found it!" : "naw :("} {devices.map(device => device.channel).join(',')}</div>
  )
}

export default Birthdays