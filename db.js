const mysql = require('mysql')

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'pok_project',
    password: 'xme%559MG'
});

module.exports = connection; 