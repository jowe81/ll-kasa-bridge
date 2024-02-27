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

    log(`Storing chore record`, deviceWrapper, "yellow");
    await storeUpdateRecord(deviceWrapper, record);
    log(`Requesting chores table reload`, deviceWrapper, "yellow");
    await deviceWrapper.deviceHandler.runRequestNow(0, {});    
}

async function toggleChore(deviceWrapper, command) {
}

function _processApiResponse(deviceWrapper, displayData, requestIndex) {
    const cache = deviceWrapper.getCache();
    const records = displayData.data?.records;
    
    return getChoresInfoByUser(deviceWrapper, records);
}


function getChoresInfoByUser(deviceWrapper, records) {
    const users = deviceWrapper.settings?.custom?.users;
    const chores = deviceWrapper.settings?.custom?.chores;

    if (!users || !chores) {
        return {};
    }

    const displayData = {};

    users.forEach((user) => {
        displayData[user.id] = {
            chores: chores
                .filter((chore) => chore.user === user.id)
                .sort((a, b) => (a.label > b.label ? 1 : -1)),
            records: records.filter((record) => record.__user?.name === user.name),
        };
    });

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
