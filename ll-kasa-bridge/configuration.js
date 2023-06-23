import constants from './constants.js';
const { SECOND, MINUTE, HOUR } = constants;
const { SUBTYPE_BULB, SUBTYPE_LED_STRIP, SUBTYPE_PLUG, SUBTYPE_SWITCH } = constants;

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
    }
  },
  
  /**
   * Global filter definitions
   */
  filters: [
    {
      id: 'externalFlags',
      globalLabel: 'Action based on flags in LifeLog',
      pluginName: 'externalFlags',
      settings: {
        /**
         * Specify an URL that will respond with JSON data (boolean flags).
         */
        url: 'http://lifelog.wnet.wn/ajax.php?action=getFlags',

        /**
         * The path to the flags properties in the JSON response. Defaults to 'flags'.
         */
        //jsonPath: 'flags'
      },
      periodicallyActive: true,
    },
    {
      id: 'nighttimeGlim',
      pluginName: 'externalFlags',
      settings: {
        /**
         * Specify an URL that will respond with JSON data (boolean flags).
         */
        url: 'http://lifelog.wnet.wn/ajax.php?action=getFlags',


        flag: 'sleep_wake',

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
      id: 'naturalLight',
      globalLabel: 'Automatic color temperature control',
      pluginName: 'naturalLight',
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
          }
        },
        nighttimeState: {
          ledStrip: {
            hue: 20,
            saturation: 20,
          },
          bulb: {
            color_temp: 2700,
          }
        },
      },
      periodicallyActive: {
        /**
         * This MUST either be set here (restriction: 'always' or periodicallyActive: true)
         * or on an override for partial filtering to work properly.
         */
        restriction: 'always',
        /**
         * Can override any of the periodicFilters defaults configured in defaults.periodicFilters above.
         */     
        paddingFromSunEvent: {
          sunrise: 1.5 * HOUR,
          sunset: 1.5 * HOUR,
        }
      },
    },
    {
      /**
       * Id that filter properties on devices can reference to use this filter
       */
      id: 'sunEvents-nightlights',

      /**
       * Label for the filter (defaults to pluginName if missing)
       */
      globalLabel: 'Brightness and color control for nightlights',

      /**
        * Name of the filter plugin (maps to 'filters/name.js' )
        * 
        * pluginName:
        */
      pluginName: 'sunEvents',

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
        restriction: 'duskToDawn',
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
      id: 'sunEvents-outdoorLights',
      globalLabel: 'Control for outdoor illumination',
      pluginName: 'sunEvents',
      settings: {
        transitionTime: 1 * HOUR,
        offset: {
          sunset: 30 * MINUTE,
          sunrise: -30 * MINUTE,
        }
      },
      periodicallyActive: {
        restriction: 'dusk',
      },
      stateData: {
        brightness: {
          value: 0,
          altValue: 5,
        },
        on_off: {
          value: 0,
          altValue: 1,
        }
      }
    },
    {
      id: 'schedule-outdoorLights',
      pluginName: 'schedule',
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
            event: 'sunset',
            offset: -45 * MINUTE,
          },
          stateData: {
            onOff: 1,
            brightness: 1,
          },
        },
        /**
         * This item rescinds the previous one a minute later
         */
        {
          trigger: {
            event: 'sunset',
            offset: -44 * MINUTE,
          },
          stateData: {
          },
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
          }
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
          stateData: {
          }
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
            event: 'sunrise',          
          },
          stateData: {
            onOff: 0,
          },
        },
        /**
         * This item rescinds the previous one a minute later
         */
        {
          trigger: {
            event: 'sunrise',
            offset: 1 * MINUTE,
          },
          stateData: {
          },
        },      
      ],
    }
  ],

  /**
   * Device Group Definitions
   */
  groups: [
    {
      id: "Bed Shelf Lights",
      channels: [ 38 ],
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
          onlyWhenSameStateAs: []
        },
        // When this light goes off, take channel 2 with.
        { channel: 2, sync: true, onPosition: false, offPosition: true },
      ],  
    },
    {
      id: "Jess Desk Lights",
      channels: [ 31, 32, 33, 36, 40 ],
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
          onlyWhenSameStateAs: []
        },
      ],  
    }
  ],
}

