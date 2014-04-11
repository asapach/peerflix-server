'use strict';

var express = require('express'),
  http = require('http'),
  api = require('./api')
    .use(express.static('.tmp'))
    .use(express.static('app'));

http.createServer(api).listen(9000);