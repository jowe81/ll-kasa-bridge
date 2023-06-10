import { isDaytime } from "../helpers/jDateTimeUtils.js";
import filterFunctions from "./Filters.js";

const getCommandObjectFromTargetData = (targetData) => {
  console.log("GetCommandObjectFromTargetData", targetData);
  
  const commandObject = {};

  const keys = Object.keys(targetData)

  keys.forEach(key => {

    const paramValue = targetData[key];

    if (typeof paramValue === 'object') {

      // Macro?
      const { value, modValue, macro } = paramValue;

      if (macro) {
        switch (macro) {
          case 'sleep_wake':
            commandObject[key] = isDaytime() ? value : modValue;
            break;

          default:
            commandObject[key] = value;
        }        

      } else {
        commandObject[key] = value;
      }

    } else {
      // Plain value
      commandObject[key] = paramValue;
      
    }    
  });

  return commandObject;
};

const filter = (filterObject, commandObject) => {
  const { name, stateData } = filterObject;

  if (!name || !stateData) {
    return commandObject;
  }

  console.log("Unfiltered commandObject", commandObject);

  // Loop over the stateData items and apply the filter to each in turn.
  if (filterFunctions[name]) {
    console.log(`Found filter ${name}`);

    Object.keys(stateData).forEach(stateKey => {
      console.log(`Processing ${stateKey}`);
      commandObject[stateKey] = filterFunctions[name](
        filterObject, 
        stateKey, 
        commandObject[stateKey] // Default value to use if none is provided in filter configuration
      );  
    });
  } else {
    console.log(`Filter ${name} doesn't exist`);
  }

  console.log("Filtered commandObject", commandObject);

  return commandObject;
}

export {
  getCommandObjectFromTargetData,
  filter,
}