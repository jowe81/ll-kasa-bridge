/**
 * These are handlers used by the photos service
 * See configuration, channel 504
 * See frontend: Photos.tsx
 */


/**
 *  Load the next picture. 
 */
function nextPicture({ channel, id, body }, deviceWrapper) {
    deviceWrapper.deviceHandler.runRequestNow(0);
}

/**
 * Add Url field to actual picture in the api response data.
 */
function processApiResponse(deviceWrapper, displayData) {
    const records = displayData.data?.records;
    const record = records.length && records[0] ? records[0] : null;

    if (record) {
        const baseUrl = deviceWrapper.settings.photosServiceBaseUrl;
        const url = `${baseUrl}/photo?_id=${record._id}`;

        displayData.data.records[0].url = url;
    }
    
    return displayData;    
}


function setFilter(command, deviceWrapper) {
    console.log("Hi from the setFilter handler", command);    
}

const handlers = {
    processApiResponse,
    nextPicture,
    setFilter,
};

export default handlers; 