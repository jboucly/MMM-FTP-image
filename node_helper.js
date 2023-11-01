const FTPClient = require('ftp');
var NodeHelper = require('node_helper');
const ConcatStream = require('concat-stream');
const { Base64Encode } = require('base64-stream');
const { ExtensionAuthorized, MimeTypesAuthorized } = require('./src/constants/img-authorized');

module.exports = NodeHelper.create({
	dirIndex: 0,
	dirPathVisited: [], // Array<string>
	dirNameList: [], // Array<{ id: number; name: string }>

	imgNameList: [], // Array<{ id: number; name: string }>
	imgBase64: new Object(), // { base64: string; mimeType: string }

	init: function () {
		console.log('MMM-FTP-image module helper initialized.');
	},

	/**
	 * Subscribe to websocket events
	 * @param {string} notification - Route name of websocket
	 * @param {object} payload - Configuration for FTP server with another information
	 */
	socketNotificationReceived: function (notification, payload) {
		var self = this;

		switch (notification) {
			case 'FTP_IMG_CALL_LIST':
				self.imgNameList = [];
				self.dirPathsAuthorized = payload.dirPathsAuthorized;

				self.connectFTPServer(self, 'list', payload);
				break;
			case 'FTP_IMG_CALL_BASE64':
				self.imgBase64 = new Object();
				self.connectFTPServer(self, 'get', payload);
				break;
			case 'FTP_IMG_CALL_NEXT_DIR':
				self.dirIndex++;
				break;
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
			switch (type) {
				case 'list':
					self.moveDir(ftp, self, payload, type);
					self.sendListName(ftp, self);
					break;
				case 'get':
					self.moveDir(ftp, self, payload, type);
					self.sendBase64Img(ftp, self, payload);
					break;
				default:
					throw new Error(`This type is not implemented => ${type}`);
			}
		});

		ftp.connect({
			...payload,
		});
	},

	moveDir: function (ftp, self, payload, type) {
		let path = null;

		if (self.dirIndex !== 0) {
			path = payload.defaultDirPath
				? `${payload.defaultDirPath}/${self.dirNameList[self.dirIndex - 1].name}`
				: self.dirNameList[self.dirIndex - 1].name;

			if (type === 'list') {
				self.dirPathVisited.push(self.dirNameList[self.dirIndex - 1].name);
			}

			if (
				self.dirPathVisited.length === self.dirNameList.length &&
				type === 'get' &&
				payload.finishAllImgInCurrentDirectory
			) {
				self.dirIndex = -1;
				self.dirPathVisited = [];
			}
		} else if (payload.defaultDirPath && !payload.finishAllImgInCurrentDirectory) {
			path = payload.defaultDirPath;
		}

		if (
			type === 'list' &&
			self.dirIndex === 1 &&
			payload.defaultDirPath &&
			payload.finishAllImgInCurrentDirectory
		) {
			self.dirPathVisited.push(payload.defaultDirPath);
		}

		if (path) {
			ftp.cwd(path, function (err) {
				if (err) throw err;
			});
		}
	},

	/**
	 * Get list of image name and send this list
	 * @param {FTPClient} ftp - FTP client
	 * @param self
	 */
	sendListName: function (ftp, self) {
		ftp.list(async function (err, list) {
			if (err) throw err;

			for (let i = 0; i < list.length; i++) {
				const file = list[i];

				switch (file.type) {
					case '-': // File type
						if (file.name.match(new RegExp(`.(${ExtensionAuthorized}?)$`, 'gm'))) {
							self.imgNameList.push({
								name: file.name,
								id: self.imgNameList.length + 1,
							});
						}
						break;

					case 'd': // Directory type
						if (
							(!['.', '..'].includes(file.name) && !self.dirPathsAuthorized) ||
							(!['.', '..'].includes(file.name) &&
								self.dirPathsAuthorized &&
								self.dirPathsAuthorized.includes(file.name))
						) {
							self.dirNameList.push({
								name: file.name,
								id: self.dirNameList.length + 1,
							});
						}
						break;
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

				self.streamToBase64(stream, ftp)
					.then(function (res) {
						self.imgBase64 = {
							base64: res,
							mimeType: self.getMimeType(payload.fileName),
						};
						resolve();
					})
					.catch(function (err) {
						throw new Error(err);
					});
			});
		});

		self.sendSocketNotification('FTP_IMG_BASE64', self.imgBase64);
	},

	/**
	 * Convert a Readable Stream to base64 string
	 * @param {ReadableStream} stream - a readable stream to convert in base64 string
	 * @returns {Promise} - Promise that resolve in a string containing the base64
	 */
	streamToBase64: function (stream) {
		return new Promise((resolve, reject) => {
			const base64 = new Base64Encode();

			const cbConcat = base64 => {
				resolve(base64);
			};

			stream
				.pipe(base64)
				.pipe(ConcatStream(cbConcat))
				.once('close', function () {
					ftp.end();
				})
				.on('error', error => {
					reject(error);
				});
		});
	},

	/**
	 * Get mimeType of file
	 * @param {String} filename - File name
	 * @returns {String} - MimeType of file
	 */
	getMimeType: function (filename) {
		for (var s in MimeTypesAuthorized) {
			if (filename.indexOf(s) === 0) {
				return signatures[s];
			}
		}
	},
});
