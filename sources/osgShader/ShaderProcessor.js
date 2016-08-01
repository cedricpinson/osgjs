'use strict';
var Notify = require( 'osg/Notify' );
var shaderLib = require( 'osgShader/shaderLib' );
var shadowShaderLib = require( 'osgShadow/shaderLib' );
var WebGLCaps = require( 'osg/WebGLCaps' );
var optimizer = require( 'osgShader/optimizer' );
var preProcessor = require( 'osgShader/preProcessor' );

//     Shader as vert/frag/glsl files Using requirejs text plugin
//     Preprocess features like:    //
//     - Handle (recursive) include, avoiding code repeat and help code factorization
//     - Handle per shader and global define/precision


var ShaderProcessor = function ( createInstance ) {

    if ( !createInstance ) {
        if ( ShaderProcessor.instance ) {
            return ShaderProcessor.instance;
        }
        ShaderProcessor.instance = this;
    }

    this._precisionFloat = WebGLCaps.instance().getWebGLParameter( 'MAX_SHADER_PRECISION_FLOAT' );
    this._precisionInt = WebGLCaps.instance().getWebGLParameter( 'MAX_SHADER_PRECISION_INT' );
    this._webgl2 = WebGLCaps.instance().isWebGL2();

    this.addShaders( shaderLib );
    this.addShaders( shadowShaderLib );
    return this;
};

