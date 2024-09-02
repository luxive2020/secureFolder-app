
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path')



contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    saveFolder: (folder) => ipcRenderer.send('save-folder', folder),
    onFoldersList: (callback) => ipcRenderer.on('folders-list', (event, folders) => callback(folders)),

  ipcRenderer: {
    on: (channel, listener) => {
      ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
    },
    send: (channel, data) => ipcRenderer.send(channel, data)
  },


    checkPassword: (password) => ipcRenderer.send('check-password', password),
    onPasswordResult: (callback) => ipcRenderer.on('password-result', callback),
    
},



  

);




