// ################################################################ \\
// # 						MMM-FTP-image					  	  # \\
// # 				FTP server image display module				  # \\
// ################################################################ \\

Module.register("MMM-FTP-image", {
	defaults: {
		port: 21,
		user: 'pi',
		password: null,
		host: 'localhost',

		opacity: 1.0,
		width: '100%',
		height: '100%',
		dirPath: 'images',
		imgChangeInterval: 10000,
		imageLoadInitialDelay: 1000,
	},

	images: [], // Type: Array<{ mimeType: string; base64: string }>
	imageIndexDisplayed: 0,
	imageDiplayedNumber: 0,
	imageLoadFinished: false,

	start: function () {
		this.logMessage('Started.');

		if (!this.config.password) {
			this.logMessage('The password is not entered !', 'error');
		}

		setTimeout(() => this.loadImagesFromFTPServer(), this.config.imageLoadInitialDelay);
	},

	/**
	 * Send notification of node_helper for get image from FTP server
	 */
	loadImagesFromFTPServer: function () {
		// Send FTP_IMG for get img from FTP server
		this.sendSocketNotification("FTP_IMG", {
			host: this.config.host,
			port: this.config.port,
			user: this.config.user,
			dirPath: this.config.dirPath,
			password: this.config.password,
		});
	},

	/**
	 * Reload DOM
	 * @returns {HTMLDivElement} - Module HTML element
	 */
	getDom: function () {
		var wrapper = document.createElement("div");

		if (this.error != null) {
			wrapper.innerHTML = this.translate(this.error);
		}

		if (!this.imageLoadFinished) {
			wrapper.innerHTML = this.translate("LOADING");
			return wrapper;
		}

		const image = this.images[this.imageIndexDisplayed];

		if (!image) {
			this.logMessage(`Could not load image (index: ${this.imageIndexDisplayed})`)
			wrapper.innerHTML = this.translate("ERROR LOADING");
			return wrapper;
		}

		wrapper.appendChild(this.createImageElement(image));
		return wrapper;
	},

	/**
	 * Create HTML image element
	 * @param {Object} image
	 * @returns {HTMLImageElement} - Image HTML element
	 */
	createImageElement: function (image) {
		var element = document.createElement("img");
		element.src = `data:${image.mimeType};base64, ${image.base64}`;
		element.style.maxWidth = this.config.width;
		element.style.maxHeight = this.config.height;
		element.style.opacity = this.config.opacity;
		return element;
	},

	/**
	 * Received image from websocket
	 * @param {String} notification - Route of websocket
	 * @param {Array<{ mimeType: string; base64: string }>} payload - Array of images to display
	 */
	socketNotificationReceived: function (notification, payload) {
		if (notification === "FTP_IMG_LIST") {
			this.logMessage('Images received !');
			this.images = payload;

			if (!this.imageLoadFinished) {
				this.scheduleImgUpdateInterval();
			}

			this.imageLoadFinished = true;
		}
	},

	/**
	 * Loop to reload image based on user defined interval time
	 */
	scheduleImgUpdateInterval: function () {
		this.logMessage(`Scheduled update interval (${this.config.imgChangeInterval/1000}s)...`)

		setInterval(() => {
			this.incrementImageIndex();
			this.updateDom();
		}, this.config.imgChangeInterval);
	},

	/**
	 * Increment image
	 * @returns {void}
	 */
	incrementImageIndex: function () {
		this.imageIndexDisplayed = this.imageDiplayedNumber;

		this.logMessage(`Current image index: ${this.imageIndexDisplayed}`)

		if (this.imageDiplayedNumber === this.images.length - 1) {
			this.imageDiplayedNumber = 0;
			this.loadImagesFromFTPServer();
			return;
		}

		this.imageDiplayedNumber++;
	},

	/**
	 * Function to log message
	 * @param {String} message
	 * @param {String} type
	 */
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
