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

  analyzeStateChange(newState) {
    if (this.deviceWrapper.state === undefined) {
      // Have no current state. Just received the first update.
      return undefined;
    }

    let changeInfo = {};
    changeInfo.changed = !_.isEqual(this.state, newState);

    return changeInfo;
  };

  getLiveDevice() {    
    return makeLiveDeviceObject(this.deviceWrapper, [
        // Include
        'powerState',
        'settings',
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
    
    // Add labels to configured timers where missing.
    this.deviceWrapper.settings.timers?.forEach((timer, index) => {
      if (!timer.label) {
        this.deviceWrapper.settings.timers[index]['label'] = timer.id;        
      }
    });

    this.deviceWrapper._deviceHandlers = this;

    this.state = {};
    this.state.liveTimers = [];

    // Start the interval check
    if (this._checkingIntervalHandler) {
      clearInterval(this._checkingIntervalHandler);
    }

    this._checkingIntervalHandler = setInterval(() => this.timerIntervalHandler(), this.deviceWrapper.interval ?? localConstants.CHECKING_INTERVAL_DEFAULT);
    
    this.initialized = true;    
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

    // Use the expiry info as live id
    timer.liveId = timer.expires;

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

  _killLiveTimerAtIndex(index) {
    if (index !== null) {
      const liveTimer = this.state.liveTimers[index];
      this.state.liveTimers.splice(index, 1);
    }
  };

  /**
   * Silence/terminate the live timer object that's passed in.
   */
  killLiveTimer(liveTimer) {
    const index = findByField('expires', liveTimer.expires, this.state.liveTimers, true);
    this._killLiveTimerAtIndex(index);
  };

  killLiveTimerByLiveId(liveTimerId) {
    const index = findByField('liveId', Number(liveTimerId), this.state.liveTimers, true);
    this._killLiveTimerAtIndex(index);
  };

  // Nudge by milliseconds.
  nudgeLiveTimerByLiveId(liveTimerId, step) {
    const liveTimer = findByField('liveId', Number(liveTimerId), this.state.liveTimers);
    
    if (liveTimer) {
      liveTimer.expires += Number(step);  
    }
  };

  // Return a number of milliseconds based on remaining time.
  getNudgeStep(expiresIn, fast = false) {
    if (expiresIn < constants.MINUTE) {
      // Up to a minute, nudge by 30s / 10s
      return constants.SECOND * (fast ? 30 : 10);
    } else if (expiresIn < 5 * constants.MINUTE) {
      // Up to 5 minutes, nudge by 1m / 30s
      return constants.SECOND * (fast ? 60 : 30);
    } else if (expiresIn < 15 * constants.MINUTE) {
      // Up to 15 minutes, nudge by 5m / 1m
      return constants.MINUTE * (fast ? 5 : 1);
    } else {
      // Otherwise 15m / 5m
      return constants.MINUTE * (fast ? 15 : 5);
    }
  }

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

    this.state.clock = Date.now();

    const now = Date.now();

    this.state.liveTimers.forEach((liveTimer, index) => {

      // Update the countdown
      liveTimer.expiresIn = liveTimer.expires - now;

      // Provide nudge steps to the frontend
      liveTimer.nudge = {
        slow: this.getNudgeStep(liveTimer.expiresIn, false),
        fast: this.getNudgeStep(liveTimer.expiresIn, true),
      }

      // See if the timer has expired, and if so add the index of the current trigger iteration.
      const msSinceTimerExpired = - (liveTimer.expires - now);

      if (msSinceTimerExpired > 0) {
        // Timer is expired.
        liveTimer.currentTriggerIndex = Math.floor(msSinceTimerExpired / liveTimer.repeatAlarmEvery);

        if (typeof liveTimer.lastTriggerIndexPlayed === 'undefined') {
          liveTimer.lastTriggerIndexPlayed = -1;
        }

        if (now < liveTimer.expires + liveTimer.ttl) {
          // In Alarm window
          this.checkAlarm(liveTimer);    
        } else {
          if (now > liveTimer.expires + liveTimer.ttl) {
            // Ttl has expired - turf it automatically
            this.killLiveTimer(liveTimer);
          }
        }
  
      }
    });  

    const currentLiveTimers = this.state.liveTimers;

    const changeInfo = {
      on_off: false,
      timers: _.isEqual(
        this._previousliveTimers, 
        this.state.liveTimers
      ) ? false : true,
    }

    if (changeInfo.timers) {
      // Sort the timers by remaining length
      this.state.liveTimers.sort((a, b) => a.expires > b.expires ? 1 : -1);
      this.deviceWrapper.socketHandler.emitDeviceStateUpdate(this.deviceWrapper.getLiveDeviceStateUpdate(), changeInfo);
    }

    this._previousLiveTimers = _.cloneDeep(currentLiveTimers);
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