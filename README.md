# MagicMirror2 Module: MMM-FTP-image

```sh

  __  __ __  __ __  __        ______ _______ _____        _
 |  \/  |  \/  |  \/  |      |  ____|__   __|  __ \      (_)
 | \  / | \  / | \  / |______| |__     | |  | |__) |_____ _ _ __ ___   __ _  __ _  ___
 | |\/| | |\/| | |\/| |______|  __|    | |  |  ___/______| | '_ ` _ \ / _` |/ _` |/ _ \
 | |  | | |  | | |  | |      | |       | |  | |          | | | | | | | (_| | (_| |  __/
 |_|  |_|_|  |_|_|  |_|      |_|       |_|  |_|          |_|_| |_| |_|\__,_|\__, |\___|
                                                                             __/ |
                                                                            |___/
```

## Description

A [MagicMirror](https://magicmirror.builders/) Module to display images from an FTP server on the Mirror.

Image authorized : GIF, PNG, JPG, JPEG, BMP, WEBP, ICO, DIB

## Features

-   [x] Display images from FTP server with interval
-   [x] Possibility to set directory to retrieve images
-   [x] Possibility to set authorized directories
-   [ ] Interaction for next or previous image from an event / notification from another MagicMirror2 module

## Screenshots

Displaying images from FTP server

![Module example](examples/example.gif)

## Installation

Open your terminal in your MagicMirror project and ⤵️

1. Go to your MagicMirror's **module folder**:

```sh
$ cd ~/MagicMirror/modules
```

2. Clone this module

```sh
$ git clone https://github.com/jboucly/MMM-FTP-image.git
```

3. Go to directory of this module

```sh
$ cd MMM-FTP-image
```

4. Install dependencies

```sh
$ npm ci
```

5. Configure the module in the `config.js` file.

## Configurations

To use this module, add it to the modules array in the `config/config.js` file:

```javascript
modules: [
    {
        module: 'MMM-FTP-image',
        position: 'middle_center',
        config: {
            // FTP server configuration
            port: 5555,
            user: 'pi',
            host: '192.168.1.16',
            password: '1234567890',

            // Display configuration
            opacity: 1.0,
            width: '50%',
            height: '100%',
            imgChangeInterval: 5000,

            // FTP directory configuration
            defaultDirPath: null,
            dirPathsAuthorized: ['pictures'],
        },
    },
];
```

## Configuration options

The following properties can be configured:

<table class="tg">
<thead>
  <tr>
    <th class="tg-fymr">Options</th>
    <th class="tg-7btt">Required</th>
    <th class="tg-7btt">Default</th>
    <th class="tg-fymr">Description</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td class="tg-baqh" colspan="4"><span style="font-weight:bold">FTP server configuration</span></td>
  </tr>
  <tr>
    <td class="tg-0pky">host</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">localhost</td>
    <td class="tg-0pky">Host of your FTP server. Required if the ftp hostname is <span style="font-weight:bold">not</span> 'localhost'</td>
  </tr>
  <tr>
    <td class="tg-0pky">port</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">21</td>
    <td class="tg-0pky">Port of your FTP server. Required if the ftp port is <span style="font-weight:bold">not</span> '21'</td>
  </tr>
  <tr>
    <td class="tg-0pky">user</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">pi</td>
    <td class="tg-0pky">Name of user for connect to FTP server. Required if the ftp user is <span style="font-weight:bold">not</span> 'pi'</td>
  </tr>
  <tr>
    <td class="tg-0pky">password</td>
    <td class="tg-c3ow">true</td>
    <td class="tg-c3ow">null</td>
    <td class="tg-0pky">Password for connect to FTP server.</td>
  </tr>
  <tr>
    <td class="tg-c3ow" colspan="4"><span style="font-weight:bold">Display configuration</span></td>
  </tr>
  <tr>
    <td class="tg-0pky">opacity</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">1.0</td>
    <td class="tg-0pky">Image opacity style</td>
  </tr>
  <tr>
    <td class="tg-0pky">width</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">100%</td>
    <td class="tg-0pky">Image width</td>
  </tr>
  <tr>
    <td class="tg-0pky">height</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">100%</td>
    <td class="tg-0pky">Image height</td>
  </tr>
  <tr>
    <td class="tg-0lax">imgChangeInterval</td>
    <td class="tg-baqh">false</td>
    <td class="tg-baqh">10s</td>
    <td class="tg-0lax">Image change interval</td>
  </tr>
  <tr>
    <td class="tg-c3ow" colspan="4"><span style="font-weight:bold">FTP directory configuration</span></td>
  </tr>
  <tr>
    <td class="tg-0pky">defaultDirPath</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">null</td>
    <td class="tg-0pky">Default directory to retrieve images. By default, this module retrieve images in current directory of FTP server</td>
  </tr>
  <tr>
    <td class="tg-0pky">dirPathsAuthorized</td>
    <td class="tg-c3ow">false</td>
    <td class="tg-c3ow">[]</td>
    <td class="tg-0pky">List of authorized directories</td>
  </tr>
</tbody>
</table>
