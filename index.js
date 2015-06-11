"use strict";

var gettextParser = require("gettext-parser");
var fs = require("fs");

var DEFAULT_FUNCTION_NAMES = ["gettext", "dgettext", "ngettext", "dngettext", "pgettext", "dpgettext", "npgettext", "dnpgettext"];
var DEFAULT_FILE_NAME = "gettext.po";

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
    return new babel.Transformer("babel-gettext-plugin", {
        CallExpression(node, parent, scope, config) {

            var functionNames = config.opts && config.opts.extra && config.opts.extra.gettext
                    && config.opts.extra.gettext.functionNames || DEFAULT_FUNCTION_NAMES;

            if (functionNames.indexOf(node.callee.name) !== -1
                || node.callee.property && functionNames.indexOf(node.callee.property.name) !== -1) {

                var args = node.arguments;

                for (var i = 0, l = args.length; i < l; i++) {
                    var arg = args[i];
                    var value = arg.value;

                    if (value) {
                        context[value] = {
                            msgid: value
                        };
                    }

                    var fileName = config.opts.extra.gettext.fileName || DEFAULT_FILE_NAME;
                    var output = gettextParser.po.compile(data);
                    fs.writeFileSync(fileName, output);
                }
            }
        }
    });
};
