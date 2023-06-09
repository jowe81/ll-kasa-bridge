const tBulb = 'bulb';
const tStrip = 'led-strip';
const tPlug = 'plug';
const tSwitch = 'switch';

const defaults = {
  pollInterval: 10000,
  offlineTolerance: 3,
}

const globalConfig = {
  subTypes: {
    tBulb,
    tStrip,
    tPlug,
    tSwitch,
  },

  [tBulb]: {
    pollInterval: 10000,
  },
  [tStrip]: {
    pollInterval: 10000,
  },
  [tSwitch]: {
    pollInterval: 1000,
  },
  [tPlug]: {
    pollInterval: 5000,
  },

  defaults,
}

const deviceMap = [
  //Bedroom
  {
    alias: 'Bedroom IKEA lamp',
    ch: 2,
    id: "8012E7EA0A70974D997DE95E898FBA261F980E1A",
    subType: tBulb,
  },
  {
    alias: 'Bedroom Desk Strip top',
    ch: 3,
    id: "80121CF5373D56F7C62278B4C0FE88A01F53DD26",
    subType: tStrip,
  },
  { 
    alias: 'Bedroom Heater',
    ch: 4,
    id: '80065A4E60A835C49695A74DA7FAE76520436E9C01',
    subType: tPlug
  },
  {
    alias: 'Bedroom Fan',
    ch: 5, 
    id: "80065A4E60A835C49695A74DA7FAE76520436E9C02",
    subType: tPlug,
  },
  {
    alias: 'Bedroom Ceiling 1',
    ch: 6, 
    id: "8012C3A3B58B58E8081EDBCF694C8CBC1F790A02",
    subType: tBulb,

  },
  {
    alias: 'Bedroom Ceiling 2',
    ch: 7, 
    id: "8012511ABF75C811DB47A833DD2EDAED1F791417",
    subType: tBulb,
  },

  //Hallway
  {
    alias: 'Hallway Ceiling 1', //Hallway ceiling 2?
    ch: 8,
    id: "80121D6F58ADDCAC185363C01347F5EA1F752B55",
    subType: tBulb,
  },
  {
    alias: 'Hallway Ceiling 2',
    ch: 9, 
    id: "8012DA57516B98CCFFE6467D8F4F01691F73C975",
    subType: tBulb,
  },


  //Bathroom
  //***** ***pp pp***
  {
    alias: 'Bathroom 1',
    ch: 10, 
    id: "8012D32B889FD9CE23C825CEB1C2EFD41F73D8E2",
    subType: tBulb,
  },
  {
    alias: 'Bathroom 2',
    ch: 11, 
    id: "8012F65B8543DA7FFFC8A3F756D1EBE61F742CDF",
    subType: tBulb,
  },
  {
    alias: 'Bathroom 3',
    ch: 12, 
    id: "80128096836910A62F80A6B532C1461E1F79D295",
    subType: tBulb,
  },
  {
    alias: 'Bathroom 4',
    ch: 13, 
    id: "8012EE37548E3F0F48405DECC13D0B801F779B2B",
    subType: tBulb,
  },
  {
    alias: 'Bedroom Desk Switch',
    ch: 14,
    id: "8006E7EB4A66E3687708A7ABF93FB237200DCDA4",
    subType: tSwitch,
    switchTargetsA: {
      'on' : [ 5, 2, 3, 16, 37, 39 ], // Turn fan and lights on
      'off': [ 4 ], // Turn heater off
    },
    switchTargetsB: {
      'on' : [ 4, 2, 3, 16, 37, 39 ], // Turn heater and lights on
      'off': [ 5 ], // Turn fan off
    }
  },
  {
    alias: 'Bathroom Heater',
    ch: 15,
    id: "80061465B741F3D278857FD2F8E09CD020C3200A",
    subType: tPlug
  },
  {
    alias: 'Bedroom Desk Strip bottom',
    ch: 16,
    id: "8012ACE65E9CFF19DBAB8CAF5A2BBD942014A9B1",
    subType: tStrip,
  },

  //Living Room
  //***** ***** ***** ***** ***** **ppp p****
  {
    alias: 'Living Room Ikea 1',
    ch: 28, 
    id: "801264A4EC3F66CAC02D4FF78712E6D11F992564",
    subType: tBulb,
  },
  {
    alias: 'Living Room Ikea 2',
    ch: 29, 
    id: "8012F095B949B648B1BE7C8A050FA39E1F78FAE8",
    subType: tBulb,
  },
  {
    alias: 'Living Room Ikea 3',
    ch: 30, 
    id: "8012AE4AF3CF80CD50EC66E4F87F3E291F99397C",
    subType: tBulb,
  },
  {
    alias: 'Living Room Ikea 4',
    ch: 31, 
    id: "8012DEFBED48C05561BF6C2F5D8A490D1F77A75D",
    subType: tBulb,    
  },
  {
    alias: 'Living Room Ikea 5',
    ch: 32, 
    id: "8012D9195E6D17B426B7F74DE432D6A21F9BD8BE",
    subType: tBulb,
  },
  {
    alias: 'Jess\' Desk Lamp',
    ch: 33, 
    id: "8012D2D5067A0F9AE37075A3FA816E341F9D35A9",
    subType: tBulb,
  },
  {
    alias: 'Switch in Jess\' desk',
    ch: 34, 
    id: "800686BE89C5D37A63B4E70AB37689212066F343",
    subType: tSwitch,
    switchTargetsA: { 'on': [ 31, 32, 33, 36, 40 ] }, //Lights above the desk and desk lamp
    switchTargetsB: { 'off': [ 31, 32, 33, 36, 40 ] }, //Lights above the desk and desk lamp
  },
  {
    alias: 'Front Door Lamp',
    ch: 35, 
    id: "801277C3769ADD0BA769504AAB6B233E1F77F11C",
    subType: tBulb,
  },
  {
    alias: 'Ikea Hallway',
    ch: 36, 
    id: "8012FA2584FE5D30C3E2F13FC023719B1F7B385D",
    subType: tBulb,
  },
  {
    alias: 'Jess Storage Shelves',
    ch: 36, 
    id: "80120A8622D026338547E3D7E88D70931F9E81A8",
    subType: tStrip,
  },
  {
    alias: 'Bedroom Desk Strip Shelving',
    ch: 37, 
    id: "80125B9CDD55CE105CC76F0CA2F6C8CC1F5426D8",
    subType: tStrip,
  },
  {
    alias: 'Bed Shelf Strip',
    ch: 38, 
    id: "8012D0E9DD82CBC61A864D093BF05E911F53B1E8",
    subType: tStrip,
  },
  {
    alias: 'Jess Bed Switch',
    ch: 101, 
    id: "8006000F366B7DD70835CBF38A51040620662083",
    subType: tSwitch,
    switchTargetsA: { 'on': [ 38 ] },
    switchTargetsB: { 'off': [ 38 ] },
  },
  { 
    alias: 'Bedroom Audio Amp',
    ch: 39,
    id: '80065A4E60A835C49695A74DA7FAE76520436E9C00',
    subType: tPlug
  },
  { 
    alias: 'Jess Desk Strip',
    ch: 40,
    id: '8012984E9F504FC4AEC384A012A6BEE01F54FA11',
    subType: tStrip
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

//  tPlug,
//  switch,
}