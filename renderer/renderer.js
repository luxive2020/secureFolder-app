

/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 * 
 */

const uploadButton = document.getElementById('upload-folder');
const folderList = document.getElementById('folder-list');



uploadButton.addEventListener('click', async()=>{
  try{
    const folderPaths = await window.electron.openFolderDialog({
      properties: ['openDirectory']
    });
    if(!folderPaths.canceled && folderPaths.length > 0){
        //document.getElementById('file-container').innerText = `Selected folder: ${folderPaths[0]}`; 
       // //Here You can add the logic to handle the folder, e.g., read its contents
        // console.log(`Selected folder: ${folderPaths[0]}`);
        const folderPath = folderPaths[0];
        const folderName = window.path.basename(folderPath);



         // Send the folder name and path to the main process
        window.electron.ipcRenderer.send('save-folder',  {name: folderName, path: folderPath});

         // optionally, display the folder immeditaely in the UI
         addFolderToList(folderName, folderPath);

    }else{
      console.log('An error occured!')
    }
  }catch(error){
    console.error('Error opening folder dialog:', error);
}

});

// Function to add folder to the UI
const addFolderToList = (name, path) => {
  const li = document.createElement('li');
  li.textContent = `Name: ${name}, Path: ${path}`;
  folderList.appendChild(li);
  
};

// Listen for saved folders from the main proces and display them
window.electron.ipcRenderer.on('folder-list', (event, folders) => {
  console.log('Recieved folders:', folders)
  folderList.innerHTML = '';
  folders.forEach(folder => addFolderToList(folder.name, folder.path));
});
