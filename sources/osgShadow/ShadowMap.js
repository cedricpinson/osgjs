define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Object',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/CullVisitor',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Matrix',
    'osg/BoundingBox',
    'osg/BoundingSphere',
    'osg/ComputeMatrixFromNodePath',
    'osg/Transform',
    'osg/Camera',
    'osg/Texture',
    'osg/Viewport',
    'osg/StateSet',
    'osg/StateAttribute',
    'osg/Uniform',
    'osg/Shader',
    'osg/Program',
    'osgShadow/ShadowAttribute',
    'osgShadow/ShadowTexture',
    'osgShader/ShaderProcessor',
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowFrustumIntersection',
    'osg/CullFace'
], function ( Notify, MACROUTILS, Object, Node, NodeVisitor, CullVisitor, Vec3, Vec4, Matrix, BoundingBox, BoundingSphere, ComputeMatrixFromNodePath, Transform, Camera, Texture, Viewport, StateSet, StateAttribute, Uniform, Shader, Program, ShadowAttribute, ShadowTexture, ShaderProcessor, ShadowTechnique, ShadowFrustumIntersection, CullFace ) {
    'use strict';

    /**
     *  ShadowMap provides an implementation of shadow textures.
     *  @class ShadowMap
     */
    var ShadowMap = function ( settings ) {
        ShadowTechnique.call( this );

        // optimized frustum
        // is tighest possible
        // light frustum
        // with non in receive camera parts removed.
        this._optimizedFrustum = false;

        if ( this._optimizedFrustum ) {

            this._frustumCasters = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];
            this._frustumReceivers = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];

            settings._cbbv = new ShadowFrustumIntersection( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN, this._frustumReceivers, this._frustumCasters );

            this._bs = new BoundingSphere();

        }

        this._projectionMatrix = Matrix.create();
        this._viewMatrix = Matrix.create();

        this._tmpMat = Matrix.create();
        this._tmpVec = Vec3.create();
        this._tmpVecBis = Vec3.create();

        this._lightUp = [ 0.0, 0.0, 1.0 ];
        this._shadowSettings = settings;

        this._textureSize = 256;
        this._texturePrecisionFormat = 'BYTE';
        this._algorithm = 'PCF';
        this._depthRange = new Array( 4 );

        var lightSource = settings.getLightSource();
        var light = lightSource.getLight();
        this._shadowAttribute = new ShadowAttribute( light, this._algorithm, this._bias, this._exponent0, this._exponent1, this.vsmEpsilon );

        this._worldLightPos = Vec4.create();
        this._worldLightPos[ 3 ] = 0;
        this._worldLightDir = Vec4.create();
        this._worldLightDir[ 3 ] = 1;

    };

    /** @lends ShadowMap.prototype */
    ShadowMap.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( ShadowTechnique.prototype, {
        dirty: function () {
            this._dirty = true;
        },
        getCamera: function () {
            return this._cameraShadow;
        },
        getTexture: function () {
            return this._texture;
        },

        setShadowCasterShaderProgram: function ( prg ) {
            var shadowSettings = this.getShadowSettings();
            if ( shadowSettings._castingStateset ) shadowSettings._castingStateset.setAttributeAndMode( prg, StateAttribute.ON | StateAttribute.OVERRIDE );
            this._castsShaderProgram = prg;
        },

        getShaderProgram: function ( vs, ps, defines ) {
            var hash = vs + ps + defines.join( '_' );
            var shadowSettings = this._shadowSettings || this.getShadowedScene().getShadowSettings();
            if ( !shadowSettings._config[ 'cacheProgram' ] ) {
                shadowSettings._config[ 'cacheProgram' ] = {};
            }
            var cache = shadowSettings._config[ 'cacheProgram' ];
            if ( cache[ hash ] !== undefined )
                return cache[ hash ];

            if ( !this._shaderProcessor ) {
                this._shaderProcessor = new ShaderProcessor(); // singleton call ?
            }

            var vertexshader = this._shaderProcessor.getShader( vs, defines );
            var fragmentshader = this._shaderProcessor.getShader( ps, defines );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vertexshader ), new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            cache[ hash ] = program;
            return program;
        },

        // TODO: remove either here or in node shadow: code repetition ?
        // ... otherwise caster and receiver doesn't get same defines
        // if any change done here and not overthere
        getDefines: function () {

            var textureType = this._shadowAttribute.getPrecision();
            var algo = this._shadowAttribute.getAlgorithm();
            var defines = [];

            var isFloat = false;
            var isLinearFloat = false;

            if ( ( typeof textureType === 'string' && textureType !== 'BYTE' ) || textureType !== Texture.UNSIGNED_BYTE ) {
                isFloat = true;
            }

            if ( isFloat && ( ( typeof textureType === 'string' && textureType.indexOf( 'LINEAR' ) !== -1 ) || textureType === Texture.HALF_FLOAT_LINEAR || textureType === Texture.FLOAT_LINEAR ) ) {
                isLinearFloat = true;
            }


            if ( algo === 'ESM' ) {
                defines.push( '#define _ESM' );
            } else if ( algo === 'NONE' ) {
                defines.push( '#define _NONE' );
            } else if ( algo === 'PCF' ) {
                defines.push( '#define _PCF' );
            } else if ( algo === 'VSM' ) {
                defines.push( '#define _VSM' );
            } else if ( algo === 'EVSM' ) {
                defines.push( '#define _EVSM' );
            }

            if ( isFloat ) {
                defines.push( '#define  _FLOATTEX' );
            }
            if ( isLinearFloat ) {
                defines.push( '#define  _FLOATLINEAR' );
            }

            return defines;
        },
        // computes a shader upon user choice
        // of shadow algorithms
        // shader file, define but texture type/format
        // associated too
        computeShadowCasterShaderProgram: function () {

            var shadowSettings = this._shadowSettings || this.getShadowedScene().getShadowSettings();

            var textureFormat = shadowSettings.getTextureFormat();
            var defines = this.getDefines();

            /*
            var floatTexSupp = textureType !== 'BYTE';
            if ( floatTexSupp && algo === 'EVSM' ) {
                textureFormat = Texture.RGBA;
            } else if ( floatTexSupp && algo === 'VSM' ) {
                textureFormat = Texture.RGBA;
            } else {
                if ( algo === 'ESM' ) {
                    textureFormat = Texture.LUMINANCE;
                } else if ( algo === 'NONE' ) {
                    if ( floatTexSupp )
                        textureFormat = Texture.LUMINANCE;
                } else if ( algo === 'PCF' ) {
                    if ( floatTexSupp )
                        textureFormat = Texture.LUMINANCE;
                } else if ( algo === 'VSM' ) {
                    textureFormat = Texture.RGBA;
                }
                textureFormat = Texture.RGBA;
            }*/
            // BASE FORMAT, unfortunately LUMINANCe isn't well supported on safari ?
            // TODO: LUMINANCE framebuffer render texture support ?
            textureFormat = Texture.RGBA;

            var shadowmapCasterVertex = 'shadowsCastVert.glsl';
            var shadowmapCasterFragment = 'shadowsCastFrag.glsl';
            var prg = this.getShaderProgram( shadowmapCasterVertex, shadowmapCasterFragment, defines );

            //this._texturePrecisionFormat
            //= textureType;
            //this.textureFormat = textureFormat;

            return prg;
        },

        getShadowCasterShaderProgram: function () {
            if ( this._dirty || this._castsShaderProgram === undefined ) {
                this._castsShaderProgram = this.computeShadowCasterShaderProgram();
            }
            return this._castsShaderProgram;
        },

        setCastingStateset: function ( st ) {
            this.getShadowSettings()._castingStateset = st;
        },
        getCastingStateset: function () {
            return this.getShadowSettings()._castingStateset;
        },

        /* Gets shadowSettings
         * or return Default shadowSettings
         * if it's shared between techniques
         */
        getShadowSettings: function () {
            return this._shadowSettings || this.getShadowedScene().getShadowSettings();
        },
        /* Sets  shadowSettings
         */
        setShadowSettings: function ( ss ) {
            this._shadowSettings = ss;
        },

        getBias: function () {
            return this._shadowAttribute.getBias();

        },
        setBias: function ( value ) {
            this._shadowAttribute.setBias( value );
        },
        getExponent0: function () {
            return this._shadowAttribute.getExponent0();
        },
        setExponent0: function ( value ) {
            this._shadowAttribute.setExponent0( value );
            var casterStateSet = this.getShadowSettings()._castingStateset;
            casterStateSet.getUniformList()[ 'exponent0' ].getUniform().set( value );
        },
        getExponent1: function () {
            return this._shadowAttribute.getExponent1();
        },
        setExponent1: function ( value ) {
            this._shadowAttribute.setExponent1( value );
            var casterStateSet = this.getShadowSettings()._castingStateset;
            casterStateSet.getUniformList()[ 'exponent1' ].getUniform().set( value );
        },
        getVsmEpsilon: function () {
            return this._shadowAttribute.getVsmEpsilon();
        },
        setVsmEpsilon: function ( value ) {
            this._shadowAttribute.setVsmEpsilon( value );
        },

        /** initialize the ShadowedScene and local cached data structures.*/
        init: function () {
            if ( !this._shadowedScene ) return;

            var shadowSettings = this.getShadowSettings();
            this._dirty = true;

            var lightSource = shadowSettings.getLightSource();
            var light = lightSource.getLight();

            // TODO: sort mess between shadowsettings and shadomap
            // handling dirty dirty shadowmpa and dirty shadowsettings
            // make it for two way of ding things.. strange.
            this._textureSize = shadowSettings.getTextureSize();
            this._texturePrecisionFormat = shadowSettings.getTextureType();
            this._textureMinFilter = shadowSettings.getTextureFilterMin();
            this._textureMagFilter = shadowSettings.getTextureFilterMax();
            this._algorithm = shadowSettings.getAlgorithm();


            var bias = shadowSettings._config[ 'bias' ];
            var exponent0 = shadowSettings._config[ 'exponent' ];
            var exponent1 = shadowSettings._config[ 'exponent1' ];
            var vsmEpsilon = shadowSettings._config[ 'VsmEpsilon' ];

            this._shadowAttribute = new ShadowAttribute( light, this._algorithm, bias, exponent0, exponent1, vsmEpsilon, this._texturePrecisionFormat );
            this._receivingStateset = this._shadowedScene.getReceivingStateSet();

            // First init
            var texUnit = light.getLightNumber() + 4;
            if ( !this._texture ) {

                var shadowTexture = new ShadowTexture();
                // TODO texUnit choice: 4 shift ... is abitrary and wrong
                // TODO: LIGHT NUMBER in shadowTexture ...
                shadowTexture.setLightUnit( light.getLightNumber() );
                shadowTexture.setName( 'ShadowTexture' + texUnit );
                this._texture = shadowTexture;

                // init camera
                var shadowCamera = new Camera();

                this.setCameraCullCallback( shadowCamera );

                shadowCamera.setRenderOrder( Camera.PRE_RENDER, 0 );
                shadowCamera.setReferenceFrame( Transform.ABSOLUTE_RF );
                shadowCamera.setClearColor( [ 1.0, 1.0, 1.0, 1.0 ] );


                shadowCamera.setName( 'light_shadow_camera' + light.getName() );
                shadowSettings._cameraShadow = shadowCamera;
                this._cameraShadow = shadowCamera;


                // init StateSets
                //////////////
                var casterStateSet = new StateSet();
                shadowSettings._castingStateset = casterStateSet;

                // just keep same as render
                //casterStateSet.setAttributeAndMode(new CullFace(CullFace.DISABLE), StateAttribute.ON | StateAttribute.OVERRIDE);
                casterStateSet.setAttributeAndMode( new CullFace( CullFace.BACK ), StateAttribute.ON | StateAttribute.OVERRIDE );

                var myuniform;
                myuniform = Uniform.createFloat1( exponent0, 'exponent0' );
                casterStateSet.addUniform( myuniform );
                myuniform = Uniform.createFloat1( exponent1, 'exponent1' );
                casterStateSet.addUniform( myuniform );


                // prevent unnecessary texture bindings, could loop over max texture unit
                // TODO: optimize: have a "don't touch current Texture stateAttribute"
                // deduce from shader compil ?
                var blankTexture = new Texture();
                blankTexture.defaultType = true;
                blankTexture.setName( 'emptyTex' );

                casterStateSet.setTextureAttributeAndMode( 0, blankTexture, StateAttribute.OFF | StateAttribute.OVERRIDE );
                casterStateSet.setTextureAttributeAndMode( 1, blankTexture, StateAttribute.OFF | StateAttribute.OVERRIDE );
                casterStateSet.setTextureAttributeAndMode( 2, blankTexture, StateAttribute.OFF | StateAttribute.OVERRIDE );
                casterStateSet.setTextureAttributeAndMode( 3, blankTexture, StateAttribute.OFF | StateAttribute.OVERRIDE );


                var near = 0.001;
                var far = 1000;
                var depthRange = new Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' );
                casterStateSet.addUniform( depthRange );

                var camera = shadowSettings._config[ 'camera' ];
                shadowSettings._cameraShadowed = camera;

            }

            this._textureAllocate();

            var casterProgram = this.getShadowCasterShaderProgram();
            this.setShadowCasterShaderProgram( casterProgram );
            shadowSettings._castingStateset.setAttributeAndMode( casterProgram, StateAttribute.ON | StateAttribute.OVERRIDE );


            this._receivingStateset.setAttributeAndMode( this._shadowAttribute, this._texture, StateAttribute.ON | StateAttribute.OVERRIDE );

            this._receivingStateset.setTextureAttributeAndMode( texUnit, this._texture, StateAttribute.ON | StateAttribute.OVERRIDE );

            // TODO:  double sure shader compiler force recompile ?
            this._dirty = false;
            shadowSettings._dirty = false;
        },

        valid: function () {
            // checks
            return true;
        },

        updateShadowParams: function () {

            this.aimShadowCastingCamera();

            /*
            // update accordingly
            if ( !this._dirty ) return;
            //update texture size, format, etc. from settings if different

            this.textureAllocate();
            this.setShadowCasterShaderProgram(this.getShadowCasterShaderProgram());

            // updated
            this._dirty = false;*/
        },
        // internal texture allocation
        // handle any change like resize, filter param, etc.
        _textureAllocate: function () {

            if ( !this._dirty ) return;

            var glCtxt = this.getShadowedScene().getGLContext();
            var shadowSettings = this.getShadowSettings();

            this._texture.dirty();
            this._texture.releaseGLObjects( glCtxt );

            var mapsize = this._textureSize;
            var shadowSizeFinal = [ mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize ];

            this._texture.setTextureSize( shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] );


            var texType = this._texturePrecisionFormat;
            var textureType, textureFormat, texFilterMin, texFilterMax;
            switch ( texType ) {
            case 'HALF_FLOAT':
                textureType = Texture.HALF_FLOAT;
                texFilterMin = Texture.NEAREST;
                texFilterMax = Texture.NEAREST;
                break;
            case 'HALF_FLOAT_LINEAR':
                textureType = Texture.HALF_FLOAT;
                texFilterMin = Texture.LINEAR;
                texFilterMax = Texture.LINEAR;
                break;
            case 'FLOAT':
                textureType = Texture.FLOAT;
                texFilterMin = Texture.NEAREST;
                texFilterMax = Texture.NEAREST;
                break;
            case 'FLOAT_LINEAR':
                textureType = Texture.FLOAT;
                texFilterMin = Texture.LINEAR;
                texFilterMax = Texture.LINEAR;
                break;
            case 'BYTE':
                textureType = Texture.UNSIGNED_BYTE;
                texFilterMin = Texture.LINEAR;
                texFilterMax = Texture.LINEAR;
                break;

            default:
                textureType = Texture.UNSIGNED_BYTE;
                texFilterMin = Texture.LINEAR;
                texFilterMax = Texture.LINEAR;
                break;

            }

            textureFormat = Texture.RGBA;
            /*
             FLOAT luminance webgl bug or unsupported by spec
              */
            /*
             if ( this._config[ 'shadow' ] === 'ESM' ) {
                 textureFormat = Texture.LUMINANCE;
             } else if ( this._config[ 'shadow' ] === 'NONE' ) {
                 textureFormat = Texture.LUMINANCE;
             } else if ( this._config[ 'shadow' ] === 'PCF' ) {
                 textureFormat = Texture.LUMINANCE;
             } else if ( this._config[ 'shadow' ] === 'VSM' ) {
                 textureFormat = Texture.RGBA;
             } else if ( this._config[ 'shadow' ] === 'EVSM' ) {
                 textureFormat = Texture.RGBA;
             }
             */

            /*
            var doBlur = shadowSettings.getConfig( 'blur' );
            var doDownSample = shadowSettings.getConfig( 'supersample' );
            if ( doBlur && doDownSample !== 0 ) {
                // we want to blur as VSM support that
                texFilterMin =  'LINEAR' ;
                texFilterMax = 'LINEAR' ;
            } else {
                texFilterMin 'NEAREST' ;
                texFilterMax 'NEAREST' ;
            }
             */

            this._texture.setType( textureType );
            this._shadowAttribute.setPrecision( textureType );

            this._texture.setMinFilter( texFilterMin );
            this._texture.setMagFilter( texFilterMax );
            this._texture.setInternalFormat( textureFormat );

            this._textureMagFilter = texFilterMax;
            this._textureMinFilter = texFilterMin;

            this._texture.setWrapS( Texture.CLAMP_TO_EDGE );
            this._texture.setWrapT( Texture.CLAMP_TO_EDGE );

            // force recreation
            //this._texture.init( glCtxt );

            // force reattach
            var camera = this._cameraShadow;
            var frameBuffer = camera.frameBufferObject;
            camera.attachments = undefined;
            if ( frameBuffer ) {
                frameBuffer.attachments = [];
                frameBuffer.dirty();
            }

            camera.attachTexture( glCtxt.COLOR_ATTACHMENT0, this._texture, 0 );
            camera.attachRenderBuffer( glCtxt.DEPTH_ATTACHMENT, glCtxt.DEPTH_COMPONENT16 );

            shadowSettings._cameraShadow.setViewport( new Viewport( 0, 0, shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] ) );

        },
        setTexturePrecision: function ( fmt ) {
            this._texturePrecisionFormat = fmt;
            this._shadowAttribute.setPrecision( fmt );
            this.dirty();
        },
        setTextureSize: function ( mapSize ) {
            this._textureSize = mapSize;
            this.dirty();
        },
        setAlgorithm: function ( algo ) {
            this._previousAlgorithm = this._algorithm;
            this._algorithm = algo;

            this._shadowAttribute.setAlgorithm( algo );
            this.dirty();
        },

        /*
         * compute  scene bounding box and bounding sphere
         */
        getBoundsCaster: function ( worldLightPos ) {
            var bs;
            // get the bounds of the scene

            var shadowSettings = this.getShadowSettings();
            shadowSettings._cbbv.reset( worldLightPos, this._frustumReceivers, this._frustumReceivers.length );
            // Why would we restrict the bbox further used for computation to just the
            // caster bbox ?
            // we'll need both caster+receiver to determine shadow map view/projection
            //shadowSettings._cbbv.setTraversalMask( shadowSettings.getCastsShadowTraversalMask() );
            //shadowSettings._cbbv.setTraversalMask( shadowSettings.getReceivesShadowTraversalMask() );


            this.getShadowedScene().nodeTraverse( shadowSettings._cbbv );
            bs = this._bs;
            bs.init();
            bs.expandByBox( shadowSettings._cbbv.getBoundingBox() );

            this._boundsCaster = bs;
            return this._boundsCaster;
        },

        /*
         * Sync camera and light vision so that
         * shadow map render using a camera whom
         * settings come from the light
         * and the scene being shadowed
         */
        aimShadowCastingCamera: function () {

            var shadowSettings = this.getShadowSettings();
            var lightSource = shadowSettings.getLightSource();
            var light = lightSource.getLight();
            var camera = this._cameraShadow;

            Matrix.copy( camera.getProjectionMatrix(), this._projectionMatrix );
            Matrix.copy( camera.getViewMatrix(), this._viewMatrix );
            var projection = this._projectionMatrix;
            var view = this._viewMatrix;
            //var projection = camera.getProjectionMatrix();
            //var view = camera.getViewMatrix();

            // inject camera world matrix.
            // from light current world/pos

            // (those you could get during "light addpositionedAttributes" cull pass.. ?)
            // TODO: clever code share between light and shadow attributes
            // try reusing light matrix uniform.
            var matrixList = lightSource.getWorldMatrices();
            var worldMatrix = matrixList[ 0 ]; // world
            //var worldMatrix = matrixList[ 1 ]; // scene camera space

            var worldLightPos = this._worldLightPos;
            var worldLightDir = this._worldLightDir;

            //  light pos & lightTarget in World Space
            Matrix.transformVec3( worldMatrix, light.getPosition(), worldLightPos );
            Vec4.copy( light.getDirection(), worldLightDir );
            worldLightDir[ 3 ] = 0;
            Matrix.transformVec4( worldMatrix, worldLightDir, worldLightDir );
            //Vec3.normalize( worldLightDir, worldLightDir );

            var zFar, zNear, radius, center, centerDistance, frustumBound;
            var zFix = false;

            if ( this._optimizedFrustum ) {

                ////////////////////////////////////////
                /// start  computations OPTIMIZED NEAR FAR
                ////////////////////////////////////////

                // clip against camera frustum + cast "margin  between light near and scene"
                //var bx = shadowSettings._cbbv.getBoundingBox();
                frustumBound = this.getBoundsCaster( worldLightPos );
                //bs.expandBySphere( bsCamera );
                center = frustumBound.center();
                radius = frustumBound.radius();

                centerDistance = Vec3.distance( worldLightPos, center );
                zNear = centerDistance - radius;
                zFar = centerDistance + radius;
                /////////////////////////////////////////////////////////
            } else {
                // use camera auto near/far
                zFar = this._farCaster;
                zNear = this._nearCaster;
                zFix = true;

                if ( camera.getComputeNearFar() === false || zNear === undefined || zFar === undefined ) {
                    // didn't get near/far auto computed
                    // first frame, off, etc.
                    frustumBound = this.getShadowedScene().getBound();
                    center = frustumBound.center();
                    radius = frustumBound.radius();

                    centerDistance = Vec3.distance( worldLightPos, center );
                    zNear = centerDistance - radius;
                    zFar = centerDistance + radius;
                    zFix = false;
                }
            }

            // Empty or Bad Frustums
            // No objects, handle it gracefully
            var epsilon = 1e-6;
            if ( zFar < zNear - epsilon ) {

                // TODO: clear shadow texture and return wihtout any further ops
                // with a early out
                Notify.log( 'empty shadowMap' );
                // for now just prevent NaN errors

                if ( this._optimizedFrustum ) {
                    for ( var l = 0; l < 6; l++ ) {
                        for ( var k = 0; k < 4; k++ ) {
                            this._frustumCasters[ l ][ k ] = 0.0;
                        }
                    }
                }

                zFar = 1;
                zNear = 0.001;
                zFix = true;
            }

            // Check div by zero or NaN cases
            if ( zNear === Number.POSITIVE_INFINITY || zNear < epsilon ) {
                zNear = epsilon;
                zFix = true;
            }
            if ( zNear === Number.NEGATIVE_INFINITY || zFar < epsilon ) {
                zFar = 1.0;
                zFix = true;
            }

            var zNearRatio = 0.001;
            if ( zNear < zFar * zNearRatio ) {
                zNear = zFar * zNearRatio;
                zFix = true;
            }

            if ( zFix ) {
                radius = ( zFar - zNear ) * 0.5;


                // move from camera to near
                // first compute a ray along light dir of length near
                Vec3.mult( worldLightDir, zNear, this._tmpVec );
                // then
                Vec3.add( worldLightPos, this._tmpVec, this._tmpVec );

                // move from near to center
                // first compute a ray along light dir of length radius
                Vec3.mult( worldLightDir, radius, this._tmpVecBis );
                Vec3.add( this._tmpVec, this._tmpVecBis, this._tmpVec );

                center = this._tmpVec;
                centerDistance = Vec3.distance( worldLightPos, center );

                zNear = centerDistance - radius;
                zFar = centerDistance + radius;

            }

            Notify.assert( zNear > epsilon );
            Notify.assert( zFar > zNear + epsilon );

            var top, right;
            var up = this._lightUp;

            if ( Math.abs( Vec3.dot( up, worldLightDir ) ) >= 1.0 ) {
                // another camera up
                up = [ 1.0, 0.0, 0.0 ];
            }

            if ( light.getPosition()[ 3 ] !== 0.0 ) {
                // positional light: spot, point, area
                var spotAngle = light.getSpotCutoff();
                if ( spotAngle < 180.0 ) {
                    // statically defined by spot, only needs zNear zFar estimates
                    // or moste precise possible to tighten and enhance precision
                    Matrix.makePerspective( spotAngle * 2.0, 1.0, zNear, zFar, projection );

                    // now compute view
                    var worldTarget = this._worldTarget || Vec3.create();
                    this._worldTarget = this.tmpVecBis;
                    // ray along direction
                    Vec3.mult( worldLightDir, zFar, worldTarget );
                    //Vec3.mult( worldLightDir, centerDistance, worldTarget );
                    // do go far a way adding that scaled ray on ligth pos
                    Vec3.add( worldLightPos, worldTarget, worldTarget );
                    Matrix.makeLookAt( worldLightPos, center, up, view );
                } else {
                    // point light/sortof
                    // standard omni-directional positional light
                    top = ( radius / centerDistance ) * zNear;
                    right = top;

                    Matrix.makeFrustum( -right, right, -top, top, zNear, zFar, projection );
                    Matrix.makeLookAt( worldLightPos, center, up, view );
                }
            } else {
                // directional light
                // make an orthographic projection
                // set the position *far* away along the light direction (inverse)
                Vec3.mult( worldLightDir, -radius * 1.5, this._tmpVecBis );
                worldLightPos = Vec3.add( center, this._tmpVecBis, worldLightPos );

                top = radius;
                right = top;
                Matrix.makeOrtho( -right, right, -top, top, zNear, zFar, projection );
                Matrix.makeLookAt( worldLightPos, center, up, view );
            }

            this._depthRange[ 0 ] = zNear;
            this._depthRange[ 1 ] = zFar;
            this._depthRange[ 2 ] = zFar - zNear;
            this._depthRange[ 3 ] = 1.0 / ( zFar - zNear );

            var castUniforms = shadowSettings._castingStateset.getUniformList();
            castUniforms[ 'Shadow_DepthRange' ].getUniform().set( this._depthRange );

            Matrix.copy( this._projectionMatrix, camera.getProjectionMatrix() );
            Matrix.copy( this._viewMatrix, camera.getViewMatrix() );

            // change each frame
            // don't set dirty
            // otherwise will
            // make texture reupload
            // (therefore emptyiing it each frame)
            this._texture.setViewMatrix( view );
            this._texture.setProjectionMatrix( projection );
            this._texture.setDepthRange( this._depthRange );

            // too late, it's latest frame
            // shadowCamera.setComputeNearFar( true );
            this._cameraShadow.setComputeNearFar( false );

            var bias = shadowSettings._config[ 'bias' ];
            if ( bias ) this.setBias( bias );
            var exponent0 = shadowSettings._config[ 'exponent' ];
            if ( exponent0 ) this.setExponent0( exponent0 );
            var exponent1 = shadowSettings._config[ 'exponent1' ];
            if ( exponent1 ) this.setExponent1( exponent1 );
            var vsmEpsilon = shadowSettings._config[ 'VsmEpsilon' ];
            if ( vsmEpsilon ) this.setVsmEpsilon( vsmEpsilon );

        },

        cullShadowCastingScene: function ( cullVisitor ) {
            // record the traversal mask on entry so we can reapply it later.
            var traversalMask = cullVisitor.getTraversalMask();
            var shadowSettings = this.getShadowSettings();

            cullVisitor.setTraversalMask( shadowSettings.getCastsShadowTraversalMask() );

            // cast geometries into depth shadow map
            cullVisitor.pushStateSet( shadowSettings._castingStateset );

            this.aimShadowCastingCamera();

            // do RTT from the camera traversal mimicking light pos/orient
            this._cameraShadow.accept( cullVisitor );

            cullVisitor.popStateSet();

            // reapply the original traversal mask
            cullVisitor.setTraversalMask( traversalMask );
        },

        enterCullCaster: function ( cullVisitor ) {



            if ( this._optimizedFrustum ) {
                // well shouldn't be called
                cullVisitor.setEnableFrustumCulling( true );

                var camera = this._cameraShadow;


                var m = cullVisitor.getCurrentProjectionMatrix();
                cullVisitor.clampProjectionMatrix( m, cullVisitor._computedNear, cullVisitor._computedFar, cullVisitor._nearFarRatio );
                var mvp = this._tmpMat;
                Matrix.mult( camera.getProjectionMatrix(), camera.getViewMatrix(), mvp );
                cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, false, true );
            }

        },

        exitCullCaster: function ( cullVisitor ) {

            this._nearCaster = cullVisitor._computedNear;
            this._farCaster = cullVisitor._computedFar;


            if ( this._optimizedFrustum ) {
                var m = cullVisitor.getCurrentProjectionMatrix();
                cullVisitor.clampProjectionMatrix( m, this._nearCaster, this._farCaster, cullVisitor._nearFarRatio );
                var mvp = this._tmpMat;
                Matrix.mult( this._cameraShadow.getProjectionMatrix(), this._cameraShadow.getViewMatrix(), mvp );
                cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, false );
                for ( var i = 0; i < 6; i++ ) {
                    Vec4.copy( cullVisitor._frustum[ i ], this._frustumCasters[ i ] );
                }
            }
        },


        /** run the cull traversal of the ShadowedScene and set up the rendering for this ShadowTechnique.*/
        cull: function ( cullVisitor ) {

            // make sure positioned data is done for light,
            // do it first
            //this.cullShadowReceivingScene( cullVisitor );

            // now we can update camera from light accordingly
            this.updateShadowParams();
            // culled last but rendered first
            this.cullShadowCastingScene( cullVisitor );

            return false;
        },

        cleanSceneGraph: function () {
            // well release a lot more things when it works
            var shadowSettings = this._shadowSettings;

            if ( shadowSettings._castingStateset ) {
                shadowSettings._cameraShadow = undefined;
                shadowSettings._castingStateset.releaseGLObjects();
                shadowSettings._castingStateset = undefined;
            }

            this._cameraShadow = undefined;


            if ( this._texture ) {
                this._texture.releaseGLObjects();
                this._texture = undefined;
            }
        }

    } ), 'osg', 'ShadowMap' );

    MACROUTILS.setTypeID( ShadowMap );

    return ShadowMap;
} );
