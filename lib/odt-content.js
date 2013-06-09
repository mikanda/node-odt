
// helper class to work with the xml that represents a document.

/**
 * Module dependencies.
 */

var merge = require('merge');

/**
 * Module exports.
 */

module.exports = create;

/**
 * Instantiate a new content wrapper.
 *
 * @param {Document} xml The xml that represents the document.
 */

function create(xml){
  return new Content(xml);
}

/**
 * The wrapper constructor.
 */

function Content(xml){
  var self = this;

  // @api private

  this.xml = xml;
}

/**
 * Lazy search the styles root element.
 */

Content.prototype.__defineGetter__('styles', function(){
  var styles;
  styles = this
    .xml
    .getElementsByTagName('office:automatic-styles')
    [0];
  return this.styles = styles;
});

/**
 * Lazy search the user-field-decls root element.
 */

Content.prototype.__defineGetter__('userFieldDeclarations', function(){
  var decls;
  decls = this
    .xml
    .getElementsByTagName('text:user-field-decls')
    [0];
  return this.userFieldDeclarations = decls;
});

/**
 * Pulls the style element with the given name.
 *
 * @param {String} name The name of the desired style.
 */

Content.prototype.style = function(name){
  var styles
    , query
    , nodes
    , i;
  styles = this.styles;
  nodes = styles.childNodes;
  for (i in nodes) {
    if (nodes[i].tagName === 'style:style'
        && nodes[i].getAttribute('style:name') === name) {
      return nodes[i];
    }
  }
  return null;
};

/**
 * Generate a new user field declaration.
 *
 * @param {String} type The type of the field.
 * @param {String} name The name of the field.
 * @param {String} value The value of the field.
 */

Content.prototype.declareUserField = function(doc, type, name, value){
  var decls = this.userFieldDeclarations
    , userField = doc.createElement('text:user-field-decl');
  userField.setAttribute('office:value-type', type);
  userField.setAttribute('text:name', name);
  userField.setAttribute('office:' + type + '-value', value);
  decls.appendChild(userField);
  return userField;
};
