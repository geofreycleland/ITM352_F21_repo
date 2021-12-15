/**
* An e-Commerce Web-site using a server and templates.
* @author Geofrey Cleland
* @since 12/5/2021
*/
var products = require('./products.json');
var express = require('express');
var app = express();
var myParser = require("body-parser");
app.use(myParser.urlencoded({ extended: true }));
app.use(myParser.json());
var qs = require('qs');
var fs = require('fs');
var session = require('express-session');
app.use(session({ secret: "MySecretKey" })) // Start sessions
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const nodemailer = require("nodemailer");
const url = require('url');


//++++++++++Read User Data File++++++++++//
var user_data_file = './user_data.json'; // Load in user data
if (fs.existsSync(user_data_file)) { // Check to see if file exists
    var file_stats = fs.statSync(user_data_file);
    var user_data = JSON.parse(fs.readFileSync(user_data_file, 'utf-8')); // return string, parse into object, set object value to user_data
}
else {
    console.log(`${user_data_file} does not exist!`);
}


//++++++++++Initialize Cart++++++++++//
app.all('*', function (req, res, next) {
    if (typeof req.session.cart == "undefined") {
        req.session.cart = {};
    }
    next();
});


//++++++++++Load In Product Data++++++++++//
app.post("/get_products_data", function (req, res, next) {
    res.json(products);
});


//++++++++++Process Login Form++++++++++//
app.post('/process_login', function (req, res, next) {
    delete req.query.username_error; // Deletes error from query after fixed
    delete req.query.password_error; // Deletes error from query after fixed
    let username = req.body["username"];
    if (typeof user_data[username] != 'undefined') { // Check if username entered exists in user data
        if (user_data[username].password == req.body.psw) { // Check if password entered matches password in user data
            req.query.name = user_data[username].name;
            req.query.email = user_data[username].email;
            res_string = `<script>
            if (location.search != "") {
                console.log(location.search);
            alert('${user_data[username].name} Login Successful!');
            location.href = "./products_display.html" + location.search;
            } else {
                alert('${user_data[username].name} Login Successful!');
            location.href = "./invoice.html";
            }
            </script>`;
            var user_info = { "username": username, "name": user_data[username].name, "email": user_data[username].email };
            res.cookie('user_info', JSON.stringify(user_info), { maxAge: 31 * 60 * 1000 });
            res.send(res_string); // If no errors found, redirect to invoice with query string of username information and products
            return;
        } else { // If password is not entered correctly, send error alert
            req.query.username = username;
            req.query.name = user_data[username].name;
            req.query.password_error = 'Invalid Password!';
        }
    } else { // If username entered is not found in user data, send error alert
        req.query.username = username;
        req.query.username_error = 'Invalid Username!';
    }
    res.redirect('./login.html?' + qs.stringify(req.query)); // If there are errors, redirect to same page
});


//++++++++++Process Registration form++++++++++//
app.post('/process_register', function (req, res, next) {
    var errors = [];
    // Full name only allow letters
    if (/^[A-Za-z]+ [A-Za-z]+$/.test(req.body.fullname) == false) {
        errors.push('Only letter characters allowed for Full Name')
    }
    // Full name maximum character length is 30
    if ((req.body.fullname.length > 30 || req.body.fullname.length < 1)) {
        errors.push('Full Name must contain Maximum 30 Characters')
    }
    // Username all lowercase (case insensitive)
    username = req.body.username.toLowerCase();
    // Check if username is in user data. If so, push username taken error
    if (typeof user_data[username] != 'undefined') {
        errors.push('Username taken');
    }
    // Username only allow letters and numbers
    if (/^[0-9a-zA-Z]+$/.test(req.body.username) == false) {
        errors.push('Only Letters And Numbers Allowed for Username');
    }
    // Username minimum character length is 4 maximum character length is 10
    if ((req.body.username.length > 10 || req.body.username.length < 4)) {
        errors.push('Username must contain at least 4 characters and a maximum of 10 characters')
    }
    // Email only allows certain character for x@y.z
    if (/[A-Za-z0-9._]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(req.body.email) == false) {
        errors.push('Must enter a valid email (username@mailserver.domain).');
    }
    // Password minumum 6 characters // 
    if (req.body.password.length < 6) {
        errors.push('Password Minimum 6 Characters')
    }
    // Check if password matches repeat password
    if (req.body.password !== req.body.repeat_password) {
        errors.push('Passwords Do Not Match')
    }

    // If there are no errors, save info to user data
    if (errors.length == 0) {
        POST = req.body
        var username = POST['username']
        user_data[username] = {}; // Register it as user's information
        user_data[username].name = req.body.fullname; // POST user's name
        user_data[username].password = req.body.password; // POST user's password
        user_data[username].email = req.body.email; // POST user's email
        data = JSON.stringify(user_data);
        fs.writeFileSync(user_data_file, data, "utf-8"); // Add new user to user data json file
        req.query.name = user_data[username].name;
        req.query.email = user_data[username].email;
        res_string = `<script>alert('${user_data[username].name} Registration Successful!');
        location.href = "${'./invoice.html?' + qs.stringify(req.query)}";
        </script>`;
        var user_info = { "username": username, "name": user_data[username].name, "email": user_data[username].email };
        res.cookie('user_info', JSON.stringify(user_info), { maxAge: 31 * 60 * 1000 });
        res.send(res_string);
        // If no errors, send window alert success
    }
    // If there are errors redirect to registration page & keep info in query string
    if (errors.length > 0) {
        req.query.fullname = req.body.fullname;
        req.query.username = req.body.username;
        req.query.email = req.body.email;
        // Add errors to query string
        req.query.errors = errors.join(';');
        res.redirect('register.html?' + qs.stringify(req.query));
    }
});


