
/**
 * Module dependencies.
 */

var util = require('../util')
  , content = require('../odt-content')
  , variables = util.variables
  , eachNode = util.eachNode
  , resolveVariable = util.resolveVariable;

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
    var tables
      , nodeList;
    nodeList = xml.getElementsByTagName('table:table');
    eachNode(nodeList, function(table){
      var tableName = table.getAttribute('table:name')
        , rowValues = values[tableName];
      if (rowValues) {
        generateRows(table, rowValues);
      }
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
  var rows
    , tableName = table.getAttribute('table:name')
    , tmpl;
  rows = table.getElementsByTagName('table:table-row');

  // extract the template row

  tmpl = rows.length === 2 ? rows.item(1) : rows.item(0);
  currentRow = rows.length;
  rowValues.forEach(function(values){
    var rowId = ++currentRow
      , row = tmpl.cloneNode(true)
      , cells;
    table.appendChild(row);
    cells = row.getElementsByTagName('table:table-cell');

    // each cell needs its own style

    generateStyles(table.ownerDocument, cells, rowId);
    eachNode(cells, function(cell){
      var styleName = cell.getAttribute('table:style-name');
      cell
        .setAttribute(
          'style-name',
          updateStyleName(styleName, rowId)
        )
    });

    // finally update the variable

    rewriteVariables(table.ownerDocument, tableName, row, rowId, values);
  });
  tmpl.parentNode.removeChild(tmpl);
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
  var styles
    , styleNodes
    , odtContent = content(doc);

  // retrieve the root element for the styles

  styles = odtContent.styles;

  // generate new styles for the cells

  eachNode(cells, function(cell){
    var styleNode;
    styleNode = content(doc)
      .style( cell.getAttribute('style:style-name') );
    if (styleNode) {
      styles.appendChild( adaptStyle(styleNode.cloneNode(true), rowId) );
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
  var styleName = style.getAttribute('style:name');
  style.setAttribute(
    'style:name',
    updateStyleName(styleName, rowId)
  );
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
  var docContent = content(doc)
    , tmpl = docContent.userFieldDeclarations.childNodes[0]
    , fields;

  // if the document has no variables there's nothing to do

  if (!tmpl) return variables;
  fields = variables;
  Object.keys(fields).forEach(function(name){
    var field = fields[name]
      , variable = resolveVariable(variables, field.type, name)

      // generate new name based on table name and row id

      , newName = tableName + '.' + rowId + '.' + name
      , getters;

    // remove old declarations

    removeUserFieldDeclarations(
      docContent.userFieldDeclarations,
      name
    );

    // extract all getters

    getters = extractGetters(row, name);

    // and rewrite their name

    getters.forEach(function(getter){
      getter.setAttribute('text:name', newName);
    });
    if (getters.length > 0) {
      docContent.declareUserField(
        doc,
        variable.type,
        newName,
        variable.value
      );
    }
  });
}

/**
 * Removes the user field declaration from the root element.
 *
 * @param {Node} declarations The root of all declarations.
 * @param {String} name The name of the declaration to remove.
 */

function removeUserFieldDeclarations(declarations, name) {
  var nodeList = declarations
    .getElementsByTagName('text:user-field-decl');
  eachNode(nodeList, function(decl){
    if (decl.getAttribute('name') === name) {
      decl.parentNode.removeChild(decl);
    }
  });
}

/**
 * Extracts all variable getters with `name` which are children of the given
 * `element`.
 *
 * @api private
 */

function extractGetters(element, name) {
  var nodeList
    , getters = [];
  nodeList = element.getElementsByTagName('text:user-field-get');
  eachNode(nodeList, function(node){
    if (node.getAttribute('text:name') === name) {
      getters.push(node);
    }
  });
  return getters;
}
