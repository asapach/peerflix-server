#!/usr/bin/env node
'use strict';

var express = require('express'),
  http = require('http'),
  path = require('path'),
  api = require('./api')
    .use(express.static(path.join(__dirname, '../.tmp')))
    .use(express.static(path.join(__dirname, '../app')))
    .use(express.static(path.join(__dirname, '../dist')));

http.createServer(api).listen(9000);