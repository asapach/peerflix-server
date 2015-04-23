#!/usr/bin/env node
'use strict';

var express = require('express'),
  http = require('http'),
  path = require('path'),
  socket = require('./socket'),
  api = require('./')
    .use(express.static(path.join(__dirname, '../dist')))
    .use(express.static(path.join(__dirname, '../.tmp')))
    .use(express.static(path.join(__dirname, '../app')));

var server = http.createServer(api);
socket(server);
server.listen(9000);
