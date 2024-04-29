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
app.use(express.static('public'));

// Middleware for parsing JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// post route to handle registering a new user
app.post('/register', async (req, res) => {
    try {
        // Check if username already exists in the database
        connection.query('SELECT * FROM member WHERE username = ?', [req.body.usernameReg], async (error, results) => {
            if (error) {
                console.error('Error checking username existence:', error);
                return res.status(500).send('Internal Server Error');
            }

            // If the username exists, return a message to the user
            if (results.length > 0) {
                console.log('Username already exists');
                res.redirect('/register?msg=username-already-exists')
            } else {
                // If the username is unique, continue
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
                        res.redirect('/register?msg=Unsuccessful-sign-up,-try-again...');
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

// post route to handle logging in 
app.post('/login', async (req, res) => {
    // access username or email and password from form
    const { usernameOrEmail, password } = req.body;
    // check if username/email and password are in database
    try {
        const query = 'SELECT * FROM member WHERE email = ? OR username = ?';
        connection.query(query, [usernameOrEmail, usernameOrEmail], async (error, results) => {
            if (error) {
                console.error('Error querying database:', error);
                res.redirect('/login?msg=Unsuccessful-login,-try-again...');
            }
            if (results.length === 0) {
                res.redirect('/login?msg=Invalid-username-or-email,-try-again...');
            } else {
                const user = results[0];
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) {
                    res.redirect('/login?msg=Invalid-password,-try-again...');
                } else {
                    req.session.userId = user.member_id;
                    req.user = { id: user.member_id };
                    console.log("User signed in")
                    res.render("home.ejs", { user: req.user });
                }
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.redirect('/login?msg=Error-logging-in,-try-again...');
    }
});


// post route to handle contact form 
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    // logging data to console for MVP (CHANGE LATER)  
    console.log('---------------------------')
    console.log('Received contact form submission:');
    console.log(' - Name:', name);
    console.log(' - Email:', email);
    console.log(' - Message:', message);

    setTimeout(() => {
        res.redirect('/home?message=Thanks+for+contacting+us');
    }, 1000);
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

// handle account page
app.get('/account', (req, res) => {
    try {
        // save memberId from user variable
        const memberId = req.user.id;

        // Retrieve user information from the member table
        const sqlQuery = 'SELECT username, email, DATE_FORMAT(registration_date, "%a %b %d %Y") AS registration_date FROM member WHERE member_id = ?';

        // Pass into query
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
    let searchTerm = req.query.search;
    let query = 'SELECT * FROM pok_project.card';
    let orderBy = req.query.orderBy;

    // Check if there's a search term
    if (searchTerm) {
        searchTerm = '%' + searchTerm.replace(/[^\w\s]/gi, '') + '%';
        query += ' WHERE name LIKE ?';
    }

    // Check if there's an orderBy parameter
    if (orderBy) {
        switch (orderBy) {
            case 'num_asc':
                query += ' ORDER BY card_id ASC';
                break;
            case 'num_desc':
                query += ' ORDER BY card_id DESC';
                break;
            case 'alpha_az':
                query += ' ORDER BY name ASC';
                break;
            case 'alpha_za':
                query += ' ORDER BY name DESC';
                break;
            default:
                // Default to no sorting
                break;
        }
    } else {
        // If no sorting option is provided, order randomly
        query += ' ORDER BY RAND()';
    }

    connection.query(query, [searchTerm], (error, results) => {
        if (error) {
            console.log('Error getting card date: ', error)
            res.redirect('/home?msg=Error-fetching-card-data');
        } else {
            // Render the cards page with filtered or all cards
            res.render('cards', { cards: results, user: req.user });
        }
    });
});


app.get('/card', (req, res) => {
    // access ids
    const card_id = req.query.id;
    const memberId = req.user ? req.user.id : null;

    // get info for specific card
    connection.query('SELECT card.*, type_of_card.type_name FROM pok_project.card INNER JOIN pok_project.card_type ON card.card_id = card_type.card_id INNER JOIN pok_project.type_of_card ON card_type.type_id = type_of_card.type_id WHERE card.card_id = ?', [card_id], (error, results) => {
        // Handle any errors that occur during the database query
        if (error) {
            console.error('Error fetching card data:', error);
            res.redirect('/home?msg=Error-fetching-card-data');
        }

        // Create a map to store card data, keyed by card ID
        const cardsMap = new Map();

        // Iterate over the results of the database query
        results.forEach(card => {
            // Rertieve card ID and type name from the query results
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

        // requires collections data to handle adding to specified collection
        connection.query('SELECT * FROM user_collection WHERE member_id = ?', [memberId], (error, collections) => {
            if (error) {
                console.error('Error fetching collections:', error);
                res.redirect('/home?msg=Error-fetching-collections');
                return;
            }

            // Render the 'card' template with the card data and collections data
            res.render('card', { cards, collections, user: req.user, card_id: req.query.id });
        });
    });
});


app.get('/register', (req, res) => {
    res.render('register', { user: req.user })
})

app.get('/login', (req, res) => {
    res.render('login', { user: req.user })
})

// handle logging oit
app.get('/logout', (req, res) => {
    // Clear the user session data
    req.session.destroy(error => {
        if (error) {
            console.error('Error destroying session:', error);
            // Handle error appropriately, maybe redirect to an error page
            return res.redirect('/home?msg=Error-logging-out');
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
                res.redirect('/home?msg=Error-fetching-collections');
                return;
            }

            // Pass the retrieved collections data to the template
            res.render('user_collection', { collections: results, user: req.user });
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        // Send an error response
        res.redirect('/home?msg=Error-fetching-collections');
    }
});

// Route to render the message inbox page
app.get('/message_inbox', async (req, res) => {
    try {
        // Retrieve the user's member_id from req.user
        const memberId = req.user.id;

        // SQL query to select messages with sender and receiver usernames
        const sqlQuery = `
            SELECT messages.*, 
                   sender.username AS sender_username,
                   receiver.username AS receiver_username
            FROM messages
            INNER JOIN member AS sender ON messages.sender_id = sender.member_id
            INNER JOIN member AS receiver ON messages.receiver_id = receiver.member_id
            WHERE receiver.member_id = ?
        `;

        // Execute the SQL query
        connection.query(sqlQuery, [memberId], (error, results) => {
            if (error) {
                console.error('Error fetching messages:', error);
                // Send an error response
                res.redirect('/home?msg=Error-fetching-messages');
                return;
            }

            // Pass the retrieved messages data to the template
            res.render('message_inbox', { messages: results, user: req.user });
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        // Send an error response
        res.redirect('/home?msg=Error-fetching-messages');
    }
});


// Endpoint to send a message
app.post('/send_message', async (req, res) => {
    try {
        // Retrieve sender's member_id from req.user
        const senderId = req.user.id;

        // Extract recipient's username and message text from the request body
        const { recipientUsername, messageText } = req.body;

        // Retrieve recipient's member_id based on the entered username
        const recipientQuery = 'SELECT member_id FROM member WHERE username = ?';
        connection.query(recipientQuery, [recipientUsername], (error, results) => {
            if (error) {
                console.log('Error retrieving recipient:', error);
                res.redirect('/message_inbox?msg=Error-retreiving-recipient') 
                return;
            }

            if (results.length === 0) {
                // If no user found with the entered username, return an error
                res.redirect('/message_inbox?msg=username-not-found')
                return;
            }

            const recipientId = results[0].member_id;

            // SQL query to insert the message into the database
            const sqlQuery = 'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)';
            
            // Execute the SQL query
            connection.query(sqlQuery, [senderId, recipientId, messageText], (error, results) => {
                if (error) {
                    console.log('Error sending message:', error);
                    res.status(500).send('Error sending message');
                } else {
                    res.redirect('/message_inbox?msg=message_sent_successfully')
                }
            });
        });
    } catch (error) {
        console.log('Error sending message:', error);
        res.redirect('/message_inbox?msg=Error-sending-message')
    }
});


app.get('/all_collections', async (req, res) => {
    try {
        // Retrieve the sort parameter from the query string
        const sortParam = req.query.sort;

        // Retrieve the user's member_id from req.user
        const memberId = req.user.id;

        // SQL query to select collections and corresponding member names
        let sqlQuery = `
            SELECT user_collection.*, member.username AS username 
            FROM user_collection 
            INNER JOIN member ON user_collection.member_id = member.member_id
        `;

        // Adjust the SQL query based on the sort parameter
        if (sortParam === 'likes_asc') {
            sqlQuery += ' ORDER BY likes ASC';
        } else if (sortParam === 'likes_desc') {
            sqlQuery += ' ORDER BY likes DESC';
        }

        // Execute the SQL query
        connection.query(sqlQuery, (error, results) => {
            if (error) {
                console.log('Error fetching collections:', error);
                // Send an error response
                res.redirect('/home?msg=Error-fetching-collections');
                return;
            }

            // Pass the retrieved collections data to the template
            res.render('all_collections', { collections: results, user: req.user });
        });
    } catch (error) {
        console.log('Error fetching collections:', error);
        // Send an error response
        res.redirect('/home?msg=Error-fetching-collections');
    }
});

app.post('/update_member_info', async (req, res) => {
    try {
        // Retrieve the user's member_id from req.user
        const memberId = req.user.id;

        // Extract new email and password from the request body
        const { newEmail, newPassword } = req.body;

        // Update the member's email and/or password in the database
        let updateQuery = 'UPDATE member SET';
        const updateParams = [];

        if (newEmail) {
            updateQuery += ' email = ?';
            updateParams.push(newEmail);
        }

        if (newPassword) {
            if (updateParams.length > 0) {
                updateQuery += ',';
            }
            updateQuery += ' password = ?';
            updateParams.push(newPassword);
        }

        updateQuery += ' WHERE member_id = ?';
        updateParams.push(memberId);

        // Execute the SQL update query
        connection.query(updateQuery, updateParams, (error, results) => {
            if (error) {
                
                console.error('Error updating member info:', error);
                // Redirect to an error page or display an error message
                res.redirect('/home?msg=Error-updating-member-info');
                return;
            }

            res.redirect('/account');
        });
    } catch (error) {
        console.error('Error updating member info:', error);
        // Redirect to an error page or display an error message
        res.redirect('/home?msg=Error-updating-member-info');
    }
});


// handle creating new collection
app.get('/create_collection', async (req, res) => {
    try {
        // Retrieve the user's information from req.user or wherever it's stored
        const memberId = req.user.id; 
        const collectionName = req.query.collectionName;

        // insert new row to user_collection
        await connection.query('INSERT INTO user_collection (member_id, name) VALUES (?, ?)', [memberId, collectionName]);

        // Redirect user to collection page
        res.redirect('/user_collection');
    } catch (error) {
        console.log('Error creating collection:', error);
        // Send an error response
        res.redirect('/home?msg=Error-creating-collection');
    }
});

app.get('/delete_collection/:user_collection_id', async (req, res) => {
    const userCollectionId = req.params.user_collection_id;
    
    try {

        // delete the rows from user_collection_card to remove foreign key
        await connection.query('DELETE FROM user_collection_card WHERE user_collection_id = ?', [userCollectionId]);

        // Then, delete the row from the user_collection table
        await connection.query('DELETE FROM user_collection WHERE user_collection_id = ?', [userCollectionId]);

        // Redirect the user to their collection page
        res.redirect('/user_collection');
    } catch (error) {
        // Rollback the transaction if an error occurs
        await connection.rollback();

        console.error('Error deleting collection:', error);
        // Send an error response
        res.redirect('/home?msg=Error-deleting-collections');
    }
});


// handle specific collection
app.get('/user_specific_collection/:user_collection_id', (req, res) => {
    // Get user_collection_id from URL parameters
    const user_collection_id = req.params.user_collection_id;

    // Query database for collection details and associated member_id
    const collectionQuery = `SELECT *, member_id FROM user_collection WHERE user_collection_id = ?`;
    connection.query(collectionQuery, [user_collection_id], (error, collectionDetails) => {
        if (error) {
            console.log('Error fetching collection details:', error);
            res.redirect('/home?msg=Error-fetching-collection-details');
            return;
        }

        // Access cards associated with collection through join query
        const cardsQuery = `
            SELECT card.* 
            FROM card 
            INNER JOIN user_collection_card ON card.card_id = user_collection_card.card_id 
            WHERE user_collection_card.user_collection_id = ?`;
        connection.query(cardsQuery, [user_collection_id], (error, cards) => {
            if (error) {
                console.log('Error fetching associated cards:', error);
                res.redirect('/home?msg=Error-fetching-associated-cards');
                return;
            }

            // Pass collection details, user_collection_id, associated cards, and req.user to the template
            res.render('user_specific_collection', {
                collection: collectionDetails[0],
                user_collection_id: user_collection_id,
                cards: cards,
                user: req.user, // Pass req.user which contains the user's details
            });
        });
    });
});

// handle adding cards to collection
app.post('/add_to_collection', (req, res) => {
    // access needed ids
    const user_collection_id = req.body.user_collection_id;
    const card_id = req.body.card_id;

    // Insert user_collection_id and card_id into user_collection_card table
    const sqlQuery = 'INSERT INTO user_collection_card (user_collection_id, card_id) VALUES (?, ?)';
    connection.query(sqlQuery, [user_collection_id, card_id], (error, results) => {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('Error adding to collection:', error);
                res.redirect('/cards?msg=Error-card-already-in-collection');
            } else {
                console.log('Error adding to collection:', error);
                res.redirect('/cards?msg=Error-adding-card');
            }
            return;
        }
        // Redirect to user_collection page after successful addition
        res.redirect('/user_collection')
    });
});

// handle removing card from collection
app.post('/remove_card_from_collection', (req, res) => {
    // access card_id and user_collection_id
    const cardId = req.body.card_id;
    const user_collection_id = req.body.user_collection_id;

    // Delete the row from user_collection_card table where card_id and user_collection_id match
    const deleteQuery = 'DELETE FROM user_collection_card WHERE card_id = ? AND user_collection_id = ?';
    connection.query(deleteQuery, [cardId, user_collection_id], (error, result) => {
        if (error) {
            console.log('Error deleting card from collection:', error);
            res.redirect('/home?msg=Error-deleting-card');
            return;
        }
        console.log('Card removed from collection successfully.');

        // Redirect to user collection
        res.redirect('/user_specific_collection/' + user_collection_id);
    });
});

// handle liking collections
app.get('/like_collection/:collectionId', async (req, res) => {
    try {
        // needed ids
        const collectionId = req.params.collectionId;

        // increment collection like in database
        const sqlQuery = 'UPDATE user_collection SET likes = likes + 1 WHERE user_collection_id = ?';

        // Execute the SQL query
        connection.query(sqlQuery, [collectionId], (error, results) => {
            if (error) {
                console.log('Error liking collection:', error);
                // Send an error response
                res.redirect('/home?msg=Error-liking-collections');
                return;
            }

            // Redirect back to the user collection page after liking the collection
            res.redirect('/all_collections');
        });
    } catch (error) {
        console.log('Error liking collection:', error);
        // Send an error response
        res.redirect('/home?msg=Error-liking-collections');
    }
});


// Set port number
const port = 3000;

// Start server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
    connection.connect(function (err) {
        if (err) throw err;
        console.log(`Database connected`);
    })
});