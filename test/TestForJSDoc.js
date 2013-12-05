#!/usr/bin/env node

module.exports = function (file_name) {
    var all        = require('./GetFuncList.js')(file_name),
        documented = require('./MockJSDoc.js')(file_name).documented,
        need       = {},
        have       = {};

    Object.keys(all).forEach(function (v) {
        if (typeof documented[v] !== 'undefined')
            have[v] = 1;
        else
            need[v] = 1;
    });

    if (process.env.VERBOSE) {
        if (process.env.VERBOSE && process.env.VERBOSE > 1)
            console.error("all:  ",  all, "\n" +
                        "have: ", have, "\n" +
                        "need: ", need
            );

        console.error("Have documentation for " +
                        Object.keys(have).length + " of " +
                        Object.keys(all).length  + " functions."
        );

        if (Object.keys(have).length)
            console.error("\tHAVE:    " + Object.keys(have).join(", "));

        if (Object.keys(need).length)
            console.error("\tMISSING: " + Object.keys(need).join(", "));
    }

    return Object.keys(need);
};


if (require.main == module) {
    console.log(module.exports(process.argv[process.argv.length-1]));
}

