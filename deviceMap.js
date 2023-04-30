const pollIntDefault = 10000;
const pollIntBulb = 10000;
const pollIntSwitch = 1000;
const pollIntPlug = 5000;

const switchTypePlug = 'plug';
const switchTypeSwitch = 'switch';

const deviceMap = [
  {
    localAlias: 'Desk lamp', //Hallway ceiling 2?
    ch: 1,
    id: "80121D6F58ADDCAC185363C01347F5EA1F752B55",
  },
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
  {
    localAlias: 'Hallway Ceiling 1',
    ch: 8, 
    id: "8012DA57516B98CCFFE6467D8F4F01691F73C975",    
  },

  //Bathroom
  //***** ***pp pp***
  {
    localAlias: 'Bathroom 1',
    ch: 9, 
    id: "8012D32B889FD9CE23C825CEB1C2EFD41F73D8E2",    
  },
  {
    localAlias: 'Bathroom 2',
    ch: 10, 
    id: "8012F65B8543DA7FFFC8A3F756D1EBE61F742CDF",    
  },
  {
    localAlias: 'Bathroom 3',
    ch: 11, 
    id: "80128096836910A62F80A6B532C1461E1F79D295",    
  },
  {
    localAlias: 'Bathroom 4',
    ch: 12, 
    id: "8012EE37548E3F0F48405DECC13D0B801F779B2B",    
  },
  {
    localAlias: 'Bedroom Desk Switch',
    ch: 13,
    id: "8006E7EB4A66E3687708A7ABF93FB237200DCDA4",
    switchType: switchTypeSwitch,
    switchTargetsA: [ 5 ], //Turn on Fan on position A (and Heater off)
    switchTargetsB: [ 4 ], //Turn on Heater on position B (and Fan off)
  },
  {
    localAlias: 'Bathroom Heater',
    ch: 14,
    id: "80061465B741F3D278857FD2F8E09CD020C3200A",
    switchType: switchTypePlug
  },
  {
    localAlias: 'Bedroom Desk Strip bottom',
    ch: 15,
    id: "8012ACE65E9CFF19DBAB8CAF5A2BBD942014A9B1",
  },


  //Living Room
  //***** ***** ***** **p** ***** **ppp p****
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


//Kitchen and living room all: ***** ***** ***** *p*p* pp*p* ppppp p*
//Blackout all lights: 000** 00000 00**0 00000 00000 00000 00
//Dek work: **p** ***** ****p
//Bedroom ceil: ***** pp***
//Bathroom: ***** ****pp pp***
];

module.exports = { 
  deviceMap,

  pollIntBulb,
  pollIntSwitch,
  pollIntPlug,

  switchTypePlug,
  switchTypeSwitch,
}