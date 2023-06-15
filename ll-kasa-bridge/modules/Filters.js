import Path from 'path';
import { getFileNames } from "../helpers/jUtils.js";
import { log } from "../helpers/jUtils.js";

const promises = [];

const filterFiles = getFileNames('./filters', import.meta.url);

let cachedFilterFunctions = {};

const getFilterFunctions = () => cachedFilterFunctions;

const loadFilterFunctions = async () => {

  // Have we loaded the functions already?
  if (Object.keys(cachedFilterFunctions).length) {
    return Promise.resolve(cachedFilterFunctions);
  }

  log(`Looking for filter plugins...`);

  Array.isArray(filterFiles) && filterFiles.forEach(fileName => {
    const filterName = Path.parse(fileName).name;
    
    log(`-> Loaded filter plugin '${filterName}'`);
    if (fileName) {
      promises.push(import(`./filters/${fileName}`));
    }
  
  });
    
  return Promise.all(promises).then(fns => {
    const filterFunctions = {};
  
    fns.forEach(fn => {
      const functionName = fn.default?.name;
      if (fn.default) {
        filterFunctions[functionName] = fn.default;
      }    
    })
  
    log(`Loaded ${Object.keys(filterFunctions).length} filter(s).`);

    // Cache them so next time we don't have to do the fs operations
    cachedFilterFunctions = filterFunctions;

    return filterFunctions;
  });
}

export { 
  loadFilterFunctions,
  getFilterFunctions,
};