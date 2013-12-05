"use strict";

var test_jsdoc = require(__dirname + '/TestForJSDoc.js'),
    glob = require(__dirname + '/../node_modules/tap/node_modules/glob');

var TEST_COUNT = 0;
var FAIL_COUNT = 0;

process.on('exit', function () {
    process.stdout.write("1.."     + TEST_COUNT + "\n" +
                         "# fail " + FAIL_COUNT + "\n");
});

function runFile (file_name) {
    var missing_docs = test_jsdoc(file_name);


    process.stdout.write( (missing_docs.length === 0 ? "ok " : "not ok " ) +
                          (++TEST_COUNT + " - " + file_name              ) +
                          "\n"
    );

    if (!missing_docs.length) return;

    FAIL_COUNT += missing_docs.length;
    process.stderr.write("# Failed test " + file_name + "\n#\n#\n");
    process.stderr.write("# No documentation for: " + missing_docs + "\n#\n#");
}

function run() {
    var patterns = [];
    for (var i=0; i < arguments.length; i++)
        patterns.push(arguments[i]);

    patterns.forEach(function (pattern) {
        glob(pattern, function (err, files) {
            if (err) throw err;
            files.forEach(function (fname) {
                runFile(fname);
            });
        });
    });
}

run(__dirname + '/../*.js');

