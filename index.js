const electron = require('electron');
const { app, BrowserWindow } = electron;

let window;

app.on('ready', () => {
    window = new BrowserWindow({frame: false,width: 1200, height: 800, minWidth: 630, minHeight: 500, useContentSize: true, show: false});
    window.on('ready-to-show', ()=>window.show());
    window.loadFile('index.html');
});

app.on('window-all-closed', () => {
    app.quit();
    app.exit();
});

app.on('quit', () => {
    app.exit();
});