
const getFormattedDate = date => {
    if (!date) {
        date = new Date();
    }

    day = date.getDate();
    month = date.getMonth() + 1;
    year = date.getFullYear();

    hours = date.getHours();
    minutes = date.getMinutes();
    seconds = date.getSeconds();

    const formattedDate = `${year}/${pad(month, 2)}/${pad(day, 2)}`;
    const formattedTime = `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`;

    return `${formattedDate} ${formattedTime}`;
}

/**
 * Pad the front of a string.
 * @param   string    input 
 * @param   integer   targetLength 
 * @param   string    paddingCharacter 
 * @returns string
 */
const pad = (input, targetLength, paddingCharacter) => {

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

module.exports = {
    getFormattedDate,
    pad,
}