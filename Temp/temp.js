if (typeof req.query['purchase_submit'] != 'undefined') {

    for (i = 0; i < products.length; i++) {
        if (params.has(`quantity${i}`)) {
            a_qty = params.get(`quantity${i}`);
            product_selection_form[`quantity${i}`].value = a_qty;
            total_qty += a_qty;
            if (!isNonNegInt(a_qty)) {
                has_errors = true;
                checkQuantityTextbox(product_selection_form[`quantity${i}`]);
            }
        }
    }

}

let errorRedirectQuery = 'store?error=Invalid%20Quantity';
let badQuantity = false;
let overMax = false;
for (i = 0; i < products.length; i++) {
    let quantityLeft = products[i].quantity_available - products[i].total_sold;
    if(typeof POST[`quantity${i}`] != 'undefined') {
        a_qty = Number(POST[`quantity${i}`]);
        errorRedirectQuery += "&quantity" + i + '=';
        if (!isNonNegativeInteger(a_qty)) {
            // Put error messages into this array to display error messages later
            quantities_errors[i] = isNonNegativeInteger(a_qty, true);
            badQuantity = true;
            if (isNaN(a_qty)) {
                errorRedirectQuery += POST[`quantity${i}`];
            } else {
                errorRedirectQuery += a_qty;
            }
        } else if (a_qty > quantityLeft){
            // Check that the desired quantity isn't over the max allowable
            if (quantityLeft == 0){
                quantities_errors[i] = ["Sorry we're out of stock"];
            } else {
                quantities_errors[i] = ["Adjusted to the maximum allowable"];
            }
            overMax = true;
            errorRedirectQuery += quantityLeft;
        } else {
            // No erros for this quantity
            quantities_errors[i] = [];
            errorRedirectQuery += a_qty;
        }
    }
}
// If any of the quantities are invalid, redirect the user back to the store page
if (badQuantity || overMax) {
    console.log("Something was bad about the quantities");
    errorRedirectQuery += "&badQuantity" + `=${badQuantity}`;
    errorRedirectQuery += "&overMax" + `=${overMax}`;
    response.redirect(errorRedirectQuery);
    return next();
}

