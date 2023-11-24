import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";

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
          //const data = {"cod":"200","message":0,"cnt":40,"list":[{"dt":1700719200,"main":{"temp":278.83,"feels_like":277.91,"temp_min":278.03,"temp_max":278.83,"pressure":1029,"sea_level":1029,"grnd_level":1024,"humidity":91,"temp_kf":0.8},"weather":[{"id":802,"main":"Clouds","description":"scattered clouds","icon":"03n"}],"clouds":{"all":28},"wind":{"speed":1.47,"deg":356,"gust":1.43},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-23 06:00:00"},{"dt":1700730000,"main":{"temp":277.97,"feels_like":276.92,"temp_min":277.34,"temp_max":277.97,"pressure":1029,"sea_level":1029,"grnd_level":1023,"humidity":85,"temp_kf":0.63},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":10},"wind":{"speed":1.48,"deg":338,"gust":1.57},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-23 09:00:00"},{"dt":1700740800,"main":{"temp":276.73,"feels_like":276.73,"temp_min":276.73,"temp_max":276.73,"pressure":1029,"sea_level":1029,"grnd_level":1023,"humidity":79,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":3},"wind":{"speed":1.27,"deg":2,"gust":1.44},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-23 12:00:00"},{"dt":1700751600,"main":{"temp":276.22,"feels_like":276.22,"temp_min":276.22,"temp_max":276.22,"pressure":1029,"sea_level":1029,"grnd_level":1024,"humidity":77,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":0},"wind":{"speed":1.33,"deg":11,"gust":1.39},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-23 15:00:00"},{"dt":1700762400,"main":{"temp":279.16,"feels_like":279.16,"temp_min":279.16,"temp_max":279.16,"pressure":1030,"sea_level":1030,"grnd_level":1024,"humidity":66,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":0.54,"deg":331,"gust":1.1},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-23 18:00:00"},{"dt":1700773200,"main":{"temp":281.57,"feels_like":280.75,"temp_min":281.57,"temp_max":281.57,"pressure":1028,"sea_level":1028,"grnd_level":1023,"humidity":59,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":1.73,"deg":281,"gust":2.06},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-23 21:00:00"},{"dt":1700784000,"main":{"temp":279.43,"feels_like":277.87,"temp_min":279.43,"temp_max":279.43,"pressure":1028,"sea_level":1028,"grnd_level":1023,"humidity":74,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":2.15,"deg":306,"gust":2.91},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-24 00:00:00"},{"dt":1700794800,"main":{"temp":277.78,"feels_like":276.47,"temp_min":277.78,"temp_max":277.78,"pressure":1029,"sea_level":1029,"grnd_level":1023,"humidity":74,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":0},"wind":{"speed":1.66,"deg":5,"gust":1.66},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-24 03:00:00"},{"dt":1700805600,"main":{"temp":276.91,"feels_like":275.77,"temp_min":276.91,"temp_max":276.91,"pressure":1029,"sea_level":1029,"grnd_level":1024,"humidity":71,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":0},"wind":{"speed":1.44,"deg":36,"gust":1.3},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-24 06:00:00"},{"dt":1700816400,"main":{"temp":276.33,"feels_like":276.33,"temp_min":276.33,"temp_max":276.33,"pressure":1029,"sea_level":1029,"grnd_level":1024,"humidity":70,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":0},"wind":{"speed":1.29,"deg":29,"gust":1.15},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-24 09:00:00"},{"dt":1700827200,"main":{"temp":275.88,"feels_like":275.88,"temp_min":275.88,"temp_max":275.88,"pressure":1029,"sea_level":1029,"grnd_level":1023,"humidity":68,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":0},"wind":{"speed":1.23,"deg":12,"gust":1.15},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-24 12:00:00"},{"dt":1700838000,"main":{"temp":275.26,"feels_like":275.26,"temp_min":275.26,"temp_max":275.26,"pressure":1029,"sea_level":1029,"grnd_level":1023,"humidity":66,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":0},"wind":{"speed":1.23,"deg":33,"gust":1.11},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-24 15:00:00"},{"dt":1700848800,"main":{"temp":278.62,"feels_like":278.62,"temp_min":278.62,"temp_max":278.62,"pressure":1029,"sea_level":1029,"grnd_level":1024,"humidity":55,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":0.26,"deg":264,"gust":0.68},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-24 18:00:00"},{"dt":1700859600,"main":{"temp":280.69,"feels_like":280.69,"temp_min":280.69,"temp_max":280.69,"pressure":1028,"sea_level":1028,"grnd_level":1022,"humidity":51,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":1.23,"deg":249,"gust":1.24},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-24 21:00:00"},{"dt":1700870400,"main":{"temp":278.37,"feels_like":278.37,"temp_min":278.37,"temp_max":278.37,"pressure":1027,"sea_level":1027,"grnd_level":1022,"humidity":66,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":0.83,"deg":295,"gust":0.91},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-25 00:00:00"},{"dt":1700881200,"main":{"temp":277.01,"feels_like":277.01,"temp_min":277.01,"temp_max":277.01,"pressure":1027,"sea_level":1027,"grnd_level":1022,"humidity":71,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":2},"wind":{"speed":1.03,"deg":23,"gust":0.92},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-25 03:00:00"},{"dt":1700892000,"main":{"temp":276.44,"feels_like":276.44,"temp_min":276.44,"temp_max":276.44,"pressure":1028,"sea_level":1028,"grnd_level":1022,"humidity":73,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":4},"wind":{"speed":0.94,"deg":43,"gust":0.85},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-25 06:00:00"},{"dt":1700902800,"main":{"temp":276,"feels_like":276,"temp_min":276,"temp_max":276,"pressure":1028,"sea_level":1028,"grnd_level":1022,"humidity":73,"temp_kf":0},"weather":[{"id":802,"main":"Clouds","description":"scattered clouds","icon":"03n"}],"clouds":{"all":29},"wind":{"speed":0.91,"deg":38,"gust":0.94},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-25 09:00:00"},{"dt":1700913600,"main":{"temp":275.77,"feels_like":275.77,"temp_min":275.77,"temp_max":275.77,"pressure":1027,"sea_level":1027,"grnd_level":1022,"humidity":73,"temp_kf":0},"weather":[{"id":802,"main":"Clouds","description":"scattered clouds","icon":"03n"}],"clouds":{"all":28},"wind":{"speed":0.92,"deg":27,"gust":0.89},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-25 12:00:00"},{"dt":1700924400,"main":{"temp":275.48,"feels_like":275.48,"temp_min":275.48,"temp_max":275.48,"pressure":1027,"sea_level":1027,"grnd_level":1022,"humidity":73,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":1},"wind":{"speed":0.99,"deg":43,"gust":1},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-25 15:00:00"},{"dt":1700935200,"main":{"temp":278.73,"feels_like":278.73,"temp_min":278.73,"temp_max":278.73,"pressure":1028,"sea_level":1028,"grnd_level":1022,"humidity":62,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":1},"wind":{"speed":0.23,"deg":102,"gust":0.35},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-25 18:00:00"},{"dt":1700946000,"main":{"temp":280.97,"feels_like":280.97,"temp_min":280.97,"temp_max":280.97,"pressure":1027,"sea_level":1027,"grnd_level":1021,"humidity":58,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":1.08,"deg":242,"gust":0.99},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-25 21:00:00"},{"dt":1700956800,"main":{"temp":278.62,"feels_like":278.62,"temp_min":278.62,"temp_max":278.62,"pressure":1026,"sea_level":1026,"grnd_level":1021,"humidity":73,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"clouds":{"all":0},"wind":{"speed":1.09,"deg":301,"gust":1.2},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-26 00:00:00"},{"dt":1700967600,"main":{"temp":277.5,"feels_like":277.5,"temp_min":277.5,"temp_max":277.5,"pressure":1026,"sea_level":1026,"grnd_level":1021,"humidity":78,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":4},"wind":{"speed":1.06,"deg":345,"gust":1.04},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-26 03:00:00"},{"dt":1700978400,"main":{"temp":277.2,"feels_like":277.2,"temp_min":277.2,"temp_max":277.2,"pressure":1026,"sea_level":1026,"grnd_level":1020,"humidity":80,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":6},"wind":{"speed":1.02,"deg":62,"gust":1.05},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-26 06:00:00"},{"dt":1700989200,"main":{"temp":276.62,"feels_like":276.62,"temp_min":276.62,"temp_max":276.62,"pressure":1026,"sea_level":1026,"grnd_level":1020,"humidity":81,"temp_kf":0},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"clouds":{"all":7},"wind":{"speed":0.67,"deg":2,"gust":0.69},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-26 09:00:00"},{"dt":1701000000,"main":{"temp":276.57,"feels_like":276.57,"temp_min":276.57,"temp_max":276.57,"pressure":1025,"sea_level":1025,"grnd_level":1020,"humidity":80,"temp_kf":0},"weather":[{"id":802,"main":"Clouds","description":"scattered clouds","icon":"03n"}],"clouds":{"all":36},"wind":{"speed":0.66,"deg":18,"gust":0.71},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-26 12:00:00"},{"dt":1701010800,"main":{"temp":276.3,"feels_like":276.3,"temp_min":276.3,"temp_max":276.3,"pressure":1024,"sea_level":1024,"grnd_level":1019,"humidity":80,"temp_kf":0},"weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04n"}],"clouds":{"all":57},"wind":{"speed":0.87,"deg":34,"gust":0.86},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-26 15:00:00"},{"dt":1701021600,"main":{"temp":279.15,"feels_like":279.15,"temp_min":279.15,"temp_max":279.15,"pressure":1024,"sea_level":1024,"grnd_level":1019,"humidity":71,"temp_kf":0},"weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04d"}],"clouds":{"all":60},"wind":{"speed":0.29,"deg":282,"gust":0.61},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-26 18:00:00"},{"dt":1701032400,"main":{"temp":281.12,"feels_like":281.12,"temp_min":281.12,"temp_max":281.12,"pressure":1023,"sea_level":1023,"grnd_level":1018,"humidity":68,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],"clouds":{"all":100},"wind":{"speed":1.07,"deg":259,"gust":1.22},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-26 21:00:00"},{"dt":1701043200,"main":{"temp":279.09,"feels_like":279.09,"temp_min":279.09,"temp_max":279.09,"pressure":1022,"sea_level":1022,"grnd_level":1017,"humidity":79,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],"clouds":{"all":99},"wind":{"speed":1.15,"deg":292,"gust":1.31},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-27 00:00:00"},{"dt":1701054000,"main":{"temp":278.61,"feels_like":277.84,"temp_min":278.61,"temp_max":278.61,"pressure":1022,"sea_level":1022,"grnd_level":1017,"humidity":79,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04n"}],"clouds":{"all":96},"wind":{"speed":1.34,"deg":334,"gust":1.34},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-27 03:00:00"},{"dt":1701064800,"main":{"temp":278.09,"feels_like":278.09,"temp_min":278.09,"temp_max":278.09,"pressure":1023,"sea_level":1023,"grnd_level":1017,"humidity":78,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04n"}],"clouds":{"all":91},"wind":{"speed":0.68,"deg":5,"gust":0.77},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-27 06:00:00"},{"dt":1701075600,"main":{"temp":277.95,"feels_like":277.95,"temp_min":277.95,"temp_max":277.95,"pressure":1023,"sea_level":1023,"grnd_level":1018,"humidity":77,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04n"}],"clouds":{"all":100},"wind":{"speed":0.63,"deg":29,"gust":0.62},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-27 09:00:00"},{"dt":1701086400,"main":{"temp":277.88,"feels_like":277.88,"temp_min":277.88,"temp_max":277.88,"pressure":1023,"sea_level":1023,"grnd_level":1018,"humidity":76,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04n"}],"clouds":{"all":100},"wind":{"speed":0.55,"deg":28,"gust":0.58},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-27 12:00:00"},{"dt":1701097200,"main":{"temp":277.86,"feels_like":277.86,"temp_min":277.86,"temp_max":277.86,"pressure":1023,"sea_level":1023,"grnd_level":1018,"humidity":76,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04n"}],"clouds":{"all":100},"wind":{"speed":0.33,"deg":59,"gust":0.46},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-27 15:00:00"},{"dt":1701108000,"main":{"temp":279.4,"feels_like":279.4,"temp_min":279.4,"temp_max":279.4,"pressure":1024,"sea_level":1024,"grnd_level":1019,"humidity":72,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],"clouds":{"all":100},"wind":{"speed":0.16,"deg":167,"gust":0.33},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-27 18:00:00"},{"dt":1701118800,"main":{"temp":280.96,"feels_like":280.96,"temp_min":280.96,"temp_max":280.96,"pressure":1024,"sea_level":1024,"grnd_level":1018,"humidity":68,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],"clouds":{"all":100},"wind":{"speed":0.53,"deg":202,"gust":0.36},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-27 21:00:00"},{"dt":1701129600,"main":{"temp":278.96,"feels_like":278.96,"temp_min":278.96,"temp_max":278.96,"pressure":1024,"sea_level":1024,"grnd_level":1018,"humidity":79,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],"clouds":{"all":100},"wind":{"speed":0.3,"deg":272,"gust":0.37},"visibility":10000,"pop":0,"sys":{"pod":"d"},"dt_txt":"2023-11-28 00:00:00"},{"dt":1701140400,"main":{"temp":278.19,"feels_like":278.19,"temp_min":278.19,"temp_max":278.19,"pressure":1024,"sea_level":1024,"grnd_level":1019,"humidity":81,"temp_kf":0},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04n"}],"clouds":{"all":100},"wind":{"speed":0.87,"deg":35,"gust":0.79},"visibility":10000,"pop":0,"sys":{"pod":"n"},"dt_txt":"2023-11-28 03:00:00"}],"city":{"id":6090785,"name":"North Vancouver","coord":{"lat":49.2762,"lon":-123.0402},"country":"CA","population":48000,"timezone":-28800,"sunrise":1700667199,"sunset":1700699014}}
          const data = await axios.get(this.weatherService.fullUrl);

          const responseData = data.data;

          // Cache the response.
          this.cache.data = responseData;

          log(`Received API data from ${this.weatherService.settings.api?.baseUrl}`, this);

          this.weatherService._updateState(responseData, true);

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
