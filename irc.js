var irc = require('slate-irc');
var net = require('net');

module.exports = (e) => {
  e.host = e.host || '174.143.119.91';
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

  e.onend = e.onend || (() => {throw Error('irc connection ended')});
  client.stream.on('end', e.onend);
  client.stream.on('error', e.onend);

  client.config = e;
  return client;
};