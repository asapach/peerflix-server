#!/usr/bin/env node
'use strict';

var STATIC_OPTIONS = { maxAge: 3600000 };

var express = require('express'),
  http = require('http'),
  path = require('path'),
  socket = require('./socket'),
  api = require('./')
    .use(express.static(path.join(__dirname, '../dist'), STATIC_OPTIONS))
    .use(express.static(path.join(__dirname, '../.tmp'), STATIC_OPTIONS))
    .use(express.static(path.join(__dirname, '../app'), STATIC_OPTIONS));

var server = http.createServer(api);
socket(server);
var port = process.env.PORT || 9000;

server.listen(port).on('error', function (e) {
  if (e.code !== 'EADDRINUSE' && e.code !== 'EACCES') {
    throw e;
  }
  console.error('Port ' + port + ' is busy. Trying the next available port...');
  server.listen(++port);
}).on('listening', function () {
  console.log('Listening on http://localhost:' + port);
});
