
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path')



contextBridge.exposeInMainWorld('electron', {
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  require: (module) => require(module),

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




