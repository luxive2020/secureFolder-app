const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');

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
    const devToolsWindow = mainWindow.webContents.devTooolsWebContents;
    if(devToolsWindow){
        devToolsWindow.once('devtools-opened', () => {
            const bounds = {x:50, y:50, width:600, height:400};
            devToolsWindow.setBounds(bounds);
        });
    }
  })
 
}

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
ipcMain.on('save-folder', (event, folder) => {
    const { name, path } = folder;

    db.run(`INSERT INTO folders (name, path) VALUES (?, ?)`, [name, path], function (err) {
        if (err) {
            console.error('Error saving folder:', err.message);
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

