define( [
    'Q',
    'osg/Notify',
    'osg/Utils',
    'osg/TextureManager',
    'osg/StateAttribute',
    'osg/Uniform',
    'osg/Image',
    'osg/ShaderGenerator',
    'osgDB/ReaderParser'
], function ( Q, Notify, MACROUTILS, TextureManager, StateAttribute, Uniform, Image, ShaderGenerator, ReaderParser ) {

    // helper
    var isPowerOf2 = function ( x ) {
        /*jshint bitwise: false */
        return ( ( x !== 0 ) && ( ( x & ( ~x + 1 ) ) === x ) );
        /*jshint bitwise: true */
    };


    /**
     * Texture encapsulate webgl texture object
     * @class Texture
     * @inherits StateAttribute
     */
    var Texture = function () {
        StateAttribute.call( this );
        this.setDefaultParameters();
        this._applyTexImage2DCallbacks = [];
    };
    Texture.DEPTH_COMPONENT = 0x1902;
    Texture.ALPHA = 0x1906;
    Texture.RGB = 0x1907;
    Texture.RGBA = 0x1908;
    Texture.LUMINANCE = 0x1909;
    Texture.LUMINANCE_ALPHA = 0x190A;

    // filter mode
    Texture.LINEAR = 0x2601;
    Texture.NEAREST = 0x2600;
    Texture.NEAREST_MIPMAP_NEAREST = 0x2700;
    Texture.LINEAR_MIPMAP_NEAREST = 0x2701;
    Texture.NEAREST_MIPMAP_LINEAR = 0x2702;
    Texture.LINEAR_MIPMAP_LINEAR = 0x2703;

    // wrap mode
    Texture.CLAMP_TO_EDGE = 0x812F;
    Texture.REPEAT = 0x2901;
    Texture.MIRRORED_REPEAT = 0x8370;

    // target
    Texture.TEXTURE_2D = 0x0DE1;
    Texture.TEXTURE_CUBE_MAP = 0x8513;
    Texture.TEXTURE_BINDING_CUBE_MAP = 0x8514;
    Texture.TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
    Texture.TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
    Texture.TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
    Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
    Texture.TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
    Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851A;
    Texture.MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;

    Texture.UNSIGNED_BYTE = 0x1401;
    Texture.FLOAT = 0x1406;

    Texture.textureManager = new TextureManager();

    /** @lends Texture.prototype */
    Texture.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {
        attributeType: 'Texture',
        cloneType: function () {
            var t = new Texture();
            t.defaultType = true;
            return t;
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType;
        },
        getOrCreateUniforms: function ( unit ) {
            if ( Texture.uniforms === undefined ) {
                Texture.uniforms = [];
            }
            if ( Texture.uniforms[ unit ] === undefined ) {
                var name = this.getType() + unit;
                var uniforms = {};
                uniforms.texture = Uniform.createInt1( unit, name );
                uniforms.uniformKeys = window.Object.keys( uniforms );
                Texture.uniforms[ unit ] = uniforms;
            }
            // uniform for an texture attribute should directly in Texture.uniforms[unit] and not in Texture.uniforms[unit][Texture0]
            return Texture.uniforms[ unit ];
        },
        setDefaultParameters: function () {
            this._image = undefined;
            this._magFilter = Texture.LINEAR;
            this._minFilter = Texture.LINEAR;
            this._wrapS = Texture.CLAMP_TO_EDGE;
            this._wrapT = Texture.CLAMP_TO_EDGE;
            this._textureWidth = 0;
            this._textureHeight = 0;
            this._unrefImageDataAfterApply = false;
            this._internalFormat = undefined;
            this._textureTarget = Texture.TEXTURE_2D;
            this._type = Texture.UNSIGNED_BYTE;
        },
        getTextureTarget: function () {
            return this._textureTarget;
        },
        getTextureObject: function () {
            return this._textureObject;
        },
        setTextureSize: function ( w, h ) {
            this._textureWidth = w;
            this._textureHeight = h;
        },
        init: function ( gl ) {
            if ( !this._textureObject ) {
                this._textureObject = Texture.textureManager.generateTextureObject( gl,
                                                                                    this,
                                                                                    this._textureTarget,
                                                                                    this._internalFormat,
                                                                                    this._textureWidth,
                                                                                    this._textureHeight );
                this.dirty();
            }
        },
        addApplyTexImage2DCallback: function ( callback ) {
            var index = this._applyTexImage2DCallbacks.indexOf( callback );
            if ( index < 0 ) {
                this._applyTexImage2DCallbacks.push( callback );
            }
        },
        removeApplyTexImage2DCallback: function ( callback ) {
            var index = this._applyTexImage2DCallbacks.indexOf( callback );
            if ( index >= 0 ) {
                this._applyTexImage2DCallbacks.splice( index, 1 );
            }
        },
        getWidth: function () {
            return this._textureWidth;
        },
        getHeight: function () {
            return this._textureHeight;
        },
        releaseGLObjects: function ( gl ) {

            if ( this._textureObject !== undefined && this._textureObject !== null ) {
                this._textureObject.releaseTextureObject( gl );
                this._textureObject = undefined;
                this._image = undefined;
            }
        },
        setWrapS: function ( value ) {
            if ( typeof ( value ) === 'string' ) {
                this._wrapS = Texture[ value ];
            } else {
                this._wrapS = value;
            }
        },
        setWrapT: function ( value ) {
            if ( typeof ( value ) === 'string' ) {
                this._wrapT = Texture[ value ];
            } else {
                this._wrapT = value;
            }
        },

        getWrapT: function () {
            return this._wrapT;
        },
        getWrapS: function () {
            return this._wrapS;
        },
        getMinFilter: function () {
            return this._minFilter;
        },
        getMagFilter: function () {
            return this._magFilter;
        },

        setMinFilter: function ( value ) {
            if ( typeof ( value ) === 'string' ) {
                this._minFilter = Texture[ value ];
            } else {
                this._minFilter = value;
            }
        },
        setMagFilter: function ( value ) {
            if ( typeof ( value ) === 'string' ) {
                this._magFilter = Texture[ value ];
            } else {
                this._magFilter = value;
            }
        },

        setImage: function ( img, imageFormat ) {

            var image = img;
            if ( img instanceof window.Image ||
                 img instanceof HTMLCanvasElement ||
                 img instanceof Uint8Array ) {
                     image = new Image( img );
                 }

            this._image = image;
            this.setImageFormat( imageFormat );
            this.dirty();
        },
        getImage: function () {
            return this._image;
        },
        setImageFormat: function ( imageFormat ) {
            if ( imageFormat ) {
                if ( typeof ( imageFormat ) === 'string' ) {
                    imageFormat = Texture[ imageFormat ];
                }
                this._imageFormat = imageFormat;
            } else {
                this._imageFormat = Texture.RGBA;
            }
        },
        setType: function ( value ) {
            if ( typeof ( value ) === 'string' ) {
                this._type = Texture[ value ];
            } else {
                this._type = value;
            }
        },
        setUnrefImageDataAfterApply: function ( bool ) {
            this._unrefImageDataAfterApply = bool;
        },
        setInternalFormat: function ( internalFormat ) {
            this._internalFormat = internalFormat;
        },
        getInternalFormat: function () {
            return this._internalFormat;
        },

        applyFilterParameter: function ( gl, target ) {

            var powerOfTwo = isPowerOf2( this._textureWidth ) && isPowerOf2( this._textureHeight );
            if ( !powerOfTwo ) {
                this.setWrapT( Texture.CLAMP_TO_EDGE );
                this.setWrapS( Texture.CLAMP_TO_EDGE );

                if ( this._minFilter === Texture.LINEAR_MIPMAP_LINEAR ||
                     this._minFilter === Texture.LINEAR_MIPMAP_NEAREST ) {
                         this.setMinFilter( Texture.LINEAR );
                     }
            }

            gl.texParameteri( target, gl.TEXTURE_MAG_FILTER, this._magFilter );
            gl.texParameteri( target, gl.TEXTURE_MIN_FILTER, this._minFilter );
            gl.texParameteri( target, gl.TEXTURE_WRAP_S, this._wrapS );
            gl.texParameteri( target, gl.TEXTURE_WRAP_T, this._wrapT );
        },

        generateMipmap: function ( gl, target ) {
            if ( this._minFilter === gl.NEAREST_MIPMAP_NEAREST ||
                 this._minFilter === gl.LINEAR_MIPMAP_NEAREST ||
                 this._minFilter === gl.NEAREST_MIPMAP_LINEAR ||
                 this._minFilter === gl.LINEAR_MIPMAP_LINEAR ) {
                     gl.generateMipmap( target );
                 }
        },
        applyTexImage2D: function ( gl ) {
            var args = Array.prototype.slice.call( arguments, 1 );
            MACROUTILS.timeStamp( 'osgjs.metrics:Texture.texImage2d' );
            gl.texImage2D.apply( gl, args );

            // call a callback when upload is done if there is one
            var numCallback = this._applyTexImage2DCallbacks.length;
            if ( numCallback > 0 ) {
                for ( var i = 0, l = numCallback; i < l; i++ ) {
                    this._applyTexImage2DCallbacks[ i ].call( this );
                }
            }
        },
        computeTextureFormat: function() {
            if ( !this._internalFormat ) {
                this._internalFormat = this._imageFormat || Texture.RGBA;
                this._imageFormat = this._internalFormat;
            } else {
                this._imageFormat = this._internalFormat;
            }

        },
        apply: function ( state ) {
            var gl = state.getGraphicContext();

            if ( this._textureObject !== undefined && !this.isDirty() ) {
                this._textureObject.bind( gl );
            } else if ( this.defaultType ) {
                gl.bindTexture( this._textureTarget, null );
            } else {
                var image = this._image;
                if ( image !== undefined ) {

                    // when data is ready we will upload it to the gpu
                    if ( image.isReady() ) {

                        // must be called before init
                        this.computeTextureFormat();

                        var imgWidth = image.getWidth() || this._textureWidth;
                        var imgHeight = image.getHeight() || this._textureHeight;

                        this.setTextureSize( imgWidth, imgHeight );

                        if ( !this._textureObject ) {
                            this.init( gl );
                        }

                        this.setDirty( false );
                        this._textureObject.bind( gl );

                        if ( image.isTypedArray() ) {
                            this.applyTexImage2D( gl,
                                                  this._textureTarget,
                                                  0,
                                                  this._internalFormat,
                                                  this._textureWidth,
                                                  this._textureHeight,
                                                  0,
                                                  this._internalFormat,
                                                  this._type,
                                                  this._image.getImage() );
                        } else {
                            this.applyTexImage2D( gl,
                                                  this._textureTarget,
                                                  0,
                                                  this._internalFormat,
                                                  this._internalFormat,
                                                  this._type,
                                                  image.getImage() );
                        }

                        this.applyFilterParameter( gl, this._textureTarget );
                        this.generateMipmap( gl, this._textureTarget );

                        if ( this._unrefImageDataAfterApply ) {
                            this._image = undefined;
                        }

                    } else {
                        gl.bindTexture( this._textureTarget, null );
                    }

                } else if ( this._textureHeight !== 0 && this._textureWidth !== 0 ) {

                    // must be called before init
                    this.computeTextureFormat();

                    if ( !this._textureObject ) {
                        this.init( gl );
                    }
                    this._textureObject.bind( gl );
                    this.applyTexImage2D( gl, this._textureTarget, 0, this._internalFormat, this._textureWidth, this._textureHeight, 0, this._internalFormat, this._type, null );

                    this.applyFilterParameter( gl, this._textureTarget );
                    this.generateMipmap( gl, this._textureTarget );
                    this.setDirty( false );
                }
            }
        },


        /**
         set the injection code that will be used in the shader generation
         for FragmentMain part we would write something like that
         @example
         var fragmentGenerator = function(unit) {
         var str = 'texColor' + unit + ' = texture2D( Texture' + unit + ', FragTexCoord' + unit + '.xy );\n';
         str += 'fragColor = fragColor * texColor' + unit + ';\n';
         };
         setShaderGeneratorFunction(fragmentGenerator, ShaderGenerator.Type.FragmentMain);

         */
        setShaderGeneratorFunction: function (
            /**Function*/
            injectionFunction,
            /**ShaderGenerator.Type*/
            mode ) {
                this[ mode ] = injectionFunction;
            },

        generateShader: function ( unit, type ) {
            if ( this[ type ] ) {
                return this[ type ].call( this, unit );
            }
            return '';
        }
    } ), 'osg', 'Texture' );

    Texture.prototype[ ShaderGenerator.Type.VertexInit ] = function ( unit ) {
        var str = 'attribute vec2 TexCoord' + unit + ';\n';
        str += 'varying vec2 FragTexCoord' + unit + ';\n';
        return str;
    };
    Texture.prototype[ ShaderGenerator.Type.VertexMain ] = function ( unit ) {
        return 'FragTexCoord' + unit + ' = TexCoord' + unit + ';\n';
    };
    Texture.prototype[ ShaderGenerator.Type.FragmentInit ] = function ( unit ) {
        var str = 'varying vec2 FragTexCoord' + unit + ';\n';
        str += 'uniform sampler2D Texture' + unit + ';\n';
        str += 'vec4 texColor' + unit + ';\n';
        return str;
    };
    Texture.prototype[ ShaderGenerator.Type.FragmentMain ] = function ( unit ) {
        var str = 'texColor' + unit + ' = texture2D( Texture' + unit + ', FragTexCoord' + unit + '.xy );\n';
        str += 'fragColor = fragColor * texColor' + unit + ';\n';
        return str;
    };


    Texture.createFromURL = function ( imageSource, format ) {
        var texture = new Texture();
        Q.when( ReaderParser.readImage( imageSource ) ).then(
            function ( img ) {
                texture.setImage( img, format );
            }
        );
        return texture;
    };

    Texture.createFromImage = function ( image, format ) {
        var a = new Texture();
        a.setImage( image, format );
        return a;
    };

    Texture.createFromCanvas = function ( canvas, format ) {
        return Texture.createFromImage( canvas, format );
    };

    Texture.create = function ( url ) {
        Notify.log( 'Texture.create is deprecated, use Texture.createFromURL instead' );
        return Texture.createFromURL( url );
    };

    return Texture;
} );
