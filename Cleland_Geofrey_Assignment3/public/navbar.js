/**
* An e-Commerce Web-site using a server and templates.
* @author Geofrey Cleland
* @since 12/5/2021
*/
//Code used from assignment 3 examples

function loadJSON(service, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('POST', service, false);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

var cart_qty;
loadJSON('./cart_qty', function (response) {
  // Parsing JSON string into object
  cart_qty = JSON.parse(response);
});

function navbar() {

  document.write(`
    <ul>
    <li><a href="./products_display.html"><img src="/images/NC logo.png" class="logoimage"></a></li><br>
    `);
  for (let product_key in allproducts) {
    document.write(`<li><a href='./products_display.html?product_key=${product_key}'>${product_key}</a></li>`);
  }
  document.write(` 
        <li id="right"><a href="./invoice.html${location.search}"><i class="fas fa-shopping-cart fa-lg"></i> (${Number(cart_qty.qty)})</a></li>
        <li id="right">`);
  if (getCookie('user_info') != false) {
    var user_info = JSON.parse(getCookie('user_info'));
    console.log(user_info);
    document.write(`<i class="fas fa-poo"> Welcome, ${user_info["name"]} </i>`); // If the user has a cookie called "user_info", welcome them by name
  } else {
    document.write(`<i class="far fa-frown"> User not logged in </i>`); // If the user does not have a cookie called "user_info", display not logged in msg
  };
  document.write(`</li>       
        <li id="right"><a href="./register.html${location.search}">Registration</a></li>`);


  if (getCookie('user_info') != false) {
    var user_info = JSON.parse(getCookie('user_info'));
    console.log(user_info);
    document.write(`<li id="right"><a href="./logout">Logout</a></li>`);
  } else {
    document.write(`<li id="right"><a href="./login.html${location.search}">Login</a></li>`);
  };

  document.write(`</ul>`);


}
// function to get cookie
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return false;
};

//Session Expire
if (getCookie('user_info') != false) {
  setTimeout("location.href = './expire';", 30 * 60 * 1000);
}

