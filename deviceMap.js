const pollIntDefault = 10000;
const pollIntBulb = 10000;
const pollIntSwitch = 1000;
const pollIntPlug = 5000;

const switchTypePlug = 'plug';
const switchTypeSwitch = 'switch';

const deviceMap = [
  //Bedroom
  {
    localAlias: 'Bedroom IKEA lamp',
    ch: 2,
    id: "8012E7EA0A70974D997DE95E898FBA261F980E1A",
  },
  {
    localAlias: 'Bedroom Desk Strip top',
    ch: 3,
    id: "80121CF5373D56F7C62278B4C0FE88A01F53DD26",
  },
  { 
    localAlias: 'Bedroom Heater',
    ch: 4,
    id: '8006C7225D65913606542A8806E16EFB20C3F13C',
    switchType: switchTypePlug
  },
  {
    localAlias: 'Bedroom Fan',
    ch: 5, 
    id: "80069F21DB5B0BBF07AEC07F6485B19320C3751C",
    switchType: switchTypePlug,
  },
  {
    localAlias: 'Bedroom Ceiling 1',
    ch: 6, 
    id: "8012C3A3B58B58E8081EDBCF694C8CBC1F790A02",    
  },
  {
    localAlias: 'Bedroom Ceiling 2',
    ch: 7, 
    id: "8012511ABF75C811DB47A833DD2EDAED1F791417",    
  },

  //Hallway
  {
    localAlias: 'Hallway Ceiling 1', //Hallway ceiling 2?
    ch: 8,
    id: "80121D6F58ADDCAC185363C01347F5EA1F752B55",
  },
  {
    localAlias: 'Hallway Ceiling 2',
    ch: 9, 
    id: "8012DA57516B98CCFFE6467D8F4F01691F73C975",    
  },


  //Bathroom
  //***** ***pp pp***
  {
    localAlias: 'Bathroom 1',
    ch: 10, 
    id: "8012D32B889FD9CE23C825CEB1C2EFD41F73D8E2",    
  },
  {
    localAlias: 'Bathroom 2',
    ch: 11, 
    id: "8012F65B8543DA7FFFC8A3F756D1EBE61F742CDF",    
  },
  {
    localAlias: 'Bathroom 3',
    ch: 12, 
    id: "80128096836910A62F80A6B532C1461E1F79D295",    
  },
  {
    localAlias: 'Bathroom 4',
    ch: 13, 
    id: "8012EE37548E3F0F48405DECC13D0B801F779B2B",    
  },
  {
    localAlias: 'Bedroom Desk Switch',
    ch: 14,
    id: "8006E7EB4A66E3687708A7ABF93FB237200DCDA4",
    switchType: switchTypeSwitch,
    switchTargetsA: [ 5 ], //Turn on Fan on position A (and Heater off)
    switchTargetsB: [ 4 ], //Turn on Heater on position B (and Fan off)
  },
  {
    localAlias: 'Bathroom Heater',
    ch: 15,
    id: "80061465B741F3D278857FD2F8E09CD020C3200A",
    switchType: switchTypePlug
  },
  {
    localAlias: 'Bedroom Desk Strip bottom',
    ch: 16,
    id: "8012ACE65E9CFF19DBAB8CAF5A2BBD942014A9B1",
  },

  //Living Room
  //***** ***** ***** ***** ***** **ppp p****
  {
    localAlias: 'Living Room Ikea 1',
    ch: 28, 
    id: "801264A4EC3F66CAC02D4FF78712E6D11F992564",    
  },
  {
    localAlias: 'Living Room Ikea 2',
    ch: 29, 
    id: "8012F095B949B648B1BE7C8A050FA39E1F78FAE8",    
  },
  {
    localAlias: 'Living Room Ikea 3',
    ch: 30, 
    id: "8012AE4AF3CF80CD50EC66E4F87F3E291F99397C",    
  },
  {
    localAlias: 'Living Room Ikea 4',
    ch: 31, 
    id: "8012DEFBED48C05561BF6C2F5D8A490D1F77A75D",    
  },
  {
    localAlias: 'Living Room Ikea 5',
    ch: 32, 
    id: "8012D9195E6D17B426B7F74DE432D6A21F9BD8BE",    
  },
  {
    localAlias: 'Jess\' Desk Lamp',
    ch: 33, 
    id: "8012D2D5067A0F9AE37075A3FA816E341F9D35A9",    
  },
  {
    localAlias: 'Switch in Jess\' desk',
    ch: 34, 
    id: "800686BE89C5D37A63B4E70AB37689212066F343",
    switchType: switchTypeSwitch,
    switchTargetsA: [ 31, 32, 33, 36 ], //Lights above the desk and desk lamp
  },
  {
    localAlias: 'Front Door Lamp',
    ch: 35, 
    id: "801277C3769ADD0BA769504AAB6B233E1F77F11C",    
  },
  {
    localAlias: 'Ikea Hallway',
    ch: 36, 
    id: "8012FA2584FE5D30C3E2F13FC023719B1F7B385D",    
  },
  {
    localAlias: 'Jess Storage Shelves',
    ch: 36, 
    id: "80120A8622D026338547E3D7E88D70931F9E81A8",    
  },
  

  


  
  

//Kitchen and living room all: ***** ***** ***** *p*p* pp*p* ppppp **
//Full on: **1** ***** ****1 11*1* 11*1* 11111 111
//Blackout: 000** 00000 00**0 00000 00000 00000 000
//Desk work: **p** ***** ****p p
//Bedroom ceil: ***** pp***
//Bathroom: ***** ****pp pp***
//Jess' desk: ***** ***** ***** ***** ***** ***** *ppp**

];

module.exports = { 
  deviceMap,

  pollIntBulb,
  pollIntSwitch,
  pollIntPlug,

  switchTypePlug,
  switchTypeSwitch,
}