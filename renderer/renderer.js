// renderer.js
const uploadButton = document.getElementById('upload-folder');
const folderList = document.getElementById('folder-list');

uploadButton.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
        window.electronAPI.saveFolder(folder);
        
    }
});




const addFolderToList = (id,name,path) => {
    const li = document.createElement('li');
    li.textContent = `Name: ${name}, Path: ${path}`;
    const openButton = document.createElement('button');
    openButton.textContent = 'open';
    openButton.addEventListener('click', ()=>{
        openTotpModal(id);
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

// FUnction to open the TOTP modal
const openTotpModal = (folderId) => {
    const modal = document.getElementById('totp-modal');
    const span = document.getElementsByClassName('close')[0];
    const submitButton = document.getElementById('submit-totp');
    const totpInput = document.getElementById('totp-input');
    modal.style.display = 'block';
    span.onclick = function(){
        modal.style.display = 'none';
    };
    window.onclick = function (event){
        if(event.target === modal){
            modal.style.display = 'none';
        }
    };
    submitButton.onclick = function(){
        const enteredCode = totpInput.value;
        if(enteredCode){
            window.electronAPI.verifyTotp(folderId, enteredCode);
        }
        modal.style.display = 'none';
    };
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
//Handle the display of the QR code
window.electronAPI.onTotpQrCode((qrCodeUrl)=>{
    const modal = document.getElementById('totp-modal');
    const qrCodeImg = document.getElementById('totp-qr-code');
    qrCodeImg.src = qrCodeUrl;
    console.log(qrCodeImg)
    modal.style.display = 'block';
})

// Listen for the foleer limit exceeded message
window.electronAPI.onFolderLimitExceeded((message)=>{
    alert(message);//Display an alert or use another method to inform the  user
});


window.electronAPI.onFoldersList((folders) => {
    folderList.innerHTML = '';
    folders.forEach(folder => addFolderToList(folder.id,folder.name, folder.path));
});


