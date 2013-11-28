var test = require("tap").test;

var CondVar = require('../CondVar.js');

test("cv as cb", function (t) {
    t.plan(1);

    var cv_as_cb = new CondVar();
    setTimeout(cv_as_cb, 100);
    t.equal(cv_as_cb.recv(), null);
});

