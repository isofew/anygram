var code = ':P';

var send = (socket, port) => {
  port = port || socket.rinfo.port;
  if (port < 1 || port > 65535) return;
  socket.send(code, port, socket.rinfo.address);
};

module.exports = (socket) => new Promise((res, rej) => {
  console.log('start punching');
  console.log(socket.linfo);
  console.log(socket.rinfo);

  if (socket.linfo.type === 'Symmetric' && socket.rinfo.type === 'Symmetric') {
    rej('cowardly refuse to punch against two symmetric NATs');
    return ;
  }
  socket.on('message', function onmsg (msg, rinfo) {
    if (msg.toString() === code) {
      socket.rinfo.pong = true;
      socket.rinfo.port = rinfo.port;
      send(socket, rinfo.port);
      socket.removeListener('message', onmsg);
      res(socket);
    }
  });
  for (var i = 0; i < 3; ++i)
    send(socket);

  setTimeout(() => {
    if (socket.rinfo.pong) return ;

    for (var epoch = 0; epoch < 3; ++epoch) {
      for (var i = 0; i <= 300; ++i) {
        setTimeout(((i) => () => {
          if (socket.rinfo.pong) return ;
          if (socket.linfo.type === 'Symmetric') {
            send(socket);
          } else {
            send(socket, socket.rinfo.port + i);
            send(socket, socket.rinfo.port - i);
          }
        })(i), 3 * i + 1000 * epoch);
      }
    }
    setTimeout(() => rej('UDP hole punching failed'), 3000);
  }, 1000);
});
