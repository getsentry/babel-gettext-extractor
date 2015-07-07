"use strict";

var gettextParser = require("gettext-parser");
var fs = require("fs");

var DEFAULT_FUNCTION_NAMES = {
    gettext: ["msgid"],
    dgettext: ["domain", "msgid"],
    ngettext: ["msgid", "msgid_plural", "count"],
    dngettext: ["domain", "msgid", "msgid_plural", "count"],
    pgettext: ["msgctxt", "msgid"],
    dpgettext: ["domain", "msgctxt", "msgid"],
    npgettext: ["msgctxt", "msgid", "msgid_plural", "count"],
    dnpgettext: ["domain", "msgctxt", "msgid", "msgid_plural", "count"]
};
var DEFAULT_FILE_NAME = "gettext.po";

module.exports = function(babel) {

    var currentFileName;
    var data;

    return new babel.Transformer("babel-gettext-plugin", {
        CallExpression(node, parent, scope, config) {

            var functionNames = config.opts && config.opts.extra && config.opts.extra.gettext
                    && config.opts.extra.gettext.functionNames || DEFAULT_FUNCTION_NAMES;

            var fileName = config.opts && config.opts.extra && config.opts.extra.gettext
                    && config.opts.extra.gettext.fileName || DEFAULT_FILE_NAME;

            if (fileName !== currentFileName) {
                currentFileName = fileName;

                data = {
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
            }

            var defaultContext = data.translations.context;

            if (functionNames.hasOwnProperty(node.callee.name)
                    || node.callee.property && functionNames.hasOwnProperty(node.callee.property.name)) {

                var functionName = functionNames[node.callee.name] || functionNames[node.callee.property.name];
                var translate = {};

                var args = node.arguments;
                for (var i = 0, l = args.length; i < l; i++) {
                    var name = functionName[i];

                    if (name && name !== "count" && name !== "domain") {
                        var arg = args[i];
                        var value = arg.value;

                        if (value) {
                            translate[name] = value;
                        }

                        if (name === "msgid_plural") {
                            translate.msgstr = ["", ""];
                        }
                    }
                }

                var context = defaultContext;
                var msgctxt = translate.msgctxt;
                if (msgctxt) {
                    data.translations[msgctxt] = data.translations[msgctxt] || {};
                    context = data.translations[msgctxt];
                }

                context[translate.msgid] = translate;

                var output = gettextParser.po.compile(data);
                fs.writeFileSync(fileName, output);
            }
        }
    });
};
