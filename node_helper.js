const FTPClient = require('ftp');
const Log = require('logger');
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
		Log.log('MMM-FTP-image module helper initialized.');
	},

	socketNotificationReceived: function (notification, payload) {
		switch (notification) {
			case 'FTP_IMG_CALL_LIST':
				this.imgNameList = [];

				if (payload.dirPathsAuthorized) {
					this.dirPathsAuthorized = payload.dirPathsAuthorized;
					this.connectFTPServer('list', payload);
				} else {
					Log.error('dirPathsAuthorized is not defined !');
				}
				break;
			case 'FTP_IMG_CALL_BASE64':
				this.imgBase64 = new Object();
				this.connectFTPServer('get', payload);
				break;
			case 'FTP_IMG_CALL_NEXT_DIR':
				this.dirIndex++;
				break;
		}
	},

	connectFTPServer: function (type, payload) {
		const ftp = new FTPClient();
		const self = this;

		ftp.on('ready', function () {
			switch (type) {
				case 'list':
					self.dirChangeAlgo(ftp, self, payload, type);
					self.sendListName(ftp, self);
					break;
				case 'get':
					self.dirChangeAlgo(ftp, self, payload, type);
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

	dirChangeAlgo: function (ftp, self, payload, type) {
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
			self.moveDir(ftp, path);
		}
	},

	moveDir: function (ftp, path) {
		ftp.cwd(path, function (err) {
			if (err) throw err;
		});
	},

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
							(!['.', '..'].includes(file.name) &&
								(!self.dirPathsAuthorized || self.dirPathsAuthorized.length === 0)) ||
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

	streamToBase64: function (stream, ftp) {
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

	getMimeType: function (filename) {
		for (var s in MimeTypesAuthorized) {
			if (filename.indexOf(s) === 0) {
				return MimeTypesAuthorized[s];
			}
		}
	},
});
