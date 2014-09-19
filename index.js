// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {

    /* Print the IP address and port*/
        console.log(socket.conn.remoteAddress +' '+ socket.handshake.headers.referer);
    /*creating the room and adding the users to it*/

        var RoomName = socket.conn.remoteAddress;
        socket.room = RoomName;
        socket.join(RoomName);


    var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {

      //--display the ip and the port number
     data = "IP:" + socket.conn.remoteAddress+" "+data;
      console.log(socket.conn.remoteAddress +' '+ socket.handshake.headers.referer);

    // we tell the client to execute 'new message'
   /* socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    }); */
      /*sending data to only the members in that room*/
       socket.in(socket.room).broadcast.emit('new message', {
       username: socket.username,
       message: data
       });

  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.in(socket.room).broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.in(socket.room).broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.in(socket.room).broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {

        socket.leave(socket.room);
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.in(socket.room).broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
