var http = require("http"),
    server,
    io = require('socket.io'),


server = http.createServer(function(req, res) {
}).listen(9999);

io = io.listen(server, {
  log:false
});


io.sockets.on('connection', function(socket) {
  var redis_client = require("redis").createClient("10009", "crestfish.redistogo.com");
  redis_client.auth("2fe0882bcea756dec5affd1bc80564ab");
  redis_client.subscribe('new_reply_topic');
  console.log("connected");

  // setup the topic reply notification
  redis_client.on("message", function(channel, message) {
    console.log("from rails to node:"+channel+message);
    socket.emit('new_reply_topic', message);
  })

  //listen the incoming user 
  socket.on('message', function(message){
    // notify all online users that the user just connecte 
    console.log(message);
    //socket.broadcast.emit('new_user_connected', message);
    
    // record socket  
    var user_id = JSON.parse(message)['new_user_id'];
    var user_name = JSON.parse(message)['new_user_name'];
    var new_user = {
      "user_id":user_id,
      "user_name":user_name
    }
    socket.set('user', new_user);
    console.log('current users are \n');
    var user_list = getExistingUserList();
    io.sockets.emit('new_user_connected', user_list);
  }) 

  socket.on('disconnect', function () {
    console.log("user disconnected");
    redis_client.unsubscribe('new_reply_topic');
    redis_client.quit();
    console.log("hh " + socket.id);
    delete io.sockets.sockets[socket.id];
    var user_list = getExistingUserList();
    io.sockets.emit('new_user_connected', user_list);
  });

  function getExistingUserList() {
    var user_list = [];
    console.log('current users are \n');
    for (var socket_id in io.sockets.sockets) {
      io.sockets.sockets[socket_id].get('user', function(err, u){
        console.log(u);
        user_list.push(u);
      });
    }
    return user_list;
  }

});
