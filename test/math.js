const Big = require("big.js");

Big.DP = 64;

function add(...args) {
  let temp = Big(arguments[0]);
  for (let i = 1; i < arguments.length; i++) {
    temp = temp.plus(arguments[i]);
  }
  return Number(temp);
}

function mul(...args) {
  let temp = Big(arguments[0]);
  for (let i = 1; i < arguments.length; i++) {
    temp = temp.times(arguments[i]);
  }
  return Number(temp);
}

function subtract(a, b) {
  return Number(Big(a).minus(b));
}
function divide(a, b) {
  try {
    return Number(Big(a).div(b));
  } catch (e) {
    console.log("error in divide", e);
  }
}

module.exports = {
  add,
  mul,
  subtract,
  divide,
  Big,
};
