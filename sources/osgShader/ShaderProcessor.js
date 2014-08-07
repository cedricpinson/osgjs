define( [
    'osg/Notify',
    'osgShader/ShaderLib'
], function ( Notify, shaderLib ) {
    'use strict';

    var shaderPrefix = shaderLib.prefix;

    //     Shader as vert/frag/glsl files Using requirejs text plugin
    //     Preprocess features like:    //
    //     - Handle (recursive) include, avoiding code repeat and help code factorization
    //     - Handle per shader and global define/precision
    /**
     * @class ShaderLoader
     */


    var ShaderLoader = function ( opt ) {
        var options = opt;
        if ( !options ) {
            options = {
                callbacksingle: function ( file ) {
                    window.dbg.viewer.log( file + 'is loaded' );
                },
                libs: [ {
                    loadprefix: shaderPrefix,
                    shaders: shaderLib
                } ]
            };
        }
        this.init( options );
    };

    /** @lends osg.ShaderLoader.prototype */
    ShaderLoader.prototype = {
        _shadersText: {},
        _shadersList: {},
        _shaderLoaded: {},
        _loaded: false,
        _callbackSingle: false,
        _numtoLoad: 0,
        _globalDefaultDefines: '',
        _globalDefaultprecision: '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n#endif',
        _debugLines: false,
        _includeR: /#pragma include "([^"]+)"/g,
        _defineR: /#define\s+([a-zA-Z_0-9]+)\s+(.*)/,
        _precisionR: /precision\s+(high|low|medium)p\s+float/,

        initShaderLib: function ( lib ) {

            if ( !lib.loadprefix ) lib.loadprefix = '';
            var i;
            for ( i in lib.shaders ) {
                if ( lib.shaders.hasOwnProperty( i ) ) {
                    this._numtoLoad++;
                }
            }
            for ( i in lib.shaders ) {
                if ( lib.shaders.hasOwnProperty( i ) ) {
                    this._shadersList[ i ] = i;
                    this._shadersText[ i ] = lib.shaders[ i ];
                    if ( this._callbackSingle ) this._callbackSingle( i );
                    this._numtoLoad--;
                }
            }
            this._loaded = true;

            Notify.assert( this._numtoLoad === 0 );


        },

        init: function ( options ) {

            this._callbackSingle = options.callbackSingle;
            this._numtoLoad = 0;

            if ( options.libs ) {
                options.libs.forEach( function ( lib ) {
                    this.initShaderLib( lib );
                }, this );
            }

            return this;
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
              for (var k = 0; k < allLines.length; k++) {
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
            var preShader;

            if ( !( shaderName in this._shadersText ) ) {
                // directory include/prefix problems.
                for ( var name in this._shadersText ) {
                    if ( name.indexOf( shaderName ) !== -1 ) {
                        preShader = this._shadersText[ name ];
                        break;
                    }
                }
                if ( !preShader ) {
                    window.dbg.viewer.error( 'shader file/text: ' + shaderName + ' not loaded' );
                    return '';
                }
            } else {
                preShader = this._shadersText[ shaderName ];
            }
            return preShader;
        },

        getShader: function ( shaderName ) {
            var shader = this.getShaderTextPure( shaderName );
            return this.processShader( shader );
        },

        // recursively  handle #include external glsl
        // files (for now in the same folder.)
        preprocess: function ( content, sourceID, includeList ) {
            return content.replace( this._includeR, function ( _, name ) {
                // \#pragma include 'name';
                // already included
                if ( includeList.indexOf( name ) !== -1 ) return '';
                // avoid endless loop, not calling the impure
                var txt = this.getShaderTextPure( name );
                // make sure it's not included twice
                includeList.push( name );
                if ( this._debugLines ) {
                    txt = this.instrumentShaderlines( txt, sourceID );
                }
                sourceID++;
                // to the infinite and beyond !
                txt = this.preprocess( txt, sourceID, includeList );
                return txt;
            }.bind( this ) );
        },

        //  process a shader and define
        //  get a full expanded single shader source code
        //  resolving include dependencies
        //  adding defines
        //  adding line instrumenting.
        processShader: function ( shader, defines ) {
            var includeList = [];
            var preShader = shader;
            var sourceID = 0;
            if ( this._debugLines ) {
                preShader = this.instrumentShaderlines( preShader, sourceID );
                sourceID++;
            }
            var postShader = this.preprocess( preShader, sourceID, includeList );

            var prePrend = '';
            if ( this._globalDefaultprecision ) {
                if ( !this._precisionR.test( postShader ) ) {
                    // use the shaderhighprecision flag at shaderloader start
                    //var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                    //var highpSupported = highp.precision != 0;
                    prePrend += this._globalDefaultprecision + '\n';
                }
            }

            if ( !defines ) defines = [];
            defines.push( this._globalDefaultDefines );

            prePrend += defines.join( '\n' ) + '\n';
            postShader = prePrend + postShader;
            return postShader;
        }
    };
    return ShaderLoader;

} );
