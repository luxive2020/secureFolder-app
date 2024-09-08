
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path')



contextBridge.exposeInMainWorld('electronAPI', {
  // Testing IPC communication
  verifyTotp: (folderId, enteredCode) => ipcRenderer.send('verify-totp',folderId, enteredCode),
  // Expose the success handler for TOTP verification
  onTotpVerificationSuccess: (callback) => ipcRenderer.on('totp-verification-success', (event, folderId) => callback(folderId)),
  onTotpVerificationFailed: (callback) => ipcRenderer.on('totp-verification-failed', (event, message) => callback(message)),
  //onTotpVerificationResult: (callback) => ipcRenderer.on('totp-verification-result',(event, isValid) => callback(isValid)),
  onTotpQrCode: (callback) => ipcRenderer.on('totp-qr-code', (event, qrCodeUrl,totpSecret)=> callback(qrCodeUrl, totpSecret)),

  selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  deleteFolder: (folderPath) => ipcRenderer.send('delete-folder', folderPath),  // Ensure the channel name matches
  
  saveFolder: (folder) => ipcRenderer.send('save-folder', folder),
  
  onFoldersList: (callback) => ipcRenderer.on('folders-list', (event, folders) => callback(folders)),
  onFolderLimitExceeded: (callback) => ipcRenderer.on('folder-limit-exceeded',(event, message)=>callback(message)),
  generateTotpQrCode: () => ipcRenderer.send('generate-totp-qr-code'),

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
