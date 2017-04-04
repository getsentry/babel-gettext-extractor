'use strict';

var assert = require('assert');
var babel = require('babel-core');

var fs = require('fs');
var plugin = require('../index.js');


describe('babel-gettext-plugin', function() {

  describe('#extract()', function() {

    it('Should return a result', function() {
      var result = babel.transform('let t = _t("code");_t("hello");', {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid']
            },
            fileName: './test/first.po'
          }]
        ]
      });
      assert(!!result);

      var content = fs.readFileSync('./test/first.po');
      assert(!!content);
    });

    it('No file', function() {
      var result = babel.transform('let t = _t("code");_t("hello");', {
        plugins: [
          [plugin, {
            fileName: './test/test2.po'
          }]
        ]
      });

      assert(!!result);
      assert(!fs.existsSync('./test/test2.po'));
    });

    it('Should return a result', function() {
      var result = babel.transform('dnpgettext("mydomain", "mycontext", ' +
                                   '"msg", "plurial", 10)', {
        plugins: [
          [plugin, {
            fileName: './test/dnpgettext.po'
          }]
        ]
      });
      assert(!!result);

      var content = fs.readFileSync('./test/dnpgettext.po');
      assert(!!content);
    });

    it('Should have comments', function() {
      var result = babel.transform('// Translators: whatever happens\n' +
                                   'let t = _t("code");', {
        plugins: [
          [plugin, {
            functionNames: {
              _t: ['msgid']
            },
            fileName: './test/comments.po'
          }]
        ]
      });
      assert(!!result);

      var content = fs.readFileSync('./test/comments.po') + '';
      assert(content.match(/whatever happens/));
    });

  });
});
