// ################################################################ \\
// # 						MMM-FTP-image					  	  # \\
// # 				FTP server image display module				  # \\
// ################################################################ \\

Module.register('MMM-FTP-image', {
	defaults: {
		// FTP server configuration
		port: 21,
		user: 'pi',
		password: null,
		host: 'localhost',

		// FTP directory configuration
		defaultDirPath: null, // Type: string | null => Default directory to retrieve images
		dirPathsAuthorized: ['tutu', 'toto'], // Type: Array<string> => List of authorized directories

		// Display configuration
		opacity: 1.0,
		width: '100%',
		height: '100%',
		imgChangeInterval: 10000, // Type: number (ms)
	},

	imgNameList: [], // Type: Array<{ mimeType: string; base64: string }>
	imgBase64: new Object(), // Type: { base64: string; mimeType: string }
	imageDisplayedNumber: 0,

	imageLoadFinished: false,
	finishAllImgInCurrentDirectory: false,

	intervalInstance: null,

	start: function () {
		this.logMessage('Started.');

		if (!this.config.password) {
			this.logMessage('The password is not entered !', 'error');
		}

		this.getListImgNameFromFTPServer();
	},

	/**
	 * Received image from websocket
	 * @param {string} notification - Route of websocket
	 * @param {Array<{ id: number; name: string }>} payload - Array of image name to display
	 */
	socketNotificationReceived: function (notification, payload) {
		switch (notification) {
			case 'FTP_IMG_LIST_NAME':
				this.logMessage('Images list received !');
				this.imgNameList = payload;

				if (!this.imageLoadFinished || this.finishAllImgInCurrentDirectory) {
					this.scheduleImgUpdateInterval();
					this.finishAllImgInCurrentDirectory = false;
				}
				break;

			case 'FTP_IMG_BASE64':
				this.logMessage('Images received !');
				this.imgBase64 = payload;
				this.incrementImageIndex();
				this.updateDom();
				break;
		}
	},

	/**
	 * Reload DOM
	 * @returns {HTMLDivElement} - Module HTML element
	 */
	getDom: function () {
		var wrapper = document.createElement('div');

		if (this.error !== null) {
			wrapper.innerHTML = this.translate(this.error);
		}

		if (!this.imageLoadFinished) {
			wrapper.innerHTML = this.translate('LOADING');
			return wrapper;
		}

		const image = this.imgBase64;

		if (!image) {
			this.logMessage(`Could not load image (index: ${this.imageDisplayedNumber})`);
			wrapper.innerHTML = this.translate('ERROR LOADING');
			return wrapper;
		}

		wrapper.appendChild(this.createImageElement(image));
		return wrapper;
	},

	/**
	 * Send notification of node_helper for get name list from FTP server
	 */
	getListImgNameFromFTPServer: function () {
		this.imageDisplayedNumber = 0;

		// Send FTP_IMG for get img from FTP server
		this.sendSocketNotification('FTP_IMG_CALL_LIST', {
			host: this.config.host,
			port: this.config.port,
			user: this.config.user,
			password: this.config.password,
			defaultDirPath: this.config.defaultDirPath,
			dirPathsAuthorized: this.config.dirPathsAuthorized,
			finishAllImgInCurrentDirectory: this.finishAllImgInCurrentDirectory,
		});
	},

	/**
	 * Create HTML image element
	 * @param {object} image - Image object
	 * @returns {HTMLImageElement} - Image HTML element
	 */
	createImageElement: function (image) {
		var element = document.createElement('img');
		element.src = `data:${image.mimeType};base64, ${image.base64}`;
		element.style.maxWidth = this.config.width;
		element.style.maxHeight = this.config.height;
		element.style.opacity = this.config.opacity;
		return element;
	},

	/**
	 * Loop to reload image based on user defined interval time
	 */
	scheduleImgUpdateInterval: function () {
		this.logMessage(`Scheduled update interval (${this.config.imgChangeInterval / 1000}s)...`);

		const payload = {
			host: this.config.host,
			port: this.config.port,
			user: this.config.user,
			password: this.config.password,
			defaultDirPath: this.config.defaultDirPath,
			dirPathsAuthorized: this.config.dirPathsAuthorized,
			finishAllImgInCurrentDirectory: this.finishAllImgInCurrentDirectory,
		};

		// Get first image
		this.sendSocketNotification('FTP_IMG_CALL_BASE64', {
			...payload,
			fileName: this.imgNameList[this.imageDisplayedNumber].name,
		});

		this.imageLoadFinished = true;
		this.finishAllImgInCurrentDirectory = false;

		// Set interval to reload image
		this.intervalInstance = setInterval(() => {
			this.sendSocketNotification('FTP_IMG_CALL_BASE64', {
				...payload,
				fileName: this.imgNameList[this.imageDisplayedNumber].name,
			});
		}, this.config.imgChangeInterval);
	},

	/**
	 * Increment image
	 * @returns {void}
	 */
	incrementImageIndex: function () {
		this.logMessage(`Current image index: ${this.imageDisplayedNumber}`);

		if (this.imageDisplayedNumber === this.imgNameList.length - 1) {
			clearInterval(this.intervalInstance);

			// Wait 10s before call next directory
			setTimeout(() => {
				this.imgNameList = [];
				this.finishAllImgInCurrentDirectory = true;
				this.sendSocketNotification('FTP_IMG_CALL_NEXT_DIR');
				this.getListImgNameFromFTPServer();
			}, this.config.imgChangeInterval);
			return;
		}

		this.imageDisplayedNumber++;
	},

	logMessage: function (message, type) {
		switch (type) {
			case 'erorr':
				Log.error(`Module ${this.name} | ${message}`);
				break;
			default:
				Log.info(`Module ${this.name} | ${message}`);
				break;
		}
	},
});
