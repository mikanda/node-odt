
/**
 * Module dependencies.
 */

var util = require('../util')
  , placeholder = util.placeholder;

/**
 * Module exports.
 */

module.exports = table;

/**
 * Applies a table value object on the template.  A table object is constructed
 * like the following:
 *
 *   { 'table-name': [ <values> ] }
 *
 * @param {Object} values The values to apply.
 */

function table(values){
  return function(xml, done){
    var ns;

    // namespace declaration (oh my! xml sucks!)

    ns = { table: xml.root().namespace('table').href() };
    xml
      .root()
      .find('//table:table', ns)
      .filter(function(table){
        return !!values[table.attr('name').value()];
      })
      .forEach(function(table){
        var name = table.attr('name').value()
          , rowValues = values[name];
        generateRows(table, rowValues);
      });
    done();
  };
}

/**
 * Generates the rows of the table and fills them with the values.
 *
 * @param {Element} table The table to modify.
 * @param {Object} rowValues The values to fill in.
 */

function generateRows(table, rowValues){
  var ns
    , rows
    , tmpl;
  ns = { table: table.namespace('table').href() };
  rows = table.find('//table:table-row', ns);
  tmpl = rows.length === 2
    ? rows[1] : rows[0];
  rowValues.forEach(function(values){
    var clone = tmpl.clone();
    table.addChild(clone);
    placeholder(clone, values);
  });
}
