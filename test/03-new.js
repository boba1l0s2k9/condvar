var test = require("tap").test;

var CondVar = require('../CondVar.js');

test("new object has methods", function (t) {
    t.plan(6);

    var CondVar = require('../CondVar.js'),
             cv = new CondVar();

    t.type(cv.send,  'function');
    t.type(cv.recv,  'function');
    t.type(cv.cb,    'function');
    t.type(cv.croak, 'function');
    t.type(cv.begin, 'function');
    t.type(cv.end,   'function');
    cv._stop();
});

