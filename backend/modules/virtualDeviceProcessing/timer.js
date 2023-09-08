import _ from "lodash";

import constants from "../../constants.js";
import { log, debug } from '..//Log.js';
import { findByField, findById } from "../../helpers/jUtils.js";
import { makeLiveDeviceObject } from '../TargetDataProcessor.js';
import { spawn } from 'child_process';

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_TIMER];

class TimerHandler {
  
  constructor(devicePool, deviceWrapper) {
    this.initialized = false;

    this.devicePool = devicePool;
    this.deviceWrapper = deviceWrapper;

    this.init();
  };

  getLiveDevice() {
    console.log('Getting LiveDevice from Timer');
    return makeLiveDeviceObject(this, [
        // Include
        'powerState',
      ], {
        // Default
        'display': true,
      }, [
        // Exclude
      ],
      // Use global defaults
      true,
    );
  };

  getState() {
    return this.state;
  };

  init() {
    if (!(this.deviceWrapper && this.devicePool)) {
      return false;
    }
    
    this.deviceWrapper.interval = this.deviceWrapper.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;

    log(`Initialized ${this.deviceWrapper.subType} for location ${this.deviceWrapper.location}.`, this.deviceWrapper);
    log(`Check-Interval: ${ Math.ceil(this.deviceWrapper.interval) } milliseconds.`, this.deviceWrapper);

    // Turn on when first starting.
    this.deviceWrapper.setPowerState(true);
    
    this.deviceWrapper._deviceHandlers = this;

    this.state = {};
    this.state.liveTimers = [];

    // Start the interval check
    if (this._checkingIntervalHandler) {
      clearInterval(this._checkingIntervalHandler);
    }

    this._checkingIntervalHandler = setInterval(() => this.timerIntervalHandler(), this.deviceWrapper.interval ?? localConstants.CHECKING_INTERVAL_DEFAULT);
    
    this.initialized = true;    
    this.setTimerFor(30 * constants.SECOND);
  };


  /**
   * Find a live timer by id
   */
  _getLiveTimer(timerId) {
    const liveTimer = findById(timerId, this.state.liveTimers);
  };

  /**
   * Schedule the timer object that's passed in.
   * At a minimum it needs a length field.
   */
  _setLiveTimer(timer) {
    if (!timer || !timer.length) {
      return;
    }

    const getHumanReadableLength = length => {
      if (length < constants.MINUTE * 2) {
        return Math.round(timer.length / constants.SECOND) + 's';
      }

      return Math.round(timer.length / constants.MINUTE) + 'm';
    }

    timer.hLength = getHumanReadableLength(timer.length);

    // Set defaults for missing fields
    if (!timer.label) {
      timer.label = timer.id ?? timer.hLength;
    }

    if (!timer.repeatAlarmEvery) {
      timer.repeatAlarmEvery = constants.MINUTE;
    }

    if (!timer.ttl) {
      timer.ttl = constants.MINUTE * 5;
    }  

    if (!timer.audiofile) {
      timer.audiofile = localConstants.AUDIO_FILE_EXPIRED_TIMER_DEFAULT;
    }

    log(`Set timer for ${timer.hLength}: ${JSON.stringify(timer)}`, this.deviceWrapper);

    this.state.liveTimers.push(timer);
    
  };

  /**
   * Get timer from configured device settings
   * @param {*} timerId 
   * @returns 
   */
  _getConfiguredTimer(timerId) {
    const timer = findById(timerId, this.deviceWrapper.settings.timers);

    if (!timer) {
      return null;
    }

    return timer;
  };

  /**
   * Silence/terminate the live timer object that's passed in.
   */
  killLiveTimer(liveTimer) {
    const index = findByField('expires', liveTimer.expires, this.state.liveTimers, true);
    console.log('Killing timer at Index: ', index);
    if (index !== null) {
      this.state.liveTimers.splice(index, 1);
    }
  };

  /**
   * Set a live timer for the given length and ttl. All parameters optional.
   */
  setTimerFor(length, ttl, label, repeatAlarmEvery) {
    if (!length) {
      length = constants.MINUTE * 1;
    }

    const liveTimer = {
      length,
      ttl,
      audiofile: null,
      label,
      expires: Date.now() + length,
      repeatAlarmEvery,
    }

    this._setLiveTimer(liveTimer);
  };

  setTimer(timerId) {
    const timer = this._getConfiguredTimer(timerId);

    if (!timer) {
      // Timer with id timerId doesn't exist on device configuration
    }

    let liveTimer = this._getLiveTimer(timerId);

    if (!liveTimer) {
      // This timer isn't currently set, initialize it.
      liveTimer = { 
        ...timer,
      };
    }

    // If the timer was currently set, reset it (reapply the length from current timestamp)
    liveTimer.expires = Date.now() + timer.length;

    this._setLiveTimer(liveTimer);
  };

  timerIntervalHandler() {
    if (!this.initialized) {
      return false;
    }

    this.state.liveTimers.forEach((liveTimer, index) => {
      const now = Date.now();
      liveTimer.expiresIn = liveTimer.expires - now;

      // See if the timer has expired, and if so add the index of the current trigger iteration.
      const msSinceTimerExpired = - liveTimer.expiresIn;

      if (msSinceTimerExpired > 0) {
        liveTimer.currentTriggerIndex = Math.floor(msSinceTimerExpired / liveTimer.repeatAlarmEvery);

        if (typeof liveTimer.lastTriggerIndexPlayed === 'undefined') {
          liveTimer.lastTriggerIndexPlayed = -1;
        }
      }

      if (now > liveTimer.expires && now < liveTimer.expires + liveTimer.ttl) {
        // In Alarm window
        this.checkAlarm(liveTimer);    
      } else {
        if (now > liveTimer.expires + liveTimer.ttl) {
          // Ttl has expired - turf it automatically
          this.killLiveTimer(liveTimer);
        }
      }
    });  
    
    const changeInfo = {
      on_off: false,
      timers: this.state.liveTimers.length ? true : false, // If there are live timers, they are changing.
    }

    if (changeInfo.timers) {
      this.deviceWrapper.socketHandler.emitDeviceStateUpdate(this.deviceWrapper.getLiveDeviceStateUpdate(), changeInfo);
    }
  };

  /**
   * Check if an alarm iteration needs to played and play it if indicated.
   */
  checkAlarm(liveTimer) {
    if (liveTimer.currentTriggerIndex > liveTimer.lastTriggerIndexPlayed) {
      const file = localConstants.AUDIO_PATH + (liveTimer.audiofile ? liveTimer.audiofile : localConstants.AUDIO_FILE_EXPIRED_TIMER_DEFAULT);
      const player = localConstants.AUDIO_PLAYER_COMMAND ?? "afplay";
  
      log(`Timer ${liveTimer.id ?? liveTimer.label}, iteration ${liveTimer.currentTriggerIndex + 1}/${Math.floor(liveTimer.ttl/liveTimer.repeatAlarmEvery)}: Playing ${file} using ${player}.`, this.deviceWrapper);
      const thread = spawn(player, [ file ]);
          
      thread.on('error', (error) => {
          console.log(`error: ${error.message}`);
      });
      
      thread.on("close", code => {
        log(`Timer ${liveTimer.id ?? liveTimer.label}: done playing ${file}.`, this.deviceWrapper);
      });    
  
      // Once played, increase this
      liveTimer.lastTriggerIndexPlayed++;
    }
  };
}

function timerHandler(devicePool, thermostat) {
  return new TimerHandler(devicePool, thermostat);
}

export default timerHandler;