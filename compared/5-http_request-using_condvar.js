#!/usr/bin/env node

var http    = require('http'),
    CondVar = require('condvar'),
    cv_body = new CondVar;

http.request({ hostname: 'www.google.com.' },
    function (res) {
        var response_body = '';
        res.on('data', function (data) { response_body += data       });
        res.on('end',  function ()     { cv_body.send(response_body) });
    }
).end();

var body = cv_body.recv();

console.log('response body length: ' + body.length);

