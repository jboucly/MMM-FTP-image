/* Magic Mirror
 * Module: MMM-Random-FTP-image
 */
Module.register("MMM-Random-FTP-image", {
	// Default module config.
	defaults: {
		port: 21,
		user: 'pi',
		password: null,
		host: 'localhost',

		dirPath: 'photos',
		photoLoadInitialDelay: 1000,
	},

	// Override dom generator.
	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.innerHTML = this.config.text;
		return wrapper;
	},

	start: function () {
		this.logMessage('started.');

		if (!this.config.password) {
			this.logMessage('The password is not entered !', 'error');
		}

		// Load images after some delay
		setTimeout(() => this.loadImagesFromFTPServer(), this.config.photoLoadInitialDelay);
	},

	loadImagesFromFTPServer: function () {
		this.sendSocketNotification("FTP_IMG", {
			host: this.config.host,
			port: this.config.port,
			user: this.config.user,
			dirPath: this.config.dirPath,
			password: this.config.password,
		});
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
	}
});
