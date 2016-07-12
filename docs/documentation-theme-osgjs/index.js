'use strict';

var fs = require('fs'),
  path = require('path'),
  File = require('vinyl'),
  vfs = require('vinyl-fs'),
  concat = require('concat-stream'),
  utils = require('documentation-theme-utils'),
  hljs = require('highlight.js'),
  Handlebars = require('handlebars'),
  getDoc = require('globals-docs').getDoc,
  remark = require('remark'),
  html = require('remark-html');


/**
 * Link text to this page or to a central resource.
 * @param {Array<string>} paths list of valid namespace paths that are linkable
 * @param {string} text inner text of the link
 * @returns {string?} potentially a url
 */
function getNamedLink(paths, text) {
  if (paths.indexOf(text) !== -1) {
    return '#' + text;
  } else if (getDoc(text)) {
    return getDoc(text);
  }
}

/**
 * Link text to this page or to a central resource.
 * @param {Array<string>} paths list of valid namespace paths that are linkable
 * @param {string} text inner text of the link
 * @param {string} description link text override
 * @returns {string} potentially linked HTML
 */
function autolink(paths, text, description) {
  var url = getNamedLink(paths, text);
  if (url) {
    return '<a href="' + url + '">' + (description || text) + '</a>';
  }
  return text;
}

/**
 * Format a parameter name. This is used in formatParameters
 * and just needs to be careful about differentiating optional
 * parameters
 *
 * @param {Object} param a param as a type spec
 * @returns {string} formatted parameter representation.
 */
function formatParameter(param) {
  return (param.type && param.type.type === 'OptionalType') ?
  '[' + param.name + ']' : param.name;
}

/**
 * Format the parameters of a function into a quickly-readable
 * summary that resembles how you would call the function
 * initially.
 *
 * @returns {string} formatted parameters
 */
function formatParameters() {
  if (!this.params) {
    return '';
  }
  return '(' + this.params.map(function (param) {
    return formatParameter(param);
  }).join(', ') + ')';
}

var htmlOptions = {
  entities: false
};

module.exports = function (comments, options, callback) {

  var pageTemplate = Handlebars.compile(fs.readFileSync(path.join(__dirname, 'index.hbs'), 'utf8'));

  var hljsOptions = options.hljs || {};
  hljs.configure(hljsOptions);


  Handlebars.registerPartial('section',
    Handlebars.compile(fs.readFileSync(path.join(__dirname, 'section.hbs'), 'utf8'), {
      preventIndent: true
    })
  );

  var paths = comments.map(function (comment) {
    return comment.path.join('.');
  }).filter(function (path) {
    return path;
  });

  Handlebars.registerHelper('permalink', function () {
    var path = [];
    for ( var i = 0; i < this.path.length; i++ ) {
      path.push( this.path[ i ].name );
    }
    return path.join('.');
  });

  var isTutorial = function ( comment ) {
    var res = false;
    for ( var i = 0; i < comment.tags.length; i++ ) {
      if ( comment.tags[ i ].title === 'tutorial' ) {
        res = true;
        break;
      }
    }
    return res;
  };

  Handlebars.registerHelper('name_', function () {
    var memberof = options.name.split( '.' )[ 0 ];
    var name = this.name;
    if ( this.memberof === memberof || isTutorial( this ) )
      while ( name.indexOf( '_' ) !== -1 )
        name = name.replace( '_', ' ' );
    return name;
  });

  Handlebars.registerHelper('name_split', function () {
    return options.name.split( '.' )[ 0 ];
  } );

  Handlebars.registerHelper('even_row', function ( conditional ) {
    if ( conditional % 2 === 0 )
      return 'bg-odd';
    else
      return 'bg-even';
  } );

  Handlebars.registerHelper('if_not_function', function ( opts ) {
    if ( this.kind !== 'function' )
      return opts.fn(this);
    else
        return opts.inverse(this);
  } );

  Handlebars.registerHelper('autolink', function (text) {
    return autolink(paths, text);
  });

  Handlebars.registerHelper('format_params', formatParameters);

  Handlebars.registerHelper('if_eq', function(a, b, opts) {
      if(a == b) // Or === depending on your needs
          return opts.fn(this);
      else
          return opts.inverse(this);
  });

  Handlebars.registerHelper('logo', function () {
    var logo;
    if ( options.config !== undefined && options.config.logo !== undefined ) {
      logo = 'assets/' + options.config.logo.split( '/' ).pop();
    }
    return logo;
  });

  var getLink = function( tags ) {
    var res;
    for ( var i = 0; i < tags.length; i++ ) {
      if ( tags[ i ].title === 'link' ) {
        res = tags[ i ].description;
        break;
      }
    }
    return res;
  }

  Handlebars.registerHelper('link_tags', function () {
    var link = getLink( this.tags );
    return link;
  });

  Handlebars.registerHelper('if_link', function(a, opts) {
      if( getLink( a ) !== undefined ) // Or === depending on your needs
          return opts.fn(this);
      else
          return opts.inverse(this);
  });

  /**
   * This helper is exposed in templates as `md` and is useful for showing
   * Markdown-formatted text as proper HTML.
   *
   * @name formatMarkdown
   * @param {string} string
   * @returns {string} string
   * @example
   * var x = '## foo';
   * // in template
   * // {{ md x }}
   * // generates <h2>foo</h2>
   */
  Handlebars.registerHelper('md', function formatMarkdown(string) {
    if ( string !== '' && string !== undefined ) {
      
      var ast = {
        type: 'root',
        children: string.children
      };

      return new Handlebars.SafeString( remark().use(html).stringify( ast ) );
    }
  });

  Handlebars.registerHelper('format_type', function (type) {

    if ( type !== undefined ) {
      var type_str; 
      if ( type.name !== undefined )
        type_str = type.name.toLowerCase();
      else if ( type.expression !== undefined && type.expression.name !== undefined )
        type_str = type.expression.name.toLowerCase();
      else
        type_str = '';
      var formatted = remark().use(html, htmlOptions)
        .stringify({
          type: 'root',
          children: utils.formatType(type, paths)
        });
      return '<span class="type-hint type-hint-' + type_str + '">' + formatted + '</span>';
    }
  });


  Handlebars.registerHelper('highlight', function (example) {
    if (hljsOptions.highlightAuto) {
      return hljs.highlightAuto(example).value;
    }
    return hljs.highlight('js', example).value;
  });

  // push assets into the pipeline as well.
  vfs.src([__dirname + '/assets/**'/*, process.cwd() + '/' + options.config.logo*/ ], { base: __dirname })
    .pipe(concat(function (files) {
      callback(null, files.concat(new File({
        path: 'index.html',
        contents: new Buffer(pageTemplate({
          docs: comments,
          options: options
        }), 'utf8')
      })));
    }));
};
