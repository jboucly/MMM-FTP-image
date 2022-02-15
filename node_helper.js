var NodeHelper = require('node_helper');
const FTPClient = require('ftp');
const path = require('path');
const fs = require('fs');

module.exports = NodeHelper.create({

	init: function () {
		console.log('MMM-Random-FTP-image module helper initialized.');
	},

	images: [],
	imgAuthorized: 'png|jpg|jpeg|gif',

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === 'FTP_IMG') {
			const ftp = new FTPClient();

			ftp.on('ready', function () {
				ftp.cwd(payload.dirPath, function (err) {
					if (err) throw err
				});

				ftp.list(async function (err, list) {
					if (err) throw err;

					for (let i = 0; i < list.length; i++) {
						const file = list[i];

						// If file is a type of File and extension match with imgAuthorized
						if (file.type === '-' && file.name.match(new RegExp(`.(${self.imgAuthorized}?)$`, 'gm'))) {
							await new Promise((resolve, reject) => {
								ftp.get(file.name, function (err, stream) {
									if (err) reject(err);
									self.images.push({
										id: i,
										value: stream,
									});

									resolve();
								});
							});
						}
					}

					ftp.end();
					self.sendImages(self, self.images);
				});
			});

			ftp.connect({
				...payload
			});
		}
	},

	sendImages: function (self) {
		console.log(images);
	},
});
