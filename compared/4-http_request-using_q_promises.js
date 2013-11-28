#!/usr/bin/env node

var http = require('http'),
    Q    = require('q');

function http_request () {
    var body = Q.defer();
    http.request({ hostname: 'www.google.com.' },
        function (res) {
            var response_body = '';
            res.on('data', function (data) { response_body += data; });
            res.on('end',  function ()     {
                body.resolve(response_body);
            });
        }
    ).end();
    return body.promise;
}

http_request().done(function (body) {
    console.log("response body length: " + body.length);
});

