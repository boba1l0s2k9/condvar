#!/usr/bin/env node

var http = require('http');

function do_something_with_response_body (body) {
    console.log("response body length: " + body.length);
}

http.request({ hostname: 'www.google.com.' },
    function request_callback (response_object) {
        var response_body = '';
        response_object.on('data', function on_response_data (data) {
            response_body += data;
        });
        response_object.on('end', function on_response_end () {
            do_something_with_response_body(response_body);
        });
}).end();

