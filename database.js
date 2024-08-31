
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

//Database file location
const dbPath = path.join(__dirname, 'data.db')

// Create or open the databse
const db = new sqlite3.Database(dbPath, (err) => {
    if(err){
        console.error('Error opening database:', err.message);
    }else{
        console.log('Connected to the database.');
        createTable();
    }
});
//Function to create the folders table if it doesn't exist

const createTable = () => {
    db.run(`CREATE TABLE IF NOT EXISTS folder(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        path TEXT)`);
        
};

module.exports = db;