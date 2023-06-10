import { isDaytime } from "../helpers/jDateTimeUtils.js";

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

export {
  getCommandObjectFromTargetData,
}