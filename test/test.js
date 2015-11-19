'use strict';

var assert = require('assert');
var babel = require('babel');

var fs = require('fs');

describe('babel-gettext-plugin', function() {

  describe('#extract()', function() {

    it('Should return a result', function() {
      var result = babel.transform('let t = _t("code");_t("hello");', {
        plugins: ['../index.js'],
        extra: {
          gettext: {
            functionNames: {
              _t: ['msgid']
            },
            fileName: 'test.po'
          }
        }
      });
      assert(!!result);

      var content = fs.readFileSync('test.po');
      assert(!!content);
    });

    it('No file', function() {
      var result = babel.transform('let t = _t("code");_t("hello");', {
        plugins: ['../index.js'],
        extra: {
          gettext: {
            fileName: 'test2.po'
          }
        }
      });

      assert(!!result);
      assert(!fs.existsSync('test2.po'));
    });

    it('Should return a result', function() {
      var result = babel.transform('dnpgettext("mydomain", "mycontext", ' +
                                   '"msg", "plurial", 10)', {
        plugins: ['../index.js'],
        extra: {
          gettext: {
            fileName: 'test.po'
          }
        }
      });
      assert(!!result);

      var content = fs.readFileSync('test.po');
      assert(!!content);
    });

    it('Should have comments', function() {
      var result = babel.transform('// Translators: whatever happens\n' +
                                   'let t = _t("code");', {
        plugins: ['../index.js'],
        extra: {
          gettext: {
            functionNames: {
              _t: ['msgid']
            },
            fileName: 'test3.po'
          }
        }
      });
      assert(!!result);

      var content = fs.readFileSync('test3.po') + '';
      assert(content.match(/whatever happens/));
    });

  });
});
