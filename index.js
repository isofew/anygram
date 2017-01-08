var punch = require('./punch');
var stun = require('./stun');

module.exports = (config) => {

  config.stunServer = config.stunServer || 'stun.ucsb.edu';
  config.timeLag = config.timeLag || 10000;

  var exports = {
    punch: punch,
    stun: stun,
    irc: require('./irc')
  };

  exports.connect = (irc, to, rinfo) => new Promise((res, rej) =>
  stun(config.stunServer).then(socket => {
    var onrinfo = (rinfo) => {
      socket.rinfo = rinfo;
      setTimeout(
        () => punch(socket).then(res).catch(rej),
        rinfo.punchTime - Date.now()
      );
    };
    var onmsg = (e) => {
      if (e.from === to) {
        irc.removeListener('message', onmsg);
        onrinfo(JSON.parse(e.message));
      }
    };
    if (rinfo) {
      socket.linfo.punchTime = rinfo.punchTime = Date.now() + config.timeLag;
      onrinfo(rinfo);
    } else {
      irc.on('message', onmsg);
    }
    irc.send(to, JSON.stringify(socket.linfo));
  }).catch(rej));

  exports.createServer = (irc, onconn, onerr) => {
    onerr = onerr || console.error;
    irc.on('message', e => {
      try {
        var rinfo = JSON.parse(e.message);
        exports.connect(irc, e.from, rinfo).then(onconn).catch(onerr);
      } catch (e) {}
    });
  };

  exports.send = (socket, msg, lport, rport) => {
    var buf = new Buffer(4);
    buf.writeUInt16BE(lport, 0);
    buf.writeUInt16BE(rport, 2);
    socket.send(Buffer.concat([buf, msg]), socket.rinfo.port, socket.rinfo.address);
  };

  exports.onrecv = (socket, cb) => {
    socket.on('message', (msg) => {
      if (msg.length <= 4) return ;
      var lport = msg.readUInt16BE(2);
      var rport = msg.readUInt16BE(0);
      cb(msg.slice(4), lport, rport);
    });
  };

  return exports;
};
