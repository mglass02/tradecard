// Import required modules
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;


// Set view engine to EJS
app.set('view engine', 'ejs');

// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));


// Middleware for parsing JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Define routes
app.get('/', (req, res) => {
    res.render('home'); 
});

app.get('/home', (req, res) => {
    res.render('home'); 
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact'); 
});

app.get('/cards', (req, res) => {
    res.render('cards'); 
});

app.get('/signUp', (req, res) => {
    res.render('signUp'); 
});

app.get('/login', (req, res) => {
    res.render('login'); 
});

// Define routes for members post log in
app.get('/wishlist', (req, res) => {
    res.render('wishlist'); 
});

app.get('/collection', (req, res) => {
    res.render('collection'); 
});

app.get('/account', (req, res) => {
    res.render('account'); 
});

app.get('/all_collections', (req, res) => {
    res.render('all_collections'); 
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});