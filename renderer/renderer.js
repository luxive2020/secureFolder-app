// renderer.js
const uploadButton = document.getElementById('upload-folder');
const folderList = document.getElementById('folder-list');

uploadButton.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
        window.electronAPI.saveFolder(folder);
        
    }
});




const addFolderToList = (name, path) => {
    const li = document.createElement('li');
    li.textContent = `Name: ${name}, Path: ${path}`;
    const openButton = document.createElement('button');
    openButton.textContent = 'open';
    openButton.addEventListener('click', ()=>{
        const enteredCode = prompt('Enter TOTP:');
        if(enteredCode){
            window.electronAPI.verifyTotp(id,enteredCode);
        }
    });
    li.appendChild(openButton)
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click',()=>{
        console.log(`Attempting to delete folder: ${path}`);
        window.electronAPI.deleteFolder(path);
        
    });
    li.appendChild(deleteButton);
    
    folderList.appendChild(li);
};

//Handle TOTP verification result
window.electronAPI.onTotpVerificationResult((isValid)=>{
    if(isValid){
        alert('Access granted');
        // Code to open the folder
    }else{
        alert('Invalid TOTP');
    }
})

// Listen for the foleer limit exceeded message
window.electronAPI.onFolderLimitExceeded((message)=>{
    alert(message);//Display an alert or use another method to inform the  user
});


window.electronAPI.onFoldersList((folders) => {
    folderList.innerHTML = '';
    folders.forEach(folder => addFolderToList(folder.name, folder.path));
});


