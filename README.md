
# node-odt

A node js tool to work with OpenDocument text files.

## Install

```
  $ npm install odt
```

## Usage

```js
var fs = require('fs')
  , odt = require('odt')
  , template = odt.template
  , createWriteStream = fs.createWriteStream
var doc = 'mytemplate.ott';
var values = { 'subject': 'My subject value' };

// apply values

template(doc)
  .apply(values)
  .on('error', function(err){
    throw err;
  })
  .on('end', function(doc){

    // write archive to disk.

    doc.pipe(createWriteStream('mydocument.odt'))
    doc.finalize(function(err){
      if (err) throw err;
      console.log('document written!');
    });
  });
```

This example can be written much easier using the convenience methods `pipe()`
and `finalize()`.

```js
var fs = require('fs')
  , odt = require('odt')
  , template = odt.template
  , createWriteStream = fs.createWriteStream
var doc = 'mytemplate.ott';
var values = { 'subject': 'My subject value' };

// apply values

template(doc)
  .apply(values)
  .on('error', function(err){
    throw err;
  })
  .finalize(function(bytes){
    console.log('The document is ' + bytes + ' bytes large.');
  })
  .pipe(createWriteStream('mydocument.odt'))
  .on('close', function(){
    console.log('document written');
  });
```

For a more advanced example see the command line utility in `bin/node-odt`.

## API

### `Template`

The main class to work with templates.  It inherits from `EventEmitter` and
fires the following events:

#### `events`

 * `error` - Fired if an error occurs.
 * `end(document)` - Fired when the document is complete.

#### `.apply(values : Object)`

Applies the values to the template.  `values` is an object of the following
form:

```js
{
  "field-type": {
    "field-name": "field-value"
  }
}
```

e.g.

```js
{
  "string": {
    "subject": "My subject",
    ...
  },
  ...
}
```

#### `.apply(handler : Function)`

Registers a handler to modify the content.  `handler` is a function of the form
`function(content, done)` while `content` is the parsed xml data of the
`content.xml` file in the document archive.  `done` is a `function` which needs
to be called upon completion.

#### `.pipe(stream : Stream)`

Pipes the archive to `stream`.

#### `.finalize(done : Function)`

Finalizes the output and calls `done(size)`. `size` is the size of the
resulting document.

## Bundled handlers

### Table handler

This handler applies a table template to a table defined by *libreoffice*.

*Warning: This part of the code is yet pretty unstable and might be changed in
future.  Use it carefully.*

#### Usage

```js
var odt = require('odt')
  , table = require('odt/handler').table;
odt
  .template('mytemplate.ott')
  .apply(
    table({
      Table1: {
        'string': { ... },
        ...
      }
    })
  )
```
