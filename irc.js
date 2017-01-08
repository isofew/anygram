var irc = require('slate-irc');
var net = require('net');

module.exports = (e) => {
  e.host = e.host || 'irc.freenode.net';
  e.port = e.port || 6667;
  e.pass = e.pass || '*';

  var client = irc(net.connect(e));
  client.pass(e.pass);
  client.nick(e.name);
  client.user(e.name, e.name);

  client.on('data', (msg) => {
    if ('PING' == msg.command)
      client.write('PONG :' + msg.trailing);
  });
  client.timer = setInterval(() => {
    client.stream.write('PING :KeepAlive\n');
  }, e.keepalive || 15000);

  client.stream.on('end', () => client.emit('error', 'IRC connection ended'));
  client.stream.on('error', (err) => client.emit('error', err));

  client.config = e;
  return client;
};
