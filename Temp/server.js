var express = require('express');
var app = express();
var fs = require('fs');
var products = require('./products.json');
// set initial inventory
products.forEach((o,i) => products[i].available = 100);

app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

app.use(express.urlencoded({ extended: false }));

app.post("/purchase", function (request, response) {
   process_quantity_form(request.body, response);
});

app.get('/inventory.json', function (req, res, next) {
   res.json(products);
});

app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));


function isNonNegInt(q, returnErrors = false) {
   errors = []; // assume no errors at first
   if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
   if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
   if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
   return returnErrors ? errors : (errors.length == 0);
}

 function process_quantity_form (POST, response) {
      var receipt = '';
      for(i in products) { 
       let q = POST[products[i].name];
       if(q == '') continue;
       if (isNonNegInt(q)) {
          let want = Number(q);
          // if quantity wanted more than available, give only what we have and add message about this
          let want_msg = '';
          if( products[i].available < want) {
            want = products[i].available;
            want_msg = `You want ${q}, only ${products[i].available} available`;
          } else {
            want_msg = `You want ${q}`;
          }
         products[i].available -= want;
         receipt += `<h3><img src="./images/${products[i].image}" width="50px" height="50px"> ${want_msg} ${products[i]['name']} at \$${products[i]['price']}<font color="blue"> Now only ${products[i].available} left in store!</font></h3>`; // render template string
       } else {
         receipt += `<h3><font color="red">${q} is not a valid quantity for ${products[i]['name']}!</font></h3>`;
       }
     }
     receipt += `<a href="./index.html">Get more cans!</a>`;
     response.send(receipt);
     response.end();
   
}