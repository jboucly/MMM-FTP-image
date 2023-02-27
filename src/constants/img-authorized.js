const extensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'dib'];

module.exports = extensions.map(e => e.toUpperCase()).join('|').concat(`|${extensions.join('|')}`);
