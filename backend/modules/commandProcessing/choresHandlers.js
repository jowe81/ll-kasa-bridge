/**
 * These are handlers used by the chores service
 * See configuration, chores-service
 * See frontend
 */
import _ from "lodash";
import { log } from "../../modules/Log.js";
import { isToday } from "../../helpers/jDateTimeUtils.js";

async function doChore(deviceWrapper, dynformsUserId, chore) {
    if (!(dynformsUserId && chore)) {
        return null;
    }

    const record = {
        __user: {
            id: dynformsUserId,
        },
        chore,
    };

    log(`Storing chore record`, deviceWrapper, "yellow");
    await storeUpdateRecord(deviceWrapper, record);
    log(`Requesting chores table reload`, deviceWrapper, "yellow");
    await deviceWrapper.deviceHandler.runRequestNow(0, {});
}

async function removeChore(deviceWrapper, choreRecord) {
    if (!choreRecord?._id) {
        log(`Unable to remove chore record - no id provided.`, deviceWrapper, "red");
        return null;
    }

    log(`Removing chore record ${choreRecord._id}`, deviceWrapper, "yellow");
    const deleteResult = await deleteRecord(deviceWrapper, choreRecord._id);
    
    if (deleteResult.status !== 200) {
        log(`Unable to remove chore record ${choreRecord._id} - dynforms returned a non-200 status code`, deviceWrapper, "bgRed");
    } else if (deleteResult.data.deletedCount !== 1) {
        log(`Unable to remove chore record ${choreRecord._id} - dynforms did not acknowledge the deletion (record may not exist anymore).`, deviceWrapper, "red");
    }
    log(`Requesting chores table reload`, deviceWrapper, "yellow");
    await deviceWrapper.deviceHandler.runRequestNow(0, {});

    return deleteResult;
}

async function toggleChore(deviceWrapper, command) {
    const dynformsUserId = command?.body?.dynformsUserId;
    const choreId = command?.body?.choreId;
    if (!(dynformsUserId && choreId)) {
        return null;
    }

    const choresInfo = getChoresInfoByUser(deviceWrapper, dynformsUserId);    
    const chore = choresInfo?.chores?.find(chore => chore.id === choreId);

    const choreRecord = choreDoneToday(dynformsUserId, chore, choresInfo.records);
    if (choreRecord) {        
        const result = await removeChore(deviceWrapper, choreRecord);
    } else {        
        await doChore(deviceWrapper, dynformsUserId, chore);
    }
}

function choreDoneToday(dynformsUserId, chore, records) {
    if (!dynformsUserId || !chore || !records) {
        return null;
    }

    return records.find(
        (record) => isToday(new Date(record.created_at)) && record.chore?.id === chore.id && record.__user.id === dynformsUserId
    );
}

function _processApiResponse(deviceWrapper, displayData, requestIndex) {
    const cache = deviceWrapper.getCache();
    const records = displayData.data?.records;
    
    return getChoresInfoByUserFromRawRecords(deviceWrapper, records);
}

function getChoresInfoByUserFromRawRecords(deviceWrapper, records) {
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
            records: records.filter((record) => record.__user?.id === user.id),
        };
    });

    return displayData;
}

function getChoresInfoByUser(deviceWrapper, dynformsUserId) {
    if (!deviceWrapper) {
        return {};
    }

    if (!deviceWrapper.state?.requests) {
        return {};
    }

    const requestInfo = deviceWrapper.state.requests[0];
    if (!requestInfo) {
        return {};
    }

    return requestInfo[dynformsUserId];
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

async function deleteRecord(deviceWrapper, recordId) {
    if (!recordId || !deviceWrapper?.deviceHandler) {
        return null;
    }
    const deleteByIdRequestIndex = 2;

    return deviceWrapper.deviceHandler
        .runDeleteByIdRequest(recordId, deleteByIdRequestIndex)
        .catch(err => log(`DeleteById request error. ${err.message}`, deviceWrapper, "bgRed"));
}

const handlers = {
    _processApiResponse, // Not for frontend use!
    doChore,
    toggleChore,
};

export default handlers;
