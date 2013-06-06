
/**
 * Module dependencies.
 */

var pipette = require('pipette')
  , Blip = pipette.Blip;

/**
 * Module exports.
 */

exports.values = values;

/**
 * Applies an object of values to the odf template.
 *
 * @param {Object} dict The values to apply.
 * @return {Function} function(xml, done).
 * @api private
 */

function values(dict){
  return function(xml, done){
    xml
      .find("//*[name()='text:user-field-decl']")
      .forEach(function(decl){
        var name = decl.attr('name').value()
          , type = decl.attr('value-type').value();
        if ((dict[type] || {})[name]) {

          // replace the value with the one of the dictionary

          decl.attr(type + '-value').value(dict[type][name]);
        }
      });

    // serialize the xml in a stream

    done(null, new Blip(xml.toString()));
  };
}
