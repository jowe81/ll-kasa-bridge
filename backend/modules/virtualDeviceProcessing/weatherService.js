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

        const settings = this.weatherService.settings;
        const { baseUrl, path, queryParams, apiKeyKey } = settings?.api;        

        if (!baseUrl) {
          return false;
        }

        // Read the API key from .env
        let apiKey = null;

        if (apiKeyKey) {
            apiKey = queryParams[apiKeyKey] ? process.env[queryParams[apiKeyKey]] : null;
        }
         

        if (apiKeyKey && !apiKey) {
            log(`Error: No value for "${apiKeyKey}" found in process.env (looking for key: "${queryParams[apiKeyKey]}")`, this.weatherService, 'red');
            return;
        }

        queryParams[apiKeyKey] = apiKey;

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

        if (!this.weatherService.fullUrl) {
            log(`Failed to initialize weather service: incomplete url (verify secrets in .env).`, this.weatherService, 'red');
        }

        // Turn on when first starting.
        this.weatherService.setPowerState(true);

        this.weatherService._deviceHandlers = this;

        this.weatherService.subscribeListener("powerState", (newPowerState) => {
        });

        log(
            `Initialized ${this.weatherService.subType} "${this.weatherService.alias}" with ${this.weatherService.settings.api.baseUrl}`,
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

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => { this.weatherServiceIntervalHandler(); }, 5000);

    }

    async weatherServiceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }
      
        try {
          const data = process.env.DISABLE_OUTSIDE_API_CALLS ? getMockData() : await axios.get(this.weatherService.fullUrl);
          //const data = getMockData();
          const responseData = data.data;

          // Cache the response.
          this.cache.data = responseData;

          log(`${this.weatherService.alias} received API data from ${this.weatherService.settings.api?.baseUrl}`, this.weatherService);

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
