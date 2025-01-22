import constants from "./constants.js";
const { SECOND, MINUTE, HOUR } = constants;
const {
    SUBTYPE_BULB,
    SUBTYPE_LED_STRIP,
    SUBTYPE_PLUG,
    SUBTYPE_SWITCH,

    SUBTYPE_AIR_AC,
    SUBTYPE_AIR_FAN,
    SUBTYPE_AIR_HEAT,
    SUBTYPE_ENTERTAINMENT,
    SUBTYPE_LIGHT,
    SUBTYPE_THERMOMETER,
    SUBTYPE_CHRISTMAS_TREE,

    DEVICETYPE_ESP_THERMOMETER,
    DEVICETYPE_ESP_RELAY,
    DEVICETYPE_ESP_MAILBOX,
} = constants;

const globalConfig = {
    [SUBTYPE_BULB]: {
        pollInterval: 10000,
    },
    [SUBTYPE_LED_STRIP]: {
        pollInterval: 10000,
    },
    [SUBTYPE_SWITCH]: {
        pollInterval: 1000,
    },
    [SUBTYPE_PLUG]: {
        pollInterval: 5000,
    },

    [DEVICETYPE_ESP_THERMOMETER]: {
        pollInterval: 10000,
    },

    [DEVICETYPE_ESP_RELAY]: {
        pollInterval: 10000,
    },

    [DEVICETYPE_ESP_MAILBOX]: {
        pollInterval: 10000,
    },

    /**
     * Other devies that play audio in addition to the server.
     */
    remoteAudioPlayers: [
        {
            url: "http://192.168.1.135:3999/play",
        },
    ],
    /**
     * Classes are used to convenienently select devices that belong together.
     * When assigning classes to a device or group, referencing the class name of a child class
     * results in all its parents being assigned to the device automatically.
     */
    classTree: {
        // Lighting
        "class-lights": {
            // Indoor Lighting
            "class-indoorLights": {
                "class-bathroomLights": {},
                "class-bedroomLights": {
                    "class-johannesDeskLights": {},
                },
                "class-hallwayLights": {},
                "class-kitchenLights": {
                    //"class-kitchenCounterLights": {},
                },
                "class-livingroomLights": {
                    "class-jessDeskLights": {},
                },
            },

            // Outdoor Lighting
            "class-outdoorLights": {},
        },

        // Devices
        "class-devices": {
            // Air handling
            "class-hvac": {},

            // Other
            "class-electronics": {},
        },
    },

    defaults: {
        /**
         * Devices
         */
        pollInterval: 10000,
        offlineTolerance: 3,

        periodicFilters: {
            /**
             * How often should the service check for filters to be run?
             */
            checkInterval: 10 * SECOND,
            /**
             * How long before and after sunrise/sunset should the filter be executed when it has the
             * periodicallyActive flag set?
             */
            paddingFromSunEvent: 2 * HOUR,
        },

        backendAlertHandler: {
            // How often should the service check for active alerts to play audio for?
            checkInterval: 15 * SECOND,
            defaultPlayInterval: 5 * MINUTE,
            defaultAudiofile: "smooth_bells_quiet.mp3",
        },
    },

    /**
     * Global filter definitions
     */
    filters: [
        {
            id: "naturalLight",
            globalLabel: "Automatic color temperature control",
            pluginName: "naturalLight",
            settings: {
                transitionTime: 1 * HOUR,
                offset: {
                    /**
                     * Offset the shift from sunrise?
                     */
                    sunrise: +1 * HOUR,
                    /**
                     * Offset the shift from sunset?
                     */
                    sunset: -1 * HOUR,
                },
                /**
                 * Define daytime and nighttime defaults for each light type
                 */
                daytimeState: {
                    ledStrip: {
                        hue: 227,
                        saturation: 23,
                    },
                    bulb: {
                        color_temp: 6000,
                    },
                },
                nighttimeState: {
                    ledStrip: {
                        hue: 20,
                        saturation: 20,
                    },
                    bulb: {
                        color_temp: 2700,
                    },
                },
            },
            periodicallyActive: {
                /**
                 * This MUST either be set here (restriction: 'always' or periodicallyActive: true)
                 * or on an override for partial filtering to work properly.
                 */
                restriction: "always",
                /**
                 * Can override any of the periodicFilters defaults configured in defaults.periodicFilters above.
                 */
                paddingFromSunEvent: {
                    sunrise: 1.5 * HOUR,
                    sunset: 1.5 * HOUR,
                },
            },
        },
        {
            /**
             * Id that filter properties on devices can reference to use this filter
             */
            id: "sunEvents-nightlights",

            /**
             * Label for the filter (defaults to pluginName if missing)
             */
            globalLabel: "Brightness and color control for nightlights",

            /**
             * Name of the filter plugin (maps to 'filters/name.js' )
             *
             * pluginName:
             */
            pluginName: "sunEvents",

            /**
             * State data for the filter. Properties must be valid IOT.SMARTBULB parameters.
             *
             * Example for sunEvents:
             *
             * stateData: {
             *  brightness: {
             *    value: 90,
             *    altValue: 10,
             *  }
             * }
             *
             */

            // Should this filter be invoked when a switch is turned on or off?
            switchPosition: true,

            /**
             * Populate this to add the filter to the periodic filter service runs.
             *
             * Example:
             *
             * periodicallyActive: {
             *  interval: 1 * MINUTE,
             *  restriction: 'duskToDawn'
             * }
             */
            periodicallyActive: {
                /**
                 * Set the interval at which the filter should be run against this device.
                 *
                 * interval:
                 */
                interval: 1 * MINUTE,

                /**
                 * Restrict the operation of the filter to certain times of the day.
                 *
                 * Must be one of the following: duskToDawn
                 *
                 * restriction:
                 */
                restriction: "duskToDawn",
            },

            settings: {
                // Settings specific to the sunEvents filter
                /**
                 * Specify across what time window the transition should occur.
                 * If not set or 0, it will be instant.
                 */
                transitionTime: 2 * HOUR,

                /**
                 * Specify an optional offset at which the transition should occur.
                 * The offset shifts the transition to before or after the sun event.
                 */
                offset: 0 * HOUR,

                /**
                 * If atDawnAndDuskOnly is set, apply optional padding on both sides of the time window
                 * resulting from the above parameters.
                 */
                padding: 5 * MINUTE,
            },
        },
        {
            id: "sunEvents-outdoorLights",
            globalLabel: "Control for outdoor illumination",
            pluginName: "sunEvents",
            settings: {
                transitionTime: 1 * HOUR,
                offset: {
                    sunset: 0 * MINUTE,
                    sunrise: -30 * MINUTE,
                },
            },
            periodicallyActive: {
                restriction: "duskToDawn",
            },
            stateData: {
                brightness: {
                    value: 0,
                    altValue: 5,
                },
                on_off: {
                    value: 0,
                    altValue: 1,
                },
            },
        },
        {
            id: "schedule-outdoorLights",
            pluginName: "schedule",
            periodicallyActive: true,
            schedule: [
                /**
                 * The pair of items below turns the lamp on 45 minutes before sunset by overwriting
                 * the on_off and brightness properties for the stateData passed in
                 * (possibly the output from another filter).
                 *
                 * A minute later, the override is disabled and the stateData will just pass through,
                 * (it may be empty or come from naturalLight and/or sunEvents).
                 */

                /*
                 * This schedule item gets triggered by sunset, with an offset.
                 * It runs a filter instead of defining data here.
                 */
                {
                    trigger: {
                        event: "sunset",
                        offset: -45 * MINUTE,
                    },
                    stateData: {
                        on_off: 1,
                        brightness: 1,
                    },
                },
                /**
                 * This item rescinds the previous one a minute later
                 */
                {
                    trigger: {
                        event: "sunset",
                        offset: -44 * MINUTE,
                    },
                    stateData: {},
                },

                /**
                 * This is a plain schedule item - specify a time and stateData.
                 */
                {
                    trigger: {
                        hours: 23,
                        minutes: 0,
                    },
                    stateData: {
                        brightness: 1,
                    },
                },

                /**
                 * This item, with an empty stateData object, will
                 * clear whatever adjustments the preceding item made,
                 * letting the input stateData pass through.
                 */
                {
                    trigger: {
                        hours: 5,
                    },
                    stateData: {},
                },

                /**
                 * The following pair of items turns the lamp off at sunrise by overwriting
                 * the on_off property for the stateData passed in (possibly output from another filter)
                 * A minute later, the override is disabled and the output from the previous filter
                 * can pass through.
                 */

                /**
                 * This schedule item gets triggered by sunrise, with an offset.
                 * It runs a filter instead of defining data here.
                 */
                {
                    trigger: {
                        event: "sunrise",
                    },
                    stateData: {
                        on_off: 0,
                    },
                },
                /**
                 * This item rescinds the previous one a minute later
                 */
                {
                    trigger: {
                        event: "sunrise",
                        offset: 1 * MINUTE,
                    },
                    stateData: {},
                },
            ],
        },
        {
            id: "schedule-kitchenCounterLights",
            pluginName: "schedule",
            periodicallyActive: true,
            schedule: [
                /**
                 * This is a plain schedule item - specify a time and stateData.
                 */
                {
                    trigger: {
                        hours: 7,
                        minutes: 0,
                    },
                    stateData: {
                        on_off: 1,
                    },
                },
                {
                    trigger: {
                        hours: 7,
                        minutes: 2,
                    },
                    stateData: {
                        // None. Now it can be manually switched.
                    },
                },
                {
                    trigger: {
                        hours: 22,
                        minutes: 0,
                    },
                    stateData: {
                        on_off: 0,
                    },
                },
                {
                    trigger: {
                        hours: 22,
                        minutes: 2,
                    },
                    stateData: {
                        // None. Now it can be manually switched.
                    },
                },
            ],
        },
        {
            id: "schedule-hallwaysNightlights",
            pluginName: "schedule",
            periodicallyActive: true,
            schedule: [
                /**
                 * The pair of items below turns the lamp on 45 minutes before sunset by overwriting
                 * the on_off and brightness properties for the stateData passed in
                 * (possibly the output from another filter).
                 *
                 * A minute later, the override is disabled and the stateData will just pass through,
                 * (it may be empty or come from naturalLight and/or sunEvents).
                 */

                /*
                 * This schedule item gets triggered by sunset, with an offset.
                 * It runs a filter instead of defining data here.
                 */
                {
                    trigger: {
                        event: "sunset",
                        offset: -45 * MINUTE,
                    },
                    stateData: {
                        on_off: 1,
                        brightness: 5,
                        color_temp: 2700,
                    },
                },
                /**
                 * This item rescinds the previous one a minute later
                 */
                {
                    trigger: {
                        event: "sunset",
                        offset: -44 * MINUTE,
                    },
                    stateData: {},
                },

                /**
                 * This is a plain schedule item - specify a time and stateData.
                 */
                {
                    trigger: {
                        hours: 23,
                        minutes: 0,
                    },
                    stateData: {
                        brightness: 1,
                    },
                },

                /**
                 * This item, with an empty stateData object, will
                 * clear whatever adjustments the preceding item made,
                 * letting the input stateData pass through.
                 */
                {
                    trigger: {
                        hours: 5,
                    },
                    stateData: {},
                },

                /**
                 * The following pair of items turns the lamp off at sunrise by overwriting
                 * the on_off property for the stateData passed in (possibly output from another filter)
                 * A minute later, the override is disabled and the output from the previous filter
                 * can pass through.
                 */

                /**
                 * This schedule item gets triggered by sunrise, with an offset.
                 * It runs a filter instead of defining data here.
                 */
                {
                    trigger: {
                        event: "sunrise",
                    },
                    stateData: {
                        on_off: 0,
                    },
                },
                /**
                 * This item rescinds the previous one a minute later
                 */
                {
                    trigger: {
                        event: "sunrise",
                        offset: 1 * MINUTE,
                    },
                    stateData: {},
                },
            ],
        },
    ],

    /**
     * Device Group Definitions
     */
    groups: [],

    /**
     * Locations
     */
    locations: [
        {
            id: "loc-default",
            name: "No location assigned",
        },
        {
            id: "loc-livingRoom",
            name: "Living Room",
        },
        {
            id: "loc-kitchen",
            name: "Kitchen",
        },
        {
            id: "loc-hallway",
            name: "Hallway",
        },
        {
            id: "loc-bathroom",
            name: "Bathroom",
        },
        {
            id: "loc-bedroom",
            name: "Bedroom",
        },
        {
            id: "loc-recroom",
            name: "Rec Room",
        },
        {
            id: "loc-outside",
            name: "Outside",
        },
        {
            id: "loc-office-johannes",
            name: "Office",
        },
        {
            id: "loc-garage",
            name: "Garage",
        },
    ],
};

const deviceMap = [
    /**
     * Tp Link Kasa devices
     */
    /**
     * Outside / Garage
     */
    {
        alias: "Front Door Lamp",
        channel: 1,
        class: "class-outdoorLights",
        id: "8012E7EA0A70974D997DE95E898FBA261F980E1A",
        displayLabel: "Entrance",
        locationId: "loc-outside",
        subType: SUBTYPE_BULB,
        filters: [
            { refId: "sunEvents-outdoorLights" },
            {
                refId: "naturalLight",
                settings: {
                    offset: {
                        sunset: 0,
                        sunrise: 0,
                    },
                },
            },
            { refId: "schedule-outdoorLights" },
        ],
    },
    /**
     * Kitchen
     * 8012511ABF75C811DB47A833DD2EDAED1F791417
     */
    {
        alias: "Counter",
        channel: 9,
        id: "80068105FEB3EACD7AC20A6D1702871720C3A77A",
        displayLabel: "Counter",
        displayType: SUBTYPE_LIGHT,
        locationId: "loc-kitchen",
        subType: SUBTYPE_SWITCH,
        filters: [{ refId: "schedule-kitchenCounterLights" }],
    },
    {
        alias: "Night Light",
        channel: 8,
        id: "8012511ABF75C811DB47A833DD2EDAED1F791417",
        displayLabel: "Nightlight",
        displayType: SUBTYPE_LIGHT,
        locationId: "loc-kitchen",
        subType: SUBTYPE_BULB,
    },
    /**
     * Bedroom
     */
    {
        alias: "Jess Bed Switch",
        channel: 10,
        id: "8006000F366B7DD70835CBF38A51040620662083",
        displayLabel: "Bed Shelf",
        displayType: SUBTYPE_LIGHT,
        locationId: "loc-bedroom",
        subType: SUBTYPE_SWITCH,
        targets: {
            on: [
                // Bed Strip
                {
                    channel: 11,
                    stateData: {
                        brightness: 80,
                        on_off: 1,
                        saturation: 0,
                    },
                },
            ],
            off: [
                {
                    channel: 11,
                    stateData: {
                        on_off: 0,
                        transition: 20000,
                    },
                },
                // Ceiling
                { channel: 12, stateData: false },
            ],
        },
    },
    {
        alias: "Bed Shelf Strip",
        channel: 11,
        id: "80120CD616EF7A3088B8A38BB8E191171F54389E",
        locationId: "loc-bedroom",
        subType: SUBTYPE_LED_STRIP,
        filters: [
            {
                /**
                 * Optionally reference a globally defined filter by its id.
                 *
                 * If set, additional parameters may be defined which will override the
                 * defaults of the global filter.
                 *
                 * refId:
                 */
                refId: "sunEvents-nightlights",

                /**
                 * Label for the filter. If not provided it will:
                 * - default to the referenced global filters label if one is specified
                 * - default to pluginName if no global filter is referenced
                 *
                 * label:
                 */
                label: "Led-strip bed",

                /**
                 * Name of the filter plugin (maps to 'filters/name.js' )
                 *
                 * pluginName:
                 */

                /**
                 * State data for the filter. Properties must be valid IOT.SMARTBULB parameters.
                 *
                 * Example for sunEvents:
                 *
                 * stateDate: {
                 *  brightness: {
                 *    value: 90,
                 *    altValue: 10,
                 *  }
                 * }
                 *
                 */
                stateData: {
                    brightness: {
                        value: 85,
                        altValue: 1,
                    },
                    saturation: {
                        value: 15,
                        altValue: 100,
                    },
                    hue: {
                        value: 24,
                        altValue: 24,
                    },
                },

                // Should this filter be invoked when a switch is turned on or off?
                switchPosition: true,

                /**
                 * Populate this to add the filter to the periodic filter service runs.
                 *
                 * Example:
                 *
                 * periodicallyActive: {
                 *  interval: 1 * MINUTE,
                 *  restriction: 'duskToDawn'
                 * }
                 */

                settings: {
                    // Settings specific to the sunEvents filter
                    /**
                     * Specify across what time window the transition should occur.
                     * If not set or 0, it will be instant.
                     */
                    transitionTime: 1 * HOUR,

                    /**
                     * Specify an optional offset at which the transition should occur.
                     * The offset shifts the transition to before or after the sun event.
                     */
                    offset: 0 * HOUR,

                    /**
                     * If atDawnAndDuskOnly is set, apply optional padding on both sides of the time window
                     * resulting from the above parameters.
                     */
                    padding: 5 * MINUTE,
                },
            },
        ],
        linkedDevices: [{ channel: 10, sync: true, onPosition: true, offPosition: true }],
        //   linkedDevices: [
        //     {
        //       channel: 10,
        //       // Sync the switch to the powerstate of this device or just toggle it?
        //       sync: true,
        //       // Only has effect if sync === true: should the device be inversely synced
        //       inverse: false,
        //       // Sync/toggle when this device is set to the on position
        //       onPosition: true,
        //       // Sync/toggle when this device is set to the off position
        //       offPosition: true,
        //       // NOT YET IMPLEMENTED: Sync/toggle only if the listed devices (channel numbers) share the same powerstate as this device
        //       onlyWhenSameStateAs: []
        //     },
        //     // When this light goes off, take channel 2 with.
        //     { channel: 2, sync: true, onPosition: false, offPosition: true },
        //   ],
    },
    {
        alias: "Bedroom Ceiling 1",
        channel: 12,
        id: "801264A4EC3F66CAC02D4FF78712E6D11F992564",
        locationId: "loc-bedroom",
        subType: SUBTYPE_BULB,
        filters: [
            {
                refId: "naturalLight",
                periodicallyActive: true,
                applyPartially: 0.3,
            },
        ],
    },
    /**
     * Rec Room
     */
    {
        alias: "Rec Room",
        channel: 20,
        id: "8012D32B889FD9CE23C825CEB1C2EFD41F73D8E2",
        locationId: "loc-recroom",
        subType: SUBTYPE_BULB,
    },
    {
        alias: "Rec Room Strip 1",
        channel: 21,
        id: "80125D66D3B56B9365A992BA16C9D3E0201EEDC1",
        locationId: "loc-recroom",
        subType: SUBTYPE_LED_STRIP,
    },
    {
        alias: "Hallway",
        channel: 30,
        id: "80124378042EF9B324B75F639D993F9F20F23759",
        locationId: "loc-recroom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "schedule-hallwaysNightlights" }],
    },
    /**
     * ESP and Other devices
     */
    {
        alias: "Outside",
        channel: 201,
        id: "esp8266-01-0",
        url: "http://192.168.1.23/read",
        display: true,
        locationId: "loc-outside",
        type: constants.DEVICETYPE_ESP_THERMOMETER,
        subType: constants.SUBTYPE_THERMOMETER,
        settings: {
            jsonPath: "temperature_sensors",
            jsonPathId: { local_id: 0 },
            jsonPathKey: "tempC",
            trends: {
                short: {
                    label: "short",
                    avg_calc_history_length: 15 * MINUTE,
                    avg_calc_data_window: 3 * MINUTE,
                },
                mid: {
                    label: "mid",
                    avg_calc_history_length: 30 * MINUTE,
                    avg_calc_data_window: 6 * MINUTE,
                },
                long: {
                    label: "long",
                    avg_calc_history_length: 60 * MINUTE,
                    avg_calc_data_window: 10 * MINUTE,
                },
            },
            pushTo: [
                {
                    id: "JoWe",
                    url: "https://drw.spdns.de/wff/temperatur.php",
                    interval: 3 * MINUTE,
                },
            ],
            sampleCollectInterval: 15 * MINUTE,
            pushToDynforms: true,
            dynformsSettings: {
                api: {
                    baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                    path: null, // will use .env DYNFORMS_PATH or default instead
                    queryParams: {},
                },
                request: {
                    collectionName: "weatherHistory",
                    requestType: "push",
                },
            },
        },
    },
    {
        alias: "Garage",
        channel: 202,
        id: "esp8266-01-1",
        url: "http://192.168.1.23/read",
        display: true,
        locationId: "loc-garage",
        type: constants.DEVICETYPE_ESP_THERMOMETER,
        subType: constants.SUBTYPE_THERMOMETER,
        settings: {
            jsonPath: "temperature_sensors",
            jsonPathId: { local_id: 1 },
            jsonPathKey: "tempC",
            trends: {
                short: {
                    label: "short",
                    avg_calc_history_length: 15 * MINUTE,
                    avg_calc_data_window: 1 * MINUTE,
                },
                mid: {
                    label: "mid",
                    avg_calc_history_length: 45 * MINUTE,
                    avg_calc_data_window: 5 * MINUTE,
                },
                long: {
                    label: "long",
                    avg_calc_history_length: 90 * MINUTE,
                    avg_calc_data_window: 10 * MINUTE,
                },
            },
            pushTo: [
                {
                    id: "JoWe",
                    url: "http://drw.spdns.de/wff/temperatur.php",
                    interval: 3 * MINUTE,
                },
            ],
            sampleCollectInterval: 1 * HOUR,
            pushToDynforms: true,
            dynformsSettings: {
                api: {
                    baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                    path: null, // will use .env DYNFORMS_PATH or default instead
                    queryParams: {},
                },
                request: {
                    collectionName: "weatherHistory",
                    requestType: "push",
                },
            },
        },
    },
    {
        alias: "Office",
        channel: 203,
        id: "esp8266-02-0",
        url: "http://192.168.1.22/read",
        display: true,
        locationId: "loc-office-johannes",
        type: constants.DEVICETYPE_ESP_THERMOMETER,
        subType: constants.SUBTYPE_THERMOMETER,
        settings: {
            jsonPath: "ds18b20",
            jsonPathId: { local_id: 0 },
            jsonPathKey: "temperature",
            trends: {
                short: {
                    label: "short",
                    avg_calc_history_length: 15 * MINUTE,
                    avg_calc_data_window: 1 * MINUTE,
                },
                mid: {
                    label: "mid",
                    avg_calc_history_length: 45 * MINUTE,
                    avg_calc_data_window: 5 * MINUTE,
                },
                long: {
                    label: "long",
                    avg_calc_history_length: 90 * MINUTE,
                    avg_calc_data_window: 10 * MINUTE,
                },
            },
            sampleCollectInterval: 1 * HOUR,
            pushToDynforms: true,
            dynformsSettings: {
                api: {
                    baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                    path: null, // will use .env DYNFORMS_PATH or default instead
                    queryParams: {},
                },
                request: {
                    collectionName: "weatherHistory",
                    requestType: "push",
                },
            },
        },
    },
    // {
    //     alias: "Bathroom",
    //     channel: 204,
    //     id: "esp8266-02-1",
    //     url: "http://192.168.1.22/read",
    //     display: true,
    //     locationId: "loc-bathroom",
    //     type: constants.DEVICETYPE_ESP_THERMOMETER,
    //     subType: constants.SUBTYPE_THERMOMETER,
    //     settings: {
    //         jsonPath: "ds18b20",
    //         jsonPathId: { local_id: 1 },
    //         jsonPathKey: "temperature",
    //         trends: {
    //             short: {
    //                 label: "short",
    //                 avg_calc_history_length: 5 * MINUTE,
    //                 avg_calc_data_window: 1 * MINUTE,
    //             },
    //             mid: {
    //                 label: "mid",
    //                 avg_calc_history_length: 20 * MINUTE,
    //                 avg_calc_data_window: 5 * MINUTE,
    //             },
    //             long: {
    //                 label: "long",
    //                 avg_calc_history_length: 60 * MINUTE,
    //                 avg_calc_data_window: 10 * MINUTE,
    //             },
    //         },
    //         sampleCollectInterval: 1 * HOUR,
    //         pushToDynforms: true,
    //         dynformsSettings: {
    //             api: {
    //                 baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
    //                 path: null, // will use .env DYNFORMS_PATH or default instead
    //                 queryParams: {},
    //             },
    //             request: {
    //                 collectionName: "weatherHistory",
    //                 requestType: "push",
    //             },
    //         },
    //     },
    // },
    {
        alias: "Kitchen Timer",
        channel: 209,
        id: "timer-kitchen",
        display: true,
        displayLabel: "Timer",
        displayType: constants.SUBTYPE_TIMER,
        locationId: "loc-kitchen",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_TIMER,
        settings: {
            timers: [
                {
                    id: "30s",
                    length: 30 * SECOND,
                    subLabel: "Fcy Cfe",
                    ttl: 0,
                    audiofileExpired: "fancy-coffee.mp3",
                },
                {
                    id: "1m",
                    length: 1 * MINUTE,
                    ttl: 0,
                },
                {
                    id: "3m",
                    topLabel: null, // will be set to id if undefined or null
                    subLabel: "Tea",
                    length: 3 * MINUTE,
                    ttl: 3 * MINUTE,
                    repeatAlarmEvery: 60 * SECOND, // will default to a minute if undefined or null
                    audiofileScheduled: "3-minutes.mp3",
                },
                {
                    id: "4m",
                    subLabel: "Coffee",
                    length: 4 * MINUTE,
                    ttl: 3 * MINUTE,
                    audiofileScheduled: "4-minutes.mp3",
                },
                {
                    id: "6m30",
                    subLabel: "Eggs",
                    length: 6 * MINUTE + 30 * SECOND,
                    ttl: 3 * MINUTE,
                    audiofileScheduled: "6-30minutes.mp3",
                },
                {
                    id: "10m",
                    length: 10 * MINUTE,
                    ttl: 3 * MINUTE,
                },
                {
                    id: "20m",
                    length: 20 * MINUTE,
                    ttl: 3 * MINUTE,
                },
                {
                    id: "pomodoro",
                    topLabel: "25m",
                    subLabel: "P'doro",
                    displayButton: true,
                    length: 25 * MINUTE,
                    ttl: 0,
                    audiofileScheduled: false,
                    audiofileExpired: "timer-pomodoro.mp3",
                },
                {
                    id: "60m",
                    topLabel: "1h",
                    displayButton: true,
                    length: 60 * MINUTE,
                    ttl: 3 * MINUTE,
                },
            ],
        },
    },
    {
        alias: "Main Clock",
        channel: 500,
        id: "clock",
        display: true,
        displayLabel: "Clock",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_CLOCK,
        settings: {
            coordinates: {
                lat: constants.DEFAULT_LAT,
                lon: constants.DEFAULT_LON,
            },
            timeFormat: "HH:MM",
            custom: {
                binaryClock: {
                    url: "http://bclock.wnet.wn/",
                },
            },
        },
    },
    {
        //api.openweathermap.org/data/2.5/forecast?lat=49.2762&lon=-123.0402&appid=aa4de02d63792ab0d52f35085261c36d
        alias: "Weather Service",
        channel: 501,
        id: "weather-service",
        display: true,
        displayLabel: "Weather Service",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_WEATHER_SERVICE,
        settings: {
            api: {
                baseUrl: "https://api.openweathermap.org",
                path: "/data/2.5/forecast",
                apiKeyKey: "appid",
                queryParams: {
                    lat: constants.DEFAULT_LAT,
                    lon: constants.DEFAULT_LON,
                    // API Key
                    appid: "WEATHER_SERVICE_OPENWEATHERMAP_APP_ID",
                },
            },
            checkInterval: 1 * HOUR,
        },
    },
    {
        alias: "Birthday Service",
        channel: 502,
        id: "birthday-service",
        display: true,
        displayLabel: "Birthdays",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DYNFORMS_SERVICE,
        settings: {
            api: {
                baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: null, // will use .env DYNFORMS_PATH or default instead
                queryParams: {},
            },
            requests: [
                {
                    connectionName: null, // not implemented // Database name. Will fall back to default constant if absent.
                    collectionName: "address_book",
                    requestType: "pull",
                    retrieve: {
                        time: {
                            frequency: "daily",
                            hours: 0,
                            minutes: 15,
                        },
                        filters: [
                            {
                                type: "dynamic",
                                field: "date_of_birth_MMDD",
                                match: {
                                    filterName: "__CURRENT_DATE",
                                    daysAfter: 14, // include n days after the current date
                                    daysBefore: 0, // include n days preceding the current date
                                    format: "MM-DD",
                                },
                            },
                        ],
                        orderBy: {
                            date_of_birth_MMDD: 1,
                            first_name: 1,
                            last_name: 1,
                        },
                    },
                },
            ],
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 1 * HOUR,
        },
    },
    {
        alias: "Scriptures Service",
        channel: 503,
        id: "scriptures-service",
        display: true,
        displayLabel: "Scriptures",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DYNFORMS_SERVICE,
        settings: {
            api: {
                baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: null, // will use .env DYNFORMS_PATH or default instead
                queryParams: {},
            },
            requests: [
                {
                    connectionName: null, // not implemented
                    collectionName: "scriptures",
                    requestType: "pull",
                    retrieve: {
                        time: {
                            frequency: "daily",
                            hours: 0,
                            minutes: 15,
                        },
                        singleRecord: {
                            type: "__CURSOR_INDEX",
                            advance: "daily",
                        },
                    },
                },
            ],
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 30 * SECOND,
            ui: {
                // Show large version in the mornings
                showInMainViewingArea: {
                    frequency: "daily",
                    startTime: {
                        hours: 6,
                        minutes: 0,
                    },
                    endTime: {
                        hours: 9,
                        minutes: 0,
                    },
                },
            },
        },
    },
    {
        // Note: this is configured as a dynforms service but it is in fact targeting the photos backend.
        alias: "Photos Service",
        channel: 504,
        id: "photos-service",
        display: true,
        displayLabel: "Photos",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DYNFORMS_SERVICE,
        commandHandlersExtension: "photosHandlers.js",
        settings: {
            api: {
                baseUrl: "http://server.wnet.wn:3021", // default: use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: 3021,
                queryParams: {},
                pathToResponseData: "", //The path in the response data to the actual data (optional)
            },
            requests: [
                {
                    connectionName: null, // not implemented
                    collectionName: "photosFileInfo",
                    requestType: "pull",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 20,
                        },
                    },
                    settings: {
                        cursorIndexOffset: 1, // by default advance one picture
                    },
                },
                {
                    collectionName: "photosFileInfo",
                    requestType: "push",
                },
            ],
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 30 * SECOND,
            ui: {
                disabled: false,
            },
            defaultCollections: [
                {
                    label: "general",
                    color: "green",
                    imgSrc: "/big-icons/icon-bg-general.png",
                },
                {
                    label: "unsorted",
                    color: "gray",
                    imgSrc: "/big-icons/icon-bg-unsorted.png",
                },
                {
                    label: "trashed",
                    color: "orange",
                    imgSrc: "/big-icons/icon-bg-trashed.png",
                },
                {
                    label: "Johannes' Faves",
                    imgSrc: "/big-icons/icon-bg-favorite.png",
                    color: "purple",
                    type: "favorite",
                },
                {
                    label: "Jess' Faves",
                    imgSrc: "/big-icons/icon-bg-favorite.png",
                    color: "purple",
                    type: "favorite",
                },
            ],

            // Specific to this service:
            photosServiceBaseUrl: "http://jj-photos.wnet.wn:3021/db",
        },
    },
    {
        alias: "Calendar Service",
        channel: 505,
        id: "calendar-service",
        display: true,
        displayLabel: "Calendar",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DAV_SERVICE,
        commandHandlersExtension: null,
        settings: {
            remotes: [
                // {
                //     defaultAccountType: "caldav",
                //     //serverUrl: "https://nc.jessandjohannes.com/remote.php/dav/calendars/admin/calendar/",
                //     serverUrl: "https://nc.jessandjohannes.com/remote.php/dav/",
                //     authMethod: "Basic",
                //     label: "Johannes",
                //     credentials: {
                //         // These point to .env variables
                //         username: "CALENDAR_SERVICE_CALDAV_JOHANNES_USERNAME",
                //         password: "CALENDAR_SERVICE_CALDAV_JOHANNES_PASSWORD",
                //     },
                //     calendarsToDisplay: [
                //         {
                //             displayName: "Johannes",
                //             url: "https://nc.jessandjohannes.com/remote.php/dav/calendars/admin/personal/",
                //         },
                //     ],
                // },
                {
                    defaultAccountType: "caldav",
                    serverUrl: "https://caldav.icloud.com",
                    authMethod: "Basic",
                    label: "Johannes",
                    credentials: {
                        // These point to .env variables
                        username: "CALENDAR_SERVICE_CALDAV_JOHANNES_ICLOUD_USERNAME",
                        password: "CALENDAR_SERVICE_CALDAV_JOHANNES_ICLOUD_PASSWORD",
                    },
                    calendarsToDisplay: [
                        {
                            displayName: "Johannes",
                            url: "https://caldav.icloud.com/1286479590/calendars/home/",
                        },
                    ],
                },
                {
                    defaultAccountType: "caldav",
                    serverUrl: "https://caldav.icloud.com",
                    authMethod: "Basic",
                    label: "Jess",
                    credentials: {
                        // These point to .env variables
                        username: "CALENDAR_SERVICE_CALDAV_JESS_ICLOUD_USERNAME",
                        password: "CALENDAR_SERVICE_CALDAV_JESS_ICLOUD_PASSWORD",
                    },
                    calendarsToDisplay: [
                        {
                            displayName: "Jess",
                            url: "https://caldav.icloud.com/287697599/calendars/home/",
                        },
                    ],
                },
            ],
            // This is hoften the handler will retrieve updated calendar info
            checkInterval: 20 * MINUTE,
        },
    },
    {
        alias: "Medical Data Service",
        channel: 506,
        id: "medical-service",
        display: true,
        displayLabel: "Medical Data",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DYNFORMS_SERVICE,
        commandHandlersExtension: "medicalHandlers.js",
        settings: {
            api: {
                baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: null, // will use .env DYNFORMS_PATH or default instead
                queryParams: {},
            },
            requests: [
                {
                    connectionName: "dynforms",
                    collectionName: "johannes_medical",
                    requestType: "pull",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 5,
                        },
                        filters: [
                            {
                                type: "static",
                                match: {
                                    created_at: { $gt: "__DATE_DAYS_AGO-30" }, // Only get values up to 1 months ago
                                },
                            },
                        ],
                        orderBy: {
                            created_at: 1,
                        },
                    },
                },
            ],
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 2 * MINUTE,
            ui: {
                warnAfter: 4 * HOUR,
                alertAfter: 5 * HOUR,
            },
        },
    },
    {
        alias: "Chores Service",
        channel: 507,
        id: "chores-service",
        display: true,
        displayLabel: "Chores",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DYNFORMS_SERVICE,
        commandHandlersExtension: "choresHandlers.js",
        settings: {
            api: {
                baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: null, // will use .env DYNFORMS_PATH or default instead
                queryParams: {},
            },
            requests: [
                {
                    connectionName: null, // not implemented
                    collectionName: "chores",
                    requestType: "pull",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 5,
                        },
                        filters: [
                            {
                                type: "static",
                                match: {
                                    created_at: { $gt: "__DATE_DAYS_AGO-30" }, // Only get values up to 1 months ago
                                },
                            },
                        ],
                        orderBy: {
                            created_at: 1,
                        },
                    },
                },
                {
                    collectionName: "chores",
                    requestType: "push",
                },
                {
                    collectionName: "chores",
                    requestType: "deleteById",
                },
                {
                    collectionName: "chores",
                    requestType: "macro",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 5,
                        },
                    },
                    settings: {
                        macroId: "__aggregation",
                        aggregation: [
                            {
                                $match: {
                                    created_at: {
                                        $gte: "__DATE_CURRENT_YEAR_START",
                                    },
                                },
                            },
                            {
                                $group: {
                                    _id: {
                                        id: "$chore.id",
                                        user: "$__user.id",
                                        week: { $week: "$created_at" }, // Extract the week number from the created_at field
                                        year: { $year: "$created_at" }, // Extract the year for accuracy
                                    },
                                    count: { $sum: 1 }, // Count the documents in each group
                                },
                            },
                            {
                                $sort: {
                                    "_id.year": 1, // Sort by year in ascending order
                                    "_id.week": 1, // Sort by week in ascending order
                                },
                            },
                        ],
                    },
                },
                {
                    collectionName: "weight_tracking",
                    requestType: "macro",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 5,
                        },
                    },
                    settings: {
                        macroId: "__aggregation",
                        aggregation: [
                            {
                                $match: {
                                    created_at: {
                                        $gte: "__DATE_CURRENT_YEAR_START",
                                    },
                                    "__user.name": "Johannes",
                                },
                            },
                            { $project: { year: { $year: "$created_at" }, week: { $week: "$created_at" }, lbs: 1 } },
                            { $group: { _id: { year: "$year", week: "$week" }, lbs: { $avg: "$lbs" } } },
                            { $sort: { "_id.year": 1, "_id.week": 1 } },
                        ],
                    },
                },
                {
                    collectionName: "weight_tracking",
                    requestType: "macro",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 5,
                        },
                    },
                    settings: {
                        macroId: "__aggregation",
                        aggregation: [
                            {
                                $match: {
                                    created_at: {
                                        $gte: "__DATE_CURRENT_YEAR_START",
                                    },
                                    "__user.name": "Jess",
                                },
                            },
                            { $project: { year: { $year: "$created_at" }, week: { $week: "$created_at" }, lbs: 1 } },
                            { $group: { _id: { year: "$year", week: "$week" }, lbs: { $avg: "$lbs" } } },
                            { $sort: { "_id.year": 1, "_id.week": 1 } },
                        ],
                    },
                },
            ],
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 30 * SECOND,
            ui: {},
            custom: {
                users: [
                    {
                        id: "jess",
                        name: "Jess",
                    },
                    {
                        id: "johannes",
                        name: "Johannes",
                    },
                ],
                chores: [
                    // Jess
                    {
                        id: "pills_am",
                        label: "am pills",
                        alertLessThan: 1,
                        daily: 1,
                        user: "jess",
                        alertText: "Morning pills are due!",
                        warnAfterHours: 8,
                        alertAfterHours: 10,
                        alertAudio: false,
                        alertInterval: 10 * MINUTE,
                        alertDismissable: true,
                    },
                    {
                        id: "pills_pm",
                        label: "pm pills",
                        alertLessThan: 1,
                        daily: 1,
                        user: "jess",
                        alertText: "Evening pills are due!",
                        warnAfterHours: 19,
                        alertAfterHours: 21,
                        alertAudio: false,
                        alertInterval: 10 * MINUTE,
                        alertDismissable: true,
                    },
                    {
                        id: "cardio",
                        label: "cardio",
                        description: "hike or bike (1h+), or run (30m+)",
                        alertLessThan: 3,
                        weekly: 3,
                        user: "jess",
                    },
                    {
                        id: "workout",
                        label: "workout",
                        description: "weightlifting (machines or free)",
                        alertLessThan: 3,
                        weekly: 3,
                        user: "jess",
                    },
                    {
                        id: "chinups",
                        label: "chinups",
                        description: "",
                        daily: 1,
                        user: "jess",
                    },
                    {
                        id: "volunteer",
                        label: "volunteer",
                        description: "any volunteer role",
                        user: "jess",
                    },
                    // Johannes
                    {
                        id: "pills_am",
                        label: "am pills",
                        alertLessThan: 1,
                        daily: 1,
                        user: "johannes",
                        alertText: "Morning pills are due!",
                        warnAfterHours: 8,
                        alertAfterHours: 10,
                        alertAudio: false,
                        alertDismissable: true,
                    },
                    {
                        id: "pills_pm",
                        label: "pm pills",
                        alertLessThan: 1,
                        daily: 1,
                        user: "johannes",
                        alertText: "Evening pills are due!",
                        warnAfterHours: 19,
                        alertAfterHours: 21,
                        alertAudio: false,
                        alertDismissable: true,
                    },
                    {
                        id: "cardio",
                        label: "cardio",
                        description: "hike or bike (1h+), or run (30m+)",
                        alertLessThan: 3,
                        weekly: 3,
                        user: "johannes",
                    },
                    {
                        id: "workout",
                        label: "workout",
                        description: "weightlifting (machines or free)",
                        alertLessThan: 2,
                        weekly: 2,
                        user: "johannes",
                    },
                    {
                        id: "piano_practice",
                        label: "piano",
                        description: "15+ minutes of practice",
                        user: "johannes",
                    },
                    {
                        id: "volunteer",
                        label: "volunteer",
                        description: "any volunteer role",
                        user: "johannes",
                    },
                ],
            },
        },
    },
    {
        alias: "Notes Service",
        channel: 508,
        id: "notes-service",
        display: true,
        displayLabel: "Notes",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DYNFORMS_SERVICE,
        commandHandlersExtension: null,
        settings: {
            api: {
                baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: null, // will use .env DYNFORMS_PATH or default instead
                queryParams: {},
            },
            requests: [
                {
                    connectionName: null, // not implemented
                    collectionName: "notes_scanned",
                    requestType: "pull",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 60,
                        },
                        orderBy: {
                            created_at: -1,
                        },
                    },
                },
            ],
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 30 * SECOND,
            ui: {},
        },
    },
    {
        alias: "Countdown Service",
        channel: 509,
        id: "countdown-service",
        display: true,
        displayLabel: "Countdown",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_DYNFORMS_SERVICE,
        commandHandlersExtension: null,
        settings: {
            api: {
                baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: null, // will use .env DYNFORMS_PATH or default instead
                queryParams: {},
            },
            requests: [
                {
                    connectionName: null, // not implemented
                    collectionName: "countdowns",
                    requestType: "pull",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 60,
                        },
                        orderBy: {
                            created_at: -1,
                        },
                    },
                },
            ],
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 30 * SECOND,
            ui: {},
        },
    },
    {
        alias: "Master Switch Service",
        channel: 999,
        id: "master-switch-service",
        display: true,
        displayLabel: "Master",
        displayType: null,
        locationId: "__internal",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_MASTER_SWITCH,
        settings: {
            uiMaster: {
                nighttimeDimming: {
                    start: {
                        hours: 18,
                        minutes: 30,
                    },
                    end: {
                        hours: 6,
                        minutes: 0,
                    },
                    uiOpacityPercent: 40,
                    forceDim: false, // Default. This means it dims only as long as dimOnButton button is 'active'.
                    //dimOnButton: "master-off",
                },
            },
            buttons: [
                // *********** Presets *************
                {
                    type: "preset",
                    alias: "Full",
                    switch: [
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                brightness: 100,
                            },
                        },
                    ],
                },
                {
                    type: "preset",
                    alias: "Low",
                    switch: [
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                brightness: 5,
                            },
                        },
                    ],
                },
                {
                    type: "preset",
                    alias: "Min",
                    switch: [
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                brightness: 1,
                            },
                        },
                    ],
                },
                {
                    type: "preset",
                    alias: "Warm",
                    switch: [
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                color_temp: 2700,
                            },
                        },
                    ],
                },
                {
                    type: "preset",
                    alias: "Red",
                    switch: [
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                on_off: 1,
                                hue: 0,
                                saturation: 100,
                                color_temp: 0,
                            },
                        },
                    ],
                },
                {
                    type: "preset",
                    alias: "Blue",
                    switch: [
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                on_off: 1,
                                hue: 240,
                                saturation: 100,
                                color_temp: 0,
                            },
                        },
                    ],
                },
                // *********** Master *************
                {
                    type: "master",
                    alias: "On",
                    buttonId: "master-on",
                    switch: [
                        {
                            // Bed strip
                            channel: 11,
                            stateData: {
                                on_off: 1,
                            },
                        },
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                on_off: 1,
                            },
                        },
                    ],
                },
                {
                    type: "master",
                    alias: "Off",
                    buttonId: "master-off",
                    switch: [
                        {
                            // Bed strip
                            channel: 11,
                            stateData: {
                                on_off: 0,
                            },
                        },
                        {
                            // Rec room
                            channel: 20,
                            stateData: {
                                on_off: 0,
                            },
                        },
                    ],
                },
            ],
        },
    },
];

const presets = [
    {
        id: "preset-full",
        name: "full",
        stateData: {
            lightState: {
                brightness: 100,
                on_off: 1,
            },
        },
    },
    {
        id: "preset-half",
        name: "minimum brightness",
        stateData: {
            lightState: {
                brightness: 50,
                on_off: 1,
            },
        },
    },
    {
        id: "preset-low",
        name: "minimum brightness",
        stateData: {
            lightState: {
                brightness: 10,
                on_off: 1,
            },
        },
    },
    {
        id: "preset-min",
        name: "minimum brightness",
        stateData: {
            lightState: {
                brightness: 1,
                on_off: 1,
            },
        },
    },
    {
        id: "preset-off",
        name: "minimum brightness",
        stateData: {
            lightState: {
                on_off: 0,
            },
        },
    },
    {
        id: "preset-green",
        name: "green, fully saturated",
        stateData: {
            lightState: {
                hue: 120,
                saturation: 100,
                color_temp: 0,
                on_off: 1,
            },
        },
    },
    {
        id: "preset-red",
        name: "red, fully saturated",
        stateData: {
            lightState: {
                hue: 0,
                saturation: 100,
                color_temp: 0,
                on_off: 1,
            },
        },
    },
    {
        id: "preset-white",
        name: "white",
        stateData: {
            lightState: {
                hue: 0,
                saturation: 0,
                color_temp: 6000,
                on_off: 1,
            },
        },
    },
];

export { deviceMap, globalConfig, presets };
