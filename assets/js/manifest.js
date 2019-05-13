const downloadManager = require('electron-download-manager');
const path = require('path');
const defaultGamePath = path.resolve('/Games/Audition 2 Revival');

let manifest = {
	download: function (urls, next) {
		downloadManager.bulkDownload({
			urls: urls,
			path: 'manifests',
			onResult: function (finishedCount, errorsCount, itemUrl) {
			
			}
		}, (error, finished, errors) => {
			if (error) {
				console.log('finished: ' + finished);
				console.log('errors: ' + errors);
			}
			
			next();
		});
	},
};

module.exports = manifest;