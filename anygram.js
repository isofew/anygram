#! /usr/bin/env node

var cmd = require('commander');

cmd
  .version(require('./package').version)
  .option('--host <value>', 'IRC Host (default: irc.freenode.net)')
  .option('--port <value>', 'IRC Port (default: 6667)')
  .option('-n, --name <value>', 'IRC Nickname')
  .option('--pass <value>', 'IRC Password (if any)')
  .option('--keepalive <n>', 'IRC KeepAlive interval in ms (default: 15000)')
  .option('--stunServer <value>', 'default: stun.ucsb.edu')
  .option('--timeLag <n>', 'max IRC time lag in ms (default: 10000, server only)')
  .option('-m, --mode <value>', 'client or server')
  .option('-s, --server <value>', 'nickname of server (client only)')
  .option('-p, --clientPort <n>', 'the port client listening on (client only)')
  .option('-P, --serverPort <n>', 'the port server forwarding to')
  .option('--postup <value>', 'postup script')
  .parse(process.argv);

if (!cmd.name || !cmd.mode || !cmd.serverPort)
  cmd.help();

var cp = require('child_process');
var onexit = require('exit-hook');
var run = (script) => {
  if (!script) return;
  script = cp.exec(script);
  onexit(() => {
    script.kill();
  });
};

var irc = require('./irc')(cmd);
irc.on('error', e=>{throw Error(e)});

var anygram = require('.')(cmd);
var dgram = require('dgram');

if (cmd.mode === 'client') {
  if (!cmd.server || !cmd.clientPort) cmd.help();
  anygram.connect(irc, cmd.server).then(socket => {

    console.log('connected');
    irc.removeAllListeners('error');
    irc.on('error', (e) => {});
    irc.quit('thank you!');

    var server = dgram.createSocket('udp4');
    server.bind(cmd.clientPort, '127.0.0.1');

    server.on('message', (msg, l) => anygram.send(socket, msg, l.port, cmd.serverPort));
    anygram.onrecv(socket, (msg, lport) => server.send(msg, lport, '127.0.0.1'));

    run(cmd.postup);

  }).catch(e=>{throw Error(e)});
}
else if (cmd.mode === 'server') {
  anygram.createServer(irc, (socket) => {

    var pool = {};
    anygram.onrecv(socket, (msg, lport, rport) => {
      if (!pool[rport]) {
        pool[rport] = dgram.createSocket('udp4');
        pool[rport].on('message', (msg) => anygram.send(socket, msg, cmd.serverPort, rport));
      }
      pool[rport].send(msg, cmd.serverPort, '127.0.0.1');
    });

  });

  run(cmd.postup);
}
else {
  cmd.help();
}
