import _ from 'lodash';
import axios from 'axios';
import constants from '../constants.js';
import { log, debug } from './Log.js';
import { globalConfig } from '../configuration.js';
import { resolveDeviceDependencies } from './DependencyResolver.js';
import { makeLiveDeviceObject } from './TargetDataProcessor.js';


const espConstants = {

  thermo: {
    // Max length of the time window to consider for trend calculation
    AVG_CALC_MAX_HISTORY_LENGTH: 15 * constants.MINUTE,

    // How many data points can be used to get each avg value?
    AVG_CALC_MAX_DATA_POINTS: 10,

    // How much difference (in degrees) constitutes a trend?
    TREND_TRESHOULD: 0.2,
  }
  
};


const EspDeviceWrapper = {
  device: null,
  initialized: false,

  addCallback(callbackFn, event) {
    log(`Adding callback to '${event}`, this);
  },

  init(cache, mapItem, globalConfig, deviceEventCallback, devicePool, socketHandler) {
    this.globalConfig = globalConfig;
    this.deviceEventCallback = deviceEventCallback;
    this.devicePool = devicePool;
    this.socketHandler = socketHandler;
    // Shared cache to keep ESP responses in and avoid querying for the same data multiple times.
    this.cache = cache;

    const requiredFields = ['alias', 'channel', 'id', 'url', 'jsonPath', 'jsonPathId', 'display', 'locationId', 'type', 'subType'];

    this.alias = mapItem.alias;
    this.channel = mapItem.channel;
    this.id = mapItem.id;
    this.url = mapItem.url;
    const urlParts = mapItem.url.split(/[\/]+/);
    this.host = urlParts && urlParts.length > 1 ? urlParts[1] : 'N/A';
    this.jsonPath = mapItem.jsonPath;
    this.jsonPathId = mapItem.jsonPathId;
    this.display = mapItem.display;
    this.locationId = mapItem.locationId;
    this.type = mapItem.type;
    this.subType = mapItem.subType;
    
    resolveDeviceDependencies(this);
        
    requiredFields.forEach(field => {       
      if (!this.field) { 
        return false;
      }
    });

    if (!cache.espUrls) {
      // Init cache.
      cache.espUrls = [];
      cache.espData = {};
    }

    if (!cache.espUrls.includes(this.url)) {
      // Add this url to the urls array for polling.
      cache.espUrls.push(this.url);      
    }

    // Spin up a code that queries the esps at an interval and caches their responses.
    if (!cache._pollingIntervalHandler) {
      this.pollInterval = globalConfig[this.type].pollInterval;

      cache._pollingIntervalHandler = setInterval(async () => {
        try {
          const response = await axios(this.url);

          cache.espData[this.url] = {
            timestamp: Date.now(),
            data: response?.data ?? null,
          }
        } catch(err) {
          log(`Polling error for ${this.url}: ${err.message}`);
        }
      }, this.pollInterval);
    }

    this.startPolling();
  },

  // This will only poll the cache
  startPolling() {
    const pollInterval = globalConfig[this.type].pollInterval;
    log(`Polling and updating this ${this.type}-${this.subType} at ${this.url} every ${pollInterval} ms.`, this);
    this._pollingIntervalHandler = setInterval(async () => {

      try {

        const data = this.cache?.espData[this.url];        

        this._updateOnlineState(data);

        if (data?.data) {

          const payloadFieldKey = Object.keys(this.jsonPathId)[0];
          const payload = data.data[this.jsonPath].find(item => item[payloadFieldKey] === this.jsonPathId[payloadFieldKey]);
          const changeInfo = this.analyzeStateChange(payload);

          if (typeof changeInfo === 'undefined') {
            // This is the initial state update.
            log(`Received initial state update.`, this);
            this._updateState(payload);
            this.socketHandler.emitDeviceStateUpdate(this, changeInfo);
            return;
          }

          // Not the initial update, and may or may not have an actual change.
          if (this.subType === constants.SUBTYPE_THERMOMETER) {
            // This needs to be done regardless of whether the data changed from the last poll.
            this.__trendData = this.processThermometerTrendData(this.__trendData, this.state.tempC);

            // Inject the trend field into the update payload (makes the addition of trend transparent).
            payload.trend = {
              diff: this.__trendData?.diff,
              trend: this.__trendData?.trend,  
            }

            // Trenddata can change even if device data does not. Only trigger if significant part changes.
            if (this.state?.diff?.toFixed(2) !== this.__trendData?.diff?.toFixed(2)) {
              // Set changeInfo.changed to trigger a socket push.
              changeInfo.changed = true;
            }
          }
          
          if (changeInfo.changed) {
            // This is an actual change.
            this._updateState(payload);
            this.socketHandler.emitDeviceStateUpdate(this, changeInfo);
          } else {
            // No change.
            return;
          }
      
          switch (this.subType) {
            case constants.SUBTYPE_THERMOMETER:
              if (!Array.isArray(data.data[this.jsonPath])) {
                throw new Error(`Bad data from device, expected array at jsonPath ${this.jsonPath} and got ${typeof data[this.jsonPath]}.`);
              }
                                  
              const { tempC } = this.state;
              
              log(`${this.alias} temperature: ${tempC} °C`, this);              
              break;

            default:
              break;

          }  
        } else {
          // No data in cache yet.
        }

      } catch(err) {
        log(`Polling error: ${err.message}`, this);
      }
      
    }, pollInterval);
  },

  /**
   * Calculate current trend from available history and add a new data point for currentTemp.
   * 
   * @param {*} currTrendData 
   * @returns {*} newTrendData 
   */
  processThermometerTrendData(currTrendData, currentTemp) {

    const getAvgTempFromDataPoints = (dataPoints) => dataPoints.reduce((prev, current, index) => {
        // First time the accumulator has the full object.
        const prevTemp = (index === 1) ? prev.tempC : prev;                  

        const dataPointsAccumulated = index + 1;
        const newVal = (prevTemp * dataPointsAccumulated + Number(current.tempC)) / (dataPointsAccumulated + 1);

        return newVal;
    });
  
    let newTrendData = _.cloneDeep(currTrendData);

    const newDataPoint = { 
      tempC: currentTemp,
      date: Date.now(),
    };


    if (currTrendData) {

      newTrendData.dataPoints.push(newDataPoint);

      const cutoffDate = Date.now() - espConstants.thermo.AVG_CALC_MAX_HISTORY_LENGTH;

      // May discard one or a couple datapoints, depending on poll intervals.
      while (newTrendData.dataPoints[0].date < cutoffDate) {
        newTrendData.dataPoints.shift();
      }

      // Figure out how many data points we have and how many to use for the calculation.
      const dataPointsAvailable = newTrendData.dataPoints.length;
      const dataPointsToUse = Math.min(
        Math.floor(dataPointsAvailable / 2), 
        espConstants.thermo.AVG_CALC_MAX_DATA_POINTS
      );

      // Wait until at least 2 data points are available on each end of the history window.
      if (dataPointsToUse > 1) {

        /**
         * The idea here is to average out the oldest and newest data points in two
         * separate groups, then interpret the difference in avagerage temperature
         * as the trend.
         */
        newTrendData.avgTempPast = getAvgTempFromDataPoints(
          newTrendData.dataPoints.slice(0, dataPointsToUse)
        );

        newTrendData.avgTempNow = getAvgTempFromDataPoints(
          newTrendData.dataPoints.slice(dataPointsAvailable - dataPointsToUse, dataPointsAvailable)
        )
        
        // diff represents the current trend.
        newTrendData.diff = newTrendData.avgTempNow -  newTrendData.avgTempPast;
        
        // Come up with a digest.
        newTrendData.trend = "steady";
        if (newTrendData.diff > espConstants.thermo.TREND_TRESHOULD) {
          newTrendData.trend = "up";
        } else if (newTrendData.diff < -espConstants.thermo.TREND_TRESHOULD) {
          newTrendData.trend = "down";
        }

      }
    } else {
      // No existing data.
      newTrendData = {                
        avgTempPast: currentTemp,
        avgTempNow: currentTemp,
        dataPoints: [ newDataPoint ],
      };              
    }

    // Time window currently covered
    newTrendData.historyStart = Date.now();
    newTrendData.historyEnd = newTrendData.dataPoints[0].date;
    newTrendData.historyLength = newTrendData.historyStart - newTrendData.historyEnd;

    return newTrendData;
  },

  /**
   * Compare newState against the current state of the device.
   * 
   * @param   {} newState 
   * @returns {} Infomation about the change or undefined if current state doesn't exist.
   */
  analyzeStateChange(newState) {
    if (this.state === undefined) {
      // Have no current state. Just received the first update.
      return undefined;
    }

    let changeInfo = {};
    changeInfo.changed = !_.isEqual(this.state, newState);

    return changeInfo;
    //let changed = 'changed': this?.state && tempC !== this?.state.tempC,


  },

  getLiveDevice() {
    return makeLiveDeviceObject(
      this, [
        // Include
      ], {
        // Default
        'display': true,
      }, [
        // Exclude
      ],
      // Use global defaults
      true,
    );
  },

  /**
   * Return a state update to be emitted to the sockets
   */
  getLiveDeviceStateUpdate() {
    const data = {
      state: this.state,
      channel: this.channel,
      isOnline: this.isOnline,
    };

    return data;
  },

  _updateOnlineState(cacheData) {
    if (cacheData?.timestamp > Date.now() - this.pollInterval * 2) {
      // Allow a bit of grace beyond the pollInterval
      this.isOnline = true;
      this.lastSeenAt = Date.now();
    } else {
      this.isOnline = false;
    }  
  },

  _updateState(data) {
    this.lastSeenAt = Date.now();
    this.state = _.cloneDeep(data);
  }
  

};

export default EspDeviceWrapper;