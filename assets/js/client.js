const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const downloadManager = require('electron-download-manager');
const hashType = 'sha1';
const hashEncoding = 'hex';
const mkdirRx = require('mkdir-recursive');

const {DownloadWorker, utils} = require('rapid-downloader');

const defaultGamePath = path.resolve('/Games/Audition 2 Revival/');

let clientDownloader = {
	baseUrl: 'http://d.aurevival.ru/debug/',
	remote: null,
	
	/**
	 * Download game files
	 * @param {string[]} lines
	 * @param {function} callback
	 * @param {function} onResult
	 * @param {function} onProgressItem
	 */
	downloadFiles: function (lines, callback, onResult, onProgressItem) {
		// Get rid of empty lines or something like false 0 undefined null etc
		lines = lines.filter((el) => {
			return el;
		});
		this.lines = lines;
		this.urlsCount = lines.length;
		this.finished = [];
		this.errors = [];
		
		this.x = 0;
		
		this.downloadFile(this.lines[this.x], callback, onResult, onProgressItem);
	},
	downloadFile: function (manifestLine, callback, onResult, onProgressItem) {
		const urlsCount = this.urlsCount;
		let finished = this.finished;
		let errors = this.errors;
		
		if (!manifestLine) {
			return;
		}
		
		const hash = manifestLine.split('\t')[1];
		const downloadUrl = this.baseUrl + manifestLine.split('\t')[0];
		let dirPath = manifestLine.split('\t')[0].split('/');
		const fileName = dirPath.pop();
		const saveDirPath = dirPath.join('/');
		
		const fullFilePath = `client/${saveDirPath}/${fileName}`;
		
		mkdirRx.mkdirSync(path.resolve(defaultGamePath, 'client/', saveDirPath));
		
		this.isValidFile(path.resolve(defaultGamePath, fullFilePath), hash, (result) => {
			if (!result) {
				fs.unlink(path.resolve(defaultGamePath, fullFilePath), (err) => {
					if (err) {
						console.log(err); //file is not exist, download it
					}
					const worker = new DownloadWorker(downloadUrl, path.resolve(defaultGamePath, fullFilePath), {
						maxConnections: 6,
						progressUpdateInterval: 100,
					});
					worker.on('ready', () => {
						worker.on('start', () => {
							return console.log('started');
						});
						worker.on('progress', (progress) => {
							onProgressItem(progress.completedPercent, fileName);
						});
						worker.on('finishing', () => {
							return console.log('Download is finishing');
						});
						worker.on('end', () => {
							finished.push(fileName);
							if (typeof onResult === 'function') {
								onResult(finished.length, errors.length, fileName, urlsCount);
							}
							if ((finished.length + errors.length) === urlsCount) {
								if (errors.length > 0) {
									callback(new Error(errors.length + ' downloads failed'), finished, errors);
								} else {
									callback(null, finished, []);
								}
							}
							this.x++;
							this.downloadFile(this.lines[this.x], callback, onResult, onProgressItem);
							return console.log('Download is done');
						});
						worker.on('error', error => {
							throw error;
						});
						worker.start();
					});
				});
			} else {
				finished.push(fileName);
				
				if (typeof onResult === 'function') {
					onResult(finished.length, errors.length, fileName, urlsCount);
				}
				
				if ((finished.length + errors.length) === urlsCount) {
					if (errors.length > 0) {
						callback(new Error(errors.length + ' downloads failed'), finished, errors);
					} else {
						callback(null, finished, []);
					}
				}
				
				this.x++;
				this.downloadFile(this.lines[this.x], callback, onResult, onProgressItem);
			}
		});
	},
	/**
	 * Check file hash, callback called after check
	 * @param {string} filePath
	 * @param {string} serverHash
	 * @param {function(boolean)} next
	 */
	isValidFile: function (filePath, serverHash, next) {
		fs.stat(filePath, (err, stats) => {
			if (err) {
				next(false);
				return;
			}
			
			if (stats.isFile()) {
				let fd = fs.createReadStream(filePath);
				
				let hash = crypto.createHash(hashType);
				hash.setEncoding(hashEncoding);
				
				fd.on('end', () => {
					hash.end();
					next(serverHash === hash.read());
				});
				
				fd.pipe(hash); //here we actually getting file hash
			}
		});
	},
	/**
	 * Parse manifest file to get links array
	 * @param {string[]} manifestPaths
	 * @returns {string[]} array with links
	 */
	getUrls: function (manifestPaths) {
		let array = [];
		
		manifestPaths.forEach((manifest) => {
			let manifestArray = fs.readFileSync(manifest).toString().split('\n');
			array = array.concat(manifestArray);
		});
		// return fs.readFileSync(manifestPath).toString().split('\n');
		return array;
	},
	/**
	 * Replace all occurrences in string
	 * @param {string} string
	 * @param {string} search
	 * @param {string} replacement
	 * @returns {string} new string
	 */
	replaceAll: function (string, search, replacement) {
		return string.split(search).join(replacement);
	}
};

module.exports = clientDownloader;
