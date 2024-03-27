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

app.get('/all_collections', (req, res) => {
    res.render('all_collections'); 
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

// Handle contact form submission
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    // logging data to console for MVP (CHANGE LATER)  
    console.log('---------------------------')
    console.log('Received contact form submission:');
    console.log(' - Name:', name);
    console.log(' - Email:', email);
    console.log(' - Message:', message);
    
    setTimeout(() => {
        res.redirect('http://localhost:3000/home?message=Thanks+for+contacting+us');
    }, 1000); 
    
});

// database info 
    //host: 'localhost',
    //user: 'root',
    //database: 'pok_project',
    //password: 'xme%559MG'

// Handle sign up form submission
app.post('/signUp', (req, res) => {
    const { username, email, password } = req.body;
    const signUpDate = new Date(); // Get the current date and time

    // Extract year, month, and day components
    const year = signUpDate.getFullYear();
    const month = signUpDate.getMonth() + 1;
    const day = signUpDate.getDate();

    // Format the date as "year/month/day"
    const formattedDate = `${year}/${month}/${day}`;

    // Logging data to console for MVP (CHANGE LATER)  
    console.log('---------------------------');
    console.log('New user has signed up:');
    console.log(' - Username:', username);
    console.log(' - Email:', email);
    console.log(' - Password:', password);
    console.log(' - Sign Up Date:', formattedDate); 

    setTimeout(() => {
        res.redirect('http://localhost:3000/home?message=Thanks+for+signing+up');
    }, 1000); 
});

// handle log in form submission
app.post('/logIn', (req, res) => {
    const { uNameOrEmail, password } = req.body;

    // Logging data to console for MVP (CHANGE LATER)  
    console.log('---------------------------');
    console.log('Member has attempted log in:');
    console.log(' - Username/email:', uNameOrEmail);
    console.log(' - Password:', password);

    setTimeout(() => {
        res.redirect('http://localhost:3000/home?message=You+are+logged+in');
    }, 1000); 

});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});