import constants from './constants.js';
const { SECOND, MINUTE, HOUR } = constants;
const { SUBTYPE_BULB, SUBTYPE_LED_STRIP, SUBTYPE_PLUG, SUBTYPE_SWITCH } = constants;

const defaults = {
  pollInterval: 10000,
  offlineTolerance: 3,
  periodicFilterServiceCheckInterval: 20 * SECOND,
}

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

  defaults,
}

const deviceMap = [
  //Bedroom
  {
    alias: 'Bedroom IKEA lamp',
    channel: 2,
    id: "8012E7EA0A70974D997DE95E898FBA261F980E1A",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Bedroom Desk Strip top',
    channel: 3,
    id: "80121CF5373D56F7C62278B4C0FE88A01F53DD26",
    subType: SUBTYPE_LED_STRIP,
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
      'on': {
        'powerState': [           
          { channel: 5, data: true },  // Turn fan on
          { channel: 4, data: false }, // Turn heater off

          { channel: 2, data: true },  // Turn lights on both ways
          { channel: 3, data: true }, 
          
          { channel: 39, data: true }, // Turn audio amp on both ways
        ],
        'lightState': [
          { 
            channel: 3,
            data: {
              on_off: 1,
              saturation: 0,
              brightness: 95,
            }
          },
          { 
            channel: 16,
            data: {
              on_off: 1,
              hue: 240,
              transition:5000,
            }
          },
          { 
            channel: 37,
            data: {
              on_off: 1,
              hue: 240,
            }
          },
        ],
      },
      'off': {
        'powerState': [
          { channel: 5, data: false }, // Turn fan off
          { channel: 4, data: true },  // Turn heater on

          { channel: 2, data: true },  // Turn lights on both ways
          { channel: 3, data: true }, 

          { channel: 39, data: true }, // Turn audio amp on both ways
        ],
        'lightState': [
          { 
            channel: 3,
            data: {
              on_off: 1,
              saturation: 0,
              brightness: 95,
            }
          },          
          { 
            channel: 16,
            data: {
              on_off: 1,
              hue: 277,
              transition:5000,
            }
          },
          { 
            channel: 37,
            data: {
              on_off: 1,
              hue: 277,
            }
          },
        ],
      }
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
  },
  {
    alias: 'Living Room Ikea 2',
    channel: 29, 
    id: "8012F095B949B648B1BE7C8A050FA39E1F78FAE8",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Living Room Ikea 3',
    channel: 30, 
    id: "8012AE4AF3CF80CD50EC66E4F87F3E291F99397C",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Living Room Ikea 4',
    channel: 31, 
    id: "8012DEFBED48C05561BF6C2F5D8A490D1F77A75D",
    subType: SUBTYPE_BULB,    
  },
  {
    alias: 'Living Room Ikea 5',
    channel: 32, 
    id: "8012D9195E6D17B426B7F74DE432D6A21F9BD8BE",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Jess\' Desk Lamp',
    channel: 33, 
    id: "8012D2D5067A0F9AE37075A3FA816E341F9D35A9",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Switch in Jess\' desk',
    channel: 34, 
    id: "800686BE89C5D37A63B4E70AB37689212066F343",
    subType: SUBTYPE_SWITCH,
    targets: {
      'on': {
        'powerState': [ //Lights above the desk and desk lamp
          { channel: 31, data: true, delay: 1000 }, 
          { channel: 32, data: true, delay: 1000 }, 
          { channel: 33, data: true, delay: 1000 }, 
          { channel: 36, data: true }, 
          { channel: 40, data: true }, 
        ],
      },
      'off': {
        'powerState': [
          { channel: 31, data: false }, 
          { channel: 32, data: false }, 
          { channel: 33, data: false }, 
          { channel: 36, data: false }, 
          { channel: 40, data: false, delay: 1000 }, 
        ],
      }
    }   
  },
  {
    alias: 'Front Door Lamp',
    channel: 35, 
    id: "801277C3769ADD0BA769504AAB6B233E1F77F11C",
    subType: SUBTYPE_BULB,
  },
  {
    alias: 'Ikea Hallway',
    channel: 36, 
    id: "8012FA2584FE5D30C3E2F13FC023719B1F7B385D",
    subType: SUBTYPE_BULB,
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
         * Name of the filter (maps to 'filters/name.js' )
         */
        name: 'sunEvents', 

        stateData: { 
          brightness: { 
            value: 80,
            altValue: 1,
          },
        },
        
        /**
         * Populate this to add the filter to the period filter service runs.
         * 
         */
        periodicallyActive: 'duskToDawn',

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
           * Only apply this filter from before until after dusk and before until after dawn?
           * 
           * If set to true, filtered parameters get changed at other times they won't be overwritten 
           * until the next dusk/dawn period
           */
          atDawnAndDuskOnly: true,

          /**
           * If atDawnAndDuskOnly is set, apply optional padding on both sides of the time window
           * resulting from the above parameters.
           */
          padding: 5 * MINUTE,
        },
        // Should this filter be invoked when a switch is turned on or off?
        switchPosition: true,
        // This filter should be run against this device at this interval
        interval: 1 * MINUTE,
      }
    ],
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
    alias: 'Jess Bed Switch',
    channel: 101, 
    id: "8006000F366B7DD70835CBF38A51040620662083",
    subType: SUBTYPE_SWITCH, 
    targets: {
      'on': {
        'lightState': [
          { 
            channel: 38, 
            data: {
              brightness: 80, 
              on_off: 1,
              saturation: 0,
            }
          },
        ]
      },
      'off': {
        'lightState': [
          { 
            channel: 38, 
            data: {
              on_off: 0, 
              transition: 20000
            }
          },
        ]
      }
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
//  pollIntBulb,
//  pollIntSwitch,
//  pollIntPlug,

//  SUBTYPE_PLUG,
//  switch,
}