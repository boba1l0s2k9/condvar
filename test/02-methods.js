var test = require("tap").test;

var CondVar = require('../CondVar.js');

test("methods defined", function (t) {
    t.plan(6);

    var CondVar = require('../CondVar.js');
    t.type(CondVar.prototype.send,  'function');
    t.type(CondVar.prototype.recv,  'function');
    t.type(CondVar.prototype.cb,    'function');
    t.type(CondVar.prototype.croak, 'function');
    t.type(CondVar.prototype.begin, 'function');
    t.type(CondVar.prototype.end,   'function');
});

