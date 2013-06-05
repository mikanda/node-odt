
/**
 * Module dependencies.
 */

var odt = require('..')
  , fs = require('fs')
  , path = require('path')
  , should = require('should')
  , join = path.join
  , unlink = fs.unlinkSync
  , stat = fs.statSync;

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
          var outputFilename = join(__dirname, '../test.odt')
            , output = fs.createWriteStream(outputFilename)
            , estimatedSize = 10582;
          doc.pipe(output);
          doc.finalize(function (err, bytes) {
            if (err) done(err);
            bytes.should.equal(estimatedSize);
          });
          output.on('close', function(){
            stat(outputFilename).size.should.equal(estimatedSize);
            unlink(outputFilename);
            done();
          });
        })
        .apply(require('../examples/values'));
    });
  });
});
