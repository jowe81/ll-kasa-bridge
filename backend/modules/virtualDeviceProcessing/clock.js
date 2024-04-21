import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import { formatTime, formatDateLong, getSunrise, getSunset, getNoon, isDaytime, getTomorrow, isDST } from "../../helpers/jDateTimeUtils.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";
import os from 'os';
import dns from "dns";
import diskusage from "diskusage";
import { exec } from "child_process";


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

        // Only push if the minute switched over.
        if (this.clock._previousMinute !== now.getMinutes()) {            
            const systemInfo = await getSystemInfoData();

            this.clock._previousMinute = now.getMinutes();
            this.clock._updateState(
                {
                    powerState: this.clock.getPowerState(),
                    clock: clockData,
                    system: systemInfo,
                },
                true
            );

            // Update the wall clocks
            let brightnessClock = null;
            let brightnessBclock = null;
            if (now.getHours() === 22) {
                brightnessBclock = 100;
                brightnessClock = 8;
            }
            if (now.getHours() === 8) {
                brightnessBclock = 1500;
                brightnessClock = 1000;
            }

            const hoursPadded = now.getHours().toString().padStart(2, "0");
            const minutesPadded = now.getMinutes().toString().padStart(2, "0");
            
            axios.get(`http://clock.wnet.wn/write?simple=${hoursPadded}.${minutesPadded}${brightnessClock ? `&brightness=${brightnessClock}` : ``}`).catch(err => {
                log(`Unable to write to bedroom wallclock.`, this.clock, 'red');
            })

            if (now.getMinutes() == 0) {        
                let offset = isDST() ? 0 : -3600;


                axios
                    .get(`http://bclock.wnet.wn/write?timestamp=${Math.floor(now.getTime() / 1000) + offset}${brightnessBclock ? `&brightness=${brightnessBclock}` : ``}`)
                    .then((data) => {
                        log(`Updated binary wall clock (DST offset in seconds: ${offset}, brightness ${brightnessBclock}).`, this.clock, "yellow");
                    })
                    .catch((err) => {
                        log(`Unable to write to bedroom wallclock.`, this.clock, "red");
                    });

            }
        }
    }
}

async function getSystemInfoData() {
    const uptimeInSeconds = os.uptime();
    const uptimeInDays = Math.floor(uptimeInSeconds / (3600 * 24));
    const uptimeInHours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
    const uptimeInMinutes = Math.floor((uptimeInSeconds % 3600) / 60);

    const devicePaths = process.env.DISKINFO_DEVICES.split(',');
    const diskInfo = await getDiskInfos(devicePaths);
    const ipv4AddressesByInterface = await getIpAddresses();
    const publicHostnameStatus = await checkPublicHostname(ipv4AddressesByInterface);
    const data = {
        uptime: `${uptimeInDays} days, ${uptimeInHours}:${uptimeInMinutes > 9 ? '' : '0'}${uptimeInMinutes}`,
        loadAvg: os.loadavg().map(n => n.toFixed(2)).join(', '),
        freeMem: (os.freemem() / 1024 / 1024).toFixed(0) + 'M',
        totalMem: (os.totalmem() / 1024 / 1024).toFixed(0) + 'M',
        platform: os.platform(),
        release: os.release(),
        disks: diskInfo,
        ipAddresses: ipv4AddressesByInterface,
        publicHostnameStatus,
    }

    return data;
}

async function getDiskInfos(devicePaths) {
    const promises = devicePaths.map(devicePath => getDiskInfo(devicePath));
    const infos = await Promise.all(promises);
    const diskInfos = {};
    infos.forEach((info, index) => diskInfos[devicePaths[index]] = info);
    
    Object.keys(diskInfos).forEach(devicePath => {
        const info = diskInfos[devicePath]
        if (info) {
            let n = parseInt(info.size);
            let unitIndex = -1;
            while (n > 1) {
                n = n / 1024;
                unitIndex++;
            }
            const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
            const unit = units[unitIndex + 1];

            ['size', 'used', 'free'].forEach(key => {
                info['f_' + key] = (info[key] / Math.pow(10, unitIndex * 3)).toFixed(2) + ` ${unit}`;
            })

            info.freePercent = Math.round((info.free / info.size) * 100);
        }
    })

    return diskInfos;
}

