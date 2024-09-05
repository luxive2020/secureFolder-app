const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const crypto = require('crypto');
const qrcode = require('qrcode');
//const db = require('./database');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');
const {authenticator } = require('otplib');

let mainWindow;
let template = [
  
];


// Create master password
const password = '@Casavat19.';
const MASTER_PASSWORD_HASH = crypto.createHash('sha256').update(password).digest('hex');

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Function to create the main application window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            sandbox: false, // Disable if it is enabled
            preload: path.join(__dirname, 'renderer/preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        },
    });

    mainWindow.loadFile('renderer/index.html');
    mainWindow.webContents.openDevTools()

  // Wait for the Devtools to be opened 
  mainWindow.webContents.on('did-finish-load', ()=>{
    getFolders((folders) =>{
        mainWindow.webContents.send('folders-list', folders);
    });
    const devToolsWindow = mainWindow.webContents.devTooolsWebContents;
    if(devToolsWindow){
        devToolsWindow.once('devtools-opened', () => {
            const bounds = {x:50, y:50, width:600, height:400};
            devToolsWindow.setBounds(bounds);
        });
    }
  })
 
}

// Run the migration to add the TOTp secret column if it doesn't exist
db.serialize(() =>{
    db.run(`PRAGMA foreign_keys = ON`);
    db.all(`PRAGMA table_info(folders)`, [], (err, rows)=>{
        if(err){
            console.error('Error checking folder table info:', err.message);
            return;
        }
        const columns = rows.map((row) => row.name);
        if (!columns.includes('totp_secret')){
            db.run(`ALTER TABLE folders ADD COLUMN totp_secret TEXT`, (err)=>{
                if(err){
                    console.error('Error adding totp_secret column:', err.message);
                }else{
                    console.log('totp_secret column added successfully.');
                }
            });
        }
    });
})
module.exports = db;

// Create the window and retrieve folders when the app is ready
app.whenReady().then(() => {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    createWindow();
});

// Quit the app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle password check
ipcMain.on('check-password', (event, password) => {
    try {
        const hashedPassword = hashPassword(password);

        if (hashedPassword === MASTER_PASSWORD_HASH) {
            event.reply('password-result', true);
        } else {
            event.reply('password-result', false);
            console.log(`${hashedPassword} is equal or not equal to ${password}`);
        }
    } catch (error) {
        console.error('Error checking password:', error);
        event.reply('password-result', false);
    }
});

// Handle folder selection via dialog
ipcMain.handle('dialog:openFolder', async () => {
    const folderPaths = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (!folderPaths.canceled && folderPaths.filePaths.length > 0) {
        return {
            name: path.basename(folderPaths.filePaths[0]),
            path: folderPaths.filePaths[0],
        };
    }
});

// Handle saving folder to the database
// Handle saving folder to the database
ipcMain.on('save-folder', (event, folder) => {
    const { name, path } = folder;

// Generate a TOTP secret for the folder
const totpSecret = authenticator.generateSecret();
// COunt the number of folders currently in the database
  // Count the number of folders currently in the database
    db.get(`SELECT COUNT(*) as count FROM folders`, [], (err, row) => {
        if (err) {
            console.error('Error counting folders:', err.message);
            return;
        }

        if (row.count >= 7) {
            event.reply('folder-limit-exceeded', 'You can only upload a maximum of 15 folders.');
        } else {
            // Save the folder only if the count is below the limit
            db.run(`INSERT INTO folders (name, path,totp_secret) VALUES (?, ?,?)`, [name, path], function (err) {
                if (err) {
                    console.error('Error saving folder:', err.message);
                    return;
                }
                // Generate QR code for the TOTP secret
                qrcode.toDataURL(authenticator.keyuri(name, 'secureFolder-app'),(err,url)=>{
                    if(err){
                        console.error('Error generating QR code:', err.message);
                        return;
                    }
                    // send the QR code URL to the renderer process
                    event.sender.send('totp-qr-code', url);
                });

                // Retrieve and send the updated list of folders
                getFolders((folders) => {
                    const mainWindow = BrowserWindow.getFocusedWindow();
                    mainWindow.webContents.send('folders-list', folders);
                });
            });
        }
    });
});
ipcMain.on('verify-totp', (event, folderId, enteredCode) =>{
    db.get(`SELECT totp_secret FROM folders WHERE id = ?`, [folderId],(err,row)=>{
        if(err) return console.error('Error retrieving TOTP secrets:', err.message);
        const isValid = authenticator.check(enteredCode, row.totp_secret);
        event.reply('totp-verification-result', isValid);
    });
});

        
    

// Handle deleting folder from the database
ipcMain.on('delete-folder', (event, folderPath) => {
    
    console.log(`Deleting folder with path: ${folderPath}`);

    db.run(`DELETE FROM folders WHERE path = ?`, [folderPath], function(err){
        if (err) {
            console.error('Error deleting folder:', err.message);
            return;
        }

        // Retrieve and send the updated list of folders
        getFolders((folders) => {
            const mainWindow = BrowserWindow.getFocusedWindow();
            mainWindow.webContents.send('folders-list', folders);
        });
    });
});



// Function to retrieve all folders
const getFolders = (callback) => {
    db.all(`SELECT * FROM folders`, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving folders:', err.message);
            return;
        }
        callback(rows);
    });
};

