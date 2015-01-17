var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

//export the listen function from the module
exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level', 1);

  //handling for each user connection
  io.sockets.on('connection', function(socket) {
    // assign a guest name
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    // default room on connect
    joinRoom(socket, 'Lobby');
    // handle user messages, name change attempts, room creation/changes
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    // provide user with list of occupied rooms on request
    socket.on('rooms', function() {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    //cleanup on disconnect
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};


function assingGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name; // associate guest name with client id
  // let the user know their guest name
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name); //keep track of names used
  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room); //make user join room(?)
  currentRoom[socket.id]; //note which room the user is in
  socket.emit('joinResult', {room: room}); //emit the joinResult event
  // let other users know user has joined room
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });
  // determine what other users are present in the room
  var usersInRoom = io.sockets.clients(room);
  // if other users exist, summarize who they are
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) { // why don't we use !== here? change?
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
  }
}

// handle user name changes
// don't allow names beginning with Guest or that are in use
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) { // add listener for nameAttempt events
    if (name.indexOf('Guest') == 0) { //again, we should change this to ===
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) { // and again... ===
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name; // update the nickNames object key with new name value
        delete namesUsed[previousNameIndex]; // allow others to use old name
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        // send error that name is in use
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use'
        });
      }
    }
  });
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function(message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text //username with message
    });
  });
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]); //leave is built into socket.io
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}
