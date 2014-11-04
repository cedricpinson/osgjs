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
    'osgShader/ShaderProcessor',
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowFrustumIntersection',
    'osg/CullFace'
], function ( Notify, MACROUTILS, Object, Node, NodeVisitor, CullVisitor, Vec3, Vec4, Matrix, BoundingBox, BoundingSphere, ComputeMatrixFromNodePath, Transform, Camera, Texture, Viewport, StateSet, StateAttribute, Uniform, Shader, Program, ShaderProcessor, ShadowTechnique, ShadowFrustumIntersection, CullFace ) {
    'use strict';

    /**
     *  ShadowMap provides an implementation of shadow textures.
     *  @class ShadowMap
     */
    var ShadowMap = function ( settings ) {
        ShadowTechnique.call( this );

        // uniforms, shaders ?
        this._lightNum = settings.getLight().getLightNumber();
        this._shadowTextureUnit = this._lightNum + 1;
        // this._texture
        // shadowSettings._cameraShadow
        this._frustumCasters = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];
        this._frustumReceivers = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];

        settings._cbbv = new ShadowFrustumIntersection( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN, this._frustumReceivers, this._frustumCasters );

        this._tmpMat = Matrix.create();
        this._bs = new BoundingSphere();

        this._shadowSettings = settings;

        this._textureSize = 256;
        this._texturePrecisionFormat = 'BYTE';
        this._algorithm = 'ESM';
    };

    /** @lends ShadowMap.prototype */
    ShadowMap.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( ShadowTechnique.prototype, {
        dirty: function () {
            this._dirty = true;
        },
        getCamera: function () {
            return this.getShadowSettings()._cameraShadow;
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

        getDefines: function () {

            var shadowSettings = this._shadowSettings || this.getShadowedScene().getShadowSettings();

            var textureType = shadowSettings.getTextureType();
            var algo = shadowSettings.getAlgorithm();
            var defines = [];

            var floatTexSupp = textureType !== 'BYTE';
            if ( floatTexSupp ) {
                defines.push( '#define  _FLOATTEX' );
            }

            if ( shadowSettings._config[ 'shadowstable' ] === 'World Position' ) {
                defines.push( '#define NUM_STABLE' );
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

        /** initialize the ShadowedScene and local cached data structures.*/
        init: function () {
            if ( !this._shadowedScene ) return;

            var shadowSettings = this.getShadowSettings();
            this._dirty = true;
            var light = shadowSettings.getLight();
            var num = this._lightNum;
            // TODO: handle texture num


            // TODO: sort mess between shadowsettings and shadomap
            // handling dirty dirty shadowmpa and dirty shadowsettings
            // make it for two way of ding things.. strange.
            this._textureSize = shadowSettings.getTextureSize();
            this._texturePrecisionFormat = shadowSettings.getTextureType();
            this._textureMinFilter = shadowSettings.getTextureFilterMin();
            this._textureMagFilter = shadowSettings.getTextureFilterMax();
            this._algorithm = shadowSettings.getAlgorithm();


            this._receivingStateset = this._shadowedScene.getReceivingStateSet();

            // First init
            if ( !this._texture ) {
                var shadowTexture = new Texture();
                shadowTexture.setName( 'shadow_' + light.getName() );
                this._texture = shadowTexture;

                var near = 0.001;
                var far = 1000;
                var depthRangeNum = new Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' + num );
                var shadowMapSizeNum = new Uniform.createFloat4( this._textureSize, 'Shadow_MapSize_' + num );
                var projectionShadowNum = new Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'Shadow_Projection' + num );
                var viewShadowNum = new Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'Shadow_View' + num );
                var enabledLight = new Uniform.createFloat1( 1.0, 'Light' + num + '_uniform_enable' );


                this._receivingStateset.addUniform( enabledLight );
                this._receivingStateset.addUniform( projectionShadowNum );
                this._receivingStateset.addUniform( viewShadowNum );
                this._receivingStateset.addUniform( depthRangeNum );
                this._receivingStateset.addUniform( shadowMapSizeNum );


                // draw only shadow & light, not texture
                var texturedebug = shadowSettings._config[ 'texture' ] ? 1.0 : 0.0;
                var myuniform = Uniform.createFloat1( texturedebug, 'debug_' + num );
                this._receivingStateset.addUniform( myuniform );
                // Shadow bias /acne/ peter panning
                var bias = shadowSettings._config[ 'bias' ];
                myuniform = Uniform.createFloat1( bias, 'bias_' + num );
                this._receivingStateset.addUniform( myuniform );
                // ESM & EVSM
                var exponent = shadowSettings._config[ 'exponent' ];
                myuniform = Uniform.createFloat1( exponent, 'exponent_' + num );
                this._receivingStateset.addUniform( myuniform );
                var exponent1 = shadowSettings._config[ 'exponent1' ];
                myuniform = Uniform.createFloat1( exponent1, 'exponent1_' + num );
                this._receivingStateset.addUniform( myuniform );
                // VSM
                var VsmEpsilon = shadowSettings._config[ 'VsmEpsilon' ];
                myuniform = Uniform.createFloat1( VsmEpsilon, 'VsmEpsilon_' + num );
                this._receivingStateset.addUniform( myuniform );

                //this._receivingStateset.addUniform( Uniform.createInt1( 0, 'Texture0' ) );

                this._receivingStateset.setTextureAttributeAndMode( this._lightNum + 1, this._texture, StateAttribute.ON | StateAttribute.OVERRIDE );
                //this._receivingStateset.addUniform( Uniform.createInt1( num + 1, 'Texture' + ( num + 1 ) ) );
                this._receivingStateset.addUniform( Uniform.createInt1( this._lightNum + 1, 'shadow_light' + this._lightNum ) );


                // init camera
                var shadowCamera = new Camera();

                this.setCameraCullCallback( shadowCamera );

                shadowCamera.setRenderOrder( Camera.PRE_RENDER, 0 );
                shadowCamera.setReferenceFrame( Transform.ABSOLUTE_RF );
                shadowCamera.setClearColor( [ 1.0, 1.0, 1.0, 1.0 ] );

                shadowCamera.setName( 'light_shadow_camera' + light.getName() );
                shadowSettings._cameraShadow = shadowCamera;


                // init StateSets
                //////////////
                var casterStateSet = new StateSet();
                shadowSettings._castingStateset = casterStateSet;

                // just keep same as render
                //casterStateSet.setAttributeAndMode(new CullFace(CullFace.DISABLE), StateAttribute.ON | StateAttribute.OVERRIDE);
                casterStateSet.setAttributeAndMode( new CullFace( CullFace.BACK ), StateAttribute.ON | StateAttribute.OVERRIDE );

                // prevent unnecessary texture bindings, could loop over max texture unit
                // TODO: optimize: have a "don't touch current Texture stateAttribute"
                // deduce from shader compil ?
                /*

                 casterStateSet.setTextureAttributeAndMode( 0, new Texture(), StateAttribute.OFF | StateAttribute.PROTECTED );
                 casterStateSet.setTextureAttributeAndMode( 1, new Texture(), StateAttribute.OFF | StateAttribute.PROTECTED );
                 casterStateSet.setTextureAttributeAndMode( 2, new Texture(), StateAttribute.OFF | StateAttribute.PROTECTED );
                 casterStateSet.setTextureAttributeAndMode( 3, new Texture(), StateAttribute.OFF | StateAttribute.PROTECTED );

                */

                var depthRange = new Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' );
                casterStateSet.addUniform( depthRange );

                var camera = shadowSettings._config[ 'camera' ];
                shadowSettings._cameraShadowed = camera;

            }

            this._textureAllocate();

            // TODO:  shader split devencfloat.glsl
            var casterProgram = this.getShadowCasterShaderProgram();
            this.setShadowCasterShaderProgram( casterProgram );
            shadowSettings._castingStateset.setAttributeAndMode( casterProgram, StateAttribute.ON | StateAttribute.OVERRIDE );


            // TODO:  shader compiler force recompile ?
            this._receivingStateset.attributeMap.dirty();
            this._dirty = false;
            shadowSettings._dirty = false;
        },

        valid: function () {
            // checks
            return true;
        },

        updateShadowParams: function () {
            // could do some light/scene change check here and skip it
            var shadowSettings = this.getShadowSettings();
            var light = shadowSettings.getLight();

            this.aimShadowCastingCamera( light, light.getPosition(), light.getDirection() );

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
            this._texture.setMinFilter( texFilterMin );
            this._texture.setMagFilter( texFilterMax );
            this._texture.setInternalFormat( textureFormat );

            this._textureMagFilter = texFilterMax;
            this._textureMinFilter = texFilterMin;

            this._texture.setWrapS( Texture.CLAMP_TO_EDGE );
            this._texture.setWrapT( Texture.CLAMP_TO_EDGE );

            // force recreation

            // force reattach
            var camera = shadowSettings._cameraShadow;
            var frameBuffer = camera.frameBufferObject;
            camera.attachments = undefined;
            if ( frameBuffer ) {
                frameBuffer.attachments = [];
                frameBuffer.dirty();
            }

            camera.attachTexture( glCtxt.COLOR_ATTACHMENT0, this._texture, 0 );
            camera.attachRenderBuffer( glCtxt.DEPTH_ATTACHMENT, glCtxt.DEPTH_COMPONENT16 );

            shadowSettings._cameraShadow.setViewport( new Viewport( 0, 0, shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] ) );
            this._receivingStateset.getUniformList()[ 'Shadow_MapSize_' + this._lightNum ].getUniform().set( shadowSizeFinal );

        },
        setTexturePrecision: function ( fmt ) {
            this._texturePrecisionFormat = fmt;
            this.dirty();
        },
        setTextureSize: function ( mapSize ) {
            this._textureSize = mapSize;
            this.dirty();
        },

        setAlgorithm: function ( algo ) {
            this._algorithm = algo;
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
         * @param { Light } light
         * @param { Vec4  } lightPos - w is 0 for directional
         * @param { Vec3  } lightDir
         * @param { Vec3  } lightUp - by default = osg::Vec3( 0, 1 0 )
         */
        aimShadowCastingCamera: function ( light, lightPos, lightDir, lightUp ) {

            var shadowSettings = this.getShadowSettings();
            var camera = shadowSettings._cameraShadow;
            var view = camera.getViewMatrix();
            var projection = camera.getProjectionMatrix();

            // lightSource can has only 1 parent and it is matrix transform.
            var parentNode = light.getUserData();
            // inject
            // camera world matrix.
            // from light current position
            var matrixList = parentNode.getWorldMatrices();
            var worldMatrix = matrixList[ 0 ];

            this._worldLightPos = this._worldLightPos || Vec3.create();
            this._worldLightDir = this._worldLightDir || Vec3.create();
            var worldLightPos = this._worldLightPos;
            var worldLightDir = this._worldLightDir;
            //  light pos & lightTarget in World Space
            Matrix.transformVec3( worldMatrix, lightPos, worldLightPos );
            Matrix.transformVec3( worldMatrix, lightDir, worldLightDir );
            Vec3.normalize( worldLightDir, worldLightDir );
            var position = worldLightPos;


            ////////////////////////////////////////
            /// start  computations OPTIMIZED NEAR FAR
            ////////////////////////////////////////

            // clip against camera frustum + cast "margin  between light near and scene"
            //var bx = shadowSettings._cbbv.getBoundingBox();
            //var bs = this.getBoundsCaster( worldLightPos );
            var bs = camera.getBound();

            if ( lightPos[ 3 ] === 0.0 ) { // infinite directional light

                // make an orthographic projection
                // set the position far away along the light direction
                position = Vec3.add( bs.center(), Vec3.mult( worldLightDir, bs.radius() * 2.0, position ), position );
            }

            var centerDistance = Vec3.distance( position, bs.center() );
            var zNear = centerDistance - bs.radius();
            var zFar = centerDistance + bs.radius();

            // from crude bbox
            if ( this._nearCaster && ( this._nearCaster !== Number.POSITIVE_INFINITY && this._nearCaster !== Number.NEGATIVE_INFINITY ) ) {
                zNear = this._nearCaster;
            }
            var zNearRatio = 0.001;
            if ( zNear < 0.00001 )
                zNear = 0.00001;

            if ( zNear < zFar * zNearRatio )
                zNear = zFar * zNearRatio;


            ////////////////////////////////////////
            /// End computations OPTIMIZED NEAR FAR
            ////////////////////////////////////////

            var top, right;
            var up = lightUp;
            if ( up === undefined /*|| Vec3.length2( up ) <= 0.0*/ ) up = [ 0.0, 0.0, 1.0 ];

            if ( Math.abs( Vec3.dot( up, lightDir ) ) >= 1.0 ) {
                // another camera up
                up = [ 1.0, 0.0, 0.0 ];
            }

            if ( lightPos[ 3 ] !== 0.0 ) { // positional light
                var spotAngle = light.getSpotCutoff();
                if ( spotAngle < 180.0 ) { // also needs zNear zFar estimates

                    Matrix.makePerspective( spotAngle * 2.0, 1.0, zNear, zFar, projection );
                    var worldTarget = this._worldTarget || Vec3.create();
                    this._worldTarget = worldTarget;
                    Vec3.mult( worldLightDir, zFar, worldTarget );
                    Vec3.add( position, worldTarget, worldTarget );
                    Matrix.makeLookAt( position, worldTarget, up, view );
                } else { // standard omni-directional positional light
                    top = ( bs.radius() / centerDistance ) * zNear;
                    right = top;

                    Matrix.makeFrustum( -right, right, -top, top, zNear, zFar, projection );
                    Matrix.makeLookAt( position, bs.center(), up, view );
                }
            } else { // directional light
                top = bs.radius();
                right = top;
                Matrix.makeOrtho( -right, right, -top, top, zNear, zFar, projection );
                Matrix.makeLookAt( position, bs.center(), up, view );
            }


            var num = this._lightNum;

            var castUniforms = shadowSettings._castingStateset.getUniformList();
            var receivingUniforms = this._receivingStateset.getUniformList();
            // udpate shader Parameters
            receivingUniforms[ 'Shadow_Projection' + num ].getUniform().set( projection );
            receivingUniforms[ 'Shadow_View' + num ].getUniform().set( view );
            // those help improving shadow depth precision
            // with "quantization" of depth value in this range.
            var depthRange = [ zNear, zFar, zFar - zNear, 1.0 / ( zFar - zNear ) ];
            receivingUniforms[ 'Shadow_DepthRange' + num ].getUniform().set( depthRange );
            castUniforms[ 'Shadow_DepthRange' ].getUniform().set( depthRange );

            receivingUniforms[ 'debug_' + num ].getUniform().set( this._shadowSettings._config[ 'texture' ] ? 1.0 : 0.0 );
            receivingUniforms[ 'bias_' + num ].getUniform().set( this._shadowSettings._config[ 'bias' ] );
            receivingUniforms[ 'exponent_' + num ].getUniform().set( this._shadowSettings._config[ 'exponent' ] );
            receivingUniforms[ 'exponent1_' + num ].getUniform().set( this._shadowSettings._config[ 'exponent1' ] );
            receivingUniforms[ 'VsmEpsilon_' + num ].getUniform().set( this._shadowSettings._config[ 'VsmEpsilon' ] );

        },

        cullShadowCastingScene: function ( cullVisitor ) {
            // record the traversal mask on entry so we can reapply it later.
            var traversalMask = cullVisitor.getTraversalMask();
            var shadowSettings = this.getShadowSettings();

            cullVisitor.setTraversalMask( shadowSettings.getCastsShadowTraversalMask() );

            // cast geometries into depth shadow map
            cullVisitor.pushStateSet( shadowSettings._castingStateset );

            var light = shadowSettings.getLight();

            this.aimShadowCastingCamera( light, light.getPosition(), light.getDirection() );

            // do RTT from the camera traversal mimicking light pos/orient
            shadowSettings._cameraShadow.accept( cullVisitor );

            cullVisitor.popStateSet();

            // reapply the original traversal mask
            cullVisitor.setTraversalMask( traversalMask );
        },

        enterCullCaster: function ( cullVisitor ) {

            // well shouldn't be called
            //cullVisitor.setEnableFrustumCulling( true );

            //var m = cullVisitor.getCurrentProjectionMatrix();
            //cullVisitor.clampProjectionMatrix( m, cullVisitor._computedNear, cullVisitor._computedFar, cullVisitor._nearFarRatio );
            var mvp = this._tmpMat;
            var shadowSettings = this.getShadowSettings();
            Matrix.mult( shadowSettings._cameraShadow.getProjectionMatrix(), shadowSettings._cameraShadow.getViewMatrix(), mvp );
            cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, false, true );
        },

        exitCullCaster: function ( cullVisitor ) {

            this._nearCaster = cullVisitor._computedNear;
            this._farCaster = cullVisitor._computedFar;

            // No objects, handle it gracefully
            var epsilon = 1e-6;
            if ( this._farCaster < this._nearCaster - epsilon ) {
                Notify.log( 'empty shadowMap' );
                for ( var l = 0; l < 6; l++ ) {
                    for ( var k = 0; k < 4; k++ ) {
                        this._frustumCasters[ l ][ k ] = 0.0;
                    }
                }
                this._farCaster = 1;
                this._nearCaster = 0.001;
                return;
            }
            var m = cullVisitor.getCurrentProjectionMatrix();
            cullVisitor.clampProjectionMatrix( m, this._nearCaster, this._farCaster, cullVisitor._nearFarRatio );
            var mvp = this._tmpMat;
            var shadowSettings = this.getShadowSettings();
            Matrix.mult( shadowSettings._cameraShadow.getProjectionMatrix(), shadowSettings._cameraShadow.getViewMatrix(), mvp );
            cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, false );
            for ( var i = 0; i < 6; i++ ) {
                Vec4.copy( cullVisitor._frustum[ i ], this._frustumCasters[ i ] );
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
            // well release a lot of thing when it works
            //
            var num = this._lightNum;

            this._receivingStateset.removeTextureAttribute( num + 1, 'Texture' );

            //this._receivingStateset.removeUniformByName( 'Texture' + ( num + 1 ) );
            this._receivingStateset.removeUniformByName( 'shadow_light' + this._lightNum );

            this._receivingStateset.removeUniformByName( 'Shadow_Projection' + num );
            this._receivingStateset.removeUniformByName( 'Shadow_View' + num );
            this._receivingStateset.removeUniformByName( 'Shadow_DepthRange' + num );
            this._receivingStateset.removeUniformByName( 'Shadow_MapSize_' + num );

            this._receivingStateset.removeUniformByName( 'Light' + num + '_uniform_enable' );

            this._receivingStateset.removeUniformByName( 'debug_' + num );
            this._receivingStateset.removeUniformByName( 'bias_' + num );
            this._receivingStateset.removeUniformByName( 'exponent_' + num );
            this._receivingStateset.removeUniformByName( 'exponent1_' + num );
            this._receivingStateset.removeUniformByName( 'VsmEpsilon_' + num );


            this._texture.releaseGLObjects();

            this._texture = 0;
            var shadowSettings = this.getShadowSettings();
            shadowSettings._cameraShadow = 0;
        },

    } ), 'osg', 'ShadowMap' );

    MACROUTILS.setTypeID( ShadowMap );

    return ShadowMap;
} );