async function getDiskInfo(devicePath) {
    return new Promise((resolve, reject) => {

        exec(`df -k "${devicePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.log(error);
                log(`Failed to execute df. Error: ${error}`);
                return;
            }

            const lines = stdout.split('\n');
            let colsRaw = lines[1].split(/\s+/);
            let colsCount;
            let osDevicePath, size, used, free, usedPercent, iUsed, iFree, iUsedPercent, mountPoint;

            const platform = os.platform();
            if (platform === 'linux') {
                colsCount = 6;
                [osDevicePath, size, used, free, usedPercent] = lines[1].split(/\s+/);
                // Mount point may have spaces - hence the acrobatics here.
                mountPoint = colsRaw.splice(5).join(' ');
            } else if (platform === 'darwin') {
                //OSX - has 3 more columns (that we don't care about).
                colsCount = 9;
                [osDevicePath, size, used, free, usedPercent, iUsed, iFree, iUsedPercent] = lines[1].split(/\s+/);
                mountPoint = colsRaw.splice(8).join(" ");
            }
            
            const info = {
                devicePath,
                osDevicePath,
                size: parseInt(size),
                used: parseInt(used),
                free: parseInt(free),
                mountPoint,
            };

            resolve(info);
        });
    });
}

async function getIpAddresses() {
    return new Promise((resolve) => {
        const networkInterfaces = os.networkInterfaces();

        // Initialize an empty object to store results
        const ipv4AddressesByInterface = {};
        const interfacesToDisplay = process.env.NETWORKINFO_INTERFACES ? process.env.NETWORKINFO_INTERFACES.split(",") : [];

        // Iterate over network interfaces
        Object.entries(networkInterfaces).forEach(([interfaceName, interfaces]) => {
            // Filter interfaces with IPv4 addresses
            const ipv4Interfaces = interfaces.filter(
                (networkInterface) =>
                    interfacesToDisplay.includes(interfaceName) &&
                    networkInterface.family === "IPv4" &&
                    !networkInterface.internal
            );

            // If there are IPv4 addresses, add them to the result object
            if (ipv4Interfaces.length > 0) {
                ipv4AddressesByInterface[interfaceName] = ipv4Interfaces.map(
                    (networkInterface) => networkInterface.address
                );
            }
                
            resolve(ipv4AddressesByInterface);
        });          
    })
}

async function checkPublicHostname(ipv4AddressesByInterface) {
    const hostname = process.env.NETWORKINFO_PUBLIC_HOSTNAME;
    if (hostname && ipv4AddressesByInterface && Object.keys(ipv4AddressesByInterface).length) {        
        try {
            const addresses = await dns.promises.resolve(hostname);
            const matchingAddresses = {};
            const interfaces = Object.keys(ipv4AddressesByInterface);

            interfaces.forEach(networkInterface => {                
                const addressesForThisInterface = ipv4AddressesByInterface[networkInterface];
                const intersection = addressesForThisInterface.filter(address => addresses.includes(address));                
                if (intersection.length) {
                    matchingAddresses[networkInterface] = intersection;
                }            
            })
            
            if (!Object.keys(matchingAddresses).length) {
                return {
                    ok: false,
                    message: `OFFLINE!`,
                };
            }

            return {
                ok: true,
                message: `OK (${Object.keys(matchingAddresses).join(", ")})`,
            };
        } catch (err) {
            log(`Unable to resolve ${hostname}:  ${err.message}`, this, "red");
            return {
                ok: false,
                message: `ERROR!`,
            }
        }
    }
    return {
        ok: null,
        message: `Config Error`,
    };
}

function clockHandler(devicePool, clock, cache) {
    return new ClockHandler(devicePool, clock, cache);
}

export default clockHandler;
