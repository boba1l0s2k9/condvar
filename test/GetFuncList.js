#!/usr/bin/env node

(function(){

var fs = require('fs');

function list_module_functions_in_file (file_name) {
    var obj_map       = {},
        flat_obj_list = {},
        loaded_mod;

    if (!fs.existsSync(file_name))
        throw "File doesn't exist: '" + file_name + "'";

    loaded_mod = require(file_name);

    if (typeof loaded_mod === 'undefined')
        throw "File load failed: '" + file_name + "'";

    // Populate obj_map with constructors, methods, and static functions
    if (typeof loaded_mod.prototype === 'object')
        // Exports a single object
        obj_map[loaded_mod.name] = loaded_mod.prototype;
    else if (typeof loaded_mod === 'object')
        // Exports one or more objects or functions
        Object.keys(loaded_mod).forEach(function (o) {
            if (typeof loaded_mod[o].prototype === 'object') {
                obj_map[o] = loaded_mod[o].prototype;
            }
        });
    else
        throw "Only handles modules with functions and objects";

    // Flatten obj_map into flat_obj_list for easy lookup
    Object.keys(obj_map).forEach(function (i) {
        // Skip anything with a leading underscore
        if (/^_/.test(i)) return;

        // Plain functions
        if (Object.keys(obj_map[i]).length === 0) {
            flat_obj_list[i] = 1;
            return;
        }

        // Constructor
        flat_obj_list[i] = 1;

        // Object methods
        Object.keys(obj_map[i]).forEach(function (j) {
            if (/^_/.test(j)) return;
            flat_obj_list[i + '.' + j] = 1;
        });
    });

    //console.log("OUTPUT:", flat_obj_list);
    return flat_obj_list;
}

module.exports = list_module_functions_in_file;

if (require.main == module) {
    console.log(module.exports(process.argv[process.argv.length-1]));
}

}());

