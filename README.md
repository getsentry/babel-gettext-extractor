# babel-gettext-plugin
Extract gettext string with babel support syntax JSX, ES6, ... It is based on node-gettext.


Installation
============

`npm install babel-gettext-plugin`

Node use
========

```js
var babel = require("babel");

babel.transform(code, {
                plugins: ["babel-gettext-plugin"]
            });
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
        functionNames: <Array>,
        fileName: <String>
    }
}
```

### functionNames ###
All function names to be extract.

### fileName ###
The file name where found all extracted strings.

License
=======

[MIT License](LICENSE).