ShaderProcessor.prototype = {
    _shadersText: {},
    _shadersList: {},
    _globalDefaultprecision: '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n#endif',
    _debugLines: false,
    _includeR: /#pragma include "([^"]+)"/g,
    _includeCondR: /#pragma include (["^+"]?["\ "[a-zA-Z_0-9](.*)"]*?)/g,
    _defineR: /\#define\s+([a-zA-Z_0-9]+)/,
    _precisionR: /precision\s+(high|low|medium)p\s+float/,
    _defineShaderNameReg: /#define\sSHADER_NAME\s(\S+)/im,

    // {
    //     'functions.glsl': textShaderFunctions,
    //     'lights.glsl': textShaderFunctions,
    //     'textures.glsl': textShaderFunctions
    // };
    addShaders: function ( shaders ) {

        var keys = window.Object.keys( shaders );

        keys.forEach( function ( key ) {

            this._shadersList[ key ] = key;
            this._shadersText[ key ] = shaders[ key ];

        }, this );

    },


    instrumentShaderlines: function ( content, sourceID ) {
        // TODO instrumentShaderlines
        // http://immersedcode.org/2012/1/12/random-notes-on-webgl/
        // one ID per "file"
        // Each file has its line number starting at 0
        //   handle include, the do that numbering also in preprocess...
        // Then on shader error using sourceID and line you can point the correct line...
        // has to attach that info to osg.shader object.
        /*
          var allLines = content.split('\n');
          var i = 0;
          for (var k = 0; k _< allLines.length; k++) {
          if (!this._includeR.test(allLines[k])) {
          allLines[k] = "#line " + (i++) + " " + sourceID + '\n' + allLines[k] ;
          }
          }
          content = allLines.join('\n');
        */

        // seems just  prefixing first line seems ok to help renumbering error mesg
        return '\n#line ' + 0 + ' ' + sourceID + '\n' + content;
    },

    getShaderTextPure: function ( shaderName ) {

        var preShader = this._shadersText[ shaderName ];

        if ( !preShader ) {
            Notify.error( 'shader file/text: ' + shaderName + ' not registered' );
            preShader = '';
        }

        return preShader;
    },

    getShader: function ( shaderName, defines, extensions, type ) {
        var shader = this.getShaderTextPure( shaderName );
        return this.processShader( shader, defines, extensions, shaderName, type );
    },

    // recursively  handle #include external glsl
    // files (for now in the same folder.)
    preprocess: function ( content, sourceID, includeList, inputsDefines ) {
        var self = this;
        return content.replace( this._includeCondR, function ( _, name ) {
            var includeOpt = name.split( ' ' );
            var includeName = includeOpt[ 0 ].replace( /"/g, '' );

            // pure include is
            // \#pragma include "name";

            // conditionnal include is name included if _PCF defined
            // \#pragma include "name" "_PCF";
            if ( includeOpt.length > 1 && inputsDefines ) {

                // some conditions here.
                // if not defined we do not include
                var found = false;
                var defines = inputsDefines.map( function ( defineString ) {
                    // find '#define', remove duplicate whitespace, split on space and return the define Text
                    return self._defineR.test( defineString ) && defineString.replace( /\s+/g, ' ' ).split( ' ' )[ 1 ];
                } );

                for ( var i = 1; i < includeOpt.length && !found; i++ ) {
                    var key = includeOpt[ i ].replace( /"/g, '' );
                    for ( var k = 0; k < defines.length && !found; k++ ) {

                        if ( defines[ k ] !== false && defines[ k ] === key ) {
                            found = true;
                            break;
                        }

                    }
                }
                if ( !found )
                    return '';
            }

            // already included
            if ( includeList.indexOf( includeName ) !== -1 ) return '';
            // avoid endless loop, not calling the impure
            var txt = this.getShaderTextPure( includeName );
            // make sure it's not included twice
            includeList.push( includeName );
            if ( this._debugLines ) {
                txt = this.instrumentShaderlines( txt, sourceID );
            }
            sourceID++;
            // to the infinite and beyond !
            txt = this.preprocess( txt, sourceID, includeList, inputsDefines );
            return txt;
        }.bind( this ) );

    },

    //  process a shader and define
    //  get a full expanded single shader source code
    //  resolving include dependencies
    //  adding defines
    //  adding line instrumenting.
    processShader: function ( shader, argDefines, argExtensions, shaderName /*, type*/ ) {

        var includeList = [];
        var preShader = shader;
        var sourceID = 0;
        var defines = argDefines;
        var extensions = argExtensions;

        if ( this._debugLines ) {
            preShader = this.instrumentShaderlines( preShader, sourceID );
            sourceID++;
        }

        // removes duplicates
        if ( defines !== undefined ) {
            defines = defines.sort().filter( function ( item, pos ) {
                return !pos || item !== defines[ pos - 1 ];
            } );
        }
        if ( extensions !== undefined ) {
            extensions = extensions.sort().filter( function ( item, pos ) {
                return !pos || item !== extensions[ pos - 1 ];
            } );
        }

        var postShader = this.preprocess( preShader, sourceID, includeList, defines );


        var prePrend = '';
        //if (this._webgl2) prePrend += '#version 300\n'; else // webgl1  (webgl2 #version 300 ?)
        prePrend += '#version 100\n'; // webgl1


        // then
        // it's extensions first
        // See https://khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf
        // p14-15: before any non-processor token
        // add them
        if ( extensions !== undefined ) {
            // could add an extension check support warning there...
            prePrend += extensions.join( '\n' ) + '\n';
        }

        // vertex shader doesn't need precision, it's highp per default, enforced per spec
        // but then not giving precision on uniform/varying might make conflicts arise
        // between both FS and VS if FS default is mediump !
        // && type !== 'vertex'
        if ( this._globalDefaultprecision ) {
            if ( !this._precisionR.test( postShader ) ) {
                // use the shaderhighprecision flag at shaderloader start
                //var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                //var highpSupported = highp.precision != 0;
                prePrend += this._globalDefaultprecision + '\n';
            }
        }

        // if defines
        // add them
        if ( defines !== undefined ) {
            prePrend += defines.join( '\n' ) + '\n';
        }
        postShader = prePrend + postShader;


        if ( defines === undefined ) {
            defines = [];
        }

        defines = defines.map( function ( defineString ) {
            // find '#define', remove duplicate whitespace, split on space and return the define Text
            return this._defineR.test( defineString ) && defineString.replace( /\s+/g, ' ' ).split( ' ' )[ 1 ];
        }.bind( this ) );

        this._osgShader = this._osgShader || require( 'osgShader/osgShader' );
        if ( this._osgShader.enableShaderOptimizer ) {

            var doTimeCompilation = this._osgShader.enableShaderCompilationTiming;

            Notify.info( 'shader optimization: ' + shaderName );
            Notify.info( 'shader before optimization\n' + postShader );

            if ( doTimeCompilation ) console.time( 'shaderPreprocess: ' + shaderName );

            var preprocessedShader = preProcessor( postShader, defines, extensions );
            postShader = preprocessedShader;

            if ( doTimeCompilation ) console.timeEnd( 'shaderPreprocess: ' + shaderName );

            if ( doTimeCompilation ) console.time( 'shaderOptimize: ' + shaderName );

            var optShader = optimizer( postShader, defines, extensions );
            postShader = optShader;

            if ( doTimeCompilation ) console.timeEnd( 'shaderOptimize: ' + shaderName );
            Notify.info( 'shader after optimization\n' + postShader );
        }

        return postShader;
    }
};
module.exports = ShaderProcessor;