//++++++++++Get cart qty++++++++++//
app.post('/cart_qty', function (req, res) {
    var total = 0;
    for (pkey in req.session.cart) {
        console.log(req.session.cart[pkey]);
        total += req.session.cart[pkey].reduce((a, b) => a + b, 0);
    }
    res.json({ "qty": total });
});


//++++++++++Process order from products_display++++++++++//
app.post('/add_to_cart', function (req, res) {
    let POST = req.body; // create variable for the data entered into products_display
    var qty = POST["prod_qty"];
    var ptype = POST["prod_type"];
    var pindex = POST["prod_index"];
    if (isNonNegInt(qty)) {
        // Add qty data to cart session
        if (typeof req.session.cart[ptype] == "undefined") {
            req.session.cart[ptype] = [];
        }
        req.session.cart[ptype][pindex] = parseInt(qty);
        res.json({ "status": "Successfully Added to Cart" });
    } else {
        res.json({ "status": "Invalid quantity, Not added to cart" });
    }
});


//++++++++++Get info from session (shopping cart data)++++++++++//
app.post('/get_cart', function (req, res) {
    res.json(req.session.cart);
});


//++++++++++Update session info/shopping cart with new quantities++++++++++//
app.post("/update_cart", function (req, res) {
    // replace cart in session with post
    // check if updated quantities are valid
    let haserrors = false;
    for (let ptype in req.body.quantities) {
        for (let i in req.body.quantities[ptype]) {
            qty = req.body.quantities[ptype][i];
            haserrors = !isNonNegInt(qty) || haserrors; // Flag -> once haserrors true, always true
            if (haserrors == true) { // if there are errors, send error msg
                msg = "Invalid quantities. Cart not updated";
            } else { // if there are no errors, update cart
                msg = "Cart successfully updated!";
                console.log(req.body.quantities);
                req.session.cart = req.body.quantities;
            }
        };
    };
    const ref_URL = new URL(req.get('Referrer'));
    ref_URL.searchParams.set("msg", msg); // get qs and add to qs
    res.redirect(ref_URL.toString());
});

//++++++++++User Logout++++++++++//
app.get("/logout", function (req, res) {
    var user_info = JSON.parse(req.cookies["user_info"]);
    var username = user_info["username"];
    logout_msg = `<script>alert('${user_info.name} has successfully logged out!'); location.href="./index.html";</script>`;
    res.clearCookie('user_info');
    res.send(logout_msg);
});

//++++++++++Session Expire++++++++++//
app.get("/expire", function (req, res) {
    logout_msg = `<script>alert('30 minutes has elapsed, Please start again!'); location.href="./logout";</script>`;
    req.session.destroy();
    res.send(logout_msg);
});

//++++++++++Complete purchase -> email invoice++++++++++//
app.post('/completePurchase', function (req, res) {
    var invoice = req.body;
    var user_info = JSON.parse(req.cookies["user_info"]);
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
            status_str = `Thank you ${user_info["name"]}! Your invoice was mailed to ${the_email}`;
        }
        res.json({ "status": status_str });
    });
    req.session.destroy();
});

//++++++++++Function to check if value isNonNegInt++++++++++//
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