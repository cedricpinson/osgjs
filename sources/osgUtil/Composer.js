define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Node',
    'osg/Depth',
    'osg/Texture',
    'osg/Camera',
    'osg/FrameBufferObject',
    'osg/Viewport',
    'osg/Matrix',
    'osg/Uniform',
    'osg/StateSet',
    'osg/Program',
    'osg/Shader',
    'osg/Shape',
    'osg/TransformEnums',
    'osg/Vec2',
    'osg/Vec3'
], function ( Notify, MACROUTILS, Node, Depth, Texture, Camera, FrameBufferObject, Viewport, Matrix,  Uniform, StateSet, Program, Shader, Shape, TransformEnums, Vec2, Vec3 ) {

    /*
     Composer is an helper to create post fx. The idea is to push one or more textures into a pipe of shader filter.

     how to use it:

     // example how to blur a texture and render it to screen
     var myTexture; // imagine it's your texture you want to process
     var composer = new Composer();
     composer.addPass(new Composer.Filter.InputTexture(myTexture));
     composer.addPass(new Composer.Filter.HBlur(5));
     composer.addPass(new Composer.Filter.VBlur(5));
     composer.renderToScreen(1200, 900);
     composer.build(); // if you dont build manually it will be done in the scenegraph while upading
     rootnode.addChild(composer);

     // now you can imagine to some process and use the result as input texture for a geometry
     var myTexture; // imagine it's your texture you want to process
     var myResultTexture = new Texture(); // imagine it's your texture you want to process
     myResultTexture.setTextureSize(1200,900);
     var composer = new Composer();
     composer.addPass(new Composer.Filter.InputTexture(myTexture));
     composer.addPass(new Composer.Filter.HBlur(5));
     composer.addPass(new Composer.Filter.VBlur(5), resultTexture);

     myGeometry.getStateSet().setTextureAttributeAndModes(0, resultTexture);
     rootnode.addChild(composer);

     */

    var Composer = function () {
        Node.call( this );
        this._stack = [];
        this._renderToScreen = false;
        this._dirty = false;
        var UpdateCallback = function () {

        };
        UpdateCallback.prototype = {
            update: function ( node /*, nv */ ) {
                if ( node.isDirty() ) {
                    node.build();
                }
            }
        };
        this.setUpdateCallback( new UpdateCallback() );
        this.getOrCreateStateSet().setAttributeAndModes( new Depth( 'DISABLE' ) );
    };

    Composer.prototype = MACROUTILS.objectInehrit( Node.prototype, {
        dirty: function () {
            for ( var i = 0, l = this._stack.length; i < l; i++ ) {
                this._stack[ i ].filter.dirty();
            }
        },

        // addPass support different signature
        // addPass(filter) -> the filter will be done on a texture of the same size than the previous pass
        // addPass(filter, textureWidth, textureHeight) -> the filter will be done on a texture width and height
        // addPass(filter, texture) -> the filter will be done on the giver texture using its width and height
        addPass: function ( filter, arg0, arg1 ) {
            if ( arg0 instanceof Texture ) {
                this._stack.push( {
                    filter: filter,
                    texture: arg0
                } );
            } else if ( arg0 !== undefined && arg1 !== undefined ) {
                this._stack.push( {
                    filter: filter,
                    width: Math.floor( arg0 ),
                    height: Math.floor( arg1 )
                } );
            } else {
                this._stack.push( {
                    filter: filter
                } );
            }
        },
        renderToScreen: function ( w, h ) {
            this._renderToScreen = true;
            this._renderToScreenWidth = w;
            this._renderToScreenHeight = h;
        },

        isDirty: function () {
            for ( var i = 0, l = this._stack.length; i < l; i++ ) {
                if ( this._stack[ i ].filter.isDirty() ) {
                    return true;
                }
            }
            return false;
        },

        build: function () {
            var root = this;
            this.removeChildren();
            var lastTextureResult;
            var self = this;
            this._stack.forEach( function ( element, i, array ) {
                if ( element.filter.isDirty() ) {
                    element.filter.build();
                }
                var stateSet = element.filter.getStateSet();
                var w, h;
                if ( element.texture !== undefined ) {
                    w = element.texture.getWidth();
                    h = element.texture.getHeight();
                } else if ( element.width !== undefined && element.height !== undefined ) {
                    w = element.width;
                    h = element.height;
                } else {
                    // get width from Texture0
                    var inputTexture = stateSet.getTextureAttribute( 0, 'Texture' );
                    if ( inputTexture === undefined ) {
                        Notify.warn( 'Composer can\'t find any information to setup texture output size' );
                    }
                    w = inputTexture.getWidth();
                    h = inputTexture.getHeight();
                }

                // is it the last filter and we want to render to screen ?
                var lastFilterRenderToScreen = ( i === array.length - 1 &&
                    self._renderToScreen === true );

                // check if we have something to do
                // else we will just translate stateset to the next filter
                // this part exist to manage the Composer.Filter.InputTexture that setup the first texture unit
                if ( !lastFilterRenderToScreen ) {
                    if ( stateSet.getAttribute( 'Program' ) === undefined ) {
                        array[ i + 1 ].filter.getStateSet().setTextureAttributeAndModes( 0, stateSet.getTextureAttribute( 0, 'Texture' ) );
                        return;
                    }
                }

                // check if we want to render on screen
                var camera = new Camera();
                camera.setStateSet( element.filter.getStateSet() );

                var texture;
                var quad;
                if ( lastFilterRenderToScreen === true ) {
                    w = self._renderToScreenWidth;
                    h = self._renderToScreenHeight;
                } else {
                    camera.setRenderOrder( Camera.PRE_RENDER, 0 );
                    texture = element.texture;
                    if ( texture === undefined ) {
                        texture = new Texture();
                        texture.setTextureSize( w, h );
                    }
                    camera.attachTexture( FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );
                }

                var vp = new Viewport( 0, 0, w, h );
                camera.setReferenceFrame( TransformEnums.ABSOLUTE_RF );
                camera.setViewport( vp );
                Matrix.makeOrtho( -w / 2, w / 2, -h / 2, h / 2, -5, 5, camera.getProjectionMatrix() );

                quad = Shape.createTexturedQuadGeometry( -w / 2, -h / 2, 0,
                    w, 0, 0,
                    0, h, 0 );

                if ( element.filter.buildGeometry !== undefined )
                    quad = element.filter.buildGeometry( quad );

                quad.setName( 'composer layer' );

                lastTextureResult = texture;

                // assign the result texture to the next stateset
                if ( i + 1 < array.length ) {
                    array[ i + 1 ].filter.getStateSet().setTextureAttributeAndModes( 0, lastTextureResult );
                }

                camera.addChild( quad );
                element.filter.getStateSet().addUniform( Uniform.createFloat2( [ w, h ], 'RenderSize' ) );
                camera.setName( 'Composer Pass' + i );
                root.addChild( camera );
            } );
            this._resultTexture = lastTextureResult;
        }
    } );

    Composer.Filter = function () {
        this._stateSet = new StateSet();
        this._dirty = true;
    };

    Composer.Filter.prototype = {
        getStateSet: function () {
            return this._stateSet;
        },
        getOrCreateStateSet: function () {
            return this._stateSet;
        },
        dirty: function () {
            this._dirty = true;
        },
        isDirty: function () {
            return this._dirty;
        }
    };


    Composer.Filter.defaultVertexShader = [
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec2 TexCoord0;',
        'varying vec2 FragTexCoord0;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'void main(void) {',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
        '  FragTexCoord0 = TexCoord0;',
        '}',
        ''
    ].join( '\n' );

    Composer.Filter.defaultFragmentShaderHeader = [
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform vec2 RenderSize;',
        'uniform sampler2D Texture0;',
        ''
    ].join( '\n' );

    Composer.Filter.shaderUtils = [
        'vec4 packFloatTo4x8(in float v) {',
        'vec4 enc = vec4(1.0, 255.0, 65025.0, 160581375.0) * v;',
        'enc = fract(enc);',
        'enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);',
        'return enc;',
        '}',

        ' ',
        'vec4 pack2FloatTo4x8(in vec2 val) {',
        ' const vec2 bitSh = vec2(256.0, 1.0);',
        ' const vec2 bitMsk = vec2(0.0, 1.0/256.0);',
        ' vec2 res1 = fract(val.x * bitSh);',
        ' res1 -= res1.xx * bitMsk;',
        ' vec2 res2 = fract(val.y * bitSh);',
        ' res2 -= res2.xx * bitMsk;',
        ' return vec4(res1.x,res1.y,res2.x,res2.y);',
        '}',
        ' ',
        'float unpack4x8ToFloat( vec4 rgba ) {',
        ' return dot( rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/160581375.0) );',
        '}',
        ' ',
        'vec2 unpack4x8To2Float(in vec4 val) {',
        ' const vec2 unshift = vec2(1.0/256.0, 1.0);',
        ' return vec2(dot(val.xy, unshift), dot(val.zw, unshift));',
        '}',

        'vec2 encodeNormal (vec3 n)',
        '{',
        '    float f = sqrt(8.0*n.z+8.0);',
        '    return n.xy / f + 0.5;',
        '}',

        'vec3 decodeNormal (vec2 enc)',
        '{',
        '    vec2 fenc = enc*4.0-2.0;',
        '    float f = dot(fenc,fenc);',
        '    float g = sqrt(1.0-f/4.0);',
        '    vec3 n;',
        '    n.xy = fenc*g;',
        '    n.z = 1.0-f/2.0;',
        '    return n;',
        '}',
        ''
    ].join( '\n' );

    Composer.Filter.Helper = {
        getOrCreatePascalCoefficients: function () {
            var cache = Composer.Filter.Helper.getOrCreatePascalCoefficients.cache;
            if ( cache !== undefined ) {
                return cache;
            }

            cache = ( function ( kernelSize ) {
                var pascalTriangle = [
                    [ 1 ]
                ];
                for ( var j = 0; j < ( kernelSize - 1 ); j++ ) {
                    //var sum = Math.pow( 2, j );
                    var currentRow = pascalTriangle[ j ];
                    var currentRowSize = currentRow.length;

                    var nextRowSize = currentRowSize + 1;
                    var nextRow = new Array( currentRowSize );
                    nextRow[ 0 ] = 1.0;
                    nextRow[ nextRowSize - 1 ] = 1.0;

                    var idx = 1;
                    for ( var p = 0; p < currentRowSize - 1; p++ ) {
                        var val = ( currentRow[ p ] + currentRow[ p + 1 ] );
                        nextRow[ idx++ ] = val;
                    }
                    pascalTriangle.push( nextRow );
                }

                // compute real coef dividing by sum
                ( function () {
                    for ( var a = 0; a < pascalTriangle.length; a++ ) {
                        var row = pascalTriangle[ a ];
                        //var str = '';

                        var sum = Math.pow( 2, a );
                        for ( var i = 0; i < row.length; i++ ) {
                            row[ i ] = row[ i ] / sum;
                            //str += row[i].toString() + ' ';
                        }
                        //Notify.log(str);
                    }
                } )();

                return pascalTriangle;
            } )( 20 );
            Composer.Filter.Helper.getOrCreatePascalCoefficients.cache = cache;
            return cache;
        }
    };

    Composer.Filter.Custom = function ( fragmentShader, uniforms ) {
        Composer.Filter.call( this );
        this._fragmentShader = fragmentShader;
        this._uniforms = uniforms;
        this._vertexShader = Composer.Filter.defaultVertexShader;
    };

    Composer.Filter.Custom.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        build: function () {

            var program = new Program(
                new Shader( 'VERTEX_SHADER', this._vertexShader ),
                new Shader( 'FRAGMENT_SHADER', this._fragmentShader ) );

            if ( this._uniforms ) {
                var unitIndex = 0;

                var r = this._fragmentShader.match( /uniform\s+\w+\s+\w+/g );
                if ( r !== null ) {
                    for ( var i = 0, l = r.length; i < l; i++ ) {
                        var match = r[ i ].match( /uniform\s+(\w+)\s+(\w+)/ );
                        var uniformType = match[ 1 ];
                        var uniformName = match[ 2 ];
                        var uniform;

                        if ( this._uniforms[ uniformName ] !== undefined ) {
                            var uniformValue = this._uniforms[ uniformName ];
                            if ( uniformType.search( 'sampler' ) !== -1 ) {
                                this._stateSet.setTextureAttributeAndModes( unitIndex, uniformValue );
                                uniform = Uniform.createInt1( unitIndex, uniformName );
                                unitIndex++;
                                this._stateSet.addUniform( uniform );
                            } else {
                                if ( Uniform.isUniform( uniformValue ) ) {
                                    uniform = uniformValue;
                                } else {
                                    uniform = Uniform[ uniformType ]( this._uniforms[ uniformName ], uniformName );
                                }
                                this._stateSet.addUniform( uniform );
                            }
                        }
                    }
                }
            }
            this._stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );



    Composer.Filter.AverageHBlur = function ( nbSamplesOpt ) {
        Composer.Filter.call( this );
        if ( nbSamplesOpt === undefined ) {
            this.setBlurSize( 5 );
        } else {
            this.setBlurSize( nbSamplesOpt );
        }
        this._pixelSize = 1.0;
    };

    Composer.Filter.AverageHBlur.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        setBlurSize: function ( nbSamples ) {
            if ( nbSamples % 2 !== 1 ) {
                nbSamples += 1;
            }
            this._nbSamples = nbSamples;
            this.dirty();
        },
        setPixelSize: function ( value ) {
            this._pixelSize = value;
            this.dirty();
        },
        getUVOffset: function ( value ) {
            return 'vec2(float(' + value + '), 0.0)/RenderSize[0];';
        },
        getShaderBlurKernel: function () {
            var nbSamples = this._nbSamples;
            var kernel = [];
            kernel.push( ' pixel = texture2D(Texture0, FragTexCoord0 );' );
            kernel.push( ' if (pixel.w == 0.0) { gl_FragColor = pixel; return; }' );
            kernel.push( ' vec2 offset;' );
            for ( var i = 1; i < Math.ceil( nbSamples / 2 ); i++ ) {
                kernel.push( ' offset = ' + this.getUVOffset( i * this._pixelSize ) );
                kernel.push( ' pixel += texture2D(Texture0, FragTexCoord0 + offset);' );
                kernel.push( ' pixel += texture2D(Texture0, FragTexCoord0 - offset);' );
            }
            kernel.push( ' pixel /= float(' + nbSamples + ');' );
            return kernel;
        },
        build: function () {
            //var nbSamples = this._nbSamples;
            var vtx = Composer.Filter.defaultVertexShader;
            var fgt = [
                Composer.Filter.defaultFragmentShaderHeader,
                'uniform float width;',

                'void main (void)',
                '{',
                '  vec4 pixel;',
                this.getShaderBlurKernel().join( '\n' ),
                '  gl_FragColor = vec4(pixel);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vtx ),
                new Shader( 'FRAGMENT_SHADER', fgt ) );

            if ( this._stateSet.getUniform( 'Texture0' ) === undefined ) {
                this._stateSet.addUniform( Uniform.createInt1( 0, 'Texture0' ) );
            }
            this._stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );


    Composer.Filter.AverageVBlur = function ( nbSamplesOpt ) {
        Composer.Filter.AverageHBlur.call( this, nbSamplesOpt );
    };
    Composer.Filter.AverageVBlur.prototype = MACROUTILS.objectInehrit( Composer.Filter.AverageHBlur.prototype, {
        getUVOffset: function ( value ) {
            return 'vec2(0.0, float(' + value + '))/RenderSize[1];';
        }
    } );

    Composer.Filter.BilateralHBlur = function ( options ) {
        Composer.Filter.call( this );

        if ( options === undefined ) {
            options = {};
        }

        var nbSamplesOpt = options.nbSamples;
        var depthTexture = options.depthTexture;
        var radius = options.radius;

        if ( nbSamplesOpt === undefined ) {
            this.setBlurSize( 5 );
        } else {
            this.setBlurSize( nbSamplesOpt );
        }
        this._depthTexture = depthTexture;
        this._radius = Uniform.createFloat( 1.0, 'radius' );
        this._pixelSize = Uniform.createFloat( 1.0, 'pixelSize' );
        this.setRadius( radius );
    };

    Composer.Filter.BilateralHBlur.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        setBlurSize: function ( nbSamples ) {
            if ( nbSamples % 2 !== 1 ) {
                nbSamples += 1;
            }
            //Notify.log('BlurSize ' + nbSamples);
            this._nbSamples = nbSamples;
            this.dirty();
        },
        setPixelSize: function ( value ) {
            this._pixelSize.get()[ 0 ] = value;
            this._pixelSize.dirty();
        },
        setRadius: function ( radius ) {
            this._radius.get()[ 0 ] = radius; // *2.0;
            this._radius.dirty();
        },
        getUVOffset: function ( value ) {
            return 'vec2(0.0, float(' + value + ') * pixelSize )/RenderSize[1];';
        },
        getShaderBlurKernel: function () {
            var nbSamples = this._nbSamples;
            var kernel = [];
            kernel.push( ' pixel = texture2D(Texture0, FragTexCoord0 );' );
            kernel.push( ' if (pixel.w <= 0.0001) { gl_FragColor = vec4(1.0); return; }' );
            kernel.push( ' vec2 offset, tmpUV;' );
            kernel.push( ' depth = getDepthValue(texture2D(Texture1, FragTexCoord0 ));' );
            for ( var i = 1; i < Math.ceil( nbSamples / 2 ); i++ ) {
                kernel.push( ' offset = ' + this.getUVOffset( i ) );

                kernel.push( ' tmpUV =  FragTexCoord0 + offset;' );
                kernel.push( ' tmpDepth = getDepthValue(texture2D(Texture1, tmpUV ));' );
                kernel.push( ' if ( abs(depth-tmpDepth) < radius) {' );
                kernel.push( '   pixel += texture2D(Texture0, tmpUV);' );
                kernel.push( '   nbHits += 1.0;' );
                kernel.push( ' }' );

                kernel.push( ' tmpUV =  FragTexCoord0 - offset;' );
                kernel.push( ' tmpDepth = getDepthValue(texture2D(Texture1, tmpUV ));' );
                kernel.push( ' if ( abs(depth-tmpDepth) < radius) {' );
                kernel.push( '   pixel += texture2D(Texture0, tmpUV);' );
                kernel.push( '   nbHits += 1.0;' );
                kernel.push( ' }' );
            }
            kernel.push( ' pixel /= nbHits;' );
            return kernel;
        },
        build: function () {
            //var nbSamples = this._nbSamples;
            var vtx = Composer.Filter.defaultVertexShader;
            var fgt = [
                Composer.Filter.defaultFragmentShaderHeader,
                'uniform sampler2D Texture1;',
                'uniform float width;',
                'uniform mat4 projection;',
                'uniform float radius;',
                'uniform float pixelSize;',

                'float znear,zfar,zrange;',
                '',
                Composer.Filter.shaderUtils,
                '',
                'float getDepthValue(vec4 v) {',
                '  float depth = unpack4x8ToFloat(v);',
                '  depth = depth*zrange+znear;',
                '  return -depth;',
                '}',

                'void main (void)',
                '{',
                '  vec4 pixel;',
                '  float depth, tmpDepth;',
                '  znear = projection[3][2] / (projection[2][2]-1.0);',
                '  zfar = projection[3][2] / (projection[2][2]+1.0);',
                '  zrange = zfar-znear;',
                '  float nbHits = 1.0;',

                this.getShaderBlurKernel().join( '\n' ),
                '  gl_FragColor = vec4(pixel);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vtx ),
                new Shader( 'FRAGMENT_SHADER', fgt ) );

            if ( this._stateSet.getUniform( 'Texture0' ) === undefined ) {
                this._stateSet.addUniform( Uniform.createInt1( 0, 'Texture0' ) );
            }
            if ( this._stateSet.getUniform( 'Texture1' ) === undefined ) {
                this._stateSet.addUniform( Uniform.createInt1( 1, 'Texture1' ) );
            }
            this._stateSet.addUniform( this._radius );
            this._stateSet.addUniform( this._pixelSize );
            this._stateSet.setTextureAttributeAndModes( 1, this._depthTexture );
            this._stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );

    Composer.Filter.BilateralVBlur = function ( options ) {
        Composer.Filter.BilateralHBlur.call( this, options );
    };

    Composer.Filter.BilateralVBlur.prototype = MACROUTILS.objectInehrit( Composer.Filter.BilateralHBlur.prototype, {
        getUVOffset: function ( value ) {
            return 'vec2(float(' + value + ')*pixelSize,0.0)/RenderSize[0];';
        }
    } );

    // InputTexture is a fake filter to setup the first texture
    // in the composer pipeline
    Composer.Filter.InputTexture = function ( texture ) {
        Composer.Filter.call( this );
        this._stateSet.setTextureAttributeAndModes( 0, texture );
    };
    Composer.Filter.InputTexture.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        build: function () {
            this._dirty = false;
        }
    } );

    // Operate a Gaussian horizontal blur
    Composer.Filter.HBlur = function ( nbSamplesOpt ) {
        Composer.Filter.call( this );
        if ( nbSamplesOpt === undefined ) {
            this.setBlurSize( 5 );
        } else {
            this.setBlurSize( nbSamplesOpt );
        }
    };

    Composer.Filter.HBlur.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        setBlurSize: function ( nbSamples ) {
            if ( nbSamples % 2 !== 1 ) {
                nbSamples += 1;
            }
            this._nbSamples = nbSamples;
            this.dirty();
        },
        getUVOffset: function ( value ) {
            return 'vec2(float(' + value + '), 0.0)/RenderSize[0];';
        },
        build: function () {
            var nbSamples = this._nbSamples;
            var vtx = Composer.Filter.defaultVertexShader;
            var pascal = Composer.Filter.Helper.getOrCreatePascalCoefficients();
            var weights = pascal[ nbSamples - 1 ];
            var start = Math.floor( nbSamples / 2.0 );
            var kernel = [];
            kernel.push( ' pixel += float(' + weights[ start ] + ')*texture2D(Texture0, FragTexCoord0 ).rgb;' );
            var offset = 1;
            kernel.push( ' vec2 offset;' );
            for ( var i = start + 1; i < nbSamples; i++ ) {
                var weight = weights[ i ];
                kernel.push( ' offset = ' + this.getUVOffset( i ) );
                offset++;
                kernel.push( ' pixel += ' + weight + '*texture2D(Texture0, FragTexCoord0 + offset).rgb;' );
                kernel.push( ' pixel += ' + weight + '*texture2D(Texture0, FragTexCoord0 - offset).rgb;' );
            }

            var fgt = [
                Composer.Filter.defaultFragmentShaderHeader,
                'uniform float width;',

                'void main (void)',
                '{',
                '  vec3 pixel;',
                kernel.join( '\n' ),
                '  gl_FragColor = vec4(pixel,1.0);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vtx ),
                new Shader( 'FRAGMENT_SHADER', fgt ) );

            if ( this._stateSet.getUniform( 'Texture0' ) === undefined ) {
                this._stateSet.addUniform( Uniform.createInt1( 0, 'Texture0' ) );
            }
            this._stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );

    // Operate a Gaussian vertical blur
    Composer.Filter.VBlur = function ( /*nbSamplesOpt*/ ) {
        Composer.Filter.HBlur.call( this );
    };

    Composer.Filter.VBlur.prototype = MACROUTILS.objectInehrit( Composer.Filter.HBlur.prototype, {
        getUVOffset: function ( value ) {
            return 'vec2(0.0, float(' + value + '))/RenderSize[1];';
        }
    } );

    // Sobel filter
    // http://en.wikipedia.org/wiki/Sobel_operator
    Composer.Filter.SobelFilter = function () {
        Composer.Filter.call( this );
        this._color = Uniform.createFloat3( [ 1.0, 1.0, 1.0 ], 'color' );
        this._factor = Uniform.createFloat( 1.0, 'factor' );
    };

    Composer.Filter.SobelFilter.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        setColor: function ( color ) {
            this._color.get()[ 0 ] = color[ 0 ];
            this._color.get()[ 1 ] = color[ 1 ];
            this._color.get()[ 2 ] = color[ 2 ];
            this._color.dirty();
        },
        setFactor: function ( f ) {
            this._factor.get()[ 0 ] = f;
            this._factor.dirty();
        },
        build: function () {
            var stateSet = this._stateSet;
            var vtx = Composer.Filter.defaultVertexShader;
            var fgt = [
                '',
                Composer.Filter.defaultFragmentShaderHeader,
                'uniform vec3 color;',
                'uniform float factor;',
                'void main (void)',
                '{',
                '  float fac0 = 2.0;',
                '  float fac1 = 1.0;',
                '  float offsetx = 1.0/RenderSize[0];',
                '  float offsety = 1.0/RenderSize[1];',
                '  vec4 texel0 = texture2D(Texture0, FragTexCoord0 + vec2(offsetx, offsety));',
                '  vec4 texel1 = texture2D(Texture0, FragTexCoord0 + vec2(offsetx, 0.0));',
                '  vec4 texel2 = texture2D(Texture0, FragTexCoord0 + vec2(offsetx, -offsety));',
                '  vec4 texel3 = texture2D(Texture0, FragTexCoord0 + vec2(0.0, -offsety));',
                '  vec4 texel4 = texture2D(Texture0, FragTexCoord0 + vec2(-offsetx, -offsety));',
                '  vec4 texel5 = texture2D(Texture0, FragTexCoord0 + vec2(-offsetx, 0.0));',
                '  vec4 texel6 = texture2D(Texture0, FragTexCoord0 + vec2(-offsetx, offsety));',
                '  vec4 texel7 = texture2D(Texture0, FragTexCoord0 + vec2(0.0, offsety));',
                '  vec4 rowx = -fac0*texel5 + fac0*texel1 +  -fac1*texel6 + fac1*texel0 + -fac1*texel4 + fac1*texel2;',
                '  vec4 rowy = -fac0*texel3 + fac0*texel7 +  -fac1*texel4 + fac1*texel6 + -fac1*texel2 + fac1*texel0;',
                '  float mag = sqrt(dot(rowy,rowy)+dot(rowx,rowx));',
                '  if (mag < 1.0/255.0) discard;',
                '  mag *= factor;',
                '  mag = min(1.0, mag);',
                '  gl_FragColor = vec4(color*mag,mag);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vtx ),
                new Shader( 'FRAGMENT_SHADER', fgt ) );

            stateSet.setAttributeAndModes( program );
            stateSet.addUniform( this._color );
            stateSet.addUniform( this._factor );
            stateSet.addUniform( Uniform.createInt1( 0, 'Texture0' ) );
            this._dirty = false;
        }
    } );



    Composer.Filter.BlendMix = function () {
        Composer.Filter.call( this );
        var texture0, texture1, mixValue;
        var unit0 = 0;
        var unit1 = 1;
        var stateSet = this._stateSet;
        if ( arguments.length === 3 ) {
            texture0 = arguments[ 0 ];
            texture1 = arguments[ 1 ];
            mixValue = arguments[ 2 ];
            unit0 = 1;
            unit1 = 2;
            stateSet.setTextureAttributeAndModes( unit0, texture0 );
        } else if ( arguments.length === 2 ) {
            texture1 = arguments[ 0 ];
            mixValue = arguments[ 1 ];
        } else if ( arguments.length === 1 ) {
            texture1 = arguments[ 0 ];
            mixValue = 0.5;
        }
        stateSet.setTextureAttributeAndModes( unit1, texture1 );
        stateSet.addUniform( Uniform.createInt1( unit0, 'Texture0' ) );
        stateSet.addUniform( Uniform.createInt1( unit1, 'Texture1' ) );
        this._mixValueUniform = Uniform.createFloat1( mixValue, 'MixValue' );
        stateSet.addUniform( this._mixValueUniform );
    };

    Composer.Filter.BlendMix.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        getBlendFactorUniform: function () {
            return this._mixValueUniform;
        },

        build: function () {
            var stateSet = this._stateSet;
            var vtx = Composer.Filter.defaultVertexShader;
            var fgt = [
                '',
                Composer.Filter.defaultFragmentShaderHeader,
                'uniform sampler2D Texture1;',
                'uniform float MixValue;',

                'void main (void)',
                '{',
                '  gl_FragColor = mix(texture2D(Texture0,FragTexCoord0), texture2D(Texture1,FragTexCoord0),MixValue);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vtx ),
                new Shader( 'FRAGMENT_SHADER', fgt ) );

            stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );


    Composer.Filter.BlendMultiply = function () {
        Composer.Filter.call( this );
        var stateSet = this._stateSet;
        var texture0, texture1;
        var unit0 = 0;
        var unit1 = 1;
        if ( arguments.length === 2 ) {
            texture0 = arguments[ 0 ];
            texture1 = arguments[ 1 ];
            unit0 = 1;
            unit0 = 2;
            stateSet.setTextureAttributeAndModes( unit0, texture0 );
        } else if ( arguments.length === 1 ) {
            texture1 = arguments[ 0 ];
        }
        stateSet.setTextureAttributeAndModes( unit1, texture1 );
        stateSet.addUniform( Uniform.createInt1( unit0, 'Texture0' ) );
        stateSet.addUniform( Uniform.createInt1( unit1, 'Texture1' ) );
    };

    Composer.Filter.BlendMultiply.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {
        build: function () {
            var vtx = Composer.Filter.defaultVertexShader;
            var fgt = [
                '',
                Composer.Filter.defaultFragmentShaderHeader,
                'uniform sampler2D Texture1;',
                'uniform float MixValue;',

                'void main (void)',
                '{',
                '  gl_FragColor = texture2D(Texture0,FragTexCoord0)*texture2D(Texture1,FragTexCoord0);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vtx ),
                new Shader( 'FRAGMENT_SHADER', fgt ) );

            this._stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );

    Composer.Filter.SSAO = function ( options ) {
        Composer.Filter.call( this );

        var stateSet = this._stateSet;
        var nbSamples = 16;
        var radius = 0.05;
        if ( options !== undefined ) {
            if ( options.nbSamples !== undefined )
                nbSamples = options.nbSamples;

            if ( options.radius !== undefined )
                radius = options.radius;
        }

        var textureNormal = options.normal;
        var texturePosition = options.position;
        this._radius = radius;
        this._nbSamples = nbSamples;
        this._noiseTextureSize = 16;
        this._sceneRadius = 2.0;

        stateSet.addUniform( Uniform.createFloat1( 1.0, 'Power' ) );
        stateSet.addUniform( Uniform.createFloat1( radius, 'Radius' ) );
        stateSet.addUniform( Uniform.createInt1( 0, 'Texture0' ) );
        stateSet.addUniform( Uniform.createInt1( 1, 'Texture1' ) );
        stateSet.addUniform( Uniform.createInt1( 2, 'Texture2' ) );
        stateSet.addUniform( Uniform.createFloat1( 0.1, 'AngleLimit' ) );

        var w = textureNormal.getWidth();
        var h = textureNormal.getHeight();
        this._size = [ w, h ];

        stateSet.setTextureAttributeAndModes( 0, textureNormal );
        stateSet.setTextureAttributeAndModes( 1, texturePosition );

        this.initNoise();

    };

    Composer.Filter.SSAO.prototype = MACROUTILS.objectInehrit( Composer.Filter.prototype, {

        initNoise: function () {
            var sizeNoise = this._noiseTextureSize;
            var noise = new Array( sizeNoise * sizeNoise * 3 );
            ( function ( array ) {
                var n = [ 0.0, 0.0 ];
                for ( var i = 0; i < sizeNoise * sizeNoise; i++ ) {
                    n[ 0 ] = 2.0 * ( Math.random() - 0.5 );
                    n[ 1 ] = 2.0 * ( Math.random() - 0.5 );

                    Vec2.normalize( n, n );
                    array[ i * 3 + 0 ] = 255 * ( n[ 0 ] * 0.5 + 0.5 );
                    array[ i * 3 + 1 ] = 255 * ( n[ 1 ] * 0.5 + 0.5 );
                    array[ i * 3 + 2 ] = 255 * 0.5;
                }
            } )( noise );

            var noiseTexture = new Texture();
            noiseTexture.setWrapS( 'REPEAT' );
            noiseTexture.setWrapT( 'REPEAT' );
            noiseTexture.setMinFilter( 'NEAREST' );
            noiseTexture.setMagFilter( 'NEAREST' );

            noiseTexture.setTextureSize( sizeNoise, sizeNoise );
            noiseTexture.setImage( new Uint8Array( noise ), 'RGB' );
            this._noiseTexture = noiseTexture;
        },
        setSceneRadius: function ( value ) {
            this._sceneRadius = value;
            this.dirty();
        },
        setAngleLimit: function ( value ) {
            var uniform = this._stateSet.getUniform( 'AngleLimit' );
            uniform.get()[ 0 ] = value;
            uniform.dirty();
        },
        setNbSamples: function ( value ) {
            if ( value === this._nbSamples ) {
                return;
            }
            this._nbSamples = Math.floor( value );
            this.dirty();
        },
        setRadius: function ( value ) {
            var uniform = this._stateSet.getUniform( 'Radius' );
            uniform.get()[ 0 ] = value;
            uniform.dirty();
        },
        setPower: function ( value ) {
            var uniform = this._stateSet.getUniform( 'Power' );
            uniform.get()[ 0 ] = value;
            uniform.dirty();
        },
        build: function () {
            var stateSet = this._stateSet;
            var nbSamples = this._nbSamples;
            var kernel = new Array( nbSamples * 4 );
            ( function ( array ) {
                var v = [ 0.0, 0.0, 0.0 ];
                for ( var i = 0; i < nbSamples; i++ ) {
                    v[ 0 ] = 2.0 * ( Math.random() - 0.5 );
                    v[ 1 ] = 2.0 * ( Math.random() - 0.5 );
                    v[ 2 ] = Math.random();

                    Vec3.normalize( v, v );
                    var scale = Math.max( i / nbSamples, 0.1 );
                    scale = 0.1 + ( 1.0 - 0.1 ) * ( scale * scale );
                    array[ i * 3 + 0 ] = v[ 0 ];
                    array[ i * 3 + 1 ] = v[ 1 ];
                    array[ i * 3 + 2 ] = v[ 2 ];
                    array[ i * 3 + 3 ] = scale;
                }
            } )( kernel );


            stateSet.setTextureAttributeAndModes( 2, this._noiseTexture );
            var uniform = stateSet.getUniform( 'noiseSampling' );
            if ( uniform === undefined ) {
                uniform = Uniform.createFloat2( [ this._size[ 0 ] / this._noiseTextureSize, this._size[ 1 ] / this._noiseTextureSize ], 'noiseSampling' );
                stateSet.addUniform( uniform );
            } else {
                uniform.set( [ this._size[ 0 ] / this._noiseTextureSize, this._size[ 1 ] / this._noiseTextureSize ] );
                uniform.dirty();
            }
            var vertexshader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'varying vec2 FragTexCoord0;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'void main(void) {',
                '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
                '  FragTexCoord0 = TexCoord0;',
                '}',
                ''
            ].join( '\n' );

            var kernelglsl = [];
            for ( var i = 0; i < nbSamples; i++ ) {
                kernelglsl.push( 'kernel[' + i + '] = vec4(' + kernel[ i * 3 ] + ',' + kernel[ i * 3 + 1 ] + ', ' + kernel[ i * 3 + 2 ] + ', ' + kernel[ i * 3 + 3 ] + ');' );
            }
            kernelglsl = kernelglsl.join( '\n' );

            //var ssaoRadiusMin = this._sceneRadius * 0.002;
            //var ssaoRadiusMax = this._sceneRadius * 0.05;
            //var ssaoRadiusStep = ( ssaoRadiusMax - ssaoRadiusMin ) / 200.0;

            var fragmentshader = [
                '',
                Composer.Filter.defaultFragmentShaderHeader,
                'uniform sampler2D Texture1;',
                'uniform sampler2D Texture2;',
                'uniform mat4 projection;',
                'uniform vec2 noiseSampling;',
                'uniform float Power;', //'+ '{ 'min': 0.1, 'max': 16.0, 'step': 0.1, 'value': 1.0 }',
                'uniform float Radius;', //'+ '{ 'min': ' + ssaoRadiusMin +', 'max': ' + ssaoRadiusMax + ', 'step': '+ ssaoRadiusStep + ', 'value': 0.01 }',
                'uniform float AngleLimit;',
                '#define NB_SAMPLES ' + this._nbSamples,
                'float depth;',
                'vec3 normal;',
                'vec4 position;',
                'vec4 kernel[' + nbSamples + '];',


                'mat3 computeBasis()',
                '{',
                '  vec2 uvrand = FragTexCoord0*noiseSampling;',
                '  vec3 rvec = texture2D(Texture2, uvrand*2.0).xyz*2.0-vec3(1.0);',
                '  vec3 tangent = normalize(rvec - normal * dot(rvec, normal));',
                '  vec3 bitangent = cross(normal, tangent);',
                '  mat3 tbn = mat3(tangent, bitangent, normal);',
                '  return tbn;',
                '}',

                'void main (void)',
                '{',
                kernelglsl,
                '  position = texture2D(Texture1, FragTexCoord0);',
                '  vec4 p = texture2D(Texture0, FragTexCoord0);',
                '  depth = p.w;',
                '  normal = vec3(p);',
                '  if ( position.w == 0.0) {',
                '     gl_FragColor = vec4(1.0,1.0,1.0,0.0);',
                '     return;',
                '  }',
                '',
                ' mat3 tbn = computeBasis();',
                ' float occlusion = 0.0;',
                ' for (int i = 0; i < NB_SAMPLES; i++) {',
                '    vec3 vecKernel = vec3(kernel[i]);',
                '    vecKernel[2] = max(AngleLimit,vecKernel[2]);',
                '    vec3 sample = tbn * vecKernel;',
                '    vec3 dir = sample;',
                '    float w = dot(dir, normal);',
                '    float dist = 1.0-kernel[i].w;',
                '    w *= dist*dist*Power;',
                '    sample = dir * float(Radius) + position.xyz;',

                '    vec4 offset = projection * vec4(sample,1.0);',
                '    offset.xy /= offset.w;',
                '    offset.xy = offset.xy * 0.5 + 0.5;',

                '    float sample_depth = texture2D(Texture1, offset.xy).z;',
                '    float range_check = abs(sample.z - sample_depth) < float(Radius) ? 1.0 : 0.0;',
                '    occlusion += (sample_depth > sample.z ? 1.0 : 0.0) * range_check*w;',

                ' }',
                ' occlusion = 1.0 - (occlusion / float(NB_SAMPLES));',
                ' gl_FragColor = vec4(vec3(occlusion),1.0);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vertexshader ),
                new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );



    Composer.Filter.SSAO8 = function ( options ) {
        Composer.Filter.SSAO.call( this, options );
    };

    Composer.Filter.SSAO8.prototype = MACROUTILS.objectInehrit( Composer.Filter.SSAO.prototype, {
        buildGeometry: function ( quad ) {
            quad.getAttributes().TexCoord1 = this._texCoord1;
            return quad;
        },
        build: function () {
            var stateSet = this._stateSet;
            var nbSamples = this._nbSamples;
            var kernel = new Array( nbSamples * 4 );
            //var angleLimit = this._angleLimit;
            ( function ( array ) {
                var v = [ 0.0, 0.0, 0.0 ];
                for ( var i = 0; i < nbSamples; i++ ) {
                    v[ 0 ] = 2.0 * ( Math.random() - 0.5 );
                    v[ 1 ] = 2.0 * ( Math.random() - 0.5 );
                    v[ 2 ] = Math.random();

                    Vec3.normalize( v, v );
                    var scale = Math.max( i / nbSamples, 0.1 );
                    scale = 0.1 + ( 1.0 - 0.1 ) * ( scale * scale );
                    array[ i * 3 + 0 ] = v[ 0 ];
                    array[ i * 3 + 1 ] = v[ 1 ];
                    array[ i * 3 + 2 ] = v[ 2 ];
                    array[ i * 3 + 3 ] = scale;
                }
            } )( kernel );

            //var sizeNoise = this._noiseTextureSize;
            stateSet.setTextureAttributeAndModes( 2, this._noiseTexture );
            var uniform = stateSet.getUniform( 'noiseSampling' );
            if ( uniform === undefined ) {
                uniform = Uniform.createFloat2( [ this._size[ 0 ] / this._noiseTextureSize, this._size[ 1 ] / this._noiseTextureSize ], 'noiseSampling' );
                stateSet.addUniform( uniform );
            } else {
                uniform.set( [ this._size[ 0 ] / this._noiseTextureSize, this._size[ 1 ] / this._noiseTextureSize ] );
                uniform.dirty();
            }
            var vertexshader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'attribute vec3 TexCoord1;',
                'varying vec2 FragTexCoord0;',
                'varying vec3 FragTexCoord1;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'void main(void) {',
                '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
                '  FragTexCoord0 = TexCoord0;',
                '  FragTexCoord1 = TexCoord1;',
                '}',
                ''
            ].join( '\n' );

            var kernelglsl = [];
            for ( var i = 0; i < nbSamples; i++ ) {
                kernelglsl.push( 'kernel[' + i + '] = vec4(' + kernel[ i * 3 ] + ',' + kernel[ i * 3 + 1 ] + ', ' + kernel[ i * 3 + 2 ] + ', ' + kernel[ i * 3 + 3 ] + ');' );
            }
            kernelglsl = kernelglsl.join( '\n' );

            //var ssaoRadiusMin = this._sceneRadius * 0.002;
            //var ssaoRadiusMax = this._sceneRadius * 0.05;
            //var ssaoRadiusStep = ( ssaoRadiusMax - ssaoRadiusMin ) / 200.0;

            var fragmentshader = [
                '',
                Composer.Filter.defaultFragmentShaderHeader,
                'varying vec3 FragTexCoord1;',
                'uniform sampler2D Texture1;',
                'uniform sampler2D Texture2;',
                'uniform mat4 projection;',
                'uniform vec2 noiseSampling;',
                'uniform float Power;', //'+ '{ 'min': 0.1, 'max': 16.0, 'step': 0.1, 'value': 1.0 }',
                'uniform float Radius;', //'+ '{ 'min': ' + ssaoRadiusMin +', 'max': ' + ssaoRadiusMax + ', 'step': '+ ssaoRadiusStep + ', 'value': 0.01 }',
                'uniform float AngleLimit;',
                '#define NB_SAMPLES ' + this._nbSamples,
                'float depth;',
                'float znear, zfar, zrange;',
                'vec3 normal;',
                'vec3 position;',
                'vec4 kernel[' + nbSamples + '];',

                Composer.Filter.shaderUtils,

                'mat3 computeBasis()',
                '{',
                '  vec2 uvrand = FragTexCoord0*noiseSampling;',
                '  //uvrand = rand(gl_FragCoord.xy);',
                '  vec3 rvec = texture2D(Texture2, uvrand*2.0).xyz*2.0-vec3(1.0);',
                '  //vec3 rvec = normalize(vec3(uvrand,0.0));',
                '  vec3 tangent = normalize(rvec - normal * dot(rvec, normal));',
                '  vec3 bitangent = cross(normal, tangent);',
                '  mat3 tbn = mat3(tangent, bitangent, normal);',
                '  return tbn;',
                '}',

                'float getDepthValue(vec4 v) {',
                '  float depth = unpack4x8ToFloat(v);',
                '  depth = depth*zrange+znear;',
                '  //depth = depth*zrange;',
                '  return -depth;',
                '}',

                'void main (void)',
                '{',
                kernelglsl,
                '  vec4 p = texture2D(Texture0, FragTexCoord0);',
                '  if (dot(p,p) < 0.001) { ',
                '     gl_FragColor = vec4(1.0,1.0,1.0,0.0);',
                '     return;',
                '  }',
                '  znear = projection[3][2] / (projection[2][2]-1.0);',
                '  zfar = projection[3][2] / (projection[2][2]+1.0);',
                '  zrange = zfar-znear;',
                '  depth = getDepthValue(texture2D(Texture1, FragTexCoord0));',
                //B = (A - znear)/(zfar-znear);',
                //B = A/(zfar-znear) - znear/(zfar-znear);',
                //B+ znear/(zfar-znear) = A/(zfar-znear) ;',
                //(zfar-znear)*(B+ znear/(zfar-znear)) = A ;',
                //(zfar-znear)*B+ znear = A ;',

                '  if ( -depth < znear) {',
                '     gl_FragColor = vec4(1.0,1.0,1.0,0.0);',
                '     return;',
                '  }',

                '  normal = decodeNormal(unpack4x8To2Float(p));',

                '  position = -FragTexCoord1*depth;',
                '  position.z = -position.z;',

                '',
                ' mat3 tbn = computeBasis();',
                ' float occlusion = 0.0;',
                ' for (int i = 0; i < NB_SAMPLES; i++) {',
                '    vec3 vecKernel = vec3(kernel[i]);',
                '    vecKernel[2] = max(AngleLimit,vecKernel[2]);',
                '    vec3 sample = tbn * vec3(vecKernel);',
                '    vec3 dir = sample;',
                '    float w = dot(dir, normal);',
                '    float dist = 1.0-kernel[i].w;',
                '    w *= dist*dist*Power;',
                '    sample = dir * float(Radius) + position.xyz;',

                '    vec4 offset = projection * vec4(sample,1.0);',
                '    offset.xy /= offset.w;',
                '    offset.xy = offset.xy * 0.5 + 0.5;',

                '    float sample_depth = getDepthValue(texture2D(Texture1, offset.xy));',
                '    float range_check = abs(sample.z - sample_depth) < float(Radius) ? 1.0 : 0.0;',
                '    occlusion += (sample_depth > sample.z ? 1.0 : 0.0) * range_check*w;',

                ' }',
                ' occlusion = 1.0 - (occlusion / float(NB_SAMPLES));',
                ' gl_FragColor = vec4(vec3(occlusion),1.0);',
                '}',
                ''
            ].join( '\n' );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vertexshader ),
                new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            stateSet.setAttributeAndModes( program );
            this._dirty = false;
        }
    } );

    return Composer;
} );
