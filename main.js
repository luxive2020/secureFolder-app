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
// Create the window and retrieve folders when the app is ready
app.whenReady().then(() => {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    createWindow();
});


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
        width: 850,
        height: 550,
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
    
            const folderPath = folderPaths.filePaths[0];
            const folderName = path.basename(folderPath);
            //check if the folder already exists in the database
            return new Promise((resolve, reject)=>{
                db.get('SELECT id FROM folders WHERE path=?',[folderPath], (err,row)=>{
                    if(err){
                        reject(err);
                    }
                    if(row){
                        //FOlder already exists, return its ID
                        resolve({
                            id: row.id,
                            name: folderName,
                            path: folderPath
                        });
                    }else{
                        //Folder is new, return the name and path (id will be generated later)
                        db.run('INSERT INTO folders (path, name) VALUES (?, ?)',[folderPath, folderName], function (inserErr){
                          if(inserErr){
                            reject(inserErr); 
                          }else{
                            // Return the newly inserted folder's Id
                            resolve({
                                id: this.lastID,
                                name: folderName,
                                path:folderPath
                            });
                          }
                        
                    });
                }
            });
    
        });
    }else{
        //Folder selection was canceled
        return null;
    }
});


// Handle saving folder to the database after successful TOTP verification
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

        if (row.count >= 15) {
            event.reply('folder-limit-exceeded', 'You can only upload a maximum of 15 folders.');
        } else {
            // Save the folder only if the count is below the limit
            db.run(`INSERT INTO folders (name, path,totp_secret) VALUES (?, ?,?)`, [name, path,totpSecret], function (err) {
                if (err) {
                    console.error('Error saving folder:', err.message);
                    return;
                }
                // Generate QR code for the TOTP secret
                qrcode.toDataURL(authenticator.keyuri(name, 'secureFolder-app', totpSecret),(err,url)=>{
                    if(err){
                        console.error('Error generating QR code:', err.message);
                        return;
                    }
                    // send the QR code URL to the renderer process
                    event.sender.send('totp-qr-code', url, totpSecret);
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

 // Generate a new TOTP secret
ipcMain.on('generate-totp-qr-code', (event)=>{
   
    const totpSecret = authenticator.generateSecret();

    // Generate the QR code as a data URL
    qrcode.toDataURL(totpSecret, (err, qrCodeUrl) =>{
        if(err){
            console.error('Error generating QR code:', err.message);
            return;
        }
        // Send the QR code and secret back to the renderer process
        
        event.sender.send('totp-qr-code', qrCodeUrl, totpSecret);
        console.log(totpSecret);
    });
});
//Verify the TOTP code entered by the user
ipcMain.handle('verify-totp', (event, folderId, enteredCode) => {
    if (!folderId || !enteredCode) {
        console.error('Missing folder ID or entered TOTP code.');
        event.reply('totp-verification-failed', 'Invalid folder ID or TOTP code.');
        return;
    }

    // Retrieve the TOTP secret from the database based on the folder ID
    db.get('SELECT totp_secret FROM folders WHERE id = ?', [folderId], (err, row) => {
        if (err || !row || !row.totp_secret) {
            console.error('Failed to retrieve TOTP secret from the database.');
            event.reply('totp-verification-failed', 'Failed to retrieve TOTP secret.');
            return;
        }

        const totpSecret = row.totp_secret;

        try {
            const verified = authenticator.verify({
                token: enteredCode,
                secret: totpSecret,
                
            });
        

            if (verified) {
                event.sender.send('totp-verification-success', 'TOTP verified successfully.',folderId);
            } else {
                event.sender.send('totp-verification-failed', 'Invalid TOTP code.');
            }
        } catch (error) {
            console.error('Error verifying TOTP code:', error);
            event.sender.send('totp-verification-failed', 'Error verifying TOTP code.');
        }
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

