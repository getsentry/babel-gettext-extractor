var assert = require('assert');
var babel = require('@babel/core');

var fs = require('fs');
var plugin = require('../index.js');


describe('babel-gettext-extractor', function() {
  describe('#extract()', function() {
    it('Should return a result for simple code example', function() {
      var result = babel.transform('let t = _t("code");_t("hello");', {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid'],
            },
            fileName: './test/first.po',
          }],
        ],
      });
      assert(!!result);

      var content = fs.readFileSync('./test/first.po');
      assert(content.indexOf('msgid "code"') !== -1);
      assert(content.indexOf('msgid "hello"') !== -1);
    });

    it('No file created if no file name provided', function() {
      var result = babel.transform('let t = _t("code");_t("hello");', {
        plugins: [
          [plugin, {
            fileName: './test/test2.po',
          }],
        ],
      });
      assert(!!result);
      assert(!fs.existsSync('./test/test2.po'));
    });

    it('Should return a result for dnpgettext', function() {
      var result = babel.transform('dnpgettext("mydomain", "mycontext", "msg", "plurial", 10)', {
        plugins: [
          [plugin, {
            fileName: './test/dnpgettext.po',
          }],
        ],
      });
      assert(!!result);
      var content = fs.readFileSync('./test/dnpgettext.po');
      assert(content.indexOf('msgid "msg"') !== -1);
      assert(content.indexOf('msgid_plural "plurial"') !== -1);
    });

    it('Should extract comments', function() {
      var result = babel.transform('// Translators: whatever happens\n let t = _t("code");', {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid'],
            },
            fileName: './test/comments.po',
          }],
        ],
      });
      assert(!!result);
      var content = fs.readFileSync('./test/comments.po') + '';
      assert(content.match(/whatever happens/));
    });

    it('Should return a result when expression is used as an argument', function() {
      var result = babel.transform("let t = _t('some' + ' expression');", {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid'],
            },
            fileName: './test/defaultTranslate.po',
          }],
        ],
      });
      assert(!!result);
      var content = fs.readFileSync('./test/defaultTranslate.po');
      assert(content.indexOf('msgid "some expression"') !== -1);
    });

    it('Should stripIndent from template literals when configured', function() {
      var result = babel.transform(`let t = _t(\`spread
        over
        multi
        lines\`);`, {
          plugins: [
            [plugin, {
              functionNames: {
                _t: ['msgid'],
              },
              fileName: './test/multiline.po',
              stripTemplateLiteralIndent: true,
            }],
          ],
        });
      assert(!!result);
      var content = fs.readFileSync('./test/multiline.po');
      assert(content.indexOf('spread over multi lines') !== -1);
    });

    it('Should stripIndent from template literals in plurals', function() {
      var result = babel.transform(`let t = ngettext(\`multi
        line\`, \`multi
        line
        plural\`, foo);`, {
          plugins: [
            [plugin, {
              functionNames: {
                ngettext: ['msgid', 'msgid_plural', 'count'],
              },
              fileName: './test/multiline-plural.po',
              stripTemplateLiteralIndent: true,
            }],
          ],
        });
      assert(!!result);
      var content = fs.readFileSync('./test/multiline-plural.po');
      assert(content.indexOf('msgid "multi line') !== -1);
      assert(content.indexOf('msgid_plural "multi line plural') !== -1);
    });

    it('Should not stripIndent from template literals by default', function() {
      var result = babel.transform(`let t = _t(\`spread
        over
        multi
        lines\`);`, {
          plugins: [
            [plugin, {
              functionNames: {
                _t: ['msgid'],
              },
              fileName: './test/stripIndent-not-configured.po',
            }],
          ],
        });
      assert(!!result);
      var content = fs.readFileSync('./test/stripIndent-not-configured.po');
      assert(content.indexOf('spread over multi lines') === -1);
    });

    it('Should return a result for JSX', function() {
      var result = babel.transform('let jsx = <h1>{_t("title")}</h1>', {
        presets: ['@babel/react'],
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid'],
            },
            fileName: './test/react.po',
          }],
        ],
      });
      assert(!!result);
      var content = fs.readFileSync('./test/react.po');
      assert(content.indexOf('msgid "title"') !== -1);
    });
  });
});
