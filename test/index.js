
/**
 * Module dependencies.
 */

var odt = require('..')
  , fs = require('fs')
  , path = require('path')
  , should = require('should')
  , pipette = require('pipette')
  , join = path.join
  , Sink = pipette.Sink;

/**
 * Tests.
 */

describe('Template', function(){

  /*!
   * Loosy test for the api.  The real test was done interactively.
   */

  describe('#apply', function(){
    it('should apply the given values to the template', function(done){
      odt
        .template(join(__dirname, '../examples/test-template.ott'))
        .on('error', done)
        .on('end', function(doc){
          var estimatedSize = 10582
            , sink = new Sink(doc);
          doc.finalize(function (err, bytes) {
            if (err) done(err);
            bytes.should.equal(estimatedSize);
          });
          doc.on('end', done);
        })
        .apply(require('../examples/values'));
    });
  });
});
