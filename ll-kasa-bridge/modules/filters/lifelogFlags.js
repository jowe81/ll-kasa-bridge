import axios from "axios";
import { log } from '../Log.js';

const lifelogFlags = () => {  

  const cache = {};

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
          cache.flags = llData.flags;
        }      
      });
    }
  
    //console.log('Currently in cache: ', cache);
  
    return commandObject;
  }

  return { execute };  
}

export default lifelogFlags;