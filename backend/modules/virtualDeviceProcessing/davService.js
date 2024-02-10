import _ from "lodash";
import { createDAVClient } from "tsdav";
import nodeIcal from "node-ical";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import { getBeginningOfDay } from "../../helpers/jDateTimeUtils.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_DAV_SERVICE];

class DavServiceHandler {
    constructor(devicePool, deviceWrapper, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.deviceWrapper = deviceWrapper;
        this.init(cache);
    }

    analyzeStateChange(oldState, newState) {
        if (oldState === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.on_off = oldState?.powerState !== newState?.powerState;
        changeInfo.changed = changeInfo.on_off || changeInfo.deviceWrapper;

        return changeInfo;
    }

    getLiveDevice() {
        const liveDevice = makeLiveDeviceObject(
            this.deviceWrapper,
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
        if (!(this.deviceWrapper && this.devicePool && this.deviceWrapper.settings)) {
            log(`Failed to initialize Dav service.`, this, "red");
            return false;
        }

        if (!cache) {
            console.error("Dav init failed - did not get cache reference.");
            return false;
        }

        this.deviceWrapper._deviceHandlers = this;

        // Store the cache reference.
        this.cache = cache;
        this.cache.data = {
            calendars: {},
            calendarData: {},
            calendarObjectsByRemotes: {},
        };

        this.resolveApiCredentials();

        // Turn on when first starting.
        this.deviceWrapper.setPowerState(true);
        this.deviceWrapper.subscribeListener("powerState", (newPowerState) => {});

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval = this.deviceWrapper.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(() => this.serviceIntervalHandler(), interval);

        this.initialized = true;

        log(`Initialized ${this.deviceWrapper.subType} "${this.deviceWrapper.alias}".`, this.deviceWrapper);
        log(
            `Check-Interval: ${Math.round(interval / constants.SECOND)} seconds (~ ${Math.round(
                interval / constants.MINUTE
            )} minutes).`,
            this.deviceWrapper
        );

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => {
            this.serviceIntervalHandler();
        }, 5000);
    }

    resolveApiCredentials() {
        this.apiCredentials = [];

        const remotes = this.deviceWrapper.settings?.remotes;
        if (Array.isArray(remotes)) {
            remotes.forEach((remoteSettings, index) => {
                const credentials = {};
                if (typeof remoteSettings.credentials === "object") {
                    Object.keys(remoteSettings.credentials).forEach((key) => {
                        const envKey = remoteSettings.credentials[key];
                        credentials[key] = process.env[envKey];
                    });
                }

                const { label, serverUrl, authMethod, defaultAccountType, calendarsToDisplay } = remoteSettings;

                this.apiCredentials.push({
                    index,
                    label,
                    defaultAccountType,
                    serverUrl,
                    authMethod,
                    credentials,
                    calendarsToDisplay,
                });
            });
        }
    }

    async serviceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }
                
        const promises = this.apiCredentials.map(async (settings, index) => {
            // **** Process this remote ********************
            const { serverUrl, authMethod, defaultAccountType, credentials } = settings;

            try {
                const client = await createDAVClient({
                    serverUrl,
                    authMethod,
                    defaultAccountType,
                    credentials,
                });

                const calendars = process.env.DISABLE_OUTSIDE_API_CALLS ? [] : await client.fetchCalendars();

                // Update the calendars in the cache                
                calendars.forEach(calendar => calendar.url && (this.cache.data.calendars[calendar.url] = calendar));
                
                const promises = settings.calendarsToDisplay.map(async ({ displayName, url }) => {
                    // **** Process this calendar within the remote ********************
                    const calendar = this.cache.data.calendars[url]; // This is the caldav calendar object.
                    const localData = this.cache.data.calendarData[url]; // These are the caldav calendar event objects.

                    // See if we have data for this calendar
                    if (false && localData) {
                        // THIS DOESN'T WORK - DISABLED FOR NOW.
                        // Data for this calendar exists. Only run a sync request.
                        const props = {
                            collection: {
                                url: calendar.url,
                                ctag: calendar.ctag,
                                syncToken: calendar.syncToken,
                                objects: undefined,
                                objectMultiGet: client.calendarMultiGet,
                            },
                            method: "webdav",
                            detailedResult: true,
                        };
                        console.log('Requesting:', props);
                        const result = await client.smartCollectionSync(props);
                        console.log(result.objects);

                        const { created, updated, deleted } = result.objects;
                        console.log(`Sync request returned:`);
                        console.log("Created", created);
                        console.log("Updated", updated);
                        console.log("Deleted", deleted);
                    } else {
                        // No data for this calenadr yet. Fetch the whole thing.
                        if (calendar) {
                            log(
                                `Remote "${settings.label}": Fetching calendar objects from ${calendar.url}`,
                                this.deviceWrapper
                            );
                            const calendarObjects = process.env.DISABLE_OUTSIDE_API_CALLS
                                ? []
                                : await client.fetchCalendarObjects({ calendar });
                                
                            this.cache.data.calendarData[url] = calendarObjects;

                            const convertedCalendarObjects = [];
                            calendarObjects.forEach((calendarObject) => {
                                const parsed = nodeIcal.parseICS(calendarObject.data);
                                const items = Object.values(parsed).filter((item) => true || item.type === "VEVENT");

                                items.forEach((vevent) => {
                                    convertedCalendarObjects.push({
                                        ...vevent,
                                        calendarLabel: settings.label, // Locally assigned label to all the calendars at this remote
                                        calendarDisplayName: displayName, // Calendar specific remotely assigned display name
                                        calendarIndex: index,
                                    });
                                });
                            });

                            // Init the cache path if it doesn't exist yet
                            if (!this.cache.data.calendarObjectsByRemotes[index]) {
                                this.cache.data.calendarObjectsByRemotes[index] = [];
                            }

                            // Remove zombies from this calendar from the full list of events for this remotes.
                            const updated = this.cache.data.calendarObjectsByRemotes[index].filter(item => item.calendarIndex !== index);

                            // Add the new events from this calendar.
                            updated.push(...convertedCalendarObjects);

                            // Update the full list for this remote.
                            this.cache.data.calendarObjectsByRemotes[index] = updated;

                            log(
                                `Remote "${settings.label}": Initial sync of calendar at ${url} successful.`,
                                this.deviceWrapper
                            );
                        } else {
                            log(
                                `Remote "${settings.label}": Error: Initial sync of calendar at ${url} failed. Calendar info does not exist.`,
                                this.deviceWrapper,
                                "red"
                            );
                        }
                    }
                });

                await Promise.all(promises);
                log(`Remote "${settings.label}": Done fetching.`, this.deviceWrapper);
            } catch (err) {
                log(`Remote "${settings.label}": API Error: ${err.message}`, this.deviceWrapper, "bgRed");
                console.log(err)
            }
        });

        log(`Pulling events from ${promises.length} calendars...`, this.deviceWrapper);

        await Promise.all(promises);

        this.processCachedApiResponse();    
    }

    /**
     * Update state after a request came back.
     */
    processCachedApiResponse() {
        const eventsByRemote = this.cache.data.calendarObjectsByRemotes ?? [];

        let allItems = [];

        Object.values(eventsByRemote).forEach(eventsFromRemote => {
            allItems.push(...eventsFromRemote);
        })

        const today = getBeginningOfDay();

        let displayData = {
            allItems,
            events: allItems
                // We're only interested in events.
                .filter((item) => item.type === "VEVENT")
                // Discard events that were before today.
                .filter((item) => new Date(new Date(item.start)) > today || new Date(item.end) > today)
                .sort((a, b) => (a.start > b.start ? 1 : -1)),
        };

        this.deviceWrapper._updateState(
            {
                powerState: this.deviceWrapper.getPowerState(),
                api: displayData,
                settings: this.deviceWrapper.settings,
            },
            true
        );
        log(
            `${this.deviceWrapper.alias} received API data from ${this.deviceWrapper.settings.remotes.length} remote(s): ${displayData.events.length} items.`,
            this.deviceWrapper
        );
    }

}

function davServiceHandler(devicePool, deviceWrapper, cache) {
    return new DavServiceHandler(devicePool, deviceWrapper, cache);
}

export default davServiceHandler;