#!/usr/bin/env node

var http = require('http'),
    response_body = '';

function do_something_with_response_body (body) {
    console.log("response body length: " + body.length);
}

function on_response_data (data) {
    response_body += data;
}

function on_response_end () {
    do_something_with_response_body(response_body);
}

function request_callback (response_object) {
    response_object.on('data', on_response_data);
    response_object.on('end',  on_response_end);
}

var request_options = { hostname: 'www.google.com.' };

var request_object = http.request(request_options, request_callback);
request_object.end();

