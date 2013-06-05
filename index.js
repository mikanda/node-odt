
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
  , libxmljs = require('libxmljs')
  , async = require('async')
  , archiver = require('archiver')
  , EventEmitter = events.EventEmitter
  , Sink = pipette.Sink
  , Blip = pipette.Blip
  , parseXmlString = libxmljs.parseXmlString
  , createReadStream = fs.createReadStream
  , createWriteStream = fs.createWriteStream
  , chain = async.waterfall
  , inherits = util.inherits;

/**
 * Module exports.
 */

exports.template = createTemplate;

/**
 * Simply instantiates a new template instance.
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

  // The number of available entries in the zip file.

  this.nentries = new AdmZip(path).getEntries().length;
  this.archive = archiver('zip');
}

// inherit from event emitter

inherits(Template, EventEmitter);

/**
 * Applies the values to the template and emits an `end` event.
 *
 * @param {Object} values The values to apply to the document.
 * @emit end {Archive} The read stream of the finished document.
 */

Template.prototype.apply = function(values){
  var archive = this.archive
    , append = this.append.bind(this);

  // parse the zip file

  this
    .stream
    .pipe(unzip.Parse())
    .on('entry', function(entry){
      if (entry.path === 'content.xml') {

        // the content is processed to apply the values

        chain(
          [
            parse(entry),
            apply(values),
            append({ name: 'content.xml' })
          ]
        );
      } else if (entry.path === 'mimetype') {

        // mimetype needs to be added uncompressed.

        var appendMime = append({
          name: 'mimetype',
          zlib: { level: zlib.Z_NO_COMPRESSION }
        });
        appendMime(entry);
      } else {
        append({ name: entry.path })(entry);
      }
    });
  return this;
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
  }
}

/**
 * Parses the content.xml file of the document.
 *
 * @param {Stream} stream The stream to parse.
 * @return {Function} function(done).
 * @api private
 */

function parse(stream){
  return function(done){
    var sink = new Sink(stream);
    sink.on('data', function(data){
      done(null, parseXmlString(data.toString()));
    });
  }
}

/**
 * Applies an object of values to the odf template.
 *
 * @param {Object} values The values to apply.
 * @return {Function} function(xml, done).
 * @api private
 */

function apply(values){
  return function(xml, done){
    xml
      .find("//*[name()='text:user-field-decl']")
      .forEach(function(decl){
        var name = decl.attr('name').value()
          , type = decl.attr('value-type').value();
        if ((values[type] || {})[name]) {

          // replace the value with the one of the dictionary

          decl.attr(type + '-value').value(values[type][name]);
        }
      });

    // serialize the xml in a stream

    done(null, new Blip(xml.toString()));
  };
}
