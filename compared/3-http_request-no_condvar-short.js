#!/usr/bin/env node

var http = require('http');

function do_something_with_response_body (body) {
    console.log("response body length: " + body.length);
}

http.request({ hostname: 'www.google.com.' },
    function (res) {
        var response_body = '';
        res.on('data', function (data) { response_body += data; });
        res.on('end',  function ()     {
            do_something_with_response_body(response_body);
        });
    }
).end();

