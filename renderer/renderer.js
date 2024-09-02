// renderer.js
const uploadButton = document.getElementById('upload-folder');
const folderList = document.getElementById('folder-list');

uploadButton.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
        window.electronAPI.saveFolder(folder);
        addFolderToList(folder.name, folder.path);
    }
});

const addFolderToList = (name, path) => {
    const li = document.createElement('li');
    li.textContent = `Name: ${name}, Path: ${path}`;
    folderList.appendChild(li);
};

window.electronAPI.onFoldersList((folders) => {
    folderList.innerHTML = '';
    folders.forEach(folder => addFolderToList(folder.name, folder.path));
});
