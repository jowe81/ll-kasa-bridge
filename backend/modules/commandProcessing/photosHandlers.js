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

function setFilter(command, deviceWrapper) {
    console.log("Hi from the setFilter handler", command);    
}

const handlers = {
    nextPicture,
    setFilter,
};

export default handlers; 