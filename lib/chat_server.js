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
