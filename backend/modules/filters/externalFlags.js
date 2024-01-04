import axios from "axios";
import _ from "lodash";

import { log, debug } from '../Log.js';
import constants from "../../constants.js";

const externalFlags = () => {  

  const LOG_TAG = 'externalFlags filter:';
  const DEFAULT_JSON_PATH = 'flags';
  const DEFAULT_POLLING_INTERVAL = constants.SECOND * 5;

  /**
   * This filter runs queries at an interval and stores data in a cache available to the execute method.
   * 
   * The interval loop populates a global cache and also flags changes for each device 
   * in a device-specific cache path.
   * 
   * When the device executes the filter, it interprets the changes found at that path.
   */
  const cache = {

    /**
     * Store unique URLs like so
     * 
     * urls: [
     *  { 
     *    url: 'https://www.example.com', 
     *    jsonPath: 'flags',
     *  }, ...
     * ]
     */
    urls: [],

    /**
     * Store the responses from the external server(s), keyed by url like so
     * 
     * responseData: {
     *  url1: {
     *    flags: {
     *      flag1: true,
     *      flag2: false,
     *    },
     *    currentChanges: {
     *    }
     *  },
     *  url2: {}...
     * }
     */
    responseData: {},

    // Register changes here when the callback returns; they'll be processed next time the filter runs.
    /**
     * Store device data like so
     * 
     * deviceData: {
     *  channel: {
     *    currentChanges: {},
     *    filterObject: {},
     *  }
     * }
     * 
     */
    deviceData: {},
    
  };


  /**
   * Apply filtering based on external flags
   */
  const execute = (filterObject, commandObject, deviceWrapper, filterPlugins) => {

    const { channel } = deviceWrapper;
    const { settings, stateData } = filterObject;
    const flag = settings?.flag;
    const url = settings?.url;
    const jsonPath = settings?.jsonPath ?? DEFAULT_JSON_PATH;

    if (!url) {
      log(`${filterObject.label}: Server URL is missing. Doing nothing.`, deviceWrapper, 'red');
      return commandObject;
    }

    if (!cache.deviceData[channel]) {
      // Initialize the cache for this channel
      cache.deviceData[channel] = {};
    }

    const deviceCache = cache.deviceData[channel];

    if (!Object.keys(deviceCache).length) {
      // Initialize cache data for this channel
      deviceCache.currentChanges = {};
      deviceCache.filterObject = _.cloneDeep(filterObject);
    }
      
    // Add the Url for this channel to the urls array if it's not in there yet
    if (url && !cache.urls.includes(url)) {
      const urlExists = cache.urls.find(urlInfo => urlInfo.url === url);

      if (!urlExists) { 
        cache.urls.push({ url, jsonPath });
      }
    }
          
    if (!(flag && stateData)) {
      // Incomplete configuration
      log(`flag name or stateData are missing from filter configuration. Doing nothing.`, deviceWrapper, 'red');
    }

    const responseData = cache.responseData[url];

    if(!responseData) {
      // No data (yet)
      return commandObject;
    }

    // Did the flag change?
    if (deviceCache.currentChanges[flag] === true) {        
      const newFlagValue = responseData.cachedFlags[flag];
    
      debug(`External flag ${flag} changed to ${newFlagValue}.`, deviceWrapper);
      
      Object.keys(stateData).forEach(stateKey => {
        const paramData = stateData[stateKey];
        const paramValue = newFlagValue ? paramData?.altValue : paramData?.value;

        if (typeof paramValue === 'number') {
          commandObject[stateKey] = paramValue;
        }          
      })

      // Clear the current change
      deviceCache.currentChanges[flag] = false;
    }

    return commandObject;
  }

  /**
   * Interpret raw data for each channel.
   * Reset global changes.
   */

  const flagChangesForDevices = () => {
    Object.keys(cache.deviceData).forEach(channel => {

      const { filterObject, currentChanges } = cache.deviceData[channel];

      const { settings } = filterObject;

      const url = settings.url;

      // Copy the latest data into the cache for this device

      const deviceCache = cache.deviceData[channel];
      const newData = cache.responseData[url];

      // Push only the changes that did happen to the device cache (do not override unprocessed changes)
      Object.keys(newData.latestChanges).forEach(flag => {
        if (newData.latestChanges[flag] === true) {
          deviceCache.currentChanges[flag] = true;
        }
      });

      deviceCache.flags = newData.cachedFlags;

    });

  }

  /**
   * Query the urls, then update the global cache
   * and flag any changes on each device cache.
   */
  const retrieveData = () => {

    const urls = cache.urls;

    urls.forEach(urlInfo => {                  
      axios.get(urlInfo.url).then((data) => {          
        storeDataAndFlagLatestChangesGlobally(data.data, urlInfo);
        flagChangesForDevices();
      }).catch((e) => {
        // console.log('Axios error');
      });
    });
  };


  /**
   * Put the new data into cache.responseData[url].data
   * and flag changes in cache.responseData[url].latestChanges
   */
  const storeDataAndFlagLatestChangesGlobally = (responseData, urlInfo) => {
    const { url, jsonPath } = urlInfo;
    const incomingFlags = responseData[jsonPath];
    
    if (!incomingFlags) {
      log(`${LOG_TAG} ${url} did not return data at path ${jsonPath}. Check url and jsonPath settings.`, null, 'red');
      return;
    }
     
    if (!cache.responseData[url]) {
      cache.responseData[url] = {
        cachedFlags: {},
        latestChanges: {},
      }
    }

    const cachedResponse = cache.responseData[url];
    const { cachedFlags, latestChanges } = cachedResponse;
    
    // Compare stored data with incoming
    Object.keys(incomingFlags).forEach(flag => {
      
      const cachedValue = cachedFlags[flag];
      const incomingValue = incomingFlags[flag];

      if (!typeof incomingValue === 'boolean') {
        log(`${LOG_TAG} ${url} did not return a valid value for ${flag}. Expected boolean, got ${typeof incomingValue}.`);
      }
              
      if (!typeof cachedValue === 'boolean') {
        cachedFlags[flag] = incomingValue;
      }

      // See if anything changed
      if (incomingValue !== cachedValue) {
        // Flag the change globally
        latestChanges[flag] = true;

        // Update global cache
        cachedFlags[flag] = incomingValue;
      } else {
        // Reset the global change
        latestChanges[flag] = false;
      }

    });
  }

  const checkFlagStateOnUrl = (url, flagName) => {
    const data = cache.responseData[url];

    if (!(data && data.cachedFlags)) {
      // Have no data from this url
      return null;
    }

    const state = data.cachedFlags[flagName];

    if (typeof state !== 'boolean') {
      // Have no data for this flag
      return null;
    }
  
    return state;
  }
  
  // On initialization, prepare to spin up a polling loop for the url.
  const pollingLoop = setInterval(retrieveData, DEFAULT_POLLING_INTERVAL);
  log(`${LOG_TAG} Started the polling loop. Interval is ${DEFAULT_POLLING_INTERVAL} ms.`);

  return { 
    execute,

    // Return the cache reference so that other filters an make decisions based on flagstate
    data: cache,

    functions: {
      checkFlagStateOnUrl
    }
  };  
}

export default externalFlags;