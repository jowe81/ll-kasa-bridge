import chalk from 'chalk';

const getFormattedDate = (date, color = 'gray') => {
    if (!date) {
        date = new Date();
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const formattedDate = `${year}/${pad(month, 2, '0')}/${pad(day, 2, '0')}`;
    const formattedTime = `${pad(hours, 2, '0')}:${pad(minutes, 2, '0')}:${pad(seconds, 2, '0')}`;

    const text = `${formattedDate} ${formattedTime}`
    return color ? chalk[color](text) : text;
}

/**
 * Pad the front of a string.
 * @param   string    input 
 * @param   integer   targetLength 
 * @param   string    paddingCharacter 
 * @returns string
 */
const pad = (input, targetLength, paddingCharacter = ' ') => {
    if (!input) { 
      input = '' 
    };

    if (typeof(input) === 'number') {
        input = input.toString();
    }

    const repeats = Math.max(targetLength - input.length, 0);

    //Default to '0'
    if (!paddingCharacter) {
        paddingCharacter = '0';
    }

    return paddingCharacter.repeat(repeats) + input;
}

const log = (text, color = null, err) => {
  let styled;
  if (err) {
    styled = chalk.red(text ?? err.message);
    console.log(getFormattedDate() + ` ${styled}`, err);
  } else {
    styled = color ? chalk[color](text) : text;
    console.log(getFormattedDate() + ` ${styled}`);
  }  
}

export {
    getFormattedDate,
    pad,
    log,
}

