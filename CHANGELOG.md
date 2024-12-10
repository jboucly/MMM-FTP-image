# MMM-Hue-Controller-2

## 1.0.0

### Description

-   Connect to a FTP server.
-   Get a list of images from FTP server from direction path given by config file.

## 1.0.1

### Description

Fix JS memory leak and overflows.

## 1.0.2

### Description

-   Add constant to list all extension accepted
-   Update logic to set extension accepted

## 1.0.3

### Description

-   Modified logic to add the ability to read the FTP server folder tree
-   Added a setting allowing certain folders to be read

### Issues

[Allow multiple directories](https://github.com/jboucly/MMM-FTP-image/issues/4#issue-1500663876)

## 1.0.4

### Description

-   Implement `RESET` event to reset the module when the package `ftp` return an error.

### Issues

[Exception when reaching last image, and trying to load the next](https://github.com/jboucly/MMM-FTP-image/issues/8)
