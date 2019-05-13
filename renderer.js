// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const child = require('child_process').execFile;
const remote = require('electron').remote;
const fs = require('fs');
const path = require('path');
const mkdirRx = require('mkdir-recursive');

let manifest = remote.require('./assets/js/manifest');
let client = remote.require('./assets/js/client');

function isOSWin64() {
	return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
}

const downloadPath = 'http://d.aurevival.ru/debug/';
const defaultGamePath = path.resolve('/Games/Audition 2 Revival');
const exe32 = path.resolve(defaultGamePath, 'client/DanceGameClient.exe');
const exe64 = path.resolve(defaultGamePath, 'client/DanceGame/Binaries/Win64/DanceGameClient-Win64-Shipping.exe');
const manifestDir = path.resolve(defaultGamePath, 'manifests');
const nodePath = 'http://88.99.93.5:3001';
const levelPath = '88.99.93.5';

let launcher = {
	launch: function () {
		child(isOSWin64() ? exe64 : exe32, [`?NODEPATH=${nodePath}?LEVELPATH=${levelPath}`], function (err, data) {
			if (err) {
				console.log(err);
				return;
			}
			
			console.log(data.toString());
		});
	}
};

let downloader = {
	manifestName: 'WindowsClientManifest.txt',
	
	init: function () {
		this.$progressLine = document.getElementById('progressLine');
		this.$launchBtn = document.getElementById('launchBtn');
		this.$progressText = document.getElementById('progressBarText');
		this.$progressLine.style.width = '0%';
		this.$launchBtn.addEventListener('click', launcher.launch);
		this.$launchBtn.disabled = true;
		
		fs.stat(path.resolve(manifestDir, this.manifestName), (err, stats) => {
			if (err) {
				console.warn(err);
				
				manifest.download([
					downloadPath + this.manifestName
				], this.onManifestsDownloaded.bind(this));
				
				return;
			}
			
			if (stats.isFile()) {
				fs.unlink(path.resolve(manifestDir, this.manifestName), (err,) => {
					if (err) {
						console.warn(err);
						return;
					}
					
					manifest.download([
						downloadPath + this.manifestName
					], this.onManifestsDownloaded.bind(this));
				});
			} else {
				manifest.download([
					downloadPath + this.manifestName
				], this.onManifestsDownloaded.bind(this));
			}
		});
		const configPath = path.resolve(process.env.LOCALAPPDATA, 'DanceGame/Saved/Config/WindowsClient');
		fs.stat(path.resolve(configPath, './Game.ini'), (err, stats) => {
			if (err) {
				//file not exist create it!
				mkdirRx.mkdirSync(configPath);
				
				let stream = fs.createWriteStream(path.resolve(configPath, './Game.ini'), {
					flags: 'a'
				});
				
				stream.write('[/Game/Blueprints/GlobalClasses/GI_GameInstance.GI_GameInstance_C]' + '\n');
				stream.write(`nodePath="${nodePath}"\n`);
				stream.write('levelPath=' + levelPath + '\n');
				stream.close();
				return;
			}
			
			if (stats.isFile()) {
				fs.unlink(path.resolve(configPath, './Game.ini'), (err) => {
					if (err) {
						throw err;
					}
					//file not exist create it!
					mkdirRx.mkdirSync(configPath);
					
					let stream = fs.createWriteStream(path.resolve(configPath, './Game.ini'), {
						flags: 'a'
					});
					
					stream.write('[/Game/Blueprints/GlobalClasses/GI_GameInstance.GI_GameInstance_C]' + '\n');
					stream.write(`nodePath="${nodePath}"\n`);
					stream.write('levelPath=' + levelPath + '\n');
					stream.close();
				});
			} else {
				//file not exist create it!
				mkdirRx.mkdirSync(configPath);
				
				let stream = fs.createWriteStream(path.resolve(configPath, './Game.ini'), {
					flags: 'a'
				});
				
				stream.write('[/Game/Blueprints/GlobalClasses/GI_GameInstance.GI_GameInstance_C]' + '\n');
				stream.write(`nodePath="${nodePath}"\n`);
				stream.write('levelPath=' + levelPath + '\n');
				stream.close();
			}
		});
	},
	onManifestsDownloaded: function () {
		client.remote = remote;
		client.downloadFiles(client.getUrls([
				path.resolve(manifestDir, this.manifestName),
			]),
			(error, finished, errors) => {
				if (error) {
					throw error;
				} else {
					this.updateProgressWidth(100);
					this.$launchBtn.disabled = false;
					this.$progressText.innerText = 'Можно запускать';
				}
			}, (finishedCount, errorsCount, fileName, urlsCount) => {
				this.finishedCount = finishedCount;
				this.urlsCount = urlsCount;
				this.updateProgressWidth(finishedCount / urlsCount * 100);
				this.updateProgressText();
			}, (progress, fileName) => {
				this.updateProgressText(progress, fileName);
			});
	},
	updateProgressText: function (progress, fileName) {
		if (fileName) {
			this.$progressText.innerText = `${fileName}: ${progress}%`;
		}
	},
	/**
	 * Updates progress bar width
	 * @param width - width in percent
	 */
	updateProgressWidth: function (width) {
		this.$progressLine.style.width = `${width}%`;
	}
};

downloader.init();