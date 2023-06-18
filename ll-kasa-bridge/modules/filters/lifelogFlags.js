import axios from "axios";
import { log } from '../Log.js';

const lifelogFlags = () => {  

  const cache = {
    // Store the responses from lifelog
    flags: {},

    // Register changes here when the callback returns; they'll be processed next time the filter runs.
    currentChanges: {},
  };


  

  /**
   * Apply filtering based on LifeLog flags
   */
  const execute = (filterObject, commandObject, deviceWrapper, filterFunctions) => {
    const { settings } = filterObject;
  
    const url = settings.lifelogUrl;

    if (url) {
      axios.get(url).then(data => {
        const llData = data.data;

        if (llData.flags) {        
          Object.keys(llData.flags).forEach((flag) => {

            const incomingValue = llData.flags[flag];
            const cachedValue = cache.flags[flag];

            if (typeof cachedValue !== 'boolean') {
              // Initial caching
              cache.flags[flag] = incomingValue;
            }

            // See if anything changed
            if (typeof cachedValue === 'boolean' && (incomingValue !== cachedValue)) {
              // Flag the change
              cache.currentChanges[flag] = true;

              // Update cache
              cache.flags[flag] = incomingValue;
            }

          });

          if (!settings?.flag) { 
            log(`${filterObject.label}: no trigger flag has been configured. Doing nothing.`, deviceWrapper, 'red');
          }

        } else {
          log(`${filterObject.label}: LifeLog returned unexpected or bad data. Doing nothing.`, deviceWrapper, 'red');
        }      
      });
    } else {
      log(`${filterObject.label}: LifeLog URL is missing. Doing nothing.`, deviceWrapper, 'red');
    }

    return processCurrentChanges(filterObject, commandObject, deviceWrapper);    
  }

  const processCurrentChanges = (filterObject, commandObject, deviceWrapper) => {
    
    const { settings, stateData } = filterObject;

    const flag = settings?.flag;
    
    if (flag && stateData) {

      if (cache.currentChanges[flag]) {        
        // Flag changed - apply filter
        Object.keys(stateData).forEach(stateKey => {
          const paramData = stateData[stateKey];
          const paramValue = cache.flags[flag] ? paramData?.altValue : paramData?.value;

          if (paramValue) {
            commandObject[stateKey] = paramValue;
          }          
        })

        // Clear the current change
        cache.currentChanges[flag] = false;
      }

    }

    return commandObject;
  }

  return { execute };  
}

export default lifelogFlags;