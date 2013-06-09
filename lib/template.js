
/**
 * Module dependencies.
 */

var zlib = require('zlib')
  , fs = require('fs')
  , events = require('events')
  , util = require('util')
  , unzip = require('unzip')

  // we need adm-zip because unzip doesn't support counting entries

  , AdmZip = require('adm-zip')
  , pipette = require('pipette')
  , xmldom = require('xmldom')
  , async = require('async')
  , archiver = require('archiver')
  , handler = require('./handler')
  , EventEmitter = events.EventEmitter
  , createReadStream = fs.createReadStream
  , inherits = util.inherits
  , Sink = pipette.Sink
  , Blip = pipette.Blip
  , DOMParser = xmldom.DOMParser
  , chain = async.waterfall
  , each = async.eachSeries;

/**
 * Module exports.
 */

exports = module.exports = createTemplate;
for (var key in handler) {
  exports[key] = handler[key];
}

/**
 * Simply instantiates a new template instance.
 *
 * @param {String} path The path to the template.
 */

function createTemplate(path){
  return new Template(path);
}

/**
 * Class to work with odf templates.
 *
 * @param {String} path The path to the template.
 */

function Template(path){
  this.stream = createReadStream(path);

  // the number of available entries in the zip file

  this.nentries = new AdmZip(path).getEntries().length;
  this.archive = archiver('zip');
  this.handlers = [];
}

// inherit from event emitter

inherits(Template, EventEmitter);

/**
 * Applies the values to the template and emits an `end` event.
 *
 * @param {Object} values The values to apply to the document.
 * @emit end {Archive} The read stream of the finished document.
 */

Template.prototype.apply = function(handler){

  // provide a shortcut for simple value applying

  if (typeof handler === 'function') {
    this.handlers.push(handler);
  } else {
    this.handlers.push(exports.values(handler));
  }

  // if the template is already running the action is complete

  if (this.processing) return this;

  // parse the zip file

  this
    .stream
    .pipe(unzip.Parse())
    .on('entry', this.processEntry.bind(this));
  this.processing = true;
  return this;
};

/**
 * Processes the given entry.
 *
 * @param {Stream} entry The entry to process.
 * @api private
 */

Template.prototype.processEntry = function(entry){

  // dispatch the entry path and take the appropriate actions

  if (entry.path === 'content.xml') {
    this.processContent(entry);
  } else if (entry.path === 'mimetype') {

    // mimetype needs to be added uncompressed.

    this.appendMime(entry);
  } else {
    this.append({ name: entry.path })(entry);
  }
};

/**
 * Parses the content and applies the handlers.
 *
 * @param {Stream} stream The to the content.
 * @api private
 */

Template.prototype.processContent = function(stream){
  chain(
    [
      parse(stream),
      this.applyHandlers(),
      this.append({ name: 'content.xml' })
    ]
  );
};

/**
 * Apply the content to the various installed handlers.
 *
 * @return {Function} function(content, done).
 * @api private
 */

Template.prototype.applyHandlers = function(){
  var handlers = this.handlers;
  return function(content, done){
    each(
      handlers,
      function(handler, next){

        // apply the handlers to the content

        handler(content, next);
      },
      function(err){
        if (err) return done(err);

        // serialize the xml data into a stream and return it

        done(null, new Blip(content.toString()));
      }
    );
  };
};

/**
 * The mimetype file is a special case since it is added uncompressed.  This
 * function does this.
 */

Template.prototype.appendMime = function(stream, done){
  var appendMime;
  appendMime = this.append({
    name: 'mimetype',
    zlib: { level: zlib.Z_NO_COMPRESSION }
  });
  appendMime(stream, done);
};

/**
 * Append the stream to the target archive.
 *
 * @param {Object} options The options to pass to `archive.append()`.
 * @return {Function} function(stream, done).
 * @api private
 */

Template.prototype.append = function(options){
  var template = this
    , archive = this.archive
    , emit = this.emit.bind(this);
  return function(stream, done){
    archive.append(stream, options, function(err){
      if (err) emit('error', err);
      if (done) done(null, stream);
      if (--template.nentries === 0) emit('end', archive);
    });
  };
};

/**
 * Proxy the archive `pipe()` method.
 */

Template.prototype.pipe = function(){
  var archive = this.archive;
  return archive.pipe.apply(archive, arguments);
};

/**
 * Proxy the archive `finalize()` method.
 */

Template.prototype.finalize = function(done){
  var archive = this.archive
    , emit = this.emit.bind(this);
  this.on('end', function(archive){
    archive.finalize(function(err, bytes){
      if (err) return emit('error', err);
      done(bytes);
    });
  });
  return this;
};

/**
 * Parses the content.xml file of the document.
 *
 * @param {Stream} stream The stream to parse.
 * @return {Function} function(done).
 * @api private
 */

function parse(stream){
  return function(done){
    var sink = new Sink(stream)
      , domParser = new DOMParser()
      , parseXmlString = domParser.parseFromString.bind(domParser);
    sink.on('data', function(data){
      done(null, parseXmlString(data.toString()));
    });
  };
}
