var stun = require('node-stun');

module.exports = (stunServer) => new Promise((res, rej) => {
  var client = stun.createClient();
  client.setServerAddr(stunServer);
  client.start(e => {
    if (e) rej(e);

    var linfo = client.getMappedAddr();
    linfo.type = client.isNatted() ? client.getNatType() : 'Open';

    var socket = client._soc0;
    socket.linfo = linfo;
    socket.removeAllListeners();
    res(socket);
  });
});
