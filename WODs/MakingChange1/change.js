//declaring variables
var initialAmount = 0.83;
var amount;
var quarters = 0;
var dimes = 0;
var nickels = 0;
var pennies = 0;

// convert pennies
amount = parseInt(initialAmount *100);

//quarters
quarters = parseInt(amount / 25);
amount = amount % 25;

//dimes
dimes = parseInt(amount / 10);
amount = amount % 10;

//nickels
nickels = parseInt(amount / 5);
amount = amount % 5;

//pennies
pennies = parseInt(amount);

console.log("The amount entered is $ " +initialAmount);
console.log("Quarters: " + quarters);
console.log("Dimes: " + dimes);
console.log("Nickels: " + nickels);
console.log("pennies: " + pennies);