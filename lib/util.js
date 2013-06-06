
/**
 * Module dependencies.
 */

var util = require('util');

/**
 * Module exports.
 */

exports.variables = variables;
exports.placeholder = placeholder;
exports.__proto__ = util;
function variables(xml, values){
  xml
    .find('//*[name()="text:user-field-decl"]')
    .forEach(function(decl){
      var name = decl.attr('name').value()
        , type = decl.attr('value-type').value();
      if ((values[type] || {})[name]) {

        // replace the value with the one of the dictionary

        decl.attr(type + '-value').value(values[type][name]);
      }
    });
  return xml;
}
function placeholder(xml, values){
  xml
    .find('//*[name()="text:placeholder"]')
    .forEach(function(p){
      var match = p.text().match(/^.?([A-Za-z0-9]+).?$/);
      if (match) {
        (function(){
          var key = match[1];
          if (values[key]) p.text(values[key]);
        })();
      }
    });
}
