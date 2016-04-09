#!/usr/bin/env node

var net = require('net');

var server = net.createServer((socket) => {
  socket.end('goodbye\n');
}).on('error', (err) => {
  throw err;
});

server.listen(8080, () => {
  address = server.address();
  console.log('opened server on %j', address);
});
