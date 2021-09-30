var month = "Feb";
var num_days = -1;

switch (month) {
    case 'Apr':
    case 'Jun':
    case 'Sep':
    case 'Nov':
        num_days = 30;
        break;
    case 'Jan':
    case 'Mar':
    case 'May':
    case 'Jul':
    case 'Aug':
    case 'Oct':
    case 'Dec':    
        num_days = 31;
        break;
    case 'Feb':
        num_days = 28;
        break;
    default:
        num_days = -1;
        break;        
}

if (num_days == -1) {
    console.log("a value that indicates that an error has occurred");
} else {
    console.log("The month of " + month + " has " + num_days + " days.");
}