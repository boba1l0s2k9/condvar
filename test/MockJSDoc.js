#!/usr/bin/env node

(function(){
"use strict";

function MockJSDoc (input_file) {
    // XXX I'm not sure how to reset JSDoc state, so use a big hammer instead.
    for (var key in require.cache)
        delete require.cache[key];

    this.input_file = input_file;
    this.parsed     = [];
    this.results    = {all: {}, documented: {}};
    this.cli        = undefined;
}

/* Prepare execution environment for JSDoc, a hack to do just enough to make it
 * look like I'm the real JSDoc command line tool.
 */
MockJSDoc.prototype.init = function (input_file) {
    if (typeof input_file !== 'undefined')
        this.input_file = input_file;

    var jsdoc_root = __dirname + '/../node_modules/jsdoc',
        jsdoc_lib  = 'jsdoc/lib/',
        jsdoc_cli  = 'jsdoc/cli.js',
        jsdoc_scan = jsdoc_lib + 'jsdoc/src/scanner';

    global.env = {
        run: {},
        conf: { tags: { allowUnknownTags: true } },
        opts: {
            _: [this.input_file],
            explain: true
        },
        dirname: jsdoc_root,
        sourceFiles: [this.input_file]
    };

    global.app = {
        jsdoc: {
            scanner: new (require(jsdoc_scan).Scanner)()
        }
    };

    /* Because we're in "explain" mode this function is called after the input
     * file is parsed.  Just store the parsing results.
     */
    global.dump = function () {
        this.parsed = arguments[0];
    }.bind(this);

    // Note: must happen after 'global' is setup
    this.cli = require(jsdoc_cli);

    return this;
};

/* Call this function after JSDoc is done to work through the parsed data and
 * put the results in this.results.
 */
MockJSDoc.prototype.process = function () {
    //console.log("parsed: ", this.parsed);
    this.parsed.forEach(function (i) {
        var name = i.longname.replace(/#/, '.');
        if (typeof i.name === 'undefined') return;
        if (/~/.test(i.longname)) return;
        if (/<anonymous>/.test(i.longname)) return;
        // TODO make this not necessary
        name = name.replace(/^module:/, '');
        this.results.all[name] = 1;
        if (!i.undocumented)
            this.results.documented[name] = 1;
    }.bind(this));
};

/* Execute JSDoc, which calls global.dump(), and also set its callback to be
 * this.process(), then return the result.
 */
MockJSDoc.prototype.run = function () {
    this.cli.runCommand(this.process.bind(this));
    return this.results;
};

module.exports = function (file) {
    return (new MockJSDoc(file)).init().run();
};

if (require.main === module) {
    console.log(module.exports(process.argv[process.argv.length-1]));
}

}());

