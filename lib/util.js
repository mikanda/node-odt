
/**
 * Module dependencies.
 */

var util = require('util');

/**
 * Module exports.
 */

exports.variables = variables;
exports.eachNode = eachNode;
exports.__proto__ = util;

/**
 * Applies the variables to the xml tree.
 *
 * @param {Document} xml The document to modify.
 * @param {Object} values The values to apply.
 */

function variables(xml, values){
  var nodeList;
  nodeList = xml.getElementsByTagName('text:user-field-decl');
  eachNode(nodeList, function(decl){
    var name = decl.getAttribute('text:name')
      , type = decl.getAttribute('office:value-type');
    if ((values[type] || {})[name]) {

      // replace the value with the one of the dictionary

      decl.setAttribute('office:' + type + '-value', values[type][name]);
    }
  });
  return xml;
}

/**
 * helper function to iterate over a node list
 *
 * @param {NodeList} nodeList The node list to iterate over.
 * @param {Function} fn function(node, index) to call for each node.
 */

function eachNode(nodeList, fn) {
  for (var index = 0; index < nodeList.length; ++index) {
    fn(nodeList.item(index), index);
  }
}
