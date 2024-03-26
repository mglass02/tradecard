// this file contains the needed javascript for the home page

const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get('message');

// Display the message if it exists
if (message) {
    alert(message); // You can use any other method to display the message
    }