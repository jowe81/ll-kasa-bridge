import { VirtualDevice } from "./features/TouchUiMain/devices/dataSlice.ts";

import { getDeviceByChannel } from './devicesHelpers.tsx';

function getDynformsServiceRecords(channel, requestIndex = 0, useLastReturnedRequest) {
    const dynformsService: VirtualDevice = getDeviceByChannel(channel);
    if (!(dynformsService && dynformsService?.state?.requests)) {
        return [];
    }

    const requestIndexToUse = useLastReturnedRequest ? dynformsService?.state?.requests?.lastReturnedRequestIndex : requestIndex;
    const records = dynformsService?.state?.requests[requestIndexToUse].data?.records ?? [];
    return records;
}

// Return the first record.
function getFirstDynformsServiceRecord(channel, requestIndex = 0, useLastReturnedRequest = false) {
    const records = getDynformsServiceRecords(channel, requestIndex, useLastReturnedRequest);
    return Array.isArray(records) && records.length ? records[0] : null;
}

function getFirstDynformsServiceRecordFromLastRequest(channel) {
    return getFirstDynformsServiceRecord(channel, undefined, true);
}


export {
  getDynformsServiceRecords,
  getFirstDynformsServiceRecord,
  getFirstDynformsServiceRecordFromLastRequest,
}