import axios from 'axios';
import { log } from './jUtils.js';

const updateLL = (event, deviceWrapper) => {
  if (!deviceWrapper) {
    //Nothing to do without a device wrapper
    return;
  }
  const LL_URL = 'http://lifelog.wnet.wn/?page=kasa_event';
  const url = `${LL_URL}&event=${event}&ch=${deviceWrapper?.channel}`;
  axios.get(url)
    .then(res => {
      log(`Updated Lifelog (${deviceWrapper.alias}, channel ${deviceWrapper.channel}): ${event} `, 'gray');
    })
    .catch(err => {
      log(`Failed to connect to LifeLog. (${deviceWrapper.alias}, channel ${deviceWrapper.channel})`, null , err.message);
    });
};

const buildCommandObjectFromQuery = query => {
  const intParams =  [ 'on_off', 'ch', 'brightness', 'color_temp', 'hue', 'saturation', 'ignore_default', 'transition'];
  const stringParams = [ 'mode' ];
  const commandObject = {};

  for (const [key, value] of Object.entries(query)) {
    if (intParams.includes(key)) {
      commandObject[key] = parseInt(value);
    } else if (stringParams.includes(key)) {
      commandObject[key] = value;
    }
  };
  
  return commandObject;
}

const processRequest = (req, res, routeCommand, devicePool) => {
  const channel  = req.query.channel ?? req.query.ch;

  // Find the deviceWrapper in the pool
  const deviceWrapper = devicePool.getDeviceWrapperByChannel(parseInt(channel));
  
  if (deviceWrapper) {
    // Transform the query into a kasa command object
    const commandObject = buildCommandObjectFromQuery(req.query);

    switch (routeCommand) {
      case 'setPowerState':
        return deviceWrapper
          .setPowerState(commandObject.on_off == 1 ? true : false, { ip: req.socket.remoteAddress })
          .then(() => res.send('ok'))
          .catch(err => {/* handled in DevicePool */});
        break;

      case 'setLightState':
        return deviceWrapper
          .setLightState(commandObject, { ip: req.socket.remoteAddress })
          .then(() => res.send('ok'))
          .catch(err => {/* handled in DevicePool */});
        break;

      default:
        return Promise.reject(`Unknown device command.`);
    }
  } else {
    return Promise.reject(`Device on channel ${channel} not found.`);
  }
}

/**
 * Handle a button on a physical remote being pushed.
 */
const processRemoteRequest = (query, devicePool) => {
  if (!query || !devicePool) {
    return null;
  }
  
  const remoteID = query.remoteID ?? 'kitchen'; //Default to kitchen as it doesn't transmit an ID.
  const remoteBtn = parseInt(query.remoteBtn);
  const remoteVoltage = query.remoteVoltage; //This is not transmitted on button push but periodically.

  if (remoteBtn) {
    switch (remoteID) {
      case 'kitchen':
        return remoteKitchen(remoteBtn, devicePool);
        break;

      case 'bed':
        return remoteBed(remoteBtn, devicePool);
        break;

      default:
        break;
    }
  }
  
  return null;
}

const remoteKitchen = (btn, devicePool) => {
  const tag = `Remote Kitchen (#${btn}):`;

  if (btn === 4) {
    devicePool.toggleGroup("group-kitchenCounterLights");
  }

  if (btn === 5) {
    devicePool.toggleGroup("group-livingroomLights");
  }

  if (btn === 6) {
    const channel = 34; //Jess desk switch
    const deviceWrapper = devicePool.getDeviceWrapperByChannel(channel);

    if (!deviceWrapper) {
      log(`${tag} Device Wrapper for Jess' Desk not found`, `bgRed`)
      // Error - no wrapper.
      return null;
    }

    deviceWrapper.toggle('Remote Kitchen');
  }

  // Timers
  if ([3, 2, 1].includes(btn)) {
    let timerId;

    switch (btn) {
      case 3:
        timerId = "3m";
        break;

      case 2:
        timerId = "4m";
        break;

      case 1:
        timerId = "6m30";
        break;
    }

    if (timerId) {      
      const timerDeviceWrapper = devicePool.getTimerDeviceWrapper();
      if (!timerDeviceWrapper) {
        log(`${tag} Cannot find timer device.`, 'red');
        return null;
      }

      // Get live instances for this timer.
      const liveTimers = timerDeviceWrapper._deviceHandlers.getState()?.liveTimers ?? [];
      const allInstances = liveTimers.filter((liveTimer) => liveTimer.id === timerId);
      const expiredInstances = allInstances.filter((liveTimer) => liveTimer.expiresIn <= 0);

      // Currently killing all instances, so you can cancel a timer if accidentally set.
      const instancesToKill = allInstances;

      if (instancesToKill.length) {
        // Remove existing instances.
        instancesToKill.forEach((liveTimer) => {
          log(`${tag} Killing timer with ID/LiveId "${timerId}"/${liveTimer.liveId}`, 'yellow');
          timerDeviceWrapper._deviceHandlers.killLiveTimerByLiveId(liveTimer.liveId);      
        })
      } else {
        // No instances of this timer are currently present; instantiate it.
        log(`${tag} Instantiating timer with ID "${timerId}"`, 'yellow');
        timerDeviceWrapper._deviceHandlers.setTimer(timerId);
      }
    }
  }
};

const remoteBed = (btn) => {
  // To implement...
}

export default {
    updateLL,
    buildCommandObjectFromQuery,
    processRequest,
    processRemoteRequest,
};