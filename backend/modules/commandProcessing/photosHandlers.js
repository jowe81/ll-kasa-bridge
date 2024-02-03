/**
 * These are handlers used by the photos service
 * See configuration, channel 504
 * See frontend: Photos.tsx
 */
import _ from 'lodash';
import { log } from '../../modules/Log.js';

async function addTags(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const tagString = commandData?.body?.tagString;

    if (!tagString) {
        return;
    }

    const separator = tagString.includes(",") ? "," : " ";
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

        const excludeTags = ["and", "at", "edits", "edit", "for", "from", "in", "on", "the", "to", "with"];

        return tags
            .map((tag) => tag.toLowerCase())
            .filter((tag) => {
                const isAlpha = /^[a-zA-Z]+$/.test(tag);
                return !excludeTags.includes(tag) && isAlpha;
            });
    }
}

async function addRemoveTag(deviceWrapper, commandData) {
    let record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const tagString = commandData?.body?.tagString?.toLowerCase();

    if (tagString) {        
        if (!Array.isArray(record.tags)) {
            record.tags = [];
        }

        if (!record.tags.includes(tagString)) {
            //Add
            record.tags.push(tagString);
        } else {
            //Remove
            record.tags = record.tags.filter((item) => item.toLowerCase() !== tagString);
        }

        await updateRecord(deviceWrapper, record);
    }
}

async function addToRemoveFromCollection(deviceWrapper, commandData) {
    let record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const { collectionName } = commandData.body;

    if (collectionName) {
        if (!record.collections.includes(collectionName)) {
            //Add
            if (collectionName === "unsorted") {
                record.collections = [];
            } else if (collectionName === "trashed") {
                record.collections = ["trashed"];
            } else {
                if (record.collections.includes('trashed')) {
                    record.collections = [];
                }
                record.collections.push(collectionName);
            }
        } else {
            //Remove
            record.collections = record.collections.filter((item) => item !== collectionName);
        }
    }

    await updateRecord(deviceWrapper, record);
}

async function hideRestorePicture(deviceWrapper, commandData) {
    let record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }
    console.log(commandData);
    const cache = deviceWrapper.getCache();       

    if (commandData?.body?.hide) {
        // Cache the current state of the record so we can undo the operation.
        cache.hideRestorePicture = {
            recordBeforeHide: _.cloneDeep(record)
        }

        record.collections = ['trashed'];
        console.log(`HIDING ${record._id} (tags: ${record.tags.join(', ')}: ${JSON.stringify(record.collections)}}` )
    } else {
        // Restore if we have a cached copy.
        const recordBeforeHide = cache.hideRestorePicture?.recordBeforeHide;
        if (recordBeforeHide) {
            record = { ...recordBeforeHide }
        } else {
            record.collections = [];
        }
        console.log(`RESTORING ${record._id} (tags: ${record.tags.join(", ")}: ${JSON.stringify(record.collections)}}`);
    }
    
    await updateRecord(deviceWrapper, record);
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

async function setFilter(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    const filter = commandData?.body?.filter;
    if (!filter) {
        log(`Could not set filter - no data: ${JSON.stringify(filter)}`, deviceWrapper, 'red');
        return null;
    }
    
    // Grab the config of the first request.
    const requestInfo = deviceWrapper.settings?.requests?.length && deviceWrapper.settings?.requests[0];

    if (!requestInfo.query) {
        requestInfo.query = {}
    }

    let collectionsFilter, tagsFilter;

    if (filter.collections.length) {
        collectionsFilter = {collections: { [filter.mode_collections]: [...filter.collections]}};
    }

    if (filter.tags.length) {
        tagsFilter = {tags: {[filter.mode_tags]: [...filter.tags]}};
    }

    // Dates
    let startDateFilter, endDateFilter

    if (filter.startDate?.enabled || filter.endDate?.enabled) {
        let startDate, endDate;

        if (filter.startDate?.enabled) {
            startDate = new Date();
            startDate.setFullYear(filter.startDate.year);
            startDate.setMonth(filter.startDate.month - 1);
            startDate.setDate(filter.startDate.date);

            startDateFilter = { date: { $gte: `__DATE-${startDate.getTime()}` } };
        }

        if (filter.endDate?.enabled) {
            endDate = new Date();
            endDate.setFullYear(filter.endDate.year);
            endDate.setMonth(filter.endDate.month - 1);
            endDate.setDate(filter.endDate.date);

            endDateFilter = {date: { $lte: `__DATE-${endDate.getTime()}`}};
        }
    }

    // Add all the filters into a master $and filter.
    const $andMaster = [];
    [collectionsFilter, tagsFilter, startDateFilter, endDateFilter].forEach(filter => filter && $andMaster.push(filter));

    let mongoFilter = {};

    if ($andMaster.length) {
        mongoFilter = {
            $and: $andMaster
        }
    }

    console.log(mongoFilter);
    requestInfo.query.filter = mongoFilter;
    log(`Setting new filter: ${JSON.stringify(mongoFilter)}`, deviceWrapper);

    const newState = {
        ...deviceWrapper.state,        
    }

    if (!newState.uiInfo) {
        newState.uiInfo = {};
    }

    newState.uiInfo.filter = filter;
    deviceWrapper._updateState(newState, true);
    nextPicture(deviceWrapper, {});
}

async function toggleFavorites(deviceWrapper, commandData) {
    const record = getRecord(deviceWrapper);
    if (!record || !deviceWrapper?.deviceHandler) {
        return null;
    }

    // Handle favorites collection
    const favorites = 'favorites';

    if (!Array.isArray(record.collections) || record.collections.includes('trashed')) {
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
    addRemoveTag,
    addTags,
    addToRemoveFromCollection,
    hideRestorePicture,
    nextPicture,
    setFilter,
    setRating,
    toggleFavorites,
};

export default handlers; 