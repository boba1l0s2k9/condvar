var test = require("tap").test;

test("module loads", function (t) {
    t.plan(2);

    var CondVar = require('../CondVar.js');
    t.type(CondVar,           'function');
    t.type(CondVar.prototype, 'object');
});

