"use strict";

var functionName = "_t";

var gettextParser = require("gettext-parser");
var fs = require("fs");

var data = {
    charset: "UTF-8",

    headers: {
        "content-type": "text/plain; charset=UTF-8",
        "plural-forms": "nplurals=2; plural=(n!=1);"
    },

    translations: {
        context: {
        }
    }
};

var context = data.translations.context;

module.exports = function(babel) {
    return new babel.Transformer("visitor", {
        CallExpression(node, parent, scope, config) {

            if (node.callee.name === functionName
                || node.callee.property && node.callee.property.name === functionName) {

                var args = node.arguments;

                for (var i = 0, l = args.length; i < l; i++) {
                    var arg = args[i];
                    var value = arg.value;
                    console.log(value);

                    if (value) {
                        context[value] = {
                            msgid: value
                        };
                    }
                    var output = gettextParser.po.compile(data);
                    fs.writeFileSync("test.pot", output);
                }
            }
        }
    });
};
