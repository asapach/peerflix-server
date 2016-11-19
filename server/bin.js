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
server.listen(port, function () {
  console.log('Listening on http://localhost:' + port);
});
