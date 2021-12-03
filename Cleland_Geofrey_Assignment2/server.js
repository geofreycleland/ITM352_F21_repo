//load required packages
var fs = require('fs');
var express = require('express');
var myParser = require("body-parser");
var filename = "./user_data.json";
var queryString = require("query-string");
var products = require('./public/products.json');
products.forEach((prod, i) => { prod.total_sold = 0 });

var app = express();

app.use(myParser.urlencoded({ extended: true }));

app.post('/process_purchase', function (req, res, next) {
    console.log(Date.now() + ': Purchase made from ip ' + req.ip + ' data: ' + JSON.stringify(req.body));
    
    invoice_data = invoice(req.body);
    res.json(invoice_data);
    next();
});

app.use(express.static('./public'));

var listener = app.listen(8080, () => { console.log('server started listening on port ' + listener.address().port); });

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
    if (subtotal <= 450) {
        shipping = 30;
    }
    else if (subtotal <= 900) {
        shipping = 15;
    }
    else {
        shipping = 0.00 * subtotal; // free shipping 
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
app.get("/login", function (request, response) {
    if(typeof request.session['last_login'] != "undefined") {
        login_time = "Last login was " + request.session["last_login"];
    } else {
        login_time = "First login";
    };
    str = `
    <body>
    Login info: ${login_time}
    <form action="/login" method="POST">`;
    if (request.query['name_err'] != undefined) {
        str += `<input type="text" name="username" size="40" placeholder="enter username" value="${request.query['name_err']}">Username Icorrect<br>`
        str += `<input type="password" name="password" size="40" placeholder="enter password"><br>`
    } else if (request.query['pass_err'] != undefined) {
        console.log(request.query['name'] + request.query['pass_err'])
        str += `<input type="text" name="username" size="40" placeholder="enter username" value="${request.query['name']}"><br>`
        str += `<input type="password" name="password" size="40" placeholder="enter password">Password Incorrect<br>`
    }
    else {
        str += `<input type="text" name="username" size="40" placeholder="enter username" ><br>`
        str += `<input type="password" name="password" size="40" placeholder="enter password"><br>`
    }
    str += `<input type="submit" value="Submit" id="submit">
                                </form>
                            </body>
        `;
    response.send(str);
});

app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    console.log("Got a POST to login");
    POST = request.body;

    user_name = POST["username"];
    user_pass = POST["password"];
    console.log("User name=" + user_name + " password=" + user_pass);
    query_response = "";

    if (user_data[user_name] != undefined) {
        if (user_data[user_name].password == user_pass) {
            // Good login
            request.session['last_login'] = Date ();
            response.send("Welcome!");
        } else {
            // Bad login, redirect
            query_response += "pass_err=" + user_pass;
            query_response += "name=" + user_name;
            console.log("password incorrect");
            response.redirect("login" + "?" + query_response);
        }
    } else {
        // Bad username
        query_response += "name_err=" + user_name;
        console.log(user_name + " doesn't exsist");
        response.redirect("login" + "?" + query_response);
    }
});

app.get("/register", function (request, response) {
    // Give a simple register form
    str = `
<body>
<form action="/register" method="POST">`;
    if (request.query["name_err"] == undefined) {
        str += `<input type="text" name="username" size="40" placeholder="enter username" ><br>`;
    } else {
        str += `<input type="text" name="username" size="40" placeholder="${request.query['name_err']}"><font color=red>User already exsists<br>`;
    }
    str += `<input type="password" name="password" size="40" placeholder="enter password"><br>`;
    if (request.query["pass_err"] == request.query["pass_repeat_err"]) {
        console.log(request.query["pass_err"] + request.query["pass_repeat_err"])
        str += `<input type="password" name="repeat_password" size="40" placeholder="enter password again"><br>`;
    } else {
        str += `<input type="password" name="repeat_password" size="40" placeholder="enter password again"><font color=red>Passwords don't match<br>`;
    }

    str += `<input type="email" name="email" size="40" placeholder="enter email"><br>
                                        <input type="submit" value="Submit" id="submit">
                                        </form>
                                    </body>
                                        `;
    response.send(str);
});

app.post("/register", function (request, response) {
    // process a simple register form
    console.log("Got a POST to register");
    POST = request.body;

    user_name = POST["username"];
    user_pass = POST["password"];
    user_pass_repeat = POST["repeat_password"]
    user_email = POST["email"];

    query_response = "";

    if (user_data[user_name] == undefined) {
        if (user_pass == user_pass_repeat) {
            console.log("Adding username=" + user_name);

            user_data[user_name] = {};
            user_data[user_name].name = user_name;
            user_data[user_name].password = user_pass;
            user_data[user_name].email = user_email;

            data = JSON.stringify(user_data);
            fs.writeFileSync(filename, data, "utf-8");

            response.redirect("login");
        } else {
            query_response += "pass_err=" + user_pass;
            query_response += "pass_repeat_err=" + user_pass_repeat;
            console.log("password don't match");
            response.redirect("register" + "?" + query_response);
        }
    } else {
        query_response += "name_err=" + user_name;
        console.log("bad request to add" + user_name);
        response.redirect("register" + "?" + query_response);
    }
});