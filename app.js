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
                res.redirect('/register?msg=username-already-exists')
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
                    res.redirect('/login?msg=Successfully-signed-up');
                });
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.redirect('/register?msg=Unsuccessful-sign-up,-try-again...');
    }
});

  
app.post('/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    try {
      const query = 'SELECT * FROM member WHERE email = ? OR username = ?';
      connection.query(query, [usernameOrEmail, usernameOrEmail], async (error, results) => {
        if (error) {
          console.error('Error querying database:', error);
          res.redirect('/login?msg=Unsuccessful-login,-try-again...');
        }
        if (results.length === 0) {
          res.redirect('/login?msg=Invalid-username,-try-again...');
        }
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            res.redirect('/login?msg=Invalid-password,-try-again...');
        }
        req.session.userId = user.member_id;
        req.user = { id: user.member_id };
        console.log("User signed in")
        res.render("home.ejs", { user: req.user });
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.redirect('/login?msg=Error-logging-in,-try-again...');
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
    res.redirect('user_collection', { user: req.user });
});

app.get('/', (req, res) => {
    res.render('home', { user: req.user }); 
});

app.get('/home', (req, res) => {
    res.render('home', { user: req.user }); 
});

app.get('/about', (req, res) => {
    res.render('about', { user: req.user });
});

app.get('/contact', (req, res) => {
    res.render('contact', { user: req.user }); 
});

app.get('/account', (req, res) => {
    try {
        const memberId = req.user.id;

        // Query to retrieve user information from the member table
        const sqlQuery = 'SELECT username, email, DATE_FORMAT(registration_date, "%a %b %d %Y") AS registration_date FROM member WHERE member_id = ?';

        // Execute the SQL query
        connection.query(sqlQuery, [memberId], (error, results) => {
            
            if (error) {
                console.error('Error fetching user information:', error);
                // Send an error response
                res.redirect('/home?msg=Error-getting-user-info...');
                return;
            }

            // Check if user information is found
            if (results.length > 0) {
                // Pass user information to the account template
                res.render('account', { user: req.user, userData: results[0] });
            } else {
                // If user information is not found, send a not found response
                res.redirect('/home?msg=User-not-found...');
            }
        });
    } catch (error) {
        console.error('Error fetching user information:', error);
        // Send an error response
        res.redirect('/home?msg=Error-getting-account-info');
    }
});

app.get('/cards', (req, res) => {
    connection.query('SELECT * FROM pok_project.card ORDER BY RAND()', (error, results) => {
      if (error) {
        res.redirect('/home?msg=Error-fetching-card-data');
      }
      // Store fetched cards in the cards array
      cards = results;
      // Render the cards page with the fetched cards
      res.render('cards', { cards: results, user: req.user });
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
      res.render('card', { cards, user: req.user });
    });
  });

app.get('/register', (req, res)=>{
    res.render('register', { user: req.user })
})

app.get('/login', (req, res)=>{
    res.render('login', { user: req.user })
})

app.get('/logout', (req, res) => {
    // Clear the user session data
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            // Handle error appropriately, maybe redirect to an error page
            return res.redirect('/error');
        }
        // Redirect the user to the homepage
        res.redirect('/');
    });
});

// Route to render the user's collection page
app.get('/user_collection', async (req, res) => {
    try {
        // Retrieve the user's member_id from req.user
        const memberId = req.user.id;

        // SQL query to select collections based on member_id
        const sqlQuery = 'SELECT * FROM user_collection WHERE member_id = ?';

        // Execute the SQL query
        connection.query(sqlQuery, [memberId], (error, results) => {
            if (error) {
                console.error('Error fetching collections:', error);
                // Send an error response
                res.status(500).send('Internal Server Error');
                return;
            }

            // Pass the retrieved collections data to the template
            res.render('user_collection', { collections: results, user: req.user });
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        // Send an error response
        res.status(500).send('Internal Server Error');
    }
});

app.get('/all_collections', async (req, res) => {
    try {
        // Retrieve the user's member_id from req.user
        //const memberId = req.user.id;

        // SQL query to select collections and corresponding member names
        const sqlQuery = `
        SELECT user_collection.*, member.username AS username 
        FROM user_collection 
        INNER JOIN member ON user_collection.member_id = member.member_id
        
        `;

        // Execute the SQL query
        connection.query(sqlQuery, (error, results) => {
            if (error) {
                console.error('Error fetching collections:', error);
                // Send an error response
                res.status(500).send('Internal Server Error');
                return;
            }

            // Pass the retrieved collections data to the template
            res.render('all_collections', { collections: results, user: req.user });
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        // Send an error response
        res.status(500).send('Internal Server Error');
    }
});

app.get('/create_collection', async (req, res) => {
    try {
        // Retrieve the user's information from req.user or wherever it's stored
        const memberId = req.user.id; // Adjust accordingly to access user information

        // Perform the insert query to add a new collection for the user
        await connection.query('INSERT INTO user_collection (member_id) VALUES (?)', [memberId]);

        // Redirect the user to their collection page
        res.redirect('/user_collection');
    } catch (error) {
        console.error('Error creating collection:', error);
        // Send an error response
        res.status(500).send('Internal Server Error');
    }
});
  
app.get('/delete_collection', async (req, res) => {
    try {
        // Retrieve the user's information from req.user or wherever it's stored
        const memberId = req.user.id; // Adjust accordingly to access user information

        // Perform the insert query to add a new collection for the user
        await connection.query('INSERT INTO user_collection (member_id) VALUES (?)', [memberId]);

        // Redirect the user to their collection page
        res.redirect('/user_collection');
    } catch (error) {
        console.error('Error deleting collection:', error);
        // Send an error response
        res.status(500).send('Internal Server Error');
    }
});

app.get('/user_specific_collection', (req, res) =>{
    res.render('user_specific_collection')
})

// Route to handle sorting by number (DESC)
app.get('/sort_by_num_asc', (req, res) => {  
    let ordered = cards.sort((a, b) => a.card_id - b.card_id);
    res.render('cards', { cards: ordered, user: req.user });
  });

  // Route to handle sorting by number (DESC)
  app.get('/sort_by_num_desc', (req, res) => {  
    let ordered = cards.sort((a, b) => b.card_id - a.card_id);
    res.render('cards', { cards: ordered, user: req.user });
  });
  
  // Route to handle sorting Sorting Alphabetically (A-Z)
  app.get('/alpha_az', (req, res) =>{
    let ordered = cards.sort((a, b) => {
      // Use localeCompare for string comparison
      return a.name.localeCompare(b.name);
    });
    res.render('cards', {cards: ordered, user: req.user });
  })
  
  // Route to handle sorting Sorting Alphabetically (Z-A)
  app.get('/alpha_za', (req, res) =>{
    let ordered = cards.sort((a, b) => {
      // Use localeCompare for string comparison
      return b.name.localeCompare(a.name);
    });
    res.render('cards', {cards: ordered, user: req.user });
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