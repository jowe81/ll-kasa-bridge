import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";
import { getDisplayDataFromApiResponse, getMockData } from "../../helpers/openWeatherMapData.js";

const localConstants =
    constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_WEATHER_SERVICE];

class WeatherServiceHandler {
    constructor(devicePool, weatherService, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.weatherService = weatherService;
        this.init(cache);
    }

    analyzeStateChange(oldState, newState) {
        if (oldState === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.changed = !_.isEqual(oldState, newState);
        changeInfo.on_off = oldState?.powerState !== newState.powerState;
        changeInfo.target = newState?.target !== oldState?.target;

        return changeInfo;
    }

    getLiveDevice() {
        const liveDevice = makeLiveDeviceObject(
            this.weatherService,
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
    
    getFullUrl() {
        if (!(this.weatherService)) {
            return false;
        }

        const { baseUrl, path, queryParams } = this.weatherService.settings.api;

        if (!baseUrl) {
          return false;
        }

        let queryString = '';
        Object.keys(queryParams).forEach(key => queryString += `&${key}=${queryParams[key]}`);

        let fullUrl = `${baseUrl}${path}`;

        if (queryString) {
          fullUrl += '?' + queryString.substring(1);
        }

        return fullUrl;
    }

    init(cache) {
        if (!(this.weatherService && this.devicePool && this.weatherService.settings?.api)) {
            log(`Failed to initialize weather service.`, this, 'red');
            return false;
        }

        if (!cache) {
          console.error('WeatherService init failed - did not get cache reference.');
          return false;
        }
        // Store the cache reference.
        this.cache = cache;

        this.weatherService.fullUrl = this.getFullUrl();

        // Turn on when first starting.
        this.weatherService.setPowerState(true);

        this.weatherService._deviceHandlers = this;

        this.weatherService.subscribeListener("powerState", (newPowerState) => {
        });

        log(
            `Initialized ${this.weatherService.subType} with ${this.weatherService.fullUrl}`,
            this.weatherService
        );
        log(
            `Check-Interval: ${Math.ceil(
                this.weatherService.settings.checkInterval / constants.MINUTE
            )} minutes.`,
            this.weatherService
        );

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        this._checkingIntervalHandler = setInterval(
            () => this.weatherServiceIntervalHandler(),
            this.weatherService.settings.checkInterval ?? 3600000
        );

        this.initialized = true;

        // Trigger an initial API call.
        this.weatherServiceIntervalHandler();
    }

    async weatherServiceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }
      
        try {
          const data = await axios.get(this.weatherService.fullUrl);
          //const data = getMockData();
          const responseData = data.data;

          // Cache the response.
          this.cache.data = responseData;

          log(`Received API data from ${this.weatherService.settings.api?.baseUrl}`, this);

          const displayData = getDisplayDataFromApiResponse(responseData);

          this.weatherService._updateState(
            displayData, 
            true
          );

        } catch (err) {
          console.log('Error when fetching weather');
          console.log(err);
        }
    }

}

function weatherServiceHandler(devicePool, weatherService, cache) {
    return new WeatherServiceHandler(devicePool, weatherService, cache);
}

export default weatherServiceHandler;
