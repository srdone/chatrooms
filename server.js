var http = require('http');
var fs = require('fs');
// provies file system path-related functionality
var path = require('path');
// allows deriving MIME type from filename extension
var mime = require('mime');

// where the contents of cached files are stored:
var cache = {};

//helper function to notify that file does not exist
function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

function sendFile(response, filePath, fileContents) {
  // path.basename(filePath) takes the path and returns the name of the file
  response.writeHead(
    200,
    {"content-type": mime.lookup(path.basename(filePath))}
  );
  // call the end event on response?
  response.end(fileContents);
}

// serve static files and store them in cache after accessed the first time
function serveStatic(response, cache, absPath) {
  // if the file exists in the cache, send that file
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      // callback function once fs.exists executes
      if(exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            // cache the file
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}
