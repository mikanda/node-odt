
/**
 * Module dependencies.
 */

var util = require('../util')
  , content = require('../odt-content')
  , variables = util.variables;

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

function table(values) {
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

function generateRows(table, rowValues) {
  var ns
    , rows
    , tableName = table.attr('name').value()
    , tmpl;
  ns = { table: table.namespace('table').href() };
  rows = table.find('table:table-row', ns);

  // extract the template row

  tmpl = rows.length === 2 ? rows[1] : rows[0];
  currentRow = rows.length;
  rowValues.forEach(function(values){
    var rowId = ++currentRow
      , row = tmpl.clone()
      , cells;
    table.addChild(row);
    cells = row.find('table:table-cell', ns);

    // each cell needs its own style

    generateStyles(table.doc(), cells, rowId);
    cells.forEach(function(cell){
      var styleName = cell.attr('style-name').value();
      cell.attr('style-name').value(
        updateStyleName(styleName, rowId)
      );
    });

    // finally update the variable

    //rewriteVariables(table.doc(), tableName, row, rowId, values);
  });
}

/**
 * Generate new styles for the `cells` based on `rowId`.  This is used as
 * suffix to the style name.
 *
 * @param {Document} doc The document where the cells belong to.
 * @param {Array} cells The cells to generate styles for.
 * @api private
 */

function generateStyles(doc, cells, rowId){
  var ns
    , styles
    , styleNodes;
  ns = {
    style: doc.root().namespace('style').href(),
    office: doc.root().namespace('office').href()
  };

  // retrieve the root element for the styles

  styles = doc.root().get('//office:automatic-styles', ns);

  // extract all style nodes

  styleNodes = styles.childNodes();

  // generate new styles for the cells

  cells.forEach(function(cell){
    var styleNode;
    styleNode = content(doc)
      .style(
        cell.attr('style-name').value()
      );
    if (styleNode) {
      styles.addChild( adaptStyle(styleNode.clone(), rowId) );
    }
  });
}

/**
 * Extract the prefix part of the style and update it with the `rowId`.
 *
 * @param {String} styleName The name to use.
 * @param {Number} rowId The row-id to use for the update.
 * @api private
 */

function updateStyleName(styleName, rowId){
  var namePrefix = styleName.match(/^(.+)[0-9]+$/)[1];
  return namePrefix + rowId;
}

/**
 * Adapt the name of `style` with `rowId`.
 *
 * @param {Element} style The element to change.
 * @param {Number} rowId The row-id to use.
 * @return {Element} The style-element for chaining.
 * @api private
 */

function adaptStyle(style, rowId){
  var styleName = style.attr('name');
  styleName.value(updateStyleName(styleName.value(), rowId));
  return style;
}

/**
 * Rewrite the rows for a single row.  Each row in the table needs an unique
 * set of variables which must be mapped to the original names.  So the
 * variable value table needs to refactored.
 *
 * @param {Document} doc The document to which the row belongs to.
 * @param {String} tableName The name of the table to which the row belongs to.
 * @param {Element} row The row element which should be rewritten.
 * @param {Object} variables The variable map for the row.
 * @api private
 */

function rewriteVariables(doc, tableName, row, rowId, variables){
  var ns = { text: doc.root().namespace('text').href() }
    , docContent = content(doc)
    , tmpl = docContent.userFieldDeclarations.childNodes()[0];

  // if the document has no variables there's nothing to do

  if (!tmpl) return variables;
  Object.keys(variables).forEach(function(type){
    var fields = variables[type];
    Object.keys(fields).forEach(function(name){
      var value = fields[name]

        // generate new name based on table name and row id

        , newName = tableName + '.' + rowId + '.' + name
        , getters;

      // extract all setters

      getters = row.find(
        './/text:user-field-get[@text:name=' + JSON.stringify(name) + ']',
        ns
      );

      // and rewrite their name

      getters.forEach(function(getter){
        getter.attr('name').value(newName);
      });
      if (getters.length > 0) {
        docContent.declareUserField(type, newName, value);
      }
    });
  });
}
