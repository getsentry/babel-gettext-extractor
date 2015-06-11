"use strict";

var assert = require("assert");
var babel = require("babel");

describe("babel-gettext-plugin", function() {

    describe("#extract()", function() {

        it("Should return a result", function() {
            var result = babel.transform("let t = _t('code');_t('hello');", {
                plugins: ["../index.js"]
            });

            console.log(result)
            assert(!!result);
        });

    });
});
