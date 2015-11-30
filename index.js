'use strict';

var gettextParser = require('gettext-parser');
var fs = require('fs');

var DEFAULT_FUNCTION_NAMES = {
  gettext: ['msgid'],
  dgettext: ['domain', 'msgid'],
  ngettext: ['msgid', 'msgid_plural', 'count'],
  dngettext: ['domain', 'msgid', 'msgid_plural', 'count'],
  pgettext: ['msgctxt', 'msgid'],
  dpgettext: ['domain', 'msgctxt', 'msgid'],
  npgettext: ['msgctxt', 'msgid', 'msgid_plural', 'count'],
  dnpgettext: ['domain', 'msgctxt', 'msgid', 'msgid_plural', 'count']
};

var DEFAULT_FILE_NAME = 'gettext.po';

var DEFAULT_HEADERS = {
  'content-type': 'text/plain; charset=UTF-8',
  'plural-forms': 'nplurals = 2; plural = (n !== 1);'
};

function getTranslatorComment(node) {
  var comments = [];
  (node.leadingComments || []).forEach(function(commentNode) {
    var match = commentNode.value.match(/^\s*translators:\s*(.*?)\s*$/im);
    if (match) {
      comments.push(match[1]);
    }
  });
  return comments.length > 0 ? comments.join('\n') : null;
}

exports.default = function(_ref) {
  var currentFileName;
  var data;
  var Plugin = _ref.Plugin;
  var relocatedComments = {};

  return new Plugin('babel-plugin-example', {visitor: {

    VariableDeclaration: function(node, parent, scope, config) {
      var translatorComment = getTranslatorComment(node);
      if (!translatorComment) {
        return;
      }
      node.declarations.forEach(function(declarator) {
        var comment = getTranslatorComment(declarator);
        if (!comment) {
          var key = declarator.init.start + '|' + declarator.init.end;
          relocatedComments[key] = translatorComment;
        }
      });
    },

    CallExpression: function(node, parent, scope, config) {
      var gtCfg = config.opts && config.opts.extra
        && config.opts.extra.gettext || {};

      var functionNames = gtCfg.functionNames || DEFAULT_FUNCTION_NAMES;
      var fileName = gtCfg.fileName || DEFAULT_FILE_NAME;
      var headers = gtCfg.headers || DEFAULT_HEADERS;
      var base = gtCfg.baseDirectory;
      if (base) {
        base = base.match(/^(.*?)\/*$/)[1] + '/';
      }

      if (fileName !== currentFileName) {
        currentFileName = fileName;
        data = {
          charset: 'UTF-8',
          headers: headers,
          translations: {context: {}}
        };

        headers['plural-forms'] = headers['plural-forms']
          || DEFAULT_HEADERS['plural-forms'];
        headers['content-type'] = headers['content-type']
          || DEFAULT_HEADERS['content-type'];
      }

      var defaultContext = data.translations.context;
      var nplurals = /nplurals ?= ?(\d)/.exec(headers['plural-forms'])[1];

      if (functionNames.hasOwnProperty(node.callee.name)
          || node.callee.property &&
          functionNames.hasOwnProperty(node.callee.property.name)) {
        var functionName = functionNames[node.callee.name]
          || functionNames[node.callee.property.name];
        var translate = {};

        var args = node.arguments;
        for (var i = 0, l = args.length; i < l; i++) {
          var name = functionName[i];

          if (name && name !== 'count' && name !== 'domain') {
            var arg = args[i];
            var value = arg.value;
            if (value) {
              translate[name] = value;
            }

            if (name === 'msgid_plural') {
              translate.msgstr = [];
              for (var p = 0; p < nplurals; p++) {
                translate.msgstr[p] = '';
              }
            }
          }
        }

        var fn = config.log.filename;
        if (base && fn && fn.substr(0, base.length) == base) {
          fn = fn.substr(base.length);
        }

        translate.comments = {
          reference: fn + ':' + node.loc.start.line
        };

        var translatorComment = getTranslatorComment(node);
        if (!translatorComment) {
          translatorComment = getTranslatorComment(parent);
          if (!translatorComment) {
            translatorComment = relocatedComments[
              node.start + '|' + node.end];
          }
        }

        if (translatorComment) {
          translate.comments.translator = translatorComment;
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
  }});
};
