
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
  styles = this.xml.get('//*[name()="office:automatic-styles"]');
  return this.styles = styles;
});

/**
 * Lazy search the user-field-decls root element.
 */

Content.prototype.__defineGetter__('userFieldDeclarations', function(){
  var decls;
  decls = this.xml.get('//*[name()="text:user-field-decls"]');
  return this.userFieldDeclarations = decls;
});

/**
 * Pulls the style element with the given name.
 *
 * @param {String} name The name of the desired style.
 */

Content.prototype.style = function(name){
  var styles
    , query;
  styles = this.styles;
  query = './*[name()="style:style"]';
  return styles
    .find(query)
    .filter(function(element){
      return element.attr('name').value() === name;
    })
    [0];
};

/**
 * Generate a new user field declaration.
 *
 * @param {String} type The type of the field.
 * @param {String} name The name of the field.
 * @param {String} value The value of the field.
 */

Content.prototype.declareUserField = function(type, name, value){
  var decls = this.userFieldDeclarations
    , userField = decls.node('text:user-field-decl');
  userField.attr('office:value-type', type);
  userField.attr('text:name', name);
  userField.attr('office:' + type + '-value', value);
  decls.addChild(userField);
  return userField;
};
