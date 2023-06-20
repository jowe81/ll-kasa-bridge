import { getNighttimePercent, getFromSettingsForNextSunEvent } from "../../helpers/jDateTimeUtils.js";
import { scale } from "../../helpers/jUtils.js";

const schedule = () => {

  /**
   * This filter spins up a scheduler task that will calculate the upcoming
   * events for each device and store them in this global cache, like so.
   * 
   * cache {
   *  schedules: {
   *    channel: [
   *        
   *    ]
   *  }
   * }
   * 
   */
  const cache = {

  }

  /**
   * Adjust values following a defined schedule
   */
  const execute = (filterObject, commandObject, deviceWrapper) => {  

    return commandObject;
  }

  return { execute };
}

export default schedule;