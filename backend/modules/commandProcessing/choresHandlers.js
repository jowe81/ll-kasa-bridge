/**
 * These are handlers used by the chores service
 * See configuration, chores-service
 * See frontend
 */
import _ from "lodash";
import { log } from "../../modules/Log.js";


async function doChore(deviceWrapper, command) {
    const {dynformsUsername, chore} = command?.body;
    if (!(dynformsUsername && chore)) {
        return null;
    }

    const record = {
        __user: {
            name: dynformsUsername,
        },
        chore,
    }
    return storeUpdateRecord(deviceWrapper, record);
}

async function toggleChore(deviceWrapper, command) {
}

function _processApiResponse(deviceWrapper, displayData, requestIndex) {
    const cache = deviceWrapper.getCache();
    return displayData;
}

function getRecords(deviceWrapper) {
    if (!deviceWrapper) {
        return {};
    }

    const records = deviceWrapper.state?.api?.data?.records;

    if (!(Array.isArray(records) && records.length)) {
        return [];
    }

    return records;
}

function getLastRecord(deviceWrapper) {    
}

async function storeUpdateRecord(deviceWrapper, record) {
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }
    const pushRequestIndex = 1

    const cache = deviceWrapper.getCache();

    return deviceWrapper.deviceHandler
        .runPushRequest(record, pushRequestIndex)
        .then((data) => {
            cache.data[pushRequestIndex] = data.data;
            deviceWrapper.deviceHandler.processCachedApiResponse(pushRequestIndex);
        })
        .catch((err) => {
            console.log(`Post request error. ${err.message}`);
        });
}

const handlers = {
    _processApiResponse, // Not for frontend use!
    doChore,
};

export default handlers;