const deviceMap = [
  //Bedroom
  {
    alias: 'Bedroom IKEA lamp',
    channel: 2,
    id: "8012E7EA0A70974D997DE95E898FBA261F980E1A",
    subType: SUBTYPE_BULB,
    filters: [
      { refId: 'naturalLight' },
      { refId: 'externalFlags',
        stateData: {
          on_off: {
            value: 0,
            altValue: 1,
          }
        },
        settings: {
          flag: 'busy_available',
        }
      },
    ],    
  },
  {
    alias: 'Bedroom Desk Strip top',
    channel: 3,
    id: "80121CF5373D56F7C62278B4C0FE88A01F53DD26",
    subType: SUBTYPE_LED_STRIP,
    filters: [
      { refId: 'naturalLight' }
    ],    
  },
  { 
    alias: 'Bedroom Heater',
    channel: 4,
    id: '80065A4E60A835C49695A74DA7FAE76520436E9C01',
    subType: SUBTYPE_PLUG
  },
  {
    alias: 'Bedroom Fan',
    channel: 5, 
    id: "80065A4E60A835C49695A74DA7FAE76520436E9C02",
    subType: SUBTYPE_PLUG,
  },
  {
    alias: 'Bedroom Ceiling 1',
    channel: 6, 
    id: "8012C3A3B58B58E8081EDBCF694C8CBC1F790A02",
    subType: SUBTYPE_BULB,

  },
  {
    alias: 'Bedroom Ceiling 2',
    channel: 7, 
    id: "8012511ABF75C811DB47A833DD2EDAED1F791417",
    subType: SUBTYPE_BULB,
  },

  //Hallway
  {
    alias: 'Hallway Ceiling 1', //Hallway ceiling 2?
    channel: 8,
    id: "80121D6F58ADDCAC185363C01347F5EA1F752B55",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Hallway Ceiling 2',
    channel: 9, 
    id: "8012DA57516B98CCFFE6467D8F4F01691F73C975",
    subType: SUBTYPE_BULB,
  },


  //Bathroom
  //***** ***pp pp***
  {
    alias: 'Bathroom 1',
    channel: 10, 
    id: "8012D32B889FD9CE23C825CEB1C2EFD41F73D8E2",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Bathroom 2',
    channel: 11, 
    id: "8012F65B8543DA7FFFC8A3F756D1EBE61F742CDF",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Bathroom 3',
    channel: 12, 
    id: "80128096836910A62F80A6B532C1461E1F79D295",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Bathroom 4',
    channel: 13, 
    id: "8012EE37548E3F0F48405DECC13D0B801F779B2B",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Bedroom Desk Switch',
    channel: 14,
    id: "8006E7EB4A66E3687708A7ABF93FB237200DCDA4",
    subType: SUBTYPE_SWITCH,
    targets: {
      on: [
        { channel: 5, stateData: true },  // Turn fan on
        { channel: 4, stateData: false }, // Turn heater off          
        { channel: 39, stateData: true }, // Turn audio amp on both ways
        { 
          channel: 2, 
          stateData: {
            on_off: 1,
            brightness: 95,
          }
        },
        { 
          channel: 3,
          stateData: {
            on_off: 1,
            brightness: 95,
          }
        },
        { 
          channel: 16,
          stateData: {
            on_off: 1,
            brightness: 20,
            hue: 240,
            saturation: 100,
          }
        },
        { 
          channel: 37,
          stateData: {
            on_off: 1,
            brightness: 20,
            hue: 240,
            saturation: 100,
          }
        },
      ],
      off: [
        { channel: 5, stateData: false }, // Turn fan off
        { channel: 4, stateData: true },  // Turn heater on
        { channel: 39, stateData: true }, // Turn audio amp on both ways
        { 
          channel: 2, 
          stateData: {
            on_off: 1,
            brightness: 95,
          }
        },
        { 
          channel: 3,
          stateData: {
            on_off: 1,
            brightness: 95,
          }
        },          
        { 
          channel: 16,
          stateData: {
            on_off: 1,
            brightness: 20,
            hue: 277,
            saturation: 100,
          }
        },
        { 
          channel: 37,
          stateData: {
            on_off: 1,
            brightness: 20,
            hue: 277,
            saturation: 100,
          }
        },
      ],
    }   
  },
  {
    alias: 'Bathroom Heater',
    channel: 15,
    id: "80061465B741F3D278857FD2F8E09CD020C3200A",
    subType: SUBTYPE_PLUG
  },
  {
    alias: 'Bedroom Desk Strip bottom',
    channel: 16,
    id: "8012ACE65E9CFF19DBAB8CAF5A2BBD942014A9B1",
    subType: SUBTYPE_LED_STRIP,
  },

  //Living Room
  //***** ***** ***** ***** ***** **ppp p****
  {
    alias: 'Living Room Ikea 1',
    channel: 28, 
    id: "801264A4EC3F66CAC02D4FF78712E6D11F992564",
    subType: SUBTYPE_BULB,
    filters: [{
      refId: 'naturalLight',
      periodicallyActive: true,
      applyPartially: 0.15,
    }]
  },
  {
    alias: 'Living Room Ikea 2',
    channel: 29, 
    id: "8012F095B949B648B1BE7C8A050FA39E1F78FAE8",
    subType: SUBTYPE_BULB,
    filters: [{
      refId: 'naturalLight',
      periodicallyActive: true,
      applyPartially: 0.3,
    }]
  },
  {
    alias: 'Living Room Ikea 3',
    channel: 30, 
    id: "8012AE4AF3CF80CD50EC66E4F87F3E291F99397C",
    subType: SUBTYPE_BULB,
    filters: [{
      refId: 'naturalLight',
      periodicallyActive: true,
      applyPartially: 0.5,
    }]
  },
  {
    alias: 'Living Room Ikea 4',
    channel: 31, 
    id: "8012DEFBED48C05561BF6C2F5D8A490D1F77A75D",
    subType: SUBTYPE_BULB,
    filters: [ { refId: 'naturalLight' }],
  },
  {
    alias: 'Living Room Ikea 5',
    channel: 32, 
    id: "8012D9195E6D17B426B7F74DE432D6A21F9BD8BE",
    subType: SUBTYPE_BULB,
    filters: [ { refId: 'naturalLight'} ],
  },
  {
    alias: 'Jess\' Desk Lamp',
    channel: 33, 
    id: "8012D2D5067A0F9AE37075A3FA816E341F9D35A9",
    subType: SUBTYPE_BULB,
    filters: [ { refId: 'naturalLight'} ],
  },
  {
    alias: 'Switch in Jess\' desk',
    channel: 34, 
    id: "800686BE89C5D37A63B4E70AB37689212066F343",
    subType: SUBTYPE_SWITCH,
    targets: {
      on: [
        {
          channel: 31,
          stateData: {
            on_off: 1,
          },
          filters: [ { refId: 'naturalLight' }],
          delay: 2000,
        },
        {
          channel: 32,
          stateData: {
            on_off: 1,
          },
          filters: [ { refId: 'naturalLight' }],
          delay: 2000,
        },
        {
          channel: 33,
          stateData: {
            on_off: 1,
          },
          filters: [ { refId: 'naturalLight' }],
          delay: 1000,
        },
        { channel: 36, stateData: true }, 
        {
          channel: 40,
          stateData: {
            brightness: 95,
            on_off: 1,
          },
          filters: [ { refId: 'naturalLight' }],
        }
      ],
      off: [
        { channel: 31, stateData: false }, 
        { channel: 32, stateData: false }, 
        { channel: 33, stateData: false }, 
        { channel: 36, stateData: false },
        { channel: 40, stateData: false, delay: 5000 }, 
      ],
    }   
  },
  {
    alias: 'Front Door Lamp',
    channel: 35, 
    id: "801277C3769ADD0BA769504AAB6B233E1F77F11C",
    subType: SUBTYPE_BULB,
    filters: [
      { refId: 'sunEvents-outdoorLights' },
      { 
        refId: 'naturalLight',
        settings: {
          offset: {
            sunset: 0,
            sunrise: 0,
          }
        }
      },
      { refId: 'schedule-outdoorLights'},
    ],
  },
  {
    alias: 'Jess Storage Shelves',
    channel: 36, 
    id: "80120A8622D026338547E3D7E88D70931F9E81A8",
    subType: SUBTYPE_LED_STRIP,
  },
  {
    alias: 'Bedroom Desk Strip Shelving',
    channel: 37, 
    id: "80125B9CDD55CE105CC76F0CA2F6C8CC1F5426D8",
    subType: SUBTYPE_LED_STRIP,    
  },
  {
    alias: 'Bed Shelf Strip',
    channel: 38, 
    id: "8012D0E9DD82CBC61A864D093BF05E911F53B1E8",
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
        refId: 'sunEvents-nightlights',

        /**
         * Label for the filter. If not provided it will:
         * - default to the referenced global filters label if one is specified
         * - default to pluginName if no global filter is referenced
         * 
         * label:
         */
        label: 'Led-strip bed',

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
          }
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
    alias: 'Jess Bed Switch',
    channel: 101, 
    id: "8006000F366B7DD70835CBF38A51040620662083",
    subType: SUBTYPE_SWITCH, 
    targets: {
      on: [
        { 
          channel: 38, 
          stateData: {
            brightness: 80, 
            on_off: 1,
            saturation: 0,
          }
        },
      ],
      off: [
        { 
          channel: 38, 
          stateData: {
            on_off: 0, 
            transition: 20000
          }
        },
      ]
    }   
  },
  { 
    alias: 'Bedroom Audio Amp',
    channel: 39,
    id: '80065A4E60A835C49695A74DA7FAE76520436E9C00',
    subType: SUBTYPE_PLUG
  },
  { 
    alias: 'Jess Desk Strip',
    channel: 40,
    id: '8012984E9F504FC4AEC384A012A6BEE01F54FA11',
    subType: SUBTYPE_LED_STRIP,
    filters: [ 
      { 
        refId: 'naturalLight',
        settings: {
          periodicallyActive: {
            restriction: {
              event: 'externalFlag',
              flag: 'sleep_wake',
              state: true,
            }
          }
        },
        stateData: {
          color_temp: 0
        }

      },
      {
        refId: 'nighttimeGlim',
      }
    ],
  },
  {
    alias: 'Ikea Hallway',
    channel: 41, 
    id: "8012FA2584FE5D30C3E2F13FC023719B1F7B385D",
    subType: SUBTYPE_BULB,
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

export { 
  deviceMap,
  globalConfig,
}