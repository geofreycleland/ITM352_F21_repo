var fs = require('fs');
var express = require('express');
var app = express();
var myParser = require("body-parser");
var filename = "./user_data.json";
var queryString = require("query-string");

app.use(myParser.urlencoded({ extended: true }));

app.use(express.static('./public'));

if (fs.existsSync(filename)) {
    data = fs.readFileSync(filename, 'utf-8');

    user_data = JSON.parse(data);
    console.log("User_data=", user_data);

    fileStats = fs.statSync(filename);
    console.log("File " + filename + " has " + fileStats.size + " characters");
} else {
    console.log("Enter the correct filename bozo!");
}

app.get("/login", function (request, response) {
    str = `
    <body>
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
            response.redirect("./products_page.html");
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

app.listen(8080, () => console.log(`listening on port 8080`));