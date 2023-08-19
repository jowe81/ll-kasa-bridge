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
    AVG_CALC_MAX_DATA_POINTS: 30,

    // How much difference (in degrees) constitutes a trend?
    TREND_TRESHOULD: 0.2,

    // How much does a reading need to differ from the previous to be considered and outlier?
    OUTLIER_THRESHOULD: 3,
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

    const requiredFields = ['alias', 'channel', 'id', 'url', 'settings', 'display', 'locationId', 'type', 'subType'];

    this.alias = mapItem.alias;
    this.channel = mapItem.channel;
    this.id = mapItem.id;
    this.url = mapItem.url;
    const urlParts = mapItem.url.split(/[\/]+/);
    this.host = urlParts && urlParts.length > 1 ? urlParts[1] : 'N/A';
    this.settings = mapItem.settings;
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
      cache._pollingHandlers = {};
    }

    if (!cache.espUrls.includes(this.url)) {
      // Add this url to the urls array for polling.
      cache.espUrls.push(this.url);      
    }

    // Query the esps at an interval and cache their responses.
    if (!cache._pollingIntervalHandler) {
      this.pollInterval = globalConfig[this.type].pollInterval;

      if (!cache._pollingHandlers[this.url]) {
        // Not polling this url yet; spin up an interval.
        cache._pollingHandlers[this.url] = setInterval(async () => {
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
    }
    this.startPolling();
  },

  // This will only poll the cache
  startPolling() {
    const pollInterval = globalConfig[this.type].pollInterval;
    log(`Polling and updating this ${this.type}-${this.subType} at ${this.url} every ${pollInterval} ms.`, this);

    this.__trendData = {};

    // Initialize the trend data cache (kept on this device)
    Object.keys(this.settings.trends).forEach(trendKey => this.__trendData[trendKey] = {
      avgTempPast: null,
      avgTempNow: null,
      dataPoints: [],
    });

    this._pollingIntervalHandler = setInterval(async () => {

      try {

        const data = this.cache?.espData[this.url];        

        this._updateOnlineState(data);

        if (data?.data) {
          const { jsonPath, jsonPathId, jsonPathKey } = this.settings;
          const payloadFieldKey = Object.keys(jsonPathId)[0];
          const payload = data.data[jsonPath].find(item => item[payloadFieldKey] === jsonPathId[payloadFieldKey]);
          const changeInfo = this.analyzeStateChange(payload);


          if (typeof changeInfo === 'undefined') {
            // This is the initial state update.
            log(`Received initial state update.`, this);
            this._updateState(payload);
            this.socketHandler.emitDeviceStateUpdate(this, changeInfo);
            return;
          }

          const { tempC } = this.state;

          

          // Not the initial update, and may or may not have an actual change.
          if (this.subType === constants.SUBTYPE_THERMOMETER) {
            // This needs to be done regardless of whether the data changed from the last poll.
            this.__trendData = this.processThermometerTrendData(this.__trendData, tempC);

            // Inject the trends/trend field into the update payload (makes the addition of trend transparent).
            payload.trends = {};
            
            Object.keys(this.settings.trends).forEach(trendKey => {
              const diff = this.__trendData[trendKey] ? this.__trendData[trendKey].diff : 0;
              const trend = this.__trendData[trendKey] ? this.__trendData[trendKey].trend : 'n/a';
              const historyLength = this.__trendData[trendKey] ? this.__trendData[trendKey].historyLength : 'n/a';

              payload.trends[trendKey] = {
                diff,
                trend,
                historyLength,
              }
            })
            
            // Trenddata can change even if device data does not. Only trigger if significant part changes.
            if (this.state?.diff?.toFixed(2) !== this.__trendData?.diff?.toFixed(2)) {
              // Set changeInfo.changed to trigger a socket push.
              changeInfo.changed = true;
            }
          }
          
          if (changeInfo.changed) {
            // This is an actual change. Passing trendData as some gets injected into the payload/state.
            this._updateState(payload);
            this.socketHandler.emitDeviceStateUpdate(this, changeInfo);
          } else {
            // No change.
            return;
          }
      
          switch (this.subType) {
            case constants.SUBTYPE_THERMOMETER:
              if (!Array.isArray(data.data[jsonPath])) {
                throw new Error(`Bad data from device, expected array at jsonPath ${jsonPath} and got ${typeof data[jsonPath]}.`);
              }

              
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
   * Calculate current trends from available history and add a new data point for currentTemp.
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
  
    const newDataPoint = { 
      tempC: currentTemp,
      date: Date.now(),
    };

    const { trends } = this.settings;

    Object.keys(trends).forEach(trendKey => {
      if (currTrendData) {
        const trendData = currTrendData[trendKey];

        if (trendData) {

          trendData.dataPoints.push(newDataPoint);

          const pollInterval = globalConfig[this.type].pollInterval;          
          const { avg_calc_history_length, avg_calc_data_window } = trends[trendKey];          
          const avg_calc_max_data_points = Math.round(avg_calc_data_window / pollInterval);
          const cutoffDate = Date.now() - avg_calc_history_length;

          // May discard one or a couple datapoints, depending on poll intervals.
          while (trendData.dataPoints[0].date < cutoffDate) {
            trendData.dataPoints.shift();
          }
    
          // Figure out how many data points we have and how many to use for the calculation.
          const dataPointsAvailable = trendData.dataPoints.length;
          const dataPointsToUse = Math.min(
            Math.floor(dataPointsAvailable / 2), 
            avg_calc_max_data_points
          );
    
          // Wait until at least 2 data points are available on each end of the history window.
          if (dataPointsToUse > 1) {
    
            /**
             * The idea here is to average out the oldest and newest data points in two
             * separate groups, then interpret the difference in avagerage temperature
             * as the trend.
             */
            trendData.avgTempPast = getAvgTempFromDataPoints(
              trendData.dataPoints.slice(0, dataPointsToUse)
            );
    
            trendData.avgTempNow = getAvgTempFromDataPoints(
              trendData.dataPoints.slice(dataPointsAvailable - dataPointsToUse, dataPointsAvailable)
            )
            
            // diff represents the current trend.
            trendData.diff = trendData.avgTempNow -  trendData.avgTempPast;
            
            // Come up with a digest.
            trendData.trend = "steady";
            if (trendData.diff > espConstants.thermo.TREND_TRESHOULD) {
              trendData.trend = "up";
            } else if (trendData.diff < -espConstants.thermo.TREND_TRESHOULD) {
              trendData.trend = "down";
            }
    
          }
        } else {
          // No existing data.
          trendData.avgTempPast = currentTemp;
          trendData.avgTempNow = currentTemp;
          trendData.dataPoints = [ newDataPoint ];    
        }

        // Time window currently covered
        trendData.historyStart = Date.now();
        trendData.historyEnd = trendData.dataPoints[0].date;
        trendData.historyLength = trendData.historyStart - trendData.historyEnd;
  
      }
  
    })
    //[203, 204].includes(this.channel) && console.log('CurrTrenDData', currTrendData);
    return currTrendData;
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

  getLatestDataPoint() {

    if (!this.__trendData) {
      return null;
    }

    const firstTrendKey = Object.keys(this.settings.trends)[0];
    const availableDatapoints = this.__trendData[firstTrendKey].dataPoints.length;

    if (!availableDatapoints) {
      return null;
    }

    return this.__trendData[firstTrendKey].dataPoints[availableDatapoints - 1];
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

  _updateState(payload, trendData) {
    this.lastSeenAt = Date.now();

    // Handle the fact that some ESPs have different field names for the temperature field.
    const { jsonPathKey } = this.settings;

    if (jsonPathKey !== 'tempC') {
      payload.tempC = payload[jsonPathKey];
      delete payload[jsonPathKey];
    }

    // Handle any outliers (invalid readings are included in outliers as they are extreme values like -127).
    const latestDataPoint = this.getLatestDataPoint();
    const latestTempC = latestDataPoint?.tempC;

    let readingIsOutlier = null;
    
    // If we have a previous sample, compare against, otherwise can't do anything.
    if (latestTempC) {      
      if (Math.random() > 0.5) {
        payload.tempC = payload.tempC + 6;
      }
      if (Math.abs(latestTempC - payload.tempC) >= espConstants.thermo.OUTLIER_THRESHOULD) {
        // Reading differs too much from previous.
        readingIsOutlier = true;
      } else {
        readingIsOutlier = false;
      }

      if (readingIsOutlier) {
        // Interpolate by overwriting the reading with the previous one.
        payload.tempC = latestTempC;
      }
    }

    this.state = _.cloneDeep(payload);
  }
  

};

export default EspDeviceWrapper;