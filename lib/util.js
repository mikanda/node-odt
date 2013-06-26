
/**
 * Module dependencies.
 */

var util = require('util');

/**
 * Module exports.
 */

exports.variables = variables;
exports.eachNode = eachNode;
exports.daysSince1899 = daysSince1899;
exports.resolveVariable = resolveVariable;
exports.__proto__ = util;

// variable aliases

var typeAliases = {
  date: 'float'
};

/**
 * Process the value of the given variable using predefined handlers.
 *
 * @param {String} type
 * @param {String} value
 *
 * @api private
 */

function processVariable(type, value) {
  var handlers
    , handler;
  handlers = {
    date: daysSince1899
  };
  handler = handlers[type];

  // process variable if there is a suitable handler

  if (handler) return handler(value);
  return value;
}

/**
 * Get the value of the given variable (includes all type aliases).
 *
 * @param {Object} values
 * @param {String} type
 * @param {String} name
 *
 * @api private
 */

function resolveVariable(values, type, name) {
  var alias = typeAliases[type]
    , value = values[name];

  // give up if the variable name doesn't exist

  if (value == null) return;
  type = (function(){
    var alias = typeAliases[type];
    if (value.type === type) {
      if (alias) return alias;
      return type;
    }
  })();

  // give up too if the type doesn't match

  if (type == null) return;

  // check if there is a variable with a suitable type

  value = processVariable(value.type, value.value);

  // return the real type and value as tupel

  return { type: type, value: value };
}

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
      , type = decl.getAttribute('office:value-type')
      , variable = resolveVariable(values, type, name);
    if (variable) {

      // replace the value with the one of the dictionary

      decl.setAttribute(
        'office:' + variable.type + '-value',
        variable.value
      );
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

/**
 * Calculate excel date shit.
 */

function daysSince1899(timestamp) {
  var diff = 2208990960000
    , res;
  res = timestamp + diff;
  res = res / 100 / 3600 / 24;
  return res;
}
