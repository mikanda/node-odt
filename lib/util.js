
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
  date: 'float',
  cent: 'float'
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
    date: daysSince1899,
    cent: function(value){

      // convert cent to euro

      return value / 100;
    }
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
    var alias = typeAliases[value.type];
    if (value.type === type) return alias || type;
    else if (alias === type) return alias;
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
      , variable = resolveVariable(values, type, name)
      , valueAttrName;
    if (variable) {

      // replace the value with the one of the dictionary

      if (variable.type === 'string') {
        valueAttrName = 'office:' + variable.type + '-value';
      } else {
        valueAttrName = 'office:value';
      }
      decl.setAttribute(
        valueAttrName,
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
 *
 * (http://www.fourmilab.ch/documents/calendar/)
 */

function daysSince1899(date) {
  var J1970 = 2440587.5  // Julian date at Unix epoch: 1970-01-01
    , J1900 = 2415020.5  // Epoch (day 1) of Excel 1900 date system (PC)
    , timestamp
    , julianDay;

  // the date can be either a javascript date or an unix timestamp

  if (date instanceof Date) {
    timestamp = Math.round(date.getTime() / 1000);
  } else {
    timestamp = date;
  }
  julianDay = J1970 + (timestamp / (60 * 60 * 24));

  // calculate day number

  value = (julianDay - J1900) + 1 +

    /*  Microsoft marching morons thought 1900 was a leap year.
        Adjust dates after 1900-02-28 to compensate for their
        idiocy.  */

    ((julianDay > 2415078.5) ? 1 : 0);
  return value;
}
