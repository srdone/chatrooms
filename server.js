var http = require('http');
var fs = require('fs');
// provies file system path-related functionality
var path = require('path');
// allows deriving MIME type from filename extension
var mime = require('mime');

// where the contents of cached files are stored:
var cache = {};
