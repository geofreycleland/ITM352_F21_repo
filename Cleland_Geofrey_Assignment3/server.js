/**
* An e-Commerce Web-site using a server and templates.
* @author Geofrey Cleland
* @since 12/5/2021
*/
var products = require('./products.json'); // set variable of products from product data to products
var express = require('express');
var app = express();
var myParser = require("body-parser");
app.use(myParser.urlencoded({ extended: true }));
app.use(myParser.json());
var qs = require('qs');
var fs = require('fs'); // Built in module, load in fs package to use
var session = require('express-session');
app.use(session({ secret: "MySecretKey" })); // Start sessions
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const nodemailer = require("nodemailer");
const url = require('url');

// ------ Read User Data File ----- //
var user_data_file = './user_data.json'; // Load in user data
if (fs.existsSync(user_data_file)) { // Check to see if file exists
    var file_stats = fs.statSync(user_data_file);
    var user_data = JSON.parse(fs.readFileSync(user_data_file, 'utf-8')); // return string, parse into object, set object value to user_data
}
else {
    console.log(`${user_data_file} does not exist!`);
}
// ------ Read User Data File ----- //

app.all('*', function (request, response, next) {
    if (typeof request.session.cart == "undefined") {
        request.session.cart = {}; // initialize cart
    }
    next();
});

// ------ Load In Product Data ----- //
app.post("/get_products_data", function (request, response, next) {
    response.json(products);
});
// ------ Load In Product Data ----- //

// ------ Process Login Form ----- //
app.post('/process_login', function (request, response, next) {
    delete request.query.username_error; // Deletes error from query after fixed
    delete request.query.password_error; // Deletes error from query after fixed
    let username = request.body["username"];
    if (typeof user_data[username] != 'undefined') { // Check if username entered exists in user data
        if (user_data[username].password == request.body.psw) { // Check if password entered matches password in user data
            request.query.name = user_data[username].name;
            request.query.email = user_data[username].email;
            response_string = `<script>
            alert('${user_data[username].name} Login Successful!');
            location.href = "${'./products_display.html'}";
            </script>`;
            var user_info = {"username": username, "name": user_data[username].name, "email": user_data[username].email};
            response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });
            response.send(response_string); // If no errors found, redirect to invoice with query string of username information and products
            return;
        } else { // If password is not entered correctly, send error alert
            request.query.username = username;
            request.query.name = user_data[username].name;
            request.query.password_error = 'Invalid Password!';
        }
    } else { // If username entered is not found in user data, send error alert
        request.query.username = username;
        request.query.username_error = 'Invalid Username!';
    }
    response.redirect('./login.html?' + qs.stringify(request.query)); // If there are errors, redirect to same page
});
// ------ End Process Login Form ----- //


// ------ Process Registration form ----- //
app.post('/process_register', function (request, response, next) {
    var errors = [];

    // -------------- Full name validation -------------- //
    // Full name only allow letters
    if (/^[A-Za-z]+ [A-Za-z]+$/.test(request.body.fullname) == false) {
        errors.push('Only letter characters allowed for Full Name')
    }

    // Full name maximum character length is 30
    if ((request.body.fullname.length > 30 || request.body.fullname.length < 1)) {
        errors.push('Full Name must contain Maximum 30 Characters')
    }

    // -------------- Username validation -------------- //
    // Username all lowercase (case insensitive)
    username = request.body.username.toLowerCase();

    // Check if username is in user data. If so, push username taken error
    if (typeof user_data[username] != 'undefined') {
        errors.push('Username taken');
    }
    // Username only allow letters and numbers
    if (/^[0-9a-zA-Z]+$/.test(request.body.username) == false) {
        errors.push('Only Letters And Numbers Allowed for Username');
    }
    // Username minimum character length is 4 maximum character length is 10
    if ((request.body.username.length > 10 || request.body.username.length < 4)) {
        errors.push('Username must contain at least 4 characters and a maximum of 10 characters')
    }

    // -------------- Email validation -------------- //
    // Email only allows certain character for x@y.z
    if (/[A-Za-z0-9._]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(request.body.email) == false) {
        errors.push('Must enter a valid email (username@mailserver.domain).');
    }

    // -------------- Password validation -------------- //
    // Password minumum 6 characters // 
    if (request.body.password.length < 6) {
        errors.push('Password Minimum 6 Characters')
    }
    // -------------- Repeat Password validation -------------- //
    // Check if password matches repeat password
    if (request.body.password !== request.body.repeat_password) {
        errors.push('Passwords Do Not Match')
    }

    // Borrowed some code from Lab 14 // 
    // If there are no errors, save info to user data
    if (errors.length == 0) {
        POST = request.body
        var username = POST['username']
        user_data[username] = {}; // Register it as user's information
        user_data[username].name = request.body.fullname; // POST user's name
        user_data[username].password = request.body.password; // POST user's password
        user_data[username].email = request.body.email; // POST user's email
        data = JSON.stringify(user_data);
        fs.writeFileSync(user_data_file, data, "utf-8"); // Add new user to user data json file
        request.query.name = user_data[username].name;
        request.query.email = user_data[username].email;
        response_string = `<script>alert('${user_data[username].name} Registration Successful!');
        location.href = "${'./invoice.html?' + qs.stringify(request.query)}";
        </script>`;
        var user_info = {"username": username, "name": user_data[username].name, "email": user_data[username].email};
        response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });
        response.send(response_string);
        // If no errors, send window alert success
    }
    // If there are errors redirect to registration page & keep info in query string
    if (errors.length > 0) {
        request.query.fullname = request.body.fullname;
        request.query.username = request.body.username;
        request.query.email = request.body.email;
        // Add errors to query string
        request.query.errors = errors.join(';');
        response.redirect('register.html?' + qs.stringify(request.query));
    }
});
// ------ End Process registration form ----- //

// ------ Get cart qty ----- //
app.post('/cart_qty', function (request, response) {
    var total = 0;
    for (pkey in request.session.cart) {
        total += request.session.cart[pkey].reduce((a, b) => a + b, 0);
    }
    response.json({"qty": total});
});
// ------ Get cart qty ----- //

// ------ Process order from products_display ----- //
app.post('/add_to_cart', function (request, response) {
    let POST = request.body; // create variable for the data entered into products_display
    var qty = POST["prod_qty"];
    var ptype = POST["prod_type"];
    var pindex = POST["prod_index"];
    if (isNonNegInt(qty)) {
        // Add qty data to cart session
        if (typeof request.session.cart[ptype] == "undefined") {
            request.session.cart[ptype] = [];
        }
        request.session.cart[ptype][pindex] = parseInt(qty);
        response.json({ "status": "Successfully Added to Cart" });
    } else {
        response.json({ "status": "Invalid quantity, Not added to cart" });
    }
});
// ------ End Process order from products_display ----- //

// ------ Get info from session (shopping cart data) ----- //
app.post('/get_cart', function (request, response) {
    response.json(request.session.cart);
});
// ------ Get info from session (shopping cart data) ----- //

// ------ Update session info/shopping cart with new quantities ----- //
app.post("/update_cart", function (request,response) {
    // replace cart in session with post
    // check if updated quantities are valid
    let haserrors = false;
    for (let ptype in request.body.quantities) {
        for (let i in request.body.quantities[ptype]) {
            qty = request.body.quantities[ptype][i];
            haserrors = !isNonNegInt(qty) || haserrors; // Flag -> once haserrors true, always true
        };
    };
    if (haserrors == true) { // if there are errors, send error msg
        msg = "Invalid quantities. Cart not updated";
    } else { // if there are no errors, update cart
        msg = "Cart successfully updated!";
        request.session.cart = request.body.quantities;
    }
    const ref_URL = new URL(request.get('Referrer'));
    ref_URL.searchParams.set("msg", msg); // get qs and add to qs
    response.redirect(ref_URL.toString());
});
// ------ End update session info/shopping cart with new quantities ----- //

// ------ User Logout ----- //
app.get("/logout" , function (request, response) {
    var user_info = JSON.parse(request.cookies["user_info"]);
    var username = user_info["username"];
    logout_msg = `<script>alert('${user_info.name} has successfully logged out!'); location.href="./index.html";</script>`;
    response.clearCookie('user_info');
    response.send(logout_msg);
});
// ------ User Logout ----- //

// ------ Complete purchase -> email invoice ----- //
app.post('/completePurchase', function (request, response) {
    var invoice = request.body;
    var user_info = JSON.parse(request.cookies["user_info"]);
    var the_email = user_info["email"];
    var transporter = nodemailer.createTransport({
        host: "mail.hawaii.edu",
        port: 25,
        secure: false, // use TLS
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        }
    });
    var mailOptions = {
        from: 'admin@netcreamery.com',
        to: the_email,
        subject: 'Your Net Creamery Invoice',
        html: invoice.invoicehtml
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            status_str = 'There was an error and your invoice could not be emailed';
            console.log(error); 
        } else {
            status_str = `Your invoice was mailed to ${the_email}`;
        }
        response.json({ "status": status_str });
    });
    request.session.destroy();
});
// ------ Complete purchase -> email invoice ----- //

// Function to check if value isNonNegInt
// Borrowed function from Assignment 1
function isNonNegInt(q, return_errors = false) { // Checks if the values input are a positive integer
    errors = []; // Initially assumes there are no errors
    if (q == '' || q == null) q = 0; // If the input is "blank" or null, set the value to 0 
    if (Number(q) != q) errors.push('<font color="red">Not a number!</font>'); // Check if string is a number value. If not, send error with reason.
    else if (q < 0) errors.push('<font color="red">Negative value!</font>'); // Check if string is non-negative. If not, send error with reason.
    else if (parseInt(q) != q) errors.push('<font color="red">Not an integer</font>'); // Check that it is an integer. If not, send error with reason.
    return return_errors ? errors : (errors.length == 0);
}

app.use(express.static('./public'));

var listener = app.listen(8080, () => { console.log('server started listening on port ' + listener.address().port) });