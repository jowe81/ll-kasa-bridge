import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import { formatTime, formatDateLong, getSunrise, getSunset, getNoon, isDaytime, getTomorrow } from "../../helpers/jDateTimeUtils.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";

const localConstants =
    constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][
        constants.SUBTYPE_CLOCK
    ];

class ClockHandler {
    constructor(devicePool, clock, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.clock = clock;
        this.init(cache);
    }

    analyzeStateChange(oldState, newState) {
        if (oldState === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.on_off = oldState?.powerState !== newState?.powerState;
        changeInfo.clock = oldState?.clock?.displayTime !== newState?.clock?.displayTime;        
        changeInfo.changed = changeInfo.on_off || changeInfo.clock;

        return changeInfo;
    }

    getLiveDevice() {
        const liveDevice = makeLiveDeviceObject(
            this.clock,
            [
                // Include
                "powerState",
            ],
            {
                // Default
                display: true,
            },
            [
                // Exclude
            ],
            // Use global defaults
            true
        );

        liveDevice.data = this.cache?.data;

        return liveDevice;
    }

    init(cache) {
        if (!(this.clock && this.devicePool && this.clock.settings)) {
            log(`Failed to initialize Clock.`, this, "red");
            return false;
        }

        if (!cache) {
            console.error("Clock init failed - did not get cache reference.");
            return false;
        }
        // Store the cache reference.
        this.cache = cache;
        this.cache.data = {};

        // Turn on when first starting.
        this.clock.setPowerState(true);

        this.clock._deviceHandlers = this;

        this.clock.subscribeListener("powerState", (newPowerState) => {});

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval =
            this.clock.settings.checkInterval ??
            localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(
            () => this.clockIntervalHandler(),
            interval
        );

        log(`Initialized ${this.clock.subType} "${this.clock.alias}".`, this.clock);
        log(`Check-Interval: ${Math.ceil(interval / constants.SECOND)} second(s).`, this.clock);

        this.initialized = true;

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => {
            this.clockIntervalHandler();
        }, 5000);
    }

    async clockIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        const { settings } = this.clock;
        
        const coordinates = {
          lat: settings.coordinates.lat,
          long: settings.coordinates.lon,
        }

        const now = new Date();
        const tomorrow = getTomorrow();

        // The sun library appears to consider the first millisecond part of the previous day, so add one.
        tomorrow.setHours(0, 0, 0, 1);

        let sunset, sunrise, nextSunEvent;

        if (isDaytime(null, coordinates)) {
          // Middle of day: need today's sunset and tomorrow's sunrise.
          nextSunEvent = "sunset";
          sunset = getSunset(null, coordinates);
          sunrise = getSunrise(tomorrow, coordinates);
        } else {
          // It's dark out.

          nextSunEvent = "sunrise";
          if (now.getHours < 12) {
            // Morning of the current day; need today's sunrise and sunset.
            sunrise = getSunrise(null, coordinates);
            sunset = getSunset(null, coordinates);
          } else {
            // Evening of the current day; need tomorrow's sunrise and sunset.
            sunrise = getSunrise(tomorrow, coordinates);
            sunset = getSunset(tomorrow, coordinates);
          }
        }

        const clockData = {
          ms: now.getTime(),
          am: now.getHours() < 12,
          hours: now.getHours(),
          minutes: now.getMinutes(),
          displayTime: formatTime(settings.timeFormat ?? localConstants.DEFAULT_TIME_FORMAT),
          displayDate: formatDateLong(`{dayOfWeek}, {month} {dayOfMonth}{daySuffix}, {year}`, now),
          sunrise: formatTime('H:MM', sunrise),
          sunset: formatTime('H:MM', sunset),
          nextSunEvent,
        }

        this.clock._updateState(
            {
                powerState: this.clock.getPowerState(),
                clock: clockData,
            },
            true
        );
    }
}

function clockHandler(devicePool, clock, cache) {
    return new ClockHandler(devicePool, clock, cache);
}

export default clockHandler;
