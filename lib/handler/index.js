
/**
 * Module dependencies.
 */

var pipette = require('pipette')
  , util = require('../util')
  , Blip = pipette.Blip
  , variables = util.variables;

/**
 * Module exports.
 */

exports.values = values;
exports.table = require('./table');

/**
 * Applies an object of values to the odf template.
 *
 * @param {Object} dict The values to apply.
 * @return {Function} function(xml, done).
 * @api private
 */

function values(dict){
  return function(xml, done){
    variables(xml, dict);

    // serialize the xml in a stream

    done(null, new Blip(xml.toString()));
  };
}
