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
    const filterFunctionWrappers = {};
  
    fns.forEach(fn => {
      const functionName = fn.default?.name;
      if (fn.default) {
        filterFunctionWrappers[functionName] = fn.default;
      }    
    })
  
    log(`Loaded ${Object.keys(filterFunctionWrappers).length} filter(s).`);

    const filterFunctions = []
    
    Object.keys(filterFunctionWrappers).forEach(functionName => {

      const filterFunctionWrapper = filterFunctionWrappers[functionName];

      // The filter function wrapper must return an execute function.
      const { execute } = filterFunctionWrapper();
            
      if (!execute) {
        log(`Failed to initialize filter plugin '${functionName}. Make sure it returns a function 'execute'.`, 'red');        
      }

      filterFunctions[functionName] = execute;
      log(`Initialized filter plugin '${functionName}'`);
    });

    // Cache them so next time we don't have to do the fs operations
    cachedFilterFunctions = filterFunctions;

    return filterFunctions;
  });
}

export { 
  loadFilterFunctions,
  getFilterFunctions,
};