// Import required modules
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Create Express application
const app = express();

// Import database connection configuration
const connection = require('./db');

// Set view engine to EJS
app.set("view engine", "ejs");

// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));


// Middleware for parsing JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Set up session middleware
app.use(session({
    secret: 'session_key',
    resave: false,
    saveUninitialized: false
  }));
  
  // Middleware to set req.user based on session data
  app.use((req, res, next) => {
    req.user = req.session.userId ? { id: req.session.userId } : null;
    next();
  });

// post routes for handling data 
app.post('/register', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.passwordReg, 10);
      const userData = {
        email: req.body.emailReg,
        username: req.body.usernameReg,
        password: hashedPassword,
        registration_date: new Date()
      };
  
      connection.query('INSERT INTO member SET ?', userData, (error, results) => {
        if (error) {
          console.error('Error inserting user:', error);
          return res.redirect('/register');
        }
        console.log('User registered successfully');
        res.redirect('/login');
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.redirect('/register');
    }
  });
  
app.post('/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    try {
      const query = 'SELECT * FROM member WHERE email = ? OR username = ?';
      connection.query(query, [usernameOrEmail, usernameOrEmail], async (error, results) => {
        if (error) {
          console.error('Error querying database:', error);
          return res.status(500).send('Internal Server Error');
        }
        if (results.length === 0) {
          return res.status(401).send('Invalid username or email');
        }
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res.status(401).send('Invalid password');
        }
        req.session.userId = user.member_id;
        req.user = { id: user.member_id };
        console.log("User signed in")
        console.log(req.user)
        res.render("home.ejs");
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).send('Internal Server Error');
    }
  });

// Define get routes to render pages 
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

app.get('/register', (req, res)=>{
    res.render('register')
})

app.get('/login', (req, res)=>{
    res.render('login')
})

// Set port number
const port = 3000;

// Start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  connection.connect(function(err){
    if(err) throw err;
    console.log(`Database connected`);
  })
});