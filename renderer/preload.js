
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path')



contextBridge.exposeInMainWorld('electronAPI', {
  // Testing IPC communication
  verifyTotp: (folderId, enteredCode) => ipcRenderer.send('verify-totp',folderId, enteredCode),
  onTotpVerificationResult: (callback) => ipcRenderer.on('totp-verification-result',(event, isValid) => callback(isValid)),

  selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  deleteFolder: (folderPath) => ipcRenderer.send('delete-folder', folderPath),  // Ensure the channel name matches
  
  saveFolder: (folder) => ipcRenderer.send('save-folder', folder),
  
  onFoldersList: (callback) => ipcRenderer.on('folders-list', (event, folders) => callback(folders)),
  onFolderLimitExceeded: (callback) => ipcRenderer.on('folder-limit-exceeded',(event, message)=>callback(message)),

  // Optional: Expose ipcRenderer methods for flexibility
  ipcRenderer: {
      on: (channel, listener) => {
          ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
      },
      send: (channel, data) => ipcRenderer.send(channel, data),
  },

  checkPassword: (password) => ipcRenderer.send('check-password', password),
  onPasswordResult: (callback) => ipcRenderer.on('password-result', callback),
});
