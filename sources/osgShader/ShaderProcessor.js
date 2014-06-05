/*global define,require */

define( [
    'osgShader/ShaderLib'

], function ( shaderLib ) {

    var shaderPrefix = shaderLib.prefix;

    //     Manage External Load Shader
    //     Or storage as json inside code
    //     (like concatened from shader file
    //     to json using a build tool like grunt)
    //     TODO: tests load/reload shaders for realtime editing.
    //
    //     Idea is to be able to edit shader in separate files than js, getting readable code, and avoid string/shader duplication in code, resulting in min code.
    //     Handle loading shader files using ajax,json,jsonp or  even inline, with a grunt dir2json task that will generate according files.
    //     Handle (recursive) include, avoiding code repeat and help code factorization
    //     Handle per shader and global define (upon extension supported, hw capabilites ("highp precision") or shader usage ("LAMBERT or BLINN_PHONG").)
    //     Possible afterward Todo list:
    //     use glsl optimizer on shaders
    //     use glsl minimizer on shaders.
    /**
     * @class ShaderLoader
     */

    var getParametersURL = function () {
        var params = {};
        var urlParam = window.location.href;
        if ( urlParam.indexOf( '?' ) !== -1 ) {
            urlParam = urlParam.split( '?' )[ 1 ];
            if ( urlParam.length > 1 ) {
                // this detection does not work well
                // it fails on "https://localhost.com/?testNumber=31"
                urlParam = urlParam.replace( /&&/g, '&' ).replace( /^&/g, '' ).replace( /&/g, '\',\'' ).replace( /=/g, '\':\'' );
                urlParam = decodeURI( urlParam );
                urlParam = JSON.parse( '{"' + urlParam + '"}' );
                for ( var option in urlParam ) {
                    var val = parseFloat( urlParam[ option ] );
                    if ( !isNaN( val ) )
                        params[ option ] = val;
                    else
                        params[ option ] = urlParam[ option ];
                }
            }
        }
        return params;
    };

    var ShaderLoader = function ( opt ) {
        var options = opt;
        if ( !options ) {
            options = {
                inline: getParametersURL()[ 'debug' ] ? false : true,
                callbacksingle: function ( file ) {
                    window.dbg.viewer.log( file + 'is loaded' );
                },
                libs: [ {
                    loadprefix:  shaderPrefix,
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


        initShaderLib: function ( lib, inline ) {

            if ( !lib.loadprefix ) lib.loadprefix = '';
            var i;
            for ( i in lib.shaders ) {
                if ( lib.shaders.hasOwnProperty( i ) ) {
                    this._numtoLoad++;
                }
            }
            if ( !inline ) {
                for ( i in lib.shaders ) {
                    if ( lib.shaders.hasOwnProperty( i ) ) {
                        this._shadersList[ i ] = lib.loadprefix + i;
                    }
                }
                this._loaded = false;

            } else {
                for ( i in lib.shaders ) {
                    if ( lib.shaders.hasOwnProperty( i ) ) {
                        this._shadersList[ i ] = i;
                        this._shadersText[ i ] = lib.shaders[ i ];
                        if ( this._callbackSingle ) this._callbackSingle( i );
                        this._numtoLoad--;
                    }
                }
                this._loaded = true;

                window.dbg.viewer.assert( this._numtoLoad === 0 );
            }

        },

        init: function(options) {

            this._callbackSingle = options.callbackSingle;
            this._numtoLoad = 0;

            if ( options.libs ) {
                options.libs.forEach( function( lib ) {
                    this.initShaderLib( lib, options.inline );
                }, this );
            }

            return this;
/*
            if ( !options.loadprefix ) options.loadprefix = '';
            var i;
            for ( i in options.shaders ) {
                if ( options.shaders.hasOwnProperty( i ) ) {
                    this._numtoLoad++;
                }
            }
            if ( !options.inline ) {
                for ( i in options.shaders ) {
                    if ( options.shaders.hasOwnProperty( i ) ) {
                        this._shadersList[ i ] = options.loadprefix + i;
                    }
                }
                this._loaded = false;

            } else {
                for ( i in options.shaders ) {
                    if ( options.shaders.hasOwnProperty( i ) ) {
                        this._shadersList[ i ] = i;
                        this._shadersText[ i ] = options.shaders[ i ];
                        if ( this._callbackSingle ) this._callbackSingle( i );
                        this._numtoLoad--;
                    }
                }
                this._loaded = true;

                window.dbg.viewer.assert( this._numtoLoad === 0 );
            }
            return this;
            */
        },
        load: function( shaderFilename, shaderName, callbackSingle ) {

            if ( !this._shadersList[ shaderName ] )
                this._shadersList[ shaderName ] = shaderFilename;

            // require the shader
            require( [ 'text!'+shaderFilename ], function ( content ) {

                this._shadersText[ shaderName ] = content;
                if ( this._callbackSingle ) this._callbackSingle();
                this._numtoLoad--;

            }.bind( this ) );

            if ( callbackSingle )
                this._callbackSingle = callbackSingle;

            return this;
        },

        loadAll: function ( options ) {
            if ( this._numtoLoad > 0 ) {

                Object.keys( this._shadersList ).forEach( function( shader ) {
                    var shaderPath = this._shadersList[ shader ];
                    this.load( shaderPath, shader, options && options.callbackSingle );
                }, this );

            }
            return this;
        },

        reloadAll: function ( options ) {
            this._shaderLoaded = {};
            this._loaded = false;
            this._numtoLoad = 0;

            Object.keys( this._shadersList ).forEach( function( shader ) {
                // unload from require
                require.undef( 'vendors/require/text!'+ shader );
                this._numtoLoad++;

            }, this );

            this.loadAll( options );
            return this;
        },

        reload: function ( options ) {
            this._shaderLoaded[ options.shaderName ] = undefined;
            this._loaded = false;
            this._numtoLoad = 1;

            // unload from require
            var shaderPath = this._shadersList[ options.shaderName ];
            require.undef( 'vendors/require/text!' + shaderPath );

            this.load( this._shaders[ options.shaderName ], options && options.shaderName, options && options.callbackSingle );
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
            }
            else {
                preShader = this._shadersText[ shaderName ];
            }
            return preShader;
        },

        getShader: function( shaderName ) {
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

});
