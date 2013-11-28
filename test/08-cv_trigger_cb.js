var test = require("tap").test;

var CondVar = require('../CondVar.js');

test("cv triggers cb", function (t) {
    t.plan(1);

    var cv_cb = new CondVar();
    cv_cb.cb(function (cv) { t.equal(cv.recv(), "cb result"); });
    setTimeout(function(){ cv_cb.send("cb result"); },  100);

});

