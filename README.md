# babel-gettext-plugin

Extract gettext string with babel support syntax JSX, ES6, ... It is based on
node-gettext.  This is a fork of the npm module `babel-gettext-plugin` which
adds support for references and runs on earlier versions of node.

Node use
========

```js
var babel = require("babel");

babel.transform(code, { plugins:["babel-gettext-plugin"]});
```

Command line use
================

```
babel --plugins babel-gettext-plugin code.js
```

Options
=======

You can pass otions as extra in babel options :
```js
extra: {
  gettext: {
    headers: <Object>,
    functionNames: <Object>,
    fileName: <String>
  }
}
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

License
=======

[MIT License](LICENSE).
