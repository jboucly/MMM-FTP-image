const FTPClient = require('ftp');
var NodeHelper = require('node_helper');
const ConcatStream = require('concat-stream')
const {
	Base64Encode
} = require('base64-stream')

module.exports = NodeHelper.create({
	imgNameList: [], // Array<{ id: number; name: string }>
	imgBase64: new Object(), // { base64: string; mimeType: string }
	imgAuthorized: 'png|PNG|jpg|JPG|jpeg|JPEG|gif|GIF|bmp|BMP|webp|WEBP|ico|ICO|dib|DIB',

	init: function () {
		console.log('MMM-FTP-image module helper initialized.');
	},

	/**
	 * Subscribe to websocket events
	 * @param {String} notification - Route name of websocket
	 * @param {Object} payload - Configuration for FTP server with another informations
	 */
	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === 'FTP_IMG_CALL_LIST') {
			self.imgNameList = [];
			self.connectFTPServer(self, 'list', payload);
		} else if (notification === 'FTP_IMG_CALL_BASE64') {
			self.imgBase64 = new Object();
			self.connectFTPServer(self, 'get', payload);
		}
	},

	/**
	 * Connect to FTP server
	 * @param {*} self
	 * @param {Strig} type - Type of connection
	 * @param {Object} payload - Payload from websocket
	 */
	connectFTPServer: function (self, type, payload) {
		const ftp = new FTPClient();

		ftp.on('ready', function () {
			ftp.cwd(payload.dirPath, function (err) {
				if (err) throw err
			});

			switch (type) {
				case 'list':
					self.sendListName(ftp, self);
					break;
				case 'get':
					self.sendBase64Img(ftp, self, payload);
					break;
				default:
					throw new Error(`This type is not implemented => ${type}`);
			}
		});

		ftp.connect({
			...payload
		});
	},

	/**
	 * Get list of image name and send this list
	 * @param {FTPClient} ftp - FTP client
	 * @param {*} self
	 */
	sendListName: function (ftp, self) {
		ftp.list(async function (err, list) {
			if (err) throw err;

			for (let i = 0; i < list.length; i++) {
				const file = list[i];

				// If file is a type of File and extension match with imgAuthorized
				if (file.type === '-' && file.name.match(new RegExp(`.(${self.imgAuthorized}?)$`, 'gm'))) {
					self.imgNameList.push({
						id: i,
						name: file.name,
					});
				}
			}

			ftp.end();
			self.sendSocketNotification('FTP_IMG_LIST_NAME', self.imgNameList);
		});
	},

	/**
	 *
	 * @param {FTPClient} ftp - FTP client
	 * @param {*} self
	 * @param {Object} payload - Payload from websocket
	 */
	sendBase64Img: async function (ftp, self, payload) {
		await new Promise((resolve, reject) => {
			ftp.get(payload.fileName, function (err, stream) {
				if (err) reject(err);

				self.streamToBase64(stream).then(function (res) {
					self.imgBase64 = {
						base64: res,
						mimeType: self.getMimeType(res),
					};
					resolve();
				}).catch(function (err) {
					throw new Error(err);
				});
			})
		});

		ftp.end();
		self.sendSocketNotification('FTP_IMG_BASE64', self.imgBase64)
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
