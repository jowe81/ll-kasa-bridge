import Path from 'path';
import { getFileNames } from "../helpers/jUtils.js";
import { log } from "../helpers/jUtils.js";

const promises = [];

const handlerFiles = getFileNames('./virtualDeviceProcessing', import.meta.url);

let cachedDeviceHandlerPlugins = {};

const getDeviceHandlerPlugins = () => cachedDeviceHandlerPlugins;

const loadDeviceHandlerPlugins = async () => {

  // Have we loaded the plugins already?
  if (Object.keys(cachedDeviceHandlerPlugins).length) {
    return Promise.resolve(cachedDeviceHandlerPlugins);
  }

  log(`Looking for device handler plugins...`);

  Array.isArray(handlerFiles) && handlerFiles.forEach(fileName => {
    const deviceHandlerName = Path.parse(fileName).name;
    
    log(`-> Loaded device handler plugin '${deviceHandlerName}'`);
    if (fileName) {
      promises.push(import(`./virtualDeviceProcessing/${fileName}`));
    }
  
  });
    
  return Promise.all(promises).then(deviceHandlerPluginsArray => {
    const handlerPlugins = {};

    deviceHandlerPluginsArray.forEach(plugin => {
      const pluginName = plugin.default?.name;
      handlerPlugins[pluginName] = plugin;
    })
  
    log(`Loaded ${Object.keys(handlerPlugins).length} device handler(s).`);
    
    // Object.keys(handlerPlugins).forEach(pluginName => {
    //   const deviceHandlerPlugin = handlerPlugins[pluginName];

    //   /**
    //    * Initialize this plugin. The wrapper MUST return an init function 
    //    * and may return additional functions and data.
    //    */
    //   const { init, functions, data } = deviceHandlerPlugin.default();

    //   if (!init) {
    //     log(`Failed to initialize device handler plugin '${pluginName}. Make sure it returns a function 'init'.`, 'red');        
    //   }

    //   log(`Initialized device handler plugin '${pluginName}'`)
    //   console.log(deviceHandlerPlugin)
    //   handlerPlugins[pluginName] = deviceHandlerPlugin.default();
    // });

    // Cache them so next time we don't have to do the fs operations
    cachedDeviceHandlerPlugins = handlerPlugins;

    return handlerPlugins;
  });
}

export { 
  loadDeviceHandlerPlugins,
  getDeviceHandlerPlugins,
};