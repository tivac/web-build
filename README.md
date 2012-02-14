Web Build: An Ant-based website optimization system
===================================================

Does the following things in some order:

* Compresses JS
* Compresses CSS
* Inlines \<script\> tags under a specific size
* Renames JS/CSS/Images/SWFs/Fonts to append a hash of their contents for easier CDN versioning
* Embeds images as DataURIs into CSS
* Optionally creates a MTHML file for IE
* Prefixes relative urls with an absolute value for using a CDN
* Supports ifdef-style code enabling for dev vs live
* Cleans up @VERSION@ in YUI modules
* Removes JS Logging
* Generates PNG8 images
* Optimizes PNGs and JPGs
* ... and maybe something else I forgot?

In order to successfully use this you will need:

* Ant 1.8
* Java JDK

Also provides a very small JS macro/lib to streamline using files/properties in JS build files

The FileTransform task is derived from code posted by [Julien Lecomte](http://www.julienlecomte.net/blog/2007/09/16/)
