
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
  var self = this
    , ns;
  ns = [
    'text',
    'office',
    'style'
  ];

  // @api private

  this.xml = xml;
  this.ns = {};

  // register all important namespace to avoid writing them all the time

  ns.forEach(function(ns){
    self.ns[ns] = xml.root().namespace(ns).href();
  });
}

/**
 * Lazy search the styles root element.
 */

Content.prototype.__defineGetter__('styles', function(){
  return this.styles = this.find('//office:automatic-styles')[0];
});

/**
 * Lazy search the user-field-decls root element.
 */

Content.prototype.__defineGetter__('userFieldDeclarations', function(){
  var queryResults = this.find('//text:user-field-decls');
  return this.userFieldDeclarations = queryResults[0];
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
  query = 'style:style[@style:name=' + JSON.stringify(name) + ']';
  return (styles.find(query, this.ns) || [])[0];
};

/**
 * Queries the root element with all available namespaces with `query`. `ns` is
 * optional and gives more namespaces.
 *
 * @api private
 */

Content.prototype.find = function(query, ns){
  var fullNS = {};

  // merge internal namespaces with the user namespace

  merge(fullNS, this.ns, ns);
  return this.xml.root().find(query, fullNS);
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
