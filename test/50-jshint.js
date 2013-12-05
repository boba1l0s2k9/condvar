/* The code in this file is adapted from jshint-tap-simple, and the license
 * information from jshint-tap-simple follows.
 */


/* License from https://github.com/tokuhirom/jshint-tap-simple 

Copyright © 2012 Tokuhiro Matsuno, http://64p.org/ <tokuhirom@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


/* jshint node: true, loopfunc: true */
"use strict";
var JSHINT = require('jshint').JSHINT,
    glob = require('../node_modules/tap/node_modules/glob'),
    fs = require('fs');

var TEST_COUNT = 0;
var FAIL_COUNT = 0;

process.on('exit', function () {
    process.stdout.write("1.."     + TEST_COUNT + "\n" +
                         "# fail " + FAIL_COUNT + "\n");
});

function runFile (fname, opt) {
    var src = fs.readFileSync(fname, 'utf-8');
    var ok  = JSHINT(src, opt);

    process.stdout.write( (ok ? "ok " : "not ok "      ) +
                          (++TEST_COUNT + " - " + fname) +
                          "\n"
    );

    var errors = JSHINT.data().errors;
    if (errors) {
        FAIL_COUNT++;
        process.stderr.write("# Failed test " + fname + "\n#\n#");
        for (var i=0; i < errors.length; i++) {
            var line = errors[i];
            var buf  = '  ' + line.id + ' ' +
                        line.raw.replace(/\{(.)\}/, function (m) { return line[m[1]]; }) +
                       ' at line ' + line.line + "\n#\n#" +
                       line.evidence + "\n#";

            for (var j=0; j < line.character-1; j++)
                buf += ' ';
            buf += "^\n#\n#\n";

            if (i !== errors.length-1)
                buf += "#";
            process.stderr.write(buf);
        }
    }
}

function run() {
    var patterns = [];
    var opt = {};
    for (var i=0; i < arguments.length; i++)
        if (typeof arguments[i] === 'object')
            opt = arguments[i];
        else
            patterns.push(arguments[i]);

    patterns.forEach(function (pattern) {
        glob(pattern, function (err, files) {
            if (err) throw err;
            files.forEach(function (fname) {
                runFile(fname, opt);
            });
        });
    });
}


run(__dirname + '/../example/*.js');
run(__dirname + '/../compared/*.js');
run(__dirname + '/../test/*.js');
run(__dirname + '/../*.js');

