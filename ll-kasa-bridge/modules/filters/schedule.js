import _ from "lodash";

import { getNighttimePercent, getFromSettingsForNextSunEvent } from "../../helpers/jDateTimeUtils.js";
import { scale } from "../../helpers/jUtils.js";

const schedule = () => {

  /**
   * 
   */
  const cache = {

  }

  /**
   * Adjust values following a defined schedule
   */
  const execute = (filterObject, commandObject, deviceWrapper) => {  

    const currentItem = getCurrentScheduleItem(filterObject);

    if (!currentItem) {
      // Nothing to do.
      return commandObject
    }

    return _.merge(commandObject, currentItem.stateData);
  }

  /**
   * Return the schedule item that is currently active.
   */
  const getCurrentScheduleItem = (filterObject) => {
    const { schedule } = filterObject;

    if (!Array.isArray(schedule) && schedule.length) {
      // Schedule is empty.
      return null;
    }

    const allItems = [ 
      /**
       * Get those items that can directly be calculated, including
       *  1. Items that have hours and minutes specified
       *  2. Items that have only minutes specified: 
       *     -> these will be expanded to 24 items, one per hour
       */
      ...getPlainItems(schedule), 
      /**
       * Get those items that reference a time such as sunset or sunrise
       * -> these will be resolved to a specific time
       */
      ...resolveReferencingItems(schedule)       
    ].sort((itemA, itemB) => 
      /**
       * Sort all items chronologically
       */
      getDateFromItem(itemA).getTime() >= getDateFromItem(itemB).getTime() ? 1 : -1
    );

    const itemCount = allItems.length;

    // Special case - only one item:
    if (itemCount === 1) {
      return allItems[0];
    }

    let currentlyActiveItem;

    // Have at least 2 items.
    allItems.forEach((item, index) => {
      if (itemIsInThePast(item)) {
        // We have entered the time window for this item
        const nextItem = index < itemCount - 1 ? allItems[index + 1] : allItems[0];
      
        if (!itemIsInThePast(nextItem)) {
          currentlyActiveItem = item;
          return false;
        }  
      }
        
      return true;
    });

    return currentlyActiveItem;
  }

  const itemIsInThePast = (item, date) => {
    if (!date) {
      date = new Date();
    }

    return (new Date).getTime() > getDateFromItem(item).getTime();
  }

  const getDateFromItem = (item) => {
    const { hours, minutes } = item.trigger;

    const date = new Date();
    date.setHours(hours ?? 0);
    date.setMinutes(minutes ?? 0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
  }

  const resolveReferencingItems = (schedule) => {
    return schedule
      .map(item => resolveReferencingItem(item))
      .filter(item => item);
  }

  const resolveReferencingItem = (item) => {
    // Todo: implement
    return null;
  }

  const getPlainItems = (schedule) => {
    const rawPlainItems = schedule.filter(item => scheduleItemIsPlain(item));

    // Find those that have no hours defined on them.
    const hourlyItems = rawPlainItems.filter(item => ['undefined', 'null'].includes(typeof item.trigger.hours));
    
    if (!hourlyItems.length) {
      return rawPlainItems;
    }
    // For each one found, create 24 new ones to run hourly.
    let resolvedHourlyItems = [];
    
    hourlyItems.forEach(item => {
      for (let i = 0; i < 24; i++) {
        const resolvedItem = _.cloneDeep(item);
        resolvedItem.trigger.hours = i;
        resolvedHourlyItems.push(resolvedItem);
      }
    })

    return [ ...rawPlainItems, ...resolvedHourlyItems ];
  }

  const scheduleItemIsPlain = (item) => {
    // If hours or minutes are specified, treat this as a plain item.
    return (typeof item.trigger === 'object' && (typeof item.trigger.hours === 'number' || typeof item.trigger.minutes === 'number'));
  }


  return { execute };
}

export default schedule;