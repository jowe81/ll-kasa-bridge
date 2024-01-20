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
                    "class-kitchenCounterLights": {},
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
    },

    /**
     * Global filter definitions
     */
    filters: [
        {
            id: "externalFlags",
            globalLabel: "Action based on flags in LifeLog",
            pluginName: "externalFlags",
            settings: {
                /**
                 * Specify an URL that will respond with JSON data (boolean flags).
                 */
                url: "http://lifelog.wnet.wn/ajax.php?action=getFlags",

                /**
                 * The path to the flags properties in the JSON response. Defaults to 'flags'.
                 */
                //jsonPath: 'flags'
            },
            periodicallyActive: true,
        },
        {
            id: "nighttimeGlim",
            pluginName: "externalFlags",
            settings: {
                /**
                 * Specify an URL that will respond with JSON data (boolean flags).
                 */
                url: "http://lifelog.wnet.wn/ajax.php?action=getFlags",

                flag: "sleep_wake",

                /**
                 * The path to the flags properties in the JSON response. Defaults to 'flags'.
                 */
                //jsonPath: 'flags'
            },
            stateData: {
                on_off: {
                    value: 0,
                    altValue: 1,
                },
                brightness: {
                    value: 0,
                    altValue: 2,
                },
                hue: {
                    value: 240,
                    altValue: 240,
                },
                saturation: {
                    value: 0,
                    altValue: 100,
                },
            },

            periodicallyActive: true,
        },
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
            id: "schedule-christmasTree",
            pluginName: "schedule",
            periodicallyActive: true,
            schedule: [
                /**
                 * This is a plain schedule item - specify a time and stateData.
                 */
                {
                    trigger: {
                        hours: 6,
                        minutes: 15,
                    },
                    stateData: {
                        on_off: 1,
                    },
                },
                {
                    trigger: {
                        hours: 6,
                        minutes: 16,
                    },
                    stateData: {
                        // None. Now it can be manually switched.
                    },
                },
                {
                    trigger: {
                        hours: 23,
                        minutes: 30,
                    },
                    stateData: {
                        on_off: 0,
                    },
                },
                {
                    trigger: {
                        hours: 23,
                        minutes: 31,
                    },
                    stateData: {
                        // None. Now it can be manually switched.
                    },
                },
            ],
        },
    ],

    /**
     * Device Group Definitions
     */
    groups: [
        {
            id: "group-bedShelfLights",
            name: "Bed Shelf Lights",
            channels: [38],
            class: "class-bedroomLights",
            display: false,
            displayLabel: "Bed",
            displayType: constants.SUBTYPE_LIGHT,
            filters: [{ refId: "naturalLight" }],
            linkedDevices: [
                {
                    channel: 101,
                    // Sync the switch to the powerstate of this device or just toggle it?
                    sync: true,
                    // Only has effect if sync === true: should the device be inversely synced
                    inverse: false,
                    // Sync/toggle when this device is set to the on position
                    onPosition: true,
                    // Sync/toggle when this device is set to the off position
                    offPosition: true,
                    // NOT YET IMPLEMENTED: Sync/toggle only if the listed devices (channel numbers) share the same powerstate as this device
                    onlyWhenSameStateAs: [],
                },
                // When this light goes off, take channel 2 with.
                {
                    channel: 2,
                    sync: true,
                    onPosition: false,
                    offPosition: true,
                },
            ],
        },
        {
            id: "group-jessDeskLights",
            name: "Jess Desk Lights",
            channels: [32, 33, 36, 40],
            class: "class-jessDeskLights",
            displayLabel: "Desk",
            display: false,
            displayType: constants.SUBTYPE_LIGHT,
            linkedDevices: [
                {
                    channel: 34,
                    // Sync the switch to the powerstate of this device or just toggle it?
                    sync: true,
                    // Only has effect if sync === true: should the device be inversely synced
                    inverse: false,
                    // Sync/toggle when this device is set to the on position
                    onPosition: true,
                    // Sync/toggle when this device is set to the off position
                    offPosition: true,
                    // NOT YET IMPLEMENTED: Sync/toggle only if the listed devices (channel numbers) share the same powerstate as this device
                    onlyWhenSameStateAs: [],
                },
            ],
        },
        {
            id: "group-bedroomDeskLights",
            name: "Bedroom Desk Lights",
            channels: [2, 3, 16, 37],
            class: "class-johannesDeskLights",
            displayLabel: "Desk",
            displayType: constants.SUBTYPE_LIGHT,
            linkedDevices: [
                {
                    channel: 14,
                    // Sync the switch to the powerstate of this device or just toggle it?
                    sync: true,
                    // Only has effect if sync === true: should the device be inversely synced
                    inverse: false,
                    // Sync/toggle when this device is set to the on position
                    onPosition: true,
                    // Sync/toggle when this device is set to the off position
                    offPosition: true,
                    // NOT YET IMPLEMENTED: Sync/toggle only if the listed devices (channel numbers) share the same powerstate as this device
                    onlyWhenSameStateAs: [],
                },
            ],
        },
        {
            id: "group-bedroomCeilingLights",
            name: "Bedroom Ceiling Lights",
            channels: [6, 7],
            class: "class-bedroomLights",
            displayType: constants.SUBTYPE_LIGHT,
            displayLabel: "Ceiling",
        },
        {
            id: "group-kitchenCounterLights",
            name: "Kitchen Counter Lights",
            channels: [42, 43],
            class: "class-kitchenCounterLights",
            displayLabel: "Counter",
            displayType: constants.SUBTYPE_LIGHT,
        },
        {
            id: "group-kitchenLights",
            name: "Kitchen Table Lights",
            channels: [28],
            class: "class-kitchenLights",
            displayLabel: "Table",
            displayType: constants.SUBTYPE_LIGHT,
        },
        {
            id: "group-hallwayCeiling",
            name: "Hallway Lights",
            channels: [8, 9],
            class: "class-kitchenLights",
            displayLabel: "Hallway",
            displayType: constants.SUBTYPE_LIGHT,
        },
        {
            id: "group-bathroomLights",
            name: "Bathroom Lights",
            displayType: constants.SUBTYPE_LIGHT,
            displayLabel: "Lights",
            channels: [10, 11, 12, 13],
            class: "class-bathroomLights",
        },
        {
            id: "group-livingroomLights",
            name: "Living Room Lights",
            displayLabel: "Living",
            displayType: constants.SUBTYPE_LIGHT,
            channels: [29, 30, 31],
            class: "class-livingroomLights",
        },
    ],

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
            id: "loc-outside",
            name: "Outside",
        },
    ],
};

const deviceMap = [
    //Bedroom
    {
        alias: "Bedroom IKEA lamp",
        channel: 2,
        class: "class-johannesDeskLights",
        displayLabel: "IKEA Lamp",
        id: "8012E7EA0A70974D997DE95E898FBA261F980E1A",
        locationId: "loc-bedroom",
        subType: SUBTYPE_BULB,
        filters: [
            { refId: "naturalLight" },
            {
                refId: "externalFlags",
                stateData: {
                    on_off: {
                        value: 0,
                        altValue: 1,
                    },
                },
                settings: {
                    flag: "busy_available",
                },
            },
        ],
    },
    {
        alias: "Bedroom Desk Strip top",
        channel: 3,
        id: "80121CF5373D56F7C62278B4C0FE88A01F53DD26",
        locationId: "loc-bedroom",
        subType: SUBTYPE_LED_STRIP,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Bedroom Heater",
        channel: 4,
        id: "80065A4E60A835C49695A74DA7FAE76520436E9C01",
        displayType: SUBTYPE_AIR_HEAT,
        displayLabel: "Heater",
        locationId: "loc-bedroom",
        subType: SUBTYPE_PLUG,
        hvacType: SUBTYPE_AIR_HEAT,
    },
    {
        alias: "Bedroom Fan",
        channel: 5,
        id: "80065A4E60A835C49695A74DA7FAE76520436E9C02",
        locationId: "loc-bedroom",
        displayType: SUBTYPE_AIR_FAN,
        displayLabel: "Fan",
        subType: SUBTYPE_PLUG,
    },
    {
        alias: "Bedroom Ceiling 1",
        channel: 6,
        class: "class-bedroomLights",
        id: "8012C3A3B58B58E8081EDBCF694C8CBC1F790A02",
        locationId: "loc-bedroom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Bedroom Ceiling 2",
        channel: 7,
        class: "class-bedroomLights",
        id: "8012511ABF75C811DB47A833DD2EDAED1F791417",
        locationId: "loc-bedroom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },

    //Hallway
    {
        alias: "Hallway Ceiling 1", //Hallway ceiling 2?
        channel: 8,
        class: "class-hallwayLights",
        id: "80121D6F58ADDCAC185363C01347F5EA1F752B55",
        locationId: "loc-kitchen",
        subType: SUBTYPE_BULB,
    },
    {
        alias: "Hallway Ceiling 2",
        channel: 9,
        class: "class-hallwayLights",
        id: "8012DA57516B98CCFFE6467D8F4F01691F73C975",
        locationId: "loc-kitchen",
        subType: SUBTYPE_BULB,
    },

    //Bathroom
    //***** ***pp pp***
    {
        alias: "Bathroom 1",
        channel: 10,
        id: "8012D32B889FD9CE23C825CEB1C2EFD41F73D8E2",
        locationId: "loc-bathroom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Bathroom 2",
        channel: 11,
        id: "8012F65B8543DA7FFFC8A3F756D1EBE61F742CDF",
        locationId: "loc-bathroom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Bathroom 3",
        channel: 12,
        id: "80128096836910A62F80A6B532C1461E1F79D295",
        locationId: "loc-bathroom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Bathroom 4",
        channel: 13,
        id: "8012EE37548E3F0F48405DECC13D0B801F779B2B",
        locationId: "loc-bathroom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Bedroom Desk Switch",
        channel: 14,
        id: "8006E7EB4A66E3687708A7ABF93FB237200DCDA4",
        locationId: "loc-bedroom",
        display: false,
        subType: SUBTYPE_SWITCH,
        targets: {
            on: [
                { channel: 5, stateData: true }, // Turn fan on
                { channel: 4, stateData: false }, // Turn heater off
                { channel: 39, stateData: true }, // Turn audio amp on both ways
                {
                    channel: 2,
                    stateData: {
                        on_off: 1,
                        brightness: 95,
                    },
                },
                {
                    channel: 3,
                    stateData: {
                        on_off: 1,
                        brightness: 95,
                    },
                },
                {
                    channel: 16,
                    stateData: {
                        on_off: 1,
                        brightness: 20,
                        hue: 240,
                        saturation: 100,
                    },
                },
                {
                    channel: 37,
                    stateData: {
                        on_off: 1,
                        brightness: 20,
                        hue: 240,
                        saturation: 100,
                    },
                },
            ],
            off: [
                { channel: 8, stateData: false },
                {
                    channel: 9,
                    stateData: {
                        on_off: 1,
                        brightness: 100,
                        hue: 120,
                        saturation: 100,
                    },
                },

                { channel: 5, stateData: false }, // Turn fan off
                { channel: 4, stateData: true }, // Turn heater on
                { channel: 39, stateData: true }, // Turn audio amp on both ways
                {
                    channel: 2,
                    stateData: {
                        on_off: 1,
                        brightness: 95,
                    },
                },
                {
                    channel: 3,
                    stateData: {
                        on_off: 1,
                        brightness: 95,
                    },
                },
                {
                    channel: 16,
                    stateData: {
                        on_off: 1,
                        brightness: 20,
                        hue: 277,
                        saturation: 100,
                    },
                },
                {
                    channel: 37,
                    stateData: {
                        on_off: 1,
                        brightness: 20,
                        hue: 277,
                        saturation: 100,
                    },
                },
            ],
        },
    },
    {
        alias: "Bathroom Heater",
        channel: 15,
        id: "80061465B741F3D278857FD2F8E09CD020C3200A",
        locationId: "loc-bathroom",
        subType: SUBTYPE_PLUG,
        displayLabel: "Heater",
        displayType: SUBTYPE_AIR_HEAT,
        hvacType: SUBTYPE_AIR_HEAT,
    },
    {
        alias: "Bedroom Desk Strip bottom",
        channel: 16,
        id: "8012ACE65E9CFF19DBAB8CAF5A2BBD942014A9B1",
        locationId: "loc-bedroom",
        subType: SUBTYPE_LED_STRIP,
    },

    //Living Room
    //***** ***** ***** ***** ***** **ppp p****
    {
        alias: "Kitchen Ikea 1",
        channel: 28,
        id: "801217E95EAD46CF3A6E6C5F9D70E22020F2079F",
        locationId: "loc-kitchen",
        subType: SUBTYPE_BULB,
        filters: [
            {
                refId: "naturalLight",
                periodicallyActive: true,
                applyPartially: 0.125,
            },
        ],
    },
    {
        alias: "Living Room Ikea 1",
        channel: 29,
        id: "801264A4EC3F66CAC02D4FF78712E6D11F992564",
        locationId: "loc-livingRoom",
        subType: SUBTYPE_BULB,
        // filters: [
        //     {
        //         refId: "naturalLight",
        //         periodicallyActive: true,
        //         applyPartially: 0.3,
        //     },
        // ],
    },
    {
        alias: "Living Room Ikea 2",
        channel: 30,
        id: "801261D1846E3508D7801279357BB1A820F2B6D1",
        locationId: "loc-livingRoom",
        subType: SUBTYPE_BULB,
        // filters: [
        //     {
        //         refId: "naturalLight",
        //         periodicallyActive: true,
        //         applyPartially: 0.5,
        //     },
        // ],
    },
    {
        alias: "Living Room Ikea 3",
        channel: 31,
        id: "80124378042EF9B324B75F639D993F9F20F23759",
        locationId: "loc-livingRoom",
        subType: SUBTYPE_BULB,
        // filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Living Room Ikea 4",
        channel: 32,
        id: "8012D9195E6D17B426B7F74DE432D6A21F9BD8BE",
        locationId: "loc-livingRoom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Tree",
        channel: 45,
        id: "80069F21DB5B0BBF07AEC07F6485B19320C3751C",
        locationId: "loc-livingRoom",
        displayType: SUBTYPE_CHRISTMAS_TREE,
        subType: SUBTYPE_PLUG,
        filters: [{ refId: "schedule-christmasTree" }],
    },
    {
        alias: "Jess' Desk Lamp",
        channel: 33,
        id: "8012D2D5067A0F9AE37075A3FA816E341F9D35A9",
        locationId: "loc-livingRoom",
        subType: SUBTYPE_BULB,
        filters: [{ refId: "naturalLight" }],
    },
    {
        alias: "Switch in Jess' desk",
        channel: 34,
        id: "800686BE89C5D37A63B4E70AB37689212066F343",
        displayLabel: "Jess Desk",
        displayType: constants.SUBTYPE_LIGHT,
        locationId: "loc-livingRoom",
        subType: SUBTYPE_SWITCH,
        targets: {
            on: [
                // {
                //     channel: 31,
                //     stateData: {
                //         on_off: 1,
                //     },
                //     delay: 2000,
                // },
                {
                    channel: 32,
                    stateData: {
                        on_off: 1,
                    },
                    delay: 2000,
                },
                {
                    channel: 33,
                    stateData: {
                        on_off: 1,
                    },
                    delay: 1000,
                },
                { channel: 36, stateData: true },
                {
                    channel: 40,
                    stateData: {
                        brightness: 95,
                        on_off: 1,
                    },
                },
            ],
            off: [
                // { channel: 31, stateData: false },
                { channel: 32, stateData: false },
                { channel: 33, stateData: false },
                { channel: 36, stateData: false },
                { channel: 40, stateData: false },
            ],
        },
    },
    {
        alias: "Front Door Lamp",
        channel: 35,
        class: "class-outdoorLights",
        id: "801277C3769ADD0BA769504AAB6B233E1F77F11C",
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
    {
        alias: "Jess Storage Shelves",
        channel: 36,
        id: "80120A8622D026338547E3D7E88D70931F9E81A8",
        locationId: "loc-livingRoom",
        subType: SUBTYPE_LED_STRIP,
    },
    {
        alias: "Bedroom Desk Strip Shelving",
        channel: 37,
        id: "80125B9CDD55CE105CC76F0CA2F6C8CC1F5426D8",
        locationId: "loc-bedroom",
        subType: SUBTYPE_LED_STRIP,
    },
    {
        alias: "Bed Shelf Strip",
        channel: 38,
        id: "8012D0E9DD82CBC61A864D093BF05E911F53B1E8",
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
        //   linkedDevices: [
        //     {
        //       channel: 101,
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
        alias: "Jess Bed Switch",
        channel: 101,
        id: "8006000F366B7DD70835CBF38A51040620662083",
        displayLabel: "Bed Shelf",
        displayType: SUBTYPE_LIGHT,
        locationId: "loc-bedroom",
        subType: SUBTYPE_SWITCH,
        targets: {
            on: [
                {
                    channel: 38,
                    stateData: {
                        brightness: 80,
                        on_off: 1,
                        saturation: 0,
                    },
                },
            ],
            off: [
                {
                    channel: 38,
                    stateData: {
                        on_off: 0,
                        transition: 20000,
                    },
                },
            ],
        },
    },
    {
        alias: "Bedroom Audio Amp",
        channel: 39,
        id: "80065A4E60A835C49695A74DA7FAE76520436E9C00",
        locationId: "loc-bedroom",
        displayType: SUBTYPE_ENTERTAINMENT,
        displayLabel: "Amp",
        subType: SUBTYPE_PLUG,
    },
    {
        alias: "Jess Desk Strip",
        channel: 40,
        id: "8012984E9F504FC4AEC384A012A6BEE01F54FA11",
        locationId: "loc-livingRoom",
        subType: SUBTYPE_LED_STRIP,
        filters: [
            {
                refId: "nighttimeGlim",
            },
            {
                refId: "naturalLight",
                settings: {
                    /**
                     * This is a filter specific setting.
                     * naturalLight taps into externalFlags to execute conditionally.
                     */
                    restrictions: [
                        {
                            type: "externalFlags",
                            url: "http://lifelog.wnet.wn/ajax.php?action=getFlags",
                            flagName: "sleep_wake",
                            flagState: true, // Block the filter when flag is set to true
                        },
                    ],
                },
                stateData: {
                    color_temp: 0,
                },
            },
        ],
    },
    {
        alias: "Kitchen Counter Main",
        channel: 42,
        id: "8006DE7EE2F73CBEA4629F293A1684A52042804800",
        locationId: "loc-kitchen",
        subType: SUBTYPE_PLUG,
    },
    {
        alias: "Kitchen Counter Sink",
        channel: 43,
        id: "8006DE7EE2F73CBEA4629F293A1684A52042804801",
        locationId: "loc-kitchen",
        subType: SUBTYPE_PLUG,
    },
    {
        alias: "Kitchen Cabinets Aleds",
        channel: 44,
        id: "8006DE7EE2F73CBEA4629F293A1684A52042804802",
        display: false,
        locationId: "loc-kitchen",
        subType: SUBTYPE_PLUG,
    },
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
        },
    },
    {
        alias: "Living Room",
        channel: 202,
        id: "esp8266-01-1",
        url: "http://192.168.1.23/read",
        display: true,
        locationId: "loc-livingRoom",
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
        },
    },
    {
        alias: "Bedroom",
        channel: 203,
        id: "esp8266-02-0",
        url: "http://192.168.1.22/read",
        display: true,
        locationId: "loc-bedroom",
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
        },
    },
    {
        alias: "Bathroom",
        channel: 204,
        id: "esp8266-02-1",
        url: "http://192.168.1.22/read",
        display: true,
        locationId: "loc-bathroom",
        type: constants.DEVICETYPE_ESP_THERMOMETER,
        subType: constants.SUBTYPE_THERMOMETER,
        settings: {
            jsonPath: "ds18b20",
            jsonPathId: { local_id: 1 },
            jsonPathKey: "temperature",
            trends: {
                short: {
                    label: "short",
                    avg_calc_history_length: 5 * MINUTE,
                    avg_calc_data_window: 1 * MINUTE,
                },
                mid: {
                    label: "mid",
                    avg_calc_history_length: 20 * MINUTE,
                    avg_calc_data_window: 5 * MINUTE,
                },
                long: {
                    label: "long",
                    avg_calc_history_length: 60 * MINUTE,
                    avg_calc_data_window: 10 * MINUTE,
                },
            },
        },
    },
    {
        alias: "Mailbox Lights",
        channel: 205,
        id: "esp32-01-0",
        url: "http://192.168.1.25/read",
        display: true,
        displayLabel: "Mailbox",
        locationId: "loc-outside",
        type: constants.DEVICETYPE_ESP_RELAY,
        subType: constants.SUBTYPE_BULB,
        settings: {
            jsonPath: null, // Top level
            jsonPathKey: "lights_on",
            engageUrl: "http://192.168.1.25/write?lights=on",
            disengageUrl: "http://192.168.1.25/write?lights=off",
        },
    },
    {
        alias: "Mailbox Lock",
        channel: 206,
        id: "esp32-01-1",
        url: "http://192.168.1.25/read",
        display: true,
        displayLabel: "Mailbox",
        displayType: constants.SUBTYPE_MAIL_COMPARTMENT,
        locationId: "loc-outside",
        type: constants.DEVICETYPE_ESP_RELAY,
        subType: constants.SUBTYPE_MAIL_COMPARTMENT,
        settings: {
            jsonPath: null, // Top level
            jsonPathKey: "door_locked",
            engageUrl: "http://192.168.1.25/write?door=lock",
            disengageUrl: "http://192.168.1.25/write?door=unlock",
        },
    },
    {
        alias: "Bathroom Thermostat",
        channel: 207,
        id: "thermostat-bathroom",
        display: true,
        displayLabel: "Thermostat",
        displayType: constants.SUBTYPE_THERMOSTAT,
        locationId: "loc-bathroom",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_THERMOSTAT,
        settings: {
            hysteresis: 1, // Hysteresis in degrees Celsius
            checkInterval: 1 * MINUTE,
            target: 25, // Will initialize to default if not set
            heat: true, // Should the room be heated?
            cool: false, // Should the room be cooled?
        },
    },
    {
        alias: "Bedroom Thermostat",
        channel: 208,
        id: "thermostat-bedroom",
        display: true,
        displayLabel: "Thermostat",
        displayType: constants.SUBTYPE_THERMOSTAT,
        locationId: "loc-bedroom",
        type: constants.DEVICETYPE_VIRTUAL,
        subType: constants.SUBTYPE_THERMOSTAT,
        settings: {
            hysteresis: 0.5, // Hysteresis in degrees Celsius
            checkInterval: 30 * SECOND,
            heat: true, // Should the room be heated?
            cool: false, // Should the room be cooled?
        },
    },
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
                    id: "1m",
                    length: 1 * MINUTE,
                    ttl: 0,
                    audiofile: null,
                },
                {
                    id: "3m",
                    topLabel: null, // will be set to id if undefined or null
                    subLabel: "Tea",
                    length: 3 * MINUTE,
                    ttl: 3 * MINUTE,
                    repeatAlarmEvery: 60 * SECOND, // will default to a minute if undefined or null
                    audiofile: null,
                },
                {
                    id: "4m",
                    subLabel: "Coffee",
                    length: 4 * MINUTE,
                    ttl: 3 * MINUTE,
                    audiofile: null,
                },
                {
                    id: "6m30",
                    subLabel: "Eggs",
                    length: 6 * MINUTE + 30 * SECOND,
                    ttl: 3 * MINUTE,
                    audiofile: null,
                },
                {
                    id: "10m",
                    length: 10 * MINUTE,
                    ttl: 3 * MINUTE,
                    audiofile: null,
                },
                {
                    id: "20m",
                    length: 20 * MINUTE,
                    ttl: 3 * MINUTE,
                    audiofile: null,
                },
                {
                    id: "pomodoro",
                    topLabel: "25m",
                    subLabel: "P'doro",
                    displayButton: true,
                    length: 25 * MINUTE,
                    ttl: 0,
                    audiofile: "timer-pomodoro.mp3",
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
                queryParams: {
                    lat: constants.DEFAULT_LAT,
                    lon: constants.DEFAULT_LON,
                    // API Key
                    appid: "aa4de02d63792ab0d52f35085261c36d",
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
                    connectionName: "test", // Database name. Will fall back to default constant if absent.
                    collectionName: "address_book",
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
            // If set causes the backend to return the results for the first request only; as a single object and not as an array.
            useSingleRequest: true,
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
                    connectionName: "test",
                    collectionName: "scriptures",
                    retrieve: {
                        time: {
                            frequency: "daily",
                            hours: 0,
                            minutes: 15,
                        },
                        singleRecord: {
                            // index: n (will be inserted dynamically when requesting from dynforms)
                            // type: "__INDEX",

                            // Have dynforms pick the item
                            type: "__RANDOMIZED_PREORDERED",
                        },
                    },
                },
            ],
            // If set causes the backend to return the results for the first request only; as a single object and not as an array.
            useSingleRequest: true,
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
                baseUrl: null, // will use .env DYNFORMS_HOST, DYNFORMS_PORT instead
                path: null, // will use .env DYNFORMS_PATH or default instead
                queryParams: {},
                pathToResponseData: "", //The path in the response data to the actual data (optional)
            },
            requests: [
                {
                    connectionName: "test",
                    collectionName: "photosFileInfo",
                    retrieve: {
                        time: {
                            frequency: "minutes",
                            minutes: 30,
                        },
                        singleRecord: {
                            type: "__RANDOMIZED_PREORDERED",
                        },
                    },
                },
            ],
            // If set causes the backend to return the results for the first request only; as a single object and not as an array.
            useSingleRequest: true,
            // This is how often the handler will go out and check whether a request should actually be run.
            checkInterval: 30 * SECOND,
            ui: {
                disabled: true,
            },

            // Specific to this service:
            photosServiceBaseUrl: "http://jj-photos.wnet.wn:3021/db",
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
                    dimOnButton: "master-off",
                },
            },
            buttons: [
                {
                    alias: "On",
                    buttonId: "master-on",
                    switch: [
                        {
                            groupId: "group-livingroomLights",
                            stateData: true,
                        },
                        {
                            groupId: "group-kitchenCounterLights",
                            stateData: true,
                        },
                        {
                            // Kitchen table
                            channel: 28,
                            stateData: {
                                // Can configure detailed state, but don't need to
                                lightState: {
                                    on_off: 1,
                                    brightness: 100,
                                },
                            },
                        },
                        {
                            // Kitchen Aleds
                            channel: 44,
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                    ],
                },
                {
                    alias: "Off",
                    buttonId: "master-off",
                    switch: [
                        {
                            groupId: "group-jessDeskLights",
                            stateData: false,
                        },
                        {
                            groupId: "group-livingroomLights",
                            stateData: false,
                        },
                        {
                            groupId: "group-kitchenCounterLights",
                            stateData: false,
                        },
                        {
                            // Kitchen table
                            channel: 28,
                            stateData: {
                                // Can configure detailed state, but don't need to
                                lightState: {
                                    on_off: 0,
                                },
                            },
                        },
                        {
                            // Kitchen Aleds
                            channel: 44,
                            stateData: true,
                        },
                        {
                            groupId: "group-hallwayCeiling",
                            stateData: false,
                        },
                        {
                            groupId: "group-bathroomLights",
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                        {
                            groupId: "group-bedroomCeilingLights",
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                        {
                            groupId: "group-bedroomDeskLights",
                            stateData: false,
                        },
                        {
                            // Thermostat Bathroom
                            channel: 207,
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                        {
                            // Heater Bathroom
                            channel: 15,
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                        {
                            // Thermostat Bedroom
                            channel: 208,
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                        {
                            // Heater Bedroom
                            channel: 4,
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                        {
                            // Fan Bedroom
                            channel: 5,
                            stateData: true,
                            ignoreForButtonState: true,
                        },
                        {
                            // Amp Bedroom
                            channel: 39,
                            stateData: false,
                            ignoreForButtonState: true,
                        },
                    ],
                },
            ],
        },
    },

    //Kitchen and living room all: ***** ***** ***** *p*p* pp*p* ppppp **
    //Full on: **1** ***** ****1 11*1* 11*1* 11111 111
    //Blackout: 000** 00000 00**0 00000 00000 00000 000
    //Desk work: **p** ***** ****p p
    //Bedroom ceil: ***** pp***
    //Bedroom all: *pp** pp*** ***** p**** ***** ***** ***** *pp**
    //Bathroom: ***** ****pp pp***
    //Jess' desk: ***** ***** ***** ***** ***** ***** *ppp**
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
