*Please note: this is a fork of a fork and is not available as an npm package
currently. If you wish to use this it's recommended you use a packaged
upstream or maintain your own fork instead.*

[![Build Status](https://travis-ci.org/mozilla/babel-gettext-extractor.svg?branch=master)](https://travis-ci.org/mozilla/babel-gettext-extractor)

# babel-gettext-extractor

Extract gettext string with babel support syntax JSX, ES6, ... It is based on
node-gettext.  This is a fork of the npm module `babel-gettext-plugin` which
adds support for references and runs on earlier versions of node.

Supports babel 6.

Install
========
`yarn add babel-gettext-extractor`
or
`npm install --save babel-gettext-extractor`

Node use
========

```js
var babel = require("babel");

babel.transform(code, { plugins:["babel-gettext-extractor"]});
```

Command line use
================

```
babel --plugins babel-gettext-extractor code.js
```

Options
=======


```js
"plugins": [
  [ "babel-gettext-extractor", {
    "headers": <Object>,
    "functionNames": <Object>,
    "fileName": <String>,
    "baseDirectory": <String>,
    "stripTemplateLiteralIndent": <Boolean>
  }]
]
```

### headers ###
The headers to put in the po file.

```js
headers: {
  "content-type": "text/plain; charset=UTF-8",
  "plural-forms": "nplurals=2; plural=(n!=1);"
}
```

### functionNames ###

A list of function names to extract.  The list is the definition of the
parameters: `"domain"`, `"msgctxt"`, `"msgid"`, `"msgid_plural"` and
`"count"`

example:
```js
functionNames: {
  myfunction: ["msgid"]
}
```

### fileName ###

The filename where the end result is placed.

### baseDirectory ###

If provided, then file names are chopped off in relation to this base path
if filenames start with that path.

### stripTemplateLiteralIndent ###

If true this will strip leading indents from multiline strings. Note: this
requires gettext function implementations to do the same leading indent removal.
Useful if you want to use Template literals for multiline strings to be passed
into to gettext functions.

License
=======

[MIT License](LICENSE).
