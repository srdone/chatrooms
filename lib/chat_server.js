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
    guestNumber = assignGuestName(socket, guestNumer, nickNames, namesUsed);
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
