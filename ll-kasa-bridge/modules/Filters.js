import Path from 'path';
import { getFileNames } from "../helpers/jUtils.js";
import { log } from "../helpers/jUtils.js";

const promises = [];

const filterFiles = getFileNames('./filters', import.meta.url);

let cachedFilterPlugins = {};

const getFilterPlugins = () => cachedFilterPlugins;

const loadFilterPlugins = async () => {

  // Have we loaded the plugins already?
  if (Object.keys(cachedFilterPlugins).length) {
    return Promise.resolve(cachedFilterPlugins);
  }

  log(`Looking for filter plugins...`);

  Array.isArray(filterFiles) && filterFiles.forEach(fileName => {
    const filterName = Path.parse(fileName).name;
    
    log(`-> Loaded filter plugin '${filterName}'`);
    if (fileName) {
      promises.push(import(`./filters/${fileName}`));
    }
  
  });
    
  return Promise.all(promises).then(filterPluginsArray => {
    const filterPlugins = {};
  
    filterPluginsArray.forEach(plugin => {
      const pluginName = plugin.default?.name;
      filterPlugins[pluginName] = plugin;
    })
  
    log(`Loaded ${Object.keys(filterPlugins).length} filter(s).`);
    
    Object.keys(filterPlugins).forEach(pluginName => {
      const filterPlugin = filterPlugins[pluginName];

      /**
       * Initialize this plugin. The wrapper MUST return an execute function 
       * and may return additional functions and data.
       */
      const { execute, functions, data } = filterPlugin.default();
      
      if (!execute) {
        log(`Failed to initialize filter plugin '${pluginName}. Make sure it returns a function 'execute'.`, 'red');        
      }

      log(`Initialized filter plugin '${pluginName}'`);
      filterPlugins[pluginName] = { execute, functions, data };
    });

    // Cache them so next time we don't have to do the fs operations
    cachedFilterPlugins = filterPlugins;

    return filterPlugins;
  });
}

export { 
  loadFilterPlugins,
  getFilterPlugins,
};