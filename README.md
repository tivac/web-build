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
* Will generate an appcache file of all JS/CSS/Image/SWF/Font files
* Cleans up @VERSION@ in YUI modules
* Removes JS Logging
* ... and maybe something else I forgot?

In order to successfully use this you will need:

* Ant 1.8
* Java JDK
* jars for the following libraries in the jars folder
  * [Jakarta BSF](https://jakarta.apache.org/bsf/)
  * [Mozilla Rhino](https://www.mozilla.org/rhino/)
  * [Apache Commons Logging](https://commons.apache.org/logging/)
  * [CSSEmbed](https://github.com/nzakas/cssembed)
  * [YUI Compressor](https://github.com/yui/yuicompressor)

The FileTransform task is derived from code posted by [Julien Lecomte](http://www.julienlecomte.net/blog/2007/09/16/)