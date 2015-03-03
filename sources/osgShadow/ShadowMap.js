define( [
    'osg/BoundingBox',
    'osg/BlendFunc',
    'osg/Camera',
    'osg/ComputeBoundsVisitor',
    'osg/FrameBufferObject',
    'osg/Matrix',
    'osg/Notify',
    'osg/NodeVisitor',
    'osg/Program',
    'osg/Shader',
    'osg/StateAttribute',
    'osg/StateSet',
    'osg/Texture',
    'osg/Transform',
    'osg/Uniform',
    'osg/Utils',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Viewport',
    'osgShader/ShaderProcessor',
    'osgShadow/ShadowAttribute',
    'osgShadow/ShadowFrustumIntersection',
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowTexture'
], function ( BoundingBox, BlendFunc, Camera, ComputeBoundsVisitor, FrameBufferObject, Matrix, Notify, NodeVisitor, Program, Shader, StateAttribute, StateSet, Texture, Transform, Uniform, MACROUTILS, Vec3, Vec4, Viewport, ShaderProcessor, ShadowAttribute, ShadowFrustumIntersection, ShadowTechnique, ShadowTexture ) {

    'use strict';


    var TransparentRemoveVisitor = function ( mask ) {
        NodeVisitor.call( this );
        // mask setting to avoid casting shadows
        this._noCastMask = mask;
        this._nodeList = [];
    };
    TransparentRemoveVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        reset: function () {
            this._nodeList = [];
        },
        apply: function ( node ) {
            var st = node.getStateSet();
            // check that and other things ?
            if ( st ) {
                var blend = st.getAttribute( 'BlendFunc' );
                if ( blend !== undefined && blend.getSource() !== BlendFunc.DISABLE ) {
                    /*jshint bitwise: false */
                    var nm = node.getNodeMask();
                    // ~0x0 as not to be processed
                    if ( nm === ~0x0 ) {
                        // set to avoid casting shadow
                        nm = this._noCastMask;
                        node.setNodeMask( nm );
                        this._nodeList.push( node );
                    } else if ( ( nm & ~( this._noCastMask ) ) !== 0 ) {
                        // set to avoid casting shadow
                        node.setNodeMask( nm | this._noCastMask );
                        this._nodeList.push( node );
                    }
                    /*jshint bitwise: true */
                    return;
                }
            }
            this.traverse( node );
        },
        setNoCastMask: function ( mask ) {
            this._noCastMask = mask;
        },
        // restore to any previous mask avoiding any breaks
        // in other application mask usage.
        restore: function () {
            var node, i = this._nodeList.length;
            while ( i-- ) {
                node = this._nodeList[ i ];
                var nm = node.getNodeMask();
                if ( nm === this._noCastMask ) node.setNodeMask( ~0x0 );
                else node.setNodeMask( nm & ~this._noCastMask );
            }
        }

    } );


    // Custom camera cull callback
    // we customize it just to avoid to add extra 'virtual' function
    // on the shadowTecnique class
    var CameraCullCallback = function ( shadowTechnique ) {
        this._shadowTechnique = shadowTechnique;
    };

    CameraCullCallback.prototype = {
        cull: function ( node, nv ) {

            // see ShadowTechnique CameraCullCallback
            this._shadowTechnique.getShadowedScene().nodeTraverse( nv );



            var cs = nv.getCurrentCullingSet();
            if ( nv.getComputeNearFar() === true && nv.getComputedFar() >= nv.getComputedNear() ) {
                var m = nv.getCurrentProjectionMatrix();

                //Matrix.clampProjectionMatrix( m, nv.getComputedNear(), nv.getComputedFar(), nv.getNearFarRatio() );
                // we should use accessors when touching external object !!!
                this._shadowTechnique._nearCaster = nv.getComputedNear();
                this._shadowTechnique._farCaster = nv.getComputedFar();

                Matrix.getFrustumPlanes( m, nv.getCurrentModelViewMatrix(), cs.getFrustum().getPlanes(), false );
                // TODO: no far no near.
                // should check if we have them
                // should add at least a near 0 clip if not
                cs.getFrustum().setupMask( 6 );
            }

            this._shadowTechnique._lightFrustum = cs.getFrustum();
            return false;
        }
    };

    /**
     *  ShadowMap provides an implementation of shadow textures.
     *  @class ShadowMap
     */
    var ShadowMap = function ( settings ) {
        ShadowTechnique.call( this );

        this._projectionMatrix = Matrix.create();
        this._viewMatrix = Matrix.create();

        this._lightUp = [ 0.0, 0.0, 1.0 ];

        // data
        this._cameraShadow = new Camera();
        this._cameraShadow.setCullCallback( new CameraCullCallback( this ) );
        this._cameraShadow.setRenderOrder( Camera.PRE_RENDER, 0 );
        this._cameraShadow.setReferenceFrame( Transform.ABSOLUTE_RF );
        this._cameraShadow.setClearColor( [ 1.0, 1.0, 1.0, 1.0 ] );

        this._texture = new ShadowTexture();
        this._textureUnitBase = 4;
        this._textureUnit = this._textureUnitBase;

        // see shadowSettings.js header for param explanations
        this._textureMagFilter = undefined;
        this._textureMinFilter = undefined;
        this._textureSize = 256;
        this._depthRange = Vec4.create();

        this._receivingStateset = undefined;

        this._casterStateSet = new StateSet();
        this._casterStateSet.addUniform( Uniform.createFloat1( 0, 'exponent0' ) );
        this._casterStateSet.addUniform( Uniform.createFloat1( 0, 'exponent1' ) );
        this._casterStateSet.addUniform( Uniform.createFloat1( 0.005, 'bias' ) );

        var near = 0.001;
        var far = 1000;
        this._casterStateSet.addUniform( Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' ) );

        this._castsShaderProgram = undefined;

        this._lightSource = undefined;

        this._shadowAttribute = new ShadowAttribute();

        this._worldLightPos = Vec4.create();
        this._worldLightPos[ 3 ] = 0;
        this._worldLightDir = Vec4.create();
        this._worldLightDir[ 3 ] = 1;

        this._castsShadowDrawTraversalMask = 0xffffffff;
        this._castsShadowBoundsTraversalMask = 0xffffffff;

        // program cache
        this._cache = {};

        this._shaderProcessor = undefined;

        // tmp variables
        this._tmpVec = Vec3.create();
        this._tmpVecBis = Vec3.create();
        this._tmpVecTercio = Vec3.create();
        if ( settings )
            this.setShadowSettings( settings );

        this._computeFrustumBounds = new ShadowFrustumIntersection();
        this._computeBoundsVisitor = new ComputeBoundsVisitor();
        this._transparentVisitor = new TransparentRemoveVisitor( this._castsShadowTraversalMask );
        // true if shadow map rendered at least once

    };

    /** @lends ShadowMap.prototype */
    ShadowMap.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( ShadowTechnique.prototype, {

        getCamera: function () {
            return this._cameraShadow;
        },

        getTexture: function () {
            return this._texture;
        },

        isDirty: function () {
            return this._dirty;
        },


        setShadowCasterShaderProgram: function ( prg ) {
            this._casterStateSet.setAttributeAndModes( prg, StateAttribute.ON | StateAttribute.OVERRIDE );
            this._castsShaderProgram = prg;
        },

        getShaderProgram: function ( vs, ps, defines ) {
            var hash = vs + ps + defines.join( '_' );

            var cache = this._cache;
            if ( cache[ hash ] !== undefined )
                return cache[ hash ];

            // we dont want singleton right now
            // actually it should disappear and use instead the one from State
            if ( !this._shaderProcessor )
                this._shaderProcessor = new ShaderProcessor( true ); //

            var vertexshader = this._shaderProcessor.getShader( vs, defines );
            var fragmentshader = this._shaderProcessor.getShader( ps, defines );

            var program = new Program(
                new Shader( 'VERTEX_SHADER', vertexshader ), new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            cache[ hash ] = program;
            return program;
        },

        // computes a shader upon user choice
        // of shadow algorithms
        // shader file, define but texture type/format
        // associated too
        computeShadowCasterShaderProgram: function () {

            var defines = this._shadowAttribute.getDefines();

            var shadowmapCasterVertex = 'shadowsCastVert.glsl';
            var shadowmapCasterFragment = 'shadowsCastFrag.glsl';
            var prg = this.getShaderProgram( shadowmapCasterVertex, shadowmapCasterFragment, defines );

            return prg;
        },
        setTextureUnitBase: function ( unitBase ) {
            this._textureUnitBase = unitBase;
            this._textureUnit = unitBase;
        },

        getShadowCasterShaderProgram: function () {
            if ( this._dirty || this._castsShaderProgram === undefined ) {
                this._castsShaderProgram = this.computeShadowCasterShaderProgram();
            }
            return this._castsShaderProgram;
        },

        /* Sets  shadowSettings
         */
        setShadowSettings: function ( shadowSettings ) {

            if ( !shadowSettings )
                return;

            var lightSource = shadowSettings.lightSource;

            this.setCastsShadowDrawTraversalMask( shadowSettings.castsShadowDrawTraversalMask );
            this.setCastsShadowBoundsTraversalMask( shadowSettings.castsShadowBoundsTraversalMask );

            this.setLightSource( lightSource );
            this.setTextureSize( shadowSettings.textureSize );
            this.setTexturePrecision( shadowSettings.textureType );

            this.setKernelSizePCF( shadowSettings.kernelSizePCF );
            this.setAlgorithm( shadowSettings.algorithm );
            this.setBias( shadowSettings.bias );
            this.setExponent0( shadowSettings.exponent );
            this.setExponent1( shadowSettings.exponent1 );
            this.setEpsilonVSM( shadowSettings.epsilonVSM );

        },

        setCastsShadowDrawTraversalMask: function ( mask ) {
            this._castsShadowDrawTraversalMask = mask;
        },
        getCastsShadowDrawTraversalMask: function () {
            return this._castsDrawShadowTraversalMask;
        },

        setCastsShadowBoundsTraversalMask: function ( mask ) {
            this._castsShadowBoundsTraversalMask = mask;
        },
        getCastsShadowBoundsTraversalMask: function () {
            return this._castsShadowBoundsTraversalMask;
        },


        getBias: function () {
            return this._shadowAttribute.getBias();
        },
        setBias: function ( value ) {
            this._shadowAttribute.setBias( value );

            this._casterStateSet.getUniformList()[ 'bias' ].getUniform().set( value );

        },

        getExponent0: function () {
            return this._shadowAttribute.getExponent0();
        },
        setExponent0: function ( value ) {
            this._shadowAttribute.setExponent0( value );
            this._casterStateSet.getUniformList()[ 'exponent0' ].getUniform().set( value );
        },

        getExponent1: function () {
            return this._shadowAttribute.getExponent1();
        },
        setExponent1: function ( value ) {
            this._shadowAttribute.setExponent1( value );
            this._casterStateSet.getUniformList()[ 'exponent1' ].getUniform().set( value );
        },

        getEpsilonVSM: function () {
            return this._shadowAttribute.getEpsilonVSM();
        },
        setEpsilonVSM: function ( value ) {
            this._shadowAttribute.setEpsilonVSM( value );
        },

        getKernelSizePCF: function () {
            return this._shadowAttribute.getKernelSizePCF();
        },
        setKernelSizePCF: function ( value ) {
            this._shadowAttribute.setKernelSizePCF( value );
        },

        setShadowedScene: function ( shadowedScene ) {
            ShadowTechnique.prototype.setShadowedScene.call( this, shadowedScene );
            this._receivingStateset = this._shadowedScene.getOrCreateStateSet();
            this.dirty();
        },

        /** initialize the ShadowedScene and local cached data structures.*/
        init: function () {

            if ( !this._shadowedScene ) return;

            this._filledOnce = false;


            var light = this._lightSource.getLight();
            var lightNumber = light.getLightNumber();


            // if light number changed we need to remove cleanly
            // attributes from receiveStateSet
            // it's because it use a typemember like light attribute
            // so the number if very important to keep State clean
            if ( this._shadowAttribute.getLightNumber() !== lightNumber ) {
                if ( this._receivingStateset.getAttribute( this._shadowAttribute.getTypeMember() ) === this._shadowAttribute )
                    this._receivingStateset.removeAttribute( this._shadowAttribute.getTypeMember() );
            }

            if ( this._texture && this._texture.getLightUnit() !== lightNumber ) {
                // remove this._texture, but not if it's not this._texture
                if ( this._receivingStateset.getTextureAttribute( this._textureUnit, this._texture.getTypeMember() ) === this._texture )
                    this._receivingStateset.removeTextureAttribute( this._textureUnit, this._texture.getTypeMember() );
            }

            if ( !this._cameraShadow ) {
                this._cameraShadow = new Camera();
                this._cameraShadow.setCullCallback( new CameraCullCallback( this ) );
                this._cameraShadow.setRenderOrder( Camera.PRE_RENDER, 0 );
                this._cameraShadow.setReferenceFrame( Transform.ABSOLUTE_RF );
                this._cameraShadow.setClearColor( [ 1.0, 1.0, 1.0, 1.0 ] );
            }

            this.initTexture();
            this._textureUnit = this._textureUnitBase + lightNumber;
            this._cameraShadow.setName( 'light_shadow_camera' + light.getName() );

            this._texture.setLightUnit( lightNumber );
            this._texture.setName( 'ShadowTexture' + this._textureUnit );

            this._shadowAttribute.setLight( light );

            this._receivingStateset.setAttributeAndModes( this._shadowAttribute, StateAttribute.ON | StateAttribute.OVERRIDE );



            // prevent unnecessary texture bindings

            if ( !ShadowMap.BlankTexture ) {
                ShadowMap.BlankTexture = new Texture();
                ShadowMap.BlankTexture.setName( 'emptyTex' );
            }
            var blankTexture = ShadowMap.BlankTexture;

            // Mandatory: prevent binding shadow textures themselves (shadowedScene stateSet is applied
            // just above in stateset hierarchy
            // that would mean undefined values as it would be read/write access...
            this._casterStateSet.setTextureAttributeAndModes( this._textureUnit, blankTexture, StateAttribute.OFF | StateAttribute.OVERRIDE | StateAttribute.PROTECTED );

            // TODO: optimize: have a "don't touch current Texture stateAttribute"
            // on ALL texture unit but alpha max texture for Depth/Normal/etc renders

            // TODO: actually get the real max texture unit from webglCaps
            //var shouldGetMaxTextureUnits = 32;
            //
            // TODO:: Should handle the alpha_mask that uses a texture
            // case somehow...
            // deduce from shader compil ?
            //for ( var k = 0; k < shouldGetMaxTextureUnits; k++ ) {
            //    this._casterStateSet.setTextureAttributeAndModes( k, blankTexture, StateAttribute.OFF | StateAttribute.OVERRIDE | StateAttribute.PROTECTED );
            //}


            var casterProgram = this.getShadowCasterShaderProgram();
            this.setShadowCasterShaderProgram( casterProgram );

            // add shadow texture to the receivers
            // should make sure somehow that
            // alpha blender transparent receiver doens't use it
            // compiler wise at least
            this._receivingStateset.setTextureAttributeAndModes( this._textureUnit, this._texture, StateAttribute.ON | StateAttribute.OVERRIDE );

            this._dirty = false;
        },

        valid: function () {
            // checks
            return true;
        },

        updateShadowTechnic: function ( /*nv*/) {

            var camera = this._cameraShadow;
            var texture = this._texture;

            if ( camera && texture ) {

                var vp = camera.getViewport();
                if ( !vp ) {
                    vp = new Viewport();
                    camera.setViewport( vp );
                }

                // if texture size changed update the camera rtt params
                if ( vp.width() !== texture.getWidth() ||
                    vp.height() !== texture.getHeight() ) {

                    camera.detachAll();

                    camera.attachTexture( FrameBufferObject.COLOR_ATTACHMENT0, texture );
                    camera.attachRenderBuffer( FrameBufferObject.DEPTH_ATTACHMENT, FrameBufferObject.DEPTH_COMPONENT16 );

                    camera.getViewport().setViewport( 0, 0, texture.getWidth(), texture.getHeight() );
                }
            }
        },

        // internal texture allocation
        // handle any change like resize, filter param, etc.
        initTexture: function () {

            if ( !this._dirty ) return;

            if ( !this._texture ) {
                this._texture = new ShadowTexture();
                this._textureUnitBase = 4;
                this._textureUnit = this._textureUnitBase;
            }

            var texType = this.getTexturePrecision();
            var textureType, textureFormat, texFilterMin, texFilterMag;

            // see shadowSettings.js header
            switch ( this.getAlgorithm() ) {
            case 'ESM':
            case 'VSM':
            case 'EVSM':
                texFilterMin = Texture.LINEAR;
                texFilterMag = Texture.LINEAR;
                break;

            default:
            case 'PCF':
            case 'NONE':
                texFilterMin = Texture.NEAREST;
                texFilterMag = Texture.NEAREST;
                break;
            }

            switch ( texType ) {
            case 'HALF_FLOAT':
                textureType = Texture.HALF_FLOAT;
                texFilterMin = Texture.NEAREST;
                texFilterMag = Texture.NEAREST;
                break;
            case 'HALF_FLOAT_LINEAR':
                textureType = Texture.HALF_FLOAT;
                texFilterMin = Texture.LINEAR;
                texFilterMag = Texture.LINEAR;
                break;
            case 'FLOAT':
                textureType = Texture.FLOAT;
                texFilterMin = Texture.NEAREST;
                texFilterMag = Texture.NEAREST;
                break;
            case 'FLOAT_LINEAR':
                textureType = Texture.FLOAT;
                texFilterMin = Texture.LINEAR;
                texFilterMag = Texture.LINEAR;
                break;
            default:
            case 'UNSIGNED_BYTE':
                textureType = Texture.UNSIGNED_BYTE;
                break;
            }

            textureFormat = Texture.RGBA;
            this._texture.setTextureSize( this._textureSize, this._textureSize );

            this._texture.setInternalFormatType( textureType );

            this._texture.setMinFilter( texFilterMin );
            this._texture.setMagFilter( texFilterMag );
            this._texture.setInternalFormat( textureFormat );

            this._textureMagFilter = texFilterMag;
            this._textureMinFilter = texFilterMin;

            this._texture.setWrapS( Texture.CLAMP_TO_EDGE );
            this._texture.setWrapT( Texture.CLAMP_TO_EDGE );

            this._texture.dirty();

        },
        setTexturePrecision: function ( format ) {
            if ( format === this._shadowAttribute.getPrecision() ) return;

            this._shadowAttribute.setPrecision( format );
            this.dirty();
        },

        getTexturePrecision: function () {
            return this._shadowAttribute.getPrecision();
        },

        setTextureSize: function ( mapSize ) {

            if ( mapSize === this._textureSize ) return;

            this._textureSize = mapSize;
            this.dirty();
        },

        setAlgorithm: function ( algo ) {

            if ( algo === this.getAlgorithm() ) return;
            this._shadowAttribute.setAlgorithm( algo );
            this.dirty();
        },

        getAlgorithm: function () {
            return this._shadowAttribute.getAlgorithm();
        },

        setLightSource: function ( lightSource ) {

            if ( !lightSource || lightSource === this._lightSource )
                return;

            this._lightSource = lightSource;
            var light = lightSource.getLight();

            if ( !light ) {
                Notify.log( 'ShadowMap.setLightSource no light attached to the lightsource' );
            }

            this.dirty();
        },

        makePerspectiveFromBoundingBox: function ( bbox, fov, eyePos, eyeDir, view, projection ) {
            var center = bbox.center( this._tmpVec );
            var radius = bbox.radius();
            var zNear = 1e-4;
            var zFar = 1.0;

            // light Near Plane Equation
            // E = eyeDir + d
            var d = Vec3.dot( eyePos, eyeDir );
            // then distance to center point of sphere
            // perpendicular to lightdir
            var distance = Vec3.dot( center, eyeDir ) + d;

            if ( distance < -radius ) {
                // won't render anything the object  is behind..
                // TODO: handle an empty render...
                // avoiding cullvisitor pass on caster would be nice.
                this._emptyCasterScene = true;
            } else if ( distance <= 0.0 ) {
                // shhh.. we're inside !
                // sphere center is behind
                zNear = 1e-5;
                zFar = distance + radius;
                //radius = zFar;

            } else if ( distance < radius ) {
                // shhh.. we're inside !
                // sphere center is in front
                zNear = 1e-5;
                zFar = distance + radius;

                //radius = zFar;
            } else {
                //  Sphere totally in front
                // long distance runner
                // we must make a nicer zNear here!
                zNear = distance - radius;
                zFar = distance + radius;
                //zNear = 0.0001;
                //radius = ( zFar - zNear ) * 0.5;
            }
            var epsilon = 1e-6;
            if ( zFar < zNear - epsilon ) {

                // TODO: clear shadow texture and return wihtout any further ops
                // with a early out
                //Notify.debug( 'empty shadowMap' );
                // for now just prevent NaN errors
                this._emptyCasterScene = true;
                zFar = 1;
                zNear = 0.001;
            } else if ( zNear < epsilon ) {
                zNear = epsilon;
            }
            var zNearRatio = 0.001;
            if ( zNear < zFar * zNearRatio ) {
                zNear = zFar * zNearRatio;
            }


            // positional light: spot, point, area
            //  fov < 180.0
            // statically defined by spot, only needs zNear zFar estimates
            var fovRadius = zNear * Math.tan( fov * 2.0 * Math.PI / 360.0 );
            // if scene radius is smaller than fov on scene
            // tighten and enhance precision
            fovRadius = fovRadius > radius ? radius : fovRadius;

            var ymax = fovRadius;
            var ymin = -ymax;

            var xmax = fovRadius;
            var xmin = -xmax;


            Matrix.makeFrustumInfinite( xmin, xmax, ymin, ymax, zNear, zFar, projection );
            //Matrix.makeFrustum( xmin, xmax, ymin, ymax, zNear, zFar, projection );

            // compute a up vector ensuring avoiding parallel vectors
            // not using this._lightUp because not
            // reverting to it once got the change here done once
            // [ 0.0, 0.0, 1.0 ];
            var up = this._lightUp;
            if ( Math.abs( Vec3.dot( up, eyeDir ) ) >= 1.0 ) {
                // another camera up
                // [ 1.0, 0.0, 0.0 ];
                if ( this._lightUp[ 0 ] === 1.0 ) {
                    this._lightUp[ 0 ] = 0.0;
                    this._lightUp[ 1 ] = 0.0;
                    this._lightUp[ 2 ] = 1.0;
                } else {
                    this._lightUp[ 0 ] = 1.0;
                    this._lightUp[ 1 ] = 0.0;
                    this._lightUp[ 2 ] = 0.0;
                }

            }
            Matrix.makeLookFromDirection( eyePos, Vec3.neg( eyeDir, this._tmpVecBis ), up, view );



            this._nearCaster = zNear;
            this._farCaster = zFar;
        },

        makeOrthoFromBoundingBox: function ( bbox, eyeDir, view, projection ) {

            var center = bbox.center( this._tmpVecTercio );

            var radius = bbox.radius();
            var diameter = radius + radius;

            var zNear = 0.0001;
            var zFar = diameter + 0.0001;

            // compute eye Pos from a inverted lightDir Ray shot from center of bbox
            // firs make a RAY
            var ray = this._tmpVecBis;
            Vec3.mult( eyeDir, -diameter, ray );
            // then move the eye to the that far pos following the ray
            var eyePos = this._tmpVec;
            Vec3.add( center, ray, eyePos );

            zNear = radius;
            zFar += radius;

            var zNearRatio = 0.001;
            if ( zNear < zFar * zNearRatio ) {
                zNear = zFar * zNearRatio;
            }

            // compute a up vector ensuring avoiding parallel vectors
            // not using this._lightUp because not
            // reverting to it once got the change here done once
            // [ 0.0, 0.0, 1.0 ];
            var up = this._lightUp;
            if ( Math.abs( Vec3.dot( up, eyeDir ) ) >= 1.0 ) {
                // another camera up
                // [ 1.0, 0.0, 0.0 ];
                if ( this._lightUp[ 0 ] === 1.0 ) {
                    this._lightUp[ 0 ] = 0.0;
                    this._lightUp[ 1 ] = 0.0;
                    this._lightUp[ 2 ] = 1.0;
                } else {
                    this._lightUp[ 0 ] = 1.0;
                    this._lightUp[ 1 ] = 0.0;
                    this._lightUp[ 2 ] = 0.0;
                }

            }
            //Matrix.makeLookFromDirection( eyePos, Vec3.neg( eyeDir, this._tmpVecBis ), up, view );
            Matrix.makeLookFromDirection( eyePos, eyeDir, up, view );

            var right, top;
            top = radius;
            right = top;
            Matrix.makeOrtho( -right, right, -top, top, zNear, zFar, projection );

            this._nearCaster = zNear;
            this._farCaster = zFar;

        },
        /*
         * Sync camera and light vision so that
         * shadow map render using a camera whom
         * settings come from the light
         * and the scene being shadowed
         */
        aimShadowCastingCamera: function ( cullVisitor, frustumBound ) {

            var lightSource = this._lightSource;

            if ( !lightSource ) {
                this._emptyCasterScene = true;
                return;
            }

            var light = lightSource.getLight();
            var camera = this._cameraShadow;

            // make sure it's not modified outside our computations
            // camera matrix can be modified by cullvisitor afterwards...
            Matrix.copy( camera.getProjectionMatrix(), this._projectionMatrix );
            Matrix.copy( camera.getViewMatrix(), this._viewMatrix );
            var projection = this._projectionMatrix;
            var view = this._viewMatrix;

            // inject camera world matrix.
            // from light current world/pos

            // TODO: clever code share between light and shadow attributes
            // try reusing light matrix uniform.
            var matrixList = lightSource.getWorldMatrices();
            var worldMatrix = matrixList[ 0 ]; // world

            var worldLightPos = this._worldLightPos;

            //  light pos & lightTarget in World Space

            if ( light.getPosition()[ 3 ] !== 0.0 ) {

                Matrix.transformVec3( worldMatrix, light.getPosition(), worldLightPos );

                // not a directionnal light, compute the world light dir
                var worldLightDir = this._worldLightDir;
                Vec3.copy( light.getDirection(), worldLightDir );
                Matrix.transformVec4( worldMatrix, worldLightDir, worldLightDir );
                Vec3.normalize( worldLightDir, worldLightDir );

                // and compute a perspective frustum
                this.makePerspectiveFromBoundingBox( frustumBound, light.getSpotCutoff(), worldLightPos, worldLightDir, view, projection );
            } else {

                Matrix.transformVec4( worldMatrix, light.getPosition(), worldLightPos );
                // lightpos is a light dir
                // so we now have to normalize
                // since the transform to world above
                Vec3.mult( worldLightPos, -1.0, worldLightPos );
                Vec3.normalize( worldLightPos, worldLightPos );
                this.makeOrthoFromBoundingBox( frustumBound, worldLightPos, view, projection );
            }

            var zNear = this._nearCaster;
            var zFar = this._farCaster;
            var epsilon = 1e-6;
            if ( zFar < zNear - epsilon ) {

                // TODO: clear shadow texture and return wihtout any further ops
                // with a early out
                // Notify.debug( 'empty shadowMap' );
                // for now just prevent NaN errors
                this._emptyCasterScene = true;
                zFar = 1;
                zNear = 0.001;
            }

            Matrix.copy( this._projectionMatrix, camera.getProjectionMatrix() );
            Matrix.copy( this._viewMatrix, camera.getViewMatrix() );

            // set values now
            this.setShadowUniformsDepthValue( zNear, zFar, view, projection );

        },

        // culling is done,
        // now try for a the tightest frustum
        // possible for shadowcasting
        frameShadowCastingFrustum: function ( cullVisitor ) {

            var camera = this._cameraShadow;
            var projection = this._projectionMatrix;
            var view = this._viewMatrix;

            var zNear = this._nearCaster;
            var zFar = this._farCaster;

            var resultNearFar = [ zNear, zFar ];

            Matrix.clampProjectionMatrix( projection, zNear, zFar, cullVisitor.getNearFarRatio(), resultNearFar );
            zNear = resultNearFar[ 0 ];
            zFar = resultNearFar[ 1 ];

            Matrix.copy( projection, camera.getProjectionMatrix() );
            Matrix.copy( view, camera.getViewMatrix() );
            this.setShadowUniformsDepthValue( zNear, zFar, view, projection );


        },

        setShadowUniformsDepthValue: function ( zNear, zFar, view, projection ) {

            // Empty or Bad Frustums
            // No objects, handle it gracefully
            var epsilon = 1e-6;
            if ( zFar < zNear - epsilon ) {
                // TODO: clear shadow texture and return wihtout any further ops
                // with a early out
                //Notify.debug( 'empty shadowMap' );
                zFar = 1.0;
                zNear = 0.001;
                this._emptyCasterScene = true;
            }

            // check all other code but depthRange
            //zNear = 0.0001;
            //zFar = 1000;

            // set values now
            this._depthRange[ 0 ] = zNear;
            this._depthRange[ 1 ] = zFar;
            this._depthRange[ 2 ] = zFar - zNear;
            this._depthRange[ 3 ] = 1.0 / ( zFar - zNear );

            var castUniforms = this._casterStateSet.getUniformList();
            castUniforms[ 'Shadow_DepthRange' ].getUniform().set( this._depthRange );

            this._texture.setViewMatrix( view );
            this._texture.setProjectionMatrix( projection );
            this._texture.setDepthRange( this._depthRange );

        },

        noDraw: function () {

            this._depthRange[ 0 ] = 0.0;
            this._depthRange[ 1 ] = 0.0;
            this._depthRange[ 2 ] = 0.0;
            this._depthRange[ 3 ] = 0.0;

            var castUniforms = this._casterStateSet.getUniformList();
            castUniforms[ 'Shadow_DepthRange' ].getUniform().set( this._depthRange );
            this._texture.setDepthRange( this._depthRange );

            var camera = this._cameraShadow;

            // make sure it's not modified outside our computations
            // camera matrix can be modified by cullvisitor afterwards...
            Matrix.copy( camera.getProjectionMatrix(), this._projectionMatrix );
            Matrix.copy( camera.getViewMatrix(), this._viewMatrix );

            this._texture.setViewMatrix( this._viewMatrix );
            this._texture.setProjectionMatrix( this._projectionMatrix );


            this._filledOnce = true;
        },
        // Defines the frustum from light param.
        //
        cullShadowCasting: function ( cullVisitor ) {


            var bbox;


            this._transparentVisitor.setNoCastMask( ~( this._castsShadowBoundsTraversalMask | this._castsShadowDrawTraversalMask ) );
            this._transparentVisitor.reset();
            this.getShadowedScene().accept( this._transparentVisitor );


            this._computeBoundsVisitor.setTraversalMask( this._castsShadowBoundsTraversalMask );
            this._computeBoundsVisitor.reset();
            this.getShadowedScene().accept( this._computeBoundsVisitor );
            bbox = this._computeBoundsVisitor.getBoundingBox();

            if ( !bbox.valid() ) {
                // nothing to draw Early out.
                this.noDraw();
                return;
            }

            // HERE we get the shadowedScene Current World Matrix
            // to get any world transform ABOVE the shadowedScene
            var worldMatrix = cullVisitor.getCurrentModelWorldMatrix();
            // it does fuck up the results.
            Matrix.transformBoundingBox( worldMatrix, bbox, bbox );

            this._emptyCasterScene = false;
            this.aimShadowCastingCamera( cullVisitor, bbox );

            if ( this._emptyCasterScene ) {
                // nothing to draw Early out.
                this.noDraw();
                return;
            }


            // get renderer to make the cull program
            // record the traversal mask on entry so we can reapply it later.
            var traversalMask = cullVisitor.getTraversalMask();

            cullVisitor.setTraversalMask( this._castsShadowDrawTraversalMask );

            // cast geometries into depth shadow map
            cullVisitor.pushStateSet( this._casterStateSet );

            this._cameraShadow.setEnableFrustumCulling( true );
            // enabling this makes for strange projection fuck up
            // (as in clamped too tight projection)
            var needNearFar = this._castsShadowDrawTraversalMask === this._castsShadowBoundsTraversalMask;
            this._cameraShadow.setComputeNearFar( needNearFar );



            // do RTT from the camera traversal mimicking light pos/orient
            this._cameraShadow.accept( cullVisitor );

            // Here culling is done, we do have near/far.
            // and cull/non-culled info
            // if we wanted a tighter frustum.
            if ( needNearFar ) {
                this.frameShadowCastingFrustum( cullVisitor );
            }


            // enabling this makes for strange projection fuck up
            // (as in clamped too tight projection)
            this._cameraShadow.setComputeNearFar( false );

            // remove our flags changes on any bitmask
            // not to break things
            this._transparentVisitor.restore();

            cullVisitor.popStateSet();

            // reapply the original traversal mask
            cullVisitor.setTraversalMask( traversalMask );
            this._filledOnce = true;
        },

        cleanReceivingStateSet: function () {
            if ( this._receivingStateset ) {

                if ( this._texture ) {
                    // remove this._texture, but not if it's not this._texture
                    if ( this._receivingStateset.getTextureAttribute( this._textureUnit, this._texture.getTypeMember() ) === this._texture )
                        this._receivingStateset.removeTextureAttribute( this._textureUnit, this._texture.getTypeMember() );
                }

                if ( this._receivingStateset.getAttribute( this._shadowAttribute.getTypeMember() ) === this._shadowAttribute )
                    this._receivingStateset.removeAttribute( this._shadowAttribute.getTypeMember() );
            }

        },
        cleanSceneGraph: function () {
            // well release a lot more things when it works
            this._cameraShadow = undefined;
            this._filledOnce = false;


            this.cleanReceivingStateSet();

            // TODO: need state
            //this._texture.releaseGLObjects();
            //this._shadowAttribute = undefined;
            this._texture = undefined;
            this._shadowedScene = undefined;
        }

    } ), 'osgShadow', 'ShadowMap' );

    MACROUTILS.setTypeID( ShadowMap );

    return ShadowMap;
} );
