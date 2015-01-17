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

// create the actual server
var server = http.createServer(function(request, response) {
  var filePath = false;

  if(request.url == '/') {
    //give a default response (!routing!)
    filePath = 'public/index.html';
  } else {
    //translate other paths
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  // we give the constructed file path to absPath so that other methods can use it
  serveStatic(response, cache, absPath);
});

server.listen(3000, function() {
  //callback function to let us know when the server has started listening
  console.log("Server listening on port 3000.");
});
