/**
* An e-Commerce Web-site using a server and templates.
* @author Geofrey Cleland
* @since 12/11/2021
*/
var express = require('express');
var app = express();
var myParser = require("body-parser");

var products = require('./products.json');
products.forEach((prod, i) => { prod.total_sold = 0 });

app.get("/product_data.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    response.send(products_str);
});

function isNonNegativeInteger(inputString, returnErrors = false) {
    // Validate that an input value is a non-negative integer
    // inputString is the input string; returnErrors indicates how the function returns: true means return the
    // array and false means return a boolean.

    errors = []; // assume no errors at first
    if (Number(inputString) != inputString) {
        errors.push('Not a number!'); // Check if string is a number value
    }
    else {
        if (inputString < 0) errors.push('Negative value!'); // Check if it is non-negative
        if (parseInt(inputString) != inputString) errors.push('Not an integer!'); // Check that it is an integer
    }
    return returnErrors ? errors : (errors.length == 0);
}

// Route to handle any request; also calls next
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path: ' + request.path);
    next();
});

// Route to handle just the path /test
app.get('/test', function (request, response, next) {
    response.send('Got a GET request to path: test');
});

app.use(myParser.urlencoded({ extended: true }));

// Rule to handle process_form request from products_display.html
app.post("/purchase", function (request, response) {
    let POST = request.body;

    for (i = 0; i < products.length; i++) {
        let quantity = POST[`quantity${i}`];
        if (isNonNegativeInteger(quantity)) {
            products[i]['total_sold'] += Number(quantity);
            response.redirect('invoice.html');
        } else {
            response.redirect('products_display.html?error=Invalid%20Quantity&quantity_textbox=' + quantity);
        }
    }

});

// Handle request for any static file
app.use(express.static('./public'));

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here 

function invoice(quantities) {
    subtotal = 0;
    for (i = 0; i < products.length; i++) {
        a_qty = quantities[`quantity${i}`];
        if (a_qty > 0) {
            // add to subtotal
            subtotal += a_qty * products[i].price;
        }
    }
    // Compute tax
    var tax_rate = 0.0575;
    var tax = tax_rate * subtotal;

    // Compute shipping
    if (subtotal <= 50) {
        shipping = 2;
    }
    else if (subtotal <= 100) {
        shipping = 5;
    }
    else {
        shipping = 0.05 * subtotal; // 5% of subtotal
    }

    // Compute grand total
    var total = subtotal + tax + shipping;

    return {
        "quantities": quantities,
        "total": total, 
        "subtotal": subtotal, 
        "tax_rate": tax_rate, 
        "tax": tax, 
        "shipping": shipping
        };
}