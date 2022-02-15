const FTPClient = require('ftp');
var NodeHelper = require('node_helper');
const ConcatStream = require('concat-stream')
const {
	Base64Encode
} = require('base64-stream')

module.exports = NodeHelper.create({
	images: [],
	imgAuthorized: 'png|jpg|jpeg|gif',

	init: function () {
		console.log('MMM-FTP-image module helper initialized.');
	},

	/**
	 * Subscribe to websocket events
	 * @param {String} notification - Route name of websocket
	 * @param {Object} payload - Configuration for FTP server
	 */
	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === 'FTP_IMG') {
			self.images = [];
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

									self.streamToBase64(stream).then(function (res) {
										self.images.push({
											mimeType: self.getMimeType(res),
											base64: res,
										});
										resolve();
									}).catch(function (err) {
										console.error(err);
									});
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

	/**
	 * Send images object with websocket route
	 * @param {*} self
	 */
	sendImages: function (self) {
		self.sendSocketNotification('FTP_IMG_LIST', self.images);
	},

	/**
	 * Convert a Readable Stream to base64 string
	 * @param {ReadableStream} stream - a readable stream to convert in base64 string
	 * @returns {Promise} - Promise that resolve in a string containing the base64
	 */
	streamToBase64: function (stream) {
		return new Promise((resolve, reject) => {
			const base64 = new Base64Encode()

			const cbConcat = (base64) => {
				resolve(base64)
			}

			stream
				.pipe(base64)
				.pipe(ConcatStream(cbConcat))
				.on('error', (error) => {
					reject(error)
				})
		})
	},

	/**
	 * Get mimeType of file
	 * @param {String} base64 - Base64 file
	 * @returns {String} - MimeType of file
	 */
	getMimeType: function (base64) {
		const signatures = {
			R0lGODdh: "image/gif",
			R0lGODlh: "image/gif",
			iVBORw0KGgo: "image/png",
			"/9j/": "image/jpg"
		};

		for (var s in signatures) {
			if (base64.indexOf(s) === 0) {
				return signatures[s];
			}
		}
	}
});
