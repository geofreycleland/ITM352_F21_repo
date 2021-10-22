require("./products_data.js");

var num_products = 5;

for (var count = 1; eval("typeof name" + count) !='undefined'; count++) {
    console.log(`${count}. ${eval('name' + count)}`);
}

console.log("That's all we have!");