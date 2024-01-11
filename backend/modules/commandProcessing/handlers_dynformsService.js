
function next(command) {
  console.log('Hi from the Next handler', command);
}

function setFilter(command) {
    console.log("Hi from the setFilter handler", command);
}

const handlers = {
  next,
  setFilter,
};

export default handlers; 