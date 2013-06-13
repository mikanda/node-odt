
/**
 * Module dependencies.
 */

var fs = require('fs')
  , odt = require('..')
  , path = require('path')
  , pipette = require('pipette')
  , handler = require('../lib/handler')
  , createReadStream = fs.createReadStream
  , table = handler.table
  , join = path.join
  , Sink = pipette.Sink;
require('should');

/**
 * Tests.
 */

describe('Template', function(){

  /*!
   * Loosy test for the api.  The real test was done interactively.
   */

  describe('values-handler', function(){
    it('should apply the given values to the template', function(done){
      odt
        .template(join(__dirname, '../examples/test-template.ott'))
        .on('error', done)
        .on('end', function(doc){
          var estimatedSize = 10547
            , sink = new Sink(doc);
          doc.finalize(function (err, bytes) {
            if (err) done(err);
            bytes.should.equal(estimatedSize);
          });
          sink.on('end', done);
        })
        .apply(require('../examples/values'));
    });
    it('should apply the given values to the template using a stream', function(done){
      var path = join(__dirname, '../examples/test-template.ott')
        , stream = createReadStream(path);
      odt
        .template(stream)
        .on('error', done)
        .on('end', function(doc){
          var estimatedSize = 10547
            , sink = new Sink(doc);
          doc.finalize(function (err, bytes) {
            if (err) done(err);
            bytes.should.equal(estimatedSize);
          });
          sink.on('end', done);
        })
        .apply(require('../examples/values'));
    });
  });
  describe('table-handler', function(){

    /*!
     * Loosy test for the api.  The real test was done interactively.
     */

    it('should apply the given table to the template', function(done){
      odt
        .template(join(__dirname, '../examples/table.ott'))
        .on('error', done)
        .on('end', function(doc){
          var estimatedSize = 9681
            , sink = new Sink(doc);
          doc.finalize(function (err, bytes) {
            if (err) done(err);
            bytes.should.equal(estimatedSize);
          });
          sink.on('end', done);
        })
        .apply( table(require('../examples/table')) );
    });
  });
});
