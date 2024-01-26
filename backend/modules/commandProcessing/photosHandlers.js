/**
 * These are handlers used by the photos service
 * See configuration, channel 504
 * See frontend: Photos.tsx
 */
import _ from 'lodash';

async function hideRestorePicture(deviceWrapper, commandData) {
    let record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const cache = deviceWrapper.getCache();       

    if (commandData?.body?.hide) {
        // Cache the current state of the record so we can undo the operation.
        cache.hideRestorePicture = {
            recordBeforeHide: _.cloneDeep(record)
        }

        record.rating = -1;
        record.collections = [];
    } else {
        // Restore if we have a cached copy.
        const recordBeforeHide = cache.hideRestorePicture?.recordBeforeHide;
        if (recordBeforeHide) {
            record = { ...recordBeforeHide }
        } else {
            record.rating = 0;
            record.collections = [];
        }
    }
    
    return await updateRecord(deviceWrapper, record);    
}

function nextPicture(deviceWrapper, { channel, id, body }) {
    deviceWrapper.deviceHandler.runRequestNow(0);
}

async function setRating(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    record.rating = commandData?.rating;
    
    return await updateRecord(deviceWrapper, record);
}

function setFilter(deviceWrapper, commandData) {
    console.log("Hi from the setFilter handler", commandData);
}

async function toggleFavorites(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    // Handle favorites collection
    const favorites = 'favorites';

    if (!Array.isArray(record.collections)) {
        record.collections = [];
    }
    
    if (record.collections.includes(favorites)) {
        record.collections = record.collections.filter(collection => collection !== favorites);
    } else {
        record.collections.push(favorites);
    }

    // Handle rating
    record.rating = !record.rating || record.rating < 5 ? 5 : 0;

    return await updateRecord(deviceWrapper, record);
}

async function addTags(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const tagString = commandData?.body?.tagString;
    
    if (!tagString) {
        return;
    }

    const separator = tagString.includes(',') ? ',' : ' ';
    const newTags = tagString.trim().split(separator);
    
    const updatedTags = Array.isArray(record.tags) ? [...record.tags, ...newTags] : newTags;
    
    record.tags = filterTags(updatedTags);
    return await updateRecord(deviceWrapper, record);

    /**
     * This is copied from Photos - should be solved differently.
     */
    function filterTags(tags) {
        if (!(tags && tags.length)) {
            return [];
        }

        const excludeTags = [
            'and',
            'at',
            'edits',
            'edit',
            'for',
            'from',
            'in',
            'on',
            'the',
            'to',
            'with',
        ]

        return tags
            .map((tag) => tag.toLowerCase())
            .filter((tag) => {
                const isAlpha = /^[a-zA-Z]+$/.test(tag);
                return !excludeTags.includes(tag) && isAlpha;
            });
            
    }
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

async function updateRecord(deviceWrapper, record) {
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const cache = deviceWrapper.getCache();

    return deviceWrapper.deviceHandler
        .runPushRequest(record)
        .then((data) => {
            cache.data[0] = data.data;
            deviceWrapper.deviceHandler.processCachedApiResponse();
        })
        .catch((err) => {
            console.log(`Post request error. ${err.message}`);
        });
}

const handlers = {
    _processApiResponse, // Not for frontend use!
    addTags,
    hideRestorePicture,
    nextPicture,
    setFilter,
    setRating,
    toggleFavorites,
};

export default handlers; 