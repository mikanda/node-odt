
# node-odt
[![Build Status](https://travis-ci.org/domachine/node-odt.png?branch=master)](https://travis-ci.org/domachine/node-odt)
[![Dependency Status](https://gemnasium.com/domachine/node-odt.png)](https://gemnasium.com/domachine/node-odt)

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
var values = {
  'subject': { type: 'string', value: 'My subject value' }
};

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

### `Template(arg : String|Stream)`

The main class to work with templates.  `arg` can be a path to the odt file or
a stream with the odt contents.  `Template` inherits from `EventEmitter` and
fires the following events:

#### `events`

 * `error` - Fired if an error occurs.
 * `end(document)` - Fired when the document is complete.

#### `.apply(values : Object)`

Applies the values to the template.  `values` is an object of the following
form:

```js
{
  "field-name": {
    "type": "field-type",
    "value": "field-value"
  }
}
```

e.g.

```js
{
  "subject": {
    "type": "string",
    "value": "My subject"
  },
  ...
}
```

##### Supported data types

* `string` - This type is well supported and does what you think.
* `date` - This type can be either an unix timestamp (`Number`) or a javascript
  `Date`.
* `cent` - This type should have an integer as value which is converted into a
  float representing the `Euro` currency.

#### `.apply(handler : Function)`

Registers a handler to modify the content.  `handler` is a function of the form
`function(content, done)` while `content` is the parsed xml data of the
`content.xml` file in the document archive.  `done` is a `function` which needs
to be called upon completion.

#### `.pipe(stream : Stream)`

Pipes the archive to `stream`.

#### `.finalize(done : Function)`

Register a handler on the 'finalized' event.  This was formerly needed to
launch the finalization of the archive.  But this is done automatically now.

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
        'subject': { ... },
        ...
      }
    })
  )
  ...
```
