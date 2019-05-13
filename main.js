// Modules to control application life and create native browser window
const electron = require('electron');
const {app, BrowserWindow, autoUpdater, dialog} = require('electron');
const log = require('electron-log');
const path = require('path');

let DownloadManager;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
} else {
	DownloadManager = require('electron-download-manager');
}

const isDev = require('electron-is-dev');

if (isDev) {
	log.info('Running in development');
} else {
	log.info('Running in production');
	
	const server = 'http://aurevival.ru:1337';
	const feed = `${server}/update/${process.platform}/${app.getVersion()}`;
	
	autoUpdater.setFeedURL({url: feed});
	
	autoUpdater.on('update-not-available', (event,) => {
		log.info('no updates');
	});
	
	autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
		const dialogOpts = {
			type: 'info',
			buttons: ['Перезапуск', 'Позже'],
			title: 'Обновление лаунчера',
			message: process.platform === 'win32' ? releaseNotes : releaseName,
			detail: 'Новая версия лаунчера загружена. Перезапустите лаунчер, чтобы он обновился.'
		};
		
		dialog.showMessageBox(dialogOpts, (response) => {
			if (response === 0) autoUpdater.quitAndInstall();
		});
	});
	
	autoUpdater.on('error', message => {
		log.error('There was a problem updating the application');
		log.error(message);
	});
	autoUpdater.checkForUpdates();
	setInterval(() => {
		autoUpdater.checkForUpdates();
	}, 30 * 1000); //check updates every 30 seconds
}

DownloadManager.register({
	downloadFolder: path.resolve('/Games/Audition 2 Revival')
	// downloadFolder: app.getPath('downloads') + '/my-app'
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 760,
		height: 540,
		useContentSize: true,
		resizable: false,
		maximizable: false,
		fullscreen: false,
		nodeIntegration: true
	});
	
	// and load the index.html of the app.
	mainWindow.loadFile('index.html');
	
	// Open the DevTools.
	// mainWindow.webContents.openDevTools();
	
	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
		
		app.quit();
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('browser-window-created', function (e, window) {
	window.setMenu(null);
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
