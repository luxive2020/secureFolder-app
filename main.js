const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');

let mainWindow;

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
            const bounds = {x:50, y:50, width:100, height:600};
            devToolsWindow.setBounds(bounds);
        });
    }
  })
 
}

// Create the window and retrieve folders when the app is ready
app.whenReady().then(() => {
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
