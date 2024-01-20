/**
 * These are handlers used by the photos service
 * See configuration, channel 504
 * See frontend: Photos.tsx
 */


async function hideRestorePicture(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const rating = commandData?.body?.hide ? -1 : 0;

    return await setRating(deviceWrapper, { rating });
}

function nextPicture(deviceWrapper, { channel, id, body }) {
    deviceWrapper.deviceHandler.runRequestNow(0);
}

async function setRating(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const cache = deviceWrapper.getCache();    
    record.rating = commandData?.rating;

    deviceWrapper.deviceHandler
        .runPushRequest(record)
        .then((data) => {
            cache.data[0] = data.data;
            deviceWrapper.deviceHandler.processCachedApiResponse();
        })
        .catch((err) => {
            console.log(`Post request error. ${err.message}`);
        });
}

async function toggleFavorites(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    return await setRating(deviceWrapper, {
        rating: !record.rating || record.rating < 5 ? 5 : 0,
    });
}

/**
 * Add Url field to actual picture in the api response data.
 */
function _processApiResponse(deviceWrapper, displayData) {
    const records = displayData.data?.records;
    const record = records?.length && records[0] ? records[0] : null;

    if (record) {
        const baseUrl = deviceWrapper.settings.photosServiceBaseUrl;
        const url = `${baseUrl}/photo?_id=${record._id}`;

        displayData.data.records[0].url = url;
    }

    return displayData;    
}


function setFilter(deviceWrapper, commandData) {
    console.log("Hi from the setFilter handler", commandData);    
}

// Get the current photo record.
function getRecord(deviceWrapper) {
    if (!deviceWrapper) {
        return {};
    }
    
    const records = deviceWrapper.state?.api?.data?.records;

    if (!(Array.isArray(records) && records.length)) {
        return {};
    }

    return records[0];
}

const handlers = {
    _processApiResponse, // Not for frontend use!
    hideRestorePicture,
    nextPicture,
    setFilter,
    toggleFavorites,
};

export default handlers; 