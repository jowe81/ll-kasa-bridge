import { useAppSelector } from "./app/hooks.ts";

import constants from "./constants.ts";

import { VirtualDevice } from "./features/TouchUiMain/devices/dataSlice.ts";

import { getDeviceByChannel } from './devicesHelpers.tsx';

function getDynformsServiceRecords(channel, requestIndex = 0) {
    const dynformsService: VirtualDevice = getDeviceByChannel(channel);
    if (!(dynformsService && dynformsService?.state?.requests)) {        
        return [];
    }    

    const records = dynformsService?.state?.requests[requestIndex].data?.records ?? [];
    return records;
}

// Return the first record.
function getFirstDynformsServiceRecord(channel, requestIndex = 0) {
    const records = getDynformsServiceRecords(channel, requestIndex);

    return Array.isArray(records) && records.length ? records[0] : null;
}

export {
  getDynformsServiceRecords,
  getFirstDynformsServiceRecord,
}