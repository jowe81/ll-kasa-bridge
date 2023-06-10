import { getSunrise, getSunset } from 'sunrise-sunset-js';

const lat = 49.2827;
const long = -123.1207;


Date.prototype.stdTimezoneOffset = function () {
  var jan = new Date(this.getFullYear(), 0, 1);
  var jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

const isDaytime = () => {

  const now = new Date();
  const hours = now.getHours();

  return (hours > 21 && hours < 7);  
}

export {
  isDaytime,
}