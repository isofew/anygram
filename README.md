AnyGram
------

Datagram forwarding behind NAT

Anygram uses STUN to get the mapped address, IRC to signal peers.


### Install
```bash
npm -g install anygram@latest
```


### CLI

#### Server
```bash
anygram -n [serverNick] -m server -P [serverPort]
```

#### Client
```bash
anygram -n [clientNick] -m client -s [serverNick] -p [clientPort] -P [serverPort]
```

The commands above will forward packets to 127.0.0.1:`clientPort`@client 
to 127.0.0.1:`serverPort`@server. For more options, see `anygram --help`

To run the commands forever, consider using 
[forever](https://github.com/foreverjs/forever)


### API

```js
var anygram = require('anygram')(config);
```

`config` uses the same command line options.

In AnyGram, all sockets are UDP sockets.

#### anygram.punch(socket)

Returns a promise of socket. `socket.rinfo` may change if the remote NAT 
is symmetric. The punching process usually succeeds if not both NATs are 
symmetric.

`socket` is a UDP socket plus two attributes `linfo` and `rinfo`, 
obtained by calling `anygram.stun`

The `rinfo.punchTime` attribute also indicates when to start punching. 
This option is to make sure both sides start punching at the same time 
in spite of 
the (sometimes huge) IRC time lag.

#### anygram.stun(stunServer)

Returns a promise of socket. `socket.linfo` will include the mapped 
`port`, `address` and the NAT `type`.

`stunServer` is the hostname of a stun server listening at 3478

#### anygram.irc(config)

Returns an IRC client.

The config should specify the `name` and `pass`(if any) of your IRC 
account. The IRC server's `host` and `port` are optional. The client 
will send PING packets at the `keepalive` interval.

#### anygram.connect(irc, to, rinfo)

Returns a promise of socket.

`irc` is the IRC **client**

`to` is the name of the peer you are connecting to

`rinfo`(optional) is specified if you already got peer's rinfo

#### anygram.createServer(irc, onconn, onerr)

Start listening on the `irc` **client** for incoming connections

`onconn` is called when connected with a peer successfully

`onerr` is called on error

#### anygram.send(socket, msg, lport, rport)

Sends `msg` with 4 bytes header (`lport` and `rport`)

#### anygram.onrecv(socket, cb)

Parses received messages to cb(`msg`, `lport`, `rport`)

Notice that the `rport`@remote will become `lport`@local and vice versa.


### Credits

* [commander](https://github.com/tj/commander.js)
* [node-stun](https://github.com/enobufs/stun)
* [slate-irc](https://github.com/slate/slate-irc)
