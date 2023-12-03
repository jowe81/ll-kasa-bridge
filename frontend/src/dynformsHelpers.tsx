import { useAppSelector } from "./app/hooks.ts";

import constants from "./constants.ts";

import { VirtualDevice } from "./features/TouchUiMain/devices/dataSlice.ts";

function getDynformsServiceRecords(channel) {
    const devices: VirtualDevice[] = useAppSelector((state) => state.data.devices);
    const dynformsService = devices.find(
        (device) =>
            device.subType === constants.SUBTYPE_DYNFORMS_SERVICE &&
            device.channel === channel
    );
    
    const records = dynformsService?.state?.api?.data?.records ?? [];
    return records;
}

export {
  getDynformsServiceRecords,
}