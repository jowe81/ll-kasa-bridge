import Path from 'path';
import { getFileNames } from "../helpers/jUtils.js";
import { log } from "../helpers/jUtils.js";


const deviceHandlerFiles = getFileNames('./virtualDeviceProcessing', import.meta.url);

let cachedDeviceHandlerPlugins = {};

const getDeviceHandlerPlugins = () => cachedDeviceHandlerPlugins;

const loadDeviceHandlerPlugins = async () => {
  // Have we loaded the plugins already?
  if (Object.keys(cachedDeviceHandlerPlugins).length) {
    return Promise.resolve(cachedDeviceHandlerPlugins);
  }

  log(`Looking for device handler plugins...`);

  const promises = [];

  Array.isArray(deviceHandlerFiles) && deviceHandlerFiles.forEach(fileName => {
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
    
    // Cache them so next time we don't have to do the fs operations
    cachedDeviceHandlerPlugins = handlerPlugins;

    return handlerPlugins;
  });
}



const commandHandlerFiles = getFileNames('./commandProcessing', import.meta.url);

let cachedCommandHandlerPlugins = {};

const getCommandHandlerPlugins = (subType) => cachedCommandHandlerPlugins[subType];

const getAllCommandHandlerPlugins = () => cachedCommandHandlerPlugins;

const loadCommandHandlerPlugins = async () => {
    // Have we loaded the plugins already?
    if (Object.keys(cachedCommandHandlerPlugins).length) {
        return Promise.resolve(cachedCommandHandlerPlugins);
    }

    log(`Looking for command handler plugins...`);

    const promises = [];

    Array.isArray(commandHandlerFiles) &&
        commandHandlerFiles.forEach((fileName) => {
            const commandHandlerName = Path.parse(fileName).name;

            log(`-> Loaded command handler plugin '${commandHandlerName}'`);
            if (fileName) {
                promises.push(import(`./commandProcessing/${fileName}`));
            }
        });

    return Promise.all(promises).then((commandHandlerPluginsArray) => {
        const handlerPlugins = {};

        commandHandlerPluginsArray.forEach((plugin, index) => {
            const fileName = commandHandlerFiles[index];                     
            const subType = getCommandHandlerSubTypeFromFilename(fileName);
            handlerPlugins[subType] = plugin;
        });

        log(`Loaded ${Object.keys(handlerPlugins).length} command handler(s).`);

        Object.keys(handlerPlugins).forEach((subType) => {
            const commandHandlerFunctions = handlerPlugins[subType].default;

            if (subType && commandHandlerFunctions) {
                cachedCommandHandlerPlugins[subType] = commandHandlerFunctions;
            }
        });
        
        return handlerPlugins;
    });
};

/**
 * Extract "dynformsService" from "handlers_dynformsService.js"
 */
const getCommandHandlerSubTypeFromFilename = (fileName) => {
    const baseName = fileName.split('.')[0];
    const components = baseName.split('_');

    if (!components.length) {
      return null;
    }

    return components[1];
}


export {
    loadDeviceHandlerPlugins,
    getDeviceHandlerPlugins,
    loadCommandHandlerPlugins,
    getCommandHandlerPlugins,
    getAllCommandHandlerPlugins,
};