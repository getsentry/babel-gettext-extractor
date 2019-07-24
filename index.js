var utils = require('./utils');
var gettextParser = require('gettext-parser');
var fs = require('fs');
var path = require('path');

var DEFAULT_FUNCTION_NAMES = {
  gettext: ['msgid'],
  dgettext: ['domain', 'msgid'],
  ngettext: ['msgid', 'msgid_plural', 'count'],
  dngettext: ['domain', 'msgid', 'msgid_plural', 'count'],
  pgettext: ['msgctxt', 'msgid'],
  dpgettext: ['domain', 'msgctxt', 'msgid'],
  npgettext: ['msgctxt', 'msgid', 'msgid_plural', 'count'],
  dnpgettext: ['domain', 'msgctxt', 'msgid', 'msgid_plural', 'count'],
};

var DEFAULT_FILE_NAME = 'gettext.po';

var DEFAULT_HEADERS = {
  'content-type': 'text/plain; charset=UTF-8',
  'plural-forms': 'nplurals = 2; plural = (n !== 1);',
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

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


module.exports = function() {
  var currentFileName;
  var data;
  var relocatedComments = {};

  return { visitor: {

    VariableDeclaration(nodePath) {
      var translatorComment = getTranslatorComment(nodePath.node);
      if (!translatorComment) {
        return;
      }
      nodePath.node.declarations.forEach(function(declarator) {
        var comment = getTranslatorComment(declarator);
        if (!comment) {
          var key = declarator.init.start + '|' + declarator.init.end;
          relocatedComments[key] = translatorComment;
        }
      });
    },

    CallExpression(nodePath, plugin) {
      var functionNames = plugin.opts && plugin.opts.functionNames || DEFAULT_FUNCTION_NAMES;
      var fileName = plugin.opts && plugin.opts.fileName || DEFAULT_FILE_NAME;
      var headers = plugin.opts && plugin.opts.headers || DEFAULT_HEADERS;
      var base = plugin.opts && plugin.opts.baseDirectory;
      var universalSlash = plugin.opts && plugin.opts.universalSlash;

      if (base) {
		base = base.match(/^(.*?)[\//]*$/)[1] + path.sep;
      }

      if (typeof fileName === 'function') {
        fileName = fileName(this.file);
      }

      if (!fileName) {
        return;
      }

      if (fileName !== currentFileName) {
        currentFileName = fileName;
        if (fs.existsSync(fileName)) {
          const fileContents = fs.readFileSync(fileName, 'utf8');
          data = gettextParser.po.parse(fileContents);
          data.headers = {
            ...(data.headers || {}),
            ...headers,
          };
          data.translations.context = data.translations.context || {};
        } else {
          data = {
            charset: 'UTF-8',
            headers: headers,
            translations: { context: {} },
          };
        }

        headers['plural-forms'] = headers['plural-forms']
          || DEFAULT_HEADERS['plural-forms'];
        headers['content-type'] = headers['content-type']
          || DEFAULT_HEADERS['content-type'];
      }

      var defaultContext = data.translations.context;
      var nplurals = /nplurals ?= ?(\d)/.exec(headers['plural-forms'])[1];

      const callee = nodePath.node.callee;

      if (functionNames.hasOwnProperty(callee.name) ||
          callee.property &&
          functionNames.hasOwnProperty(callee.property.name)) {
        var functionName = functionNames[callee.name]
          || functionNames[callee.property.name];
        var translate = {};

        var args = nodePath.get('arguments');
        for (var i = 0, l = args.length; i < l; i++) {
          var name = functionName[i];

          if (name && name !== 'count' && name !== 'domain') {
            var arg = args[i].evaluate();
            var value = arg.value;
            if (arg.confident && value) {
              if (plugin.opts.stripTemplateLiteralIndent) {
                value = utils.stripIndent(value);
              }
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

        var fn = this.file.opts.filename;
        if (base && fn && fn.substr(0, base.length) === base) {
          fn = fn.substr(base.length);
        }

        if (universalSlash === '/') {
          fn = fn.replace(/\\/g, universalSlash)
        } else if (universalSlash === '\\') {
          fn = fn.replace(/\//g, universalSlash)
        }

        translate.comments = {
          reference: fn + ':' + nodePath.node.loc.start.line,
        };

        var translatorComment = getTranslatorComment(nodePath.node);
        if (!translatorComment) {
          translatorComment = getTranslatorComment(nodePath.parentPath);
          if (!translatorComment) {
            translatorComment = relocatedComments[
              nodePath.node.start + '|' + nodePath.node.end];
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

        if (typeof context[translate.msgid] !== 'undefined') {
          // If we already have this translation append the new file reference
          // so we know about all the places it is used.
          var newRef = translate.comments.reference;
          var currentRef = context[translate.msgid].comments.reference;
          var refs = currentRef.split('\n');
          if (refs.indexOf(newRef) === -1) {
            refs.push(newRef);
            context[translate.msgid].comments.reference = refs.sort().join('\n');
          }
        } else if (typeof translate.msgid !== 'undefined') {
          // Do not add translation if msgid is undefined.
          context[translate.msgid] = translate;
        }

        // Sort by file reference to make output idempotent for the same input.
        if (data.translations && data.translations.context) {
          data.translations.context = utils.sortObjectKeysByRef(data.translations.context);
        }
        ensureDirectoryExistence(fileName);
        fs.writeFileSync(fileName, gettextParser.po.compile(data));
      }
    },
  } };
};
