// renderer.js
const uploadButton = document.getElementById('upload-folder');
const folderList = document.getElementById('folder-list');
const totpModal = document.getElementById('totp-modal');
const cancelTotpButton = document.getElementById('cancel-totp');
let folderToUpload = null;


uploadButton.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder && folder.id) {
        folderToUpload = folder; 
        console.log('Selected folder:', folderToUpload.id);
        window.electronAPI.generateTotpQrCode();
        
        //window.electronAPI.saveFolder(folder);
        
    }else{
        console.error('Folder ID is missing or folder secltion failed',folder.id);
    }
});

//Listen for TOTP QR code event
window.electronAPI.onTotpQrCode((qrCodeUrl,totpSecret) =>{
    console.log(qrCodeUrl);
    console.log('this totpsec',totpSecret);
    const qrCodeImg = document.getElementById('totp-qr-code');
    const secretText = document.getElementById('totp-secret');
    
    //Ensure the QR code and secret are valide before proceeding
    if (qrCodeImg && secretText){
        
        qrCodeImg.src = qrCodeUrl;
       secretText.textContent = totpSecret;
        console.log('Totp Secret:',totpSecret);

        //Show the TOTP modal after the QR code is generate
    totpModal.style.display = 'block'; //show the modal
    }else{
        console.error('QR code image or secret text element not found.')
    }
    

});

// Handle TOTP submission
console.log('verifyTotp:', window.electronAPI.verifyTotp); 
const submitTotpButton = document.getElementById('submit-totp');
submitTotpButton.addEventListener('click', ()=>{
    const enteredCode = document.getElementById('totp-input').value.trim();
    console.log('Enter code 1 is:',enteredCode)
    if(enteredCode && folderToUpload && folderToUpload.id){
        
        window.electronAPI.verifyTotp(folderToUpload.id, enteredCode);
        totpModal.style.display = 'none';
        //window.electronAPI.saveFolder(folderToUpload);
        console.log('ok!', enteredCode)
    }else{
        console.log('Enter code 11 is:',enteredCode);
    }
});
// Handle successful verification
window.electronAPI.onTotpVerificationSuccess((folderId) => {
    console.log('TOTP verified successfully for folder:', folderId);
    //Proceed to upload the folder
   window.electronAPI.saveFolder(folderToUpload);
   console.log('Ilove to pray!')
    //Reset after upload
    folderToUpload = null;
});


//Handle faile verification
window.electronAPI.onTotpVerificationFailed((message) => {
    console.log('It will be resolved!')
    alert(`TOTP verification failed: ${message}`);
})



//Handle cancelling TOTP process
cancelTotpButton.addEventListener('click', ()=>{
    folderToUpload = null; // Displaye the folder
    totpModal.style.display = 'none'; // close the modal
    alert('Folder upload canceled');
});


//Handle folder list update
window.electronAPI.onFoldersList((folders) => {
    folderList.innerHTML = '';
    folders.forEach(folder => addFolderToList(folder.id,folder.name, folder.path));
    
    
});

//Handle folder limit exceeded
window.electronAPI.onFolderLimitExceeded((message)=>{
    alert(message);//Display an alert or use another method to inform the  user
});





const addFolderToList = (id,name,path) => {
    const li = document.createElement('li');
    li.textContent = `Name: ${name}, Path: ${path}`;
    const openButton = document.createElement('button');
    openButton.className = 'openBtn';
    openButton.textContent = 'open';
    openButton.addEventListener('click', ()=>{
        openTotpModal(id);
    });
    li.appendChild(openButton)
    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteBtn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click',()=>{
        console.log(`Attempting to delete folder: ${path}`);
        window.electronAPI.deleteFolder(path);
        
    });
    li.appendChild(deleteButton);
    
    folderList.appendChild(li);
};

// // FUnction to open the TOTP modal
// const openTotpModal = (folderId) => {
//     const modal = document.getElementById('totp-modal');
//     const span = document.getElementsByClassName('close')[0];
//     const submitButton = document.getElementById('submit-totp');
//     const totpInput = document.getElementById('totp-input');
//     modal.style.display = 'block';
//     span.onclick = function(){
//         modal.style.display = 'none';
//     };
//     window.onclick = function (event){
//         if(event.target === modal){
//             modal.style.display = 'none';
//         }
//     };
//     submitButton.onclick = function(){
//         const enteredCode = totpInput.value;
//         console.log(enteredCode)
//         if(enteredCode){
//             window.electronAPI.verifyTotp(folderId, enteredCode);
//             console.log('Taiow',ent)
//         }
//         modal.style.display = 'none';
//     };
// };


//Handle the display of the QR code
// window.electronAPI.onTotpQrCode((qrCodeUrl)=>{
//     const modal = document.getElementById('totp-modal');
//     const qrCodeImg = document.getElementById('totp-qr-code');
//     qrCodeImg.src = qrCodeUrl;
//     console.log(qrCodeImg)
//     modal.style.display = 'block';
// })





