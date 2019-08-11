var assert = require('assert');
var babel = require('@babel/core');

var fs = require('fs');
var plugin = require('../index.js');
var utils = require('../utils.js');

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

    it('Should create subfolder if doesn\'t exists', function() {
      var result = babel.transform('let t = _t("code");_t("hello");', {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid'],
            },
            fileName: './test/some/folder/structure/test.po',
          }],
        ],
      });
      assert(!!result);

      var content = fs.readFileSync('./test/some/folder/structure/test.po');
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

    it('Should decide on a filename dynamically', function() {
      const code = '_t("Dynamic Filenames")';

      var result = babel.transform(code, {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid'],
            },
            fileName: (file) => 'test/' + file.opts.generatorOpts.sourceFileName + '-dynamic-filename.po',
          }],
        ],
      });
      assert(!!result);
      var content = fs.readFileSync('./test/unknown-dynamic-filename.po');
      assert(content.indexOf('msgid "Dynamic Filenames"') !== -1);
    });

    it('Should skip a file if the dynamic filename is false', function() {
      const code = '_t("Dynamic Filenames")';

      var result = babel.transform(code, {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid'],
            },
            fileName: () => false,
          }],
        ],
      });
      assert(!!result);
    });
  });
});

describe('utils', function() {
  describe('#sortObjectKeysByRef()', function() {
    it('Should sort source file line numbers as numbers', function() {
      const unordered = {
        a: { comments: { reference: 'path.js:20' } },
        b: { comments: { reference: 'path.js:100' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'a');
      assert(keys[1] === 'b');
    });

    it('Should read line number from reference after the last colon', function() {
      const unordered = {
        a: { comments: { reference: 'path:with-colon.js:20' } },
        b: { comments: { reference: 'path:with-colon.js:100' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'a');
      assert(keys[1] === 'b');
    });

    it('Should compare paths before line numbers', function() {
      const unordered = {
        a: { comments: { reference: 'path-a.js:20' } },
        b: { comments: { reference: 'path-b.js:10' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'a');
      assert(keys[1] === 'b');
    });

    it('Should compare paths case-insensitively', function() {
      const unordered = {
        a: { comments: { reference: 'path-a.js:10' } },
        b: { comments: { reference: 'path-B.js:10' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'a');
      assert(keys[1] === 'b');
    });

    it('Should treat reference with no colon as all path', function() {
      const unordered = {
        a: { comments: { reference: 'path-a.js' } },
        b: { comments: { reference: 'path-b.js' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'a');
      assert(keys[1] === 'b');
    });

    it('Should treat reference with a colon suffix as all path', function() {
      const unordered = {
        a: { comments: { reference: 'path-a.js:' } },
        b: { comments: { reference: 'path-b.js:' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'a');
      assert(keys[1] === 'b');
    });

    it('Should treat reference with a non-numeric part after the colon as all path', function() {
      const unordered = {
        a: { comments: { reference: 'path-a.js:not-a-number' } },
        b: { comments: { reference: 'path-b.js:not-a-number' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'a');
      assert(keys[1] === 'b');
    });

    it('Should compare references line by line', function() {
      const unordered = {
        a: { comments: { reference: 'path.js:20\npath.js:820' } },
        b: { comments: { reference: 'path.js:20\npath.js:453' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'b');
      assert(keys[1] === 'a');
    });

    it('Should sort the reference with more lines first if common lines are all equal', function() {
      const unordered = {
        a: { comments: { reference: 'path.js:20\npath.js:30' } },
        b: { comments: { reference: 'path.js:20\npath.js:30\npath.js:40' } },
      };

      const ordered = utils.sortObjectKeysByRef(unordered);
      const keys = Array.from(Object.keys(ordered));
      assert(keys[0] === 'b');
      assert(keys[1] === 'a');
    });
  });
});
