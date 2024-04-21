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

  app.post('/register', async (req, res) => {
    try {
        // Check if the username already exists in the database
        connection.query('SELECT * FROM member WHERE username = ?', [req.body.usernameReg], async (error, results) => {
            if (error) {
                console.error('Error checking username existence:', error);
                return res.status(500).send('Internal Server Error');
            }

            // If the username already exists, return a message to the user
            if (results.length > 0) {
                console.log('Username already exists');
                return res.status(409).send('Username already exists')
            } else {
                // If the username is unique, proceed with user registration
                const hashedPassword = await bcrypt.hash(req.body.passwordReg, 10);
                const userData = {
                    email: req.body.emailReg,
                    username: req.body.usernameReg,
                    password: hashedPassword,
                    registration_date: new Date()
                };

                // Insert the new user into the database
                connection.query('INSERT INTO member SET ?', userData, (error, results) => {
                    if (error) {
                        console.error('Error inserting user:', error);
                        return res.status(500).send('Internal Server Error');
                    }
                    console.log('User registered successfully');
                    res.redirect('/login');
                });
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal Server Error');
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

app.post('/user_collection', (req, res) => {
    res.redirect('/user_collection');
  });

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

app.get('/account', (req, res) => {
    res.render('account')
});

app.get('/cards', (req, res) => {
    connection.query('SELECT * FROM pok_project.card ORDER BY RAND()', (error, results) => {
      if (error) {
        console.error('Error fetching card data:', error);
        throw error;
      }
      // Store fetched cards in the cards array
      cards = results;
      // Render the cards page with the fetched cards
      res.render('cards', { cards: results });
    });
  });



// Define a route for handling requests to view a specific card
app.get('/card', (req, res) => {
    // Extract the card ID from the query parameters
    const cardId = req.query.id;
    
    // Query the database to fetch data for the specified card
    connection.query('SELECT card.*, type_of_card.type_name FROM pok_project.card INNER JOIN pok_project.card_type ON card.card_id = card_type.card_id INNER JOIN pok_project.type_of_card ON card_type.type_id = type_of_card.type_id WHERE card.card_id = ?', [cardId], (error, results) => {
      // Handle any errors that occur during the database query
      if (error) {
        console.error('Error fetching card data:', error);
        throw error;
      }
  
      // Create a map to store card data, keyed by card ID
      const cardsMap = new Map();
      
      // Iterate over the results of the database query
      results.forEach(card => {
        // Extract the card ID and type name from the query results
        const { card_id, type_name, ...rest } = card;
        
        // If the card ID is not already in the map, add it with an empty types array
        if (!cardsMap.has(card_id)) {
          cardsMap.set(card_id, { ...rest, types: [] });
        }
        
        // Add the type name to the types array for the current card
        cardsMap.get(card_id).types.push({ type_name });
      });
      // Convert the map values to an array of card objects
      const cards = Array.from(cardsMap.values());
      
      // Render the 'card' template with the card data
      res.render('card', { cards });
    });
  });

app.get('/register', (req, res)=>{
    res.render('register')
})

app.get('/login', (req, res)=>{
    res.render('login')
})

app.get('/user_collection', (req, res)=>{
    res.render('user_collection')
})

// routes to handle sorting of cards
// Route to handle sorting by number (ASC)
app.get('/sort_by_num_asc', (req, res) => {
    let ordered = cards.sort((a, b) => a.card_id - b.card_id);
    res.render('cards', { cards: ordered });
  });
  
  // Route to handle sorting by number (DESC)
  app.get('/sort_by_num_desc', (req, res) => {  
    let ordered = cards.sort((a, b) => b.card_id - a.card_id);
    res.render('cards', { cards: ordered });
  });
  
  // Route to handle sorting Sorting Alphabetically (A-Z)
  app.get('/alpha_az', (req, res) =>{
    let ordered = cards.sort((a, b) => {
      // Use localeCompare for string comparison
      return a.name.localeCompare(b.name);
    });
    res.render('cards', {cards: ordered});
  })
  
  // Route to handle sorting Sorting Alphabetically (Z-A)
  app.get('/alpha_za', (req, res) =>{
    let ordered = cards.sort((a, b) => {
      // Use localeCompare for string comparison
      return b.name.localeCompare(a.name);
    });
    res.render('cards', {cards: ordered});
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