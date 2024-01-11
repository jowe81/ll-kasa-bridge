import { useAppSelector } from "./app/hooks.ts";

import constants from "./constants.ts";

import { VirtualDevice } from "./features/TouchUiMain/devices/dataSlice.ts";

import { getDeviceByChannel } from './devicesHelpers.tsx';

function getDynformsServiceRecords(channel) {
    const dynformsService: VirtualDevice = getDeviceByChannel(channel);

    if (!dynformsService) {
      return [];
    }    

    // This path should be a backend parameter in configuration.js
    const records = dynformsService?.state?.api?.data?.records ?? [];
    return records;
}

// Return the first record.
function getDynformsServiceRecord(channel) {
    const records = getDynformsServiceRecords(channel);

    return Array.isArray(records) && records.length ? records[0] : null;
}

export {
  getDynformsServiceRecords,
  getDynformsServiceRecord,
}