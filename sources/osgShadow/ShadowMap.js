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
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowFrustumIntersection',
    'osg/CullFace'
], function ( Notify, MACROUTILS, Object, Node, NodeVisitor, CullVisitor, Vec3, Vec4, Matrix, BoundingBox, BoundingSphere, ComputeMatrixFromNodePath, Transform, Camera, Texture, Viewport, StateSet, StateAttribute, Uniform, ShadowTechnique, ShadowFrustumIntersection, CullFace ) {
    'use strict';

    /**
     *  ShadowMap provides an implementation of shadow textures.
     *  @class ShadowMap
     */
    var ShadowMap = function () {
        ShadowTechnique.call( this );

        // uniforms, shaders ?
        this._lightNum = 0;
        this._shadowTextureUnit = this._lightNum + 1;
        // this._texture
        // this._cameraShadow
        this._frustumCasters = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];
        this._frustumReceivers = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];
        this._cbbv = new ShadowFrustumIntersection( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN, this._frustumReceivers, this._frustumCasters );

        this._tmpMat = Matrix.create();
        this._bs = new BoundingSphere();
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
            if ( this._castingStateset ) this._castingStateset.setAttributeAndMode( prg, StateAttribute.ON | StateAttribute.OVERRIDE );
            this._castsShaderProgram = prg;
        },
        getShadowCasterShaderProgram: function () {
            return this._castsShaderProgram;
        },

        setCastingStateset: function ( st ) {
            this._castingStateset = st;
        },
        getCastingStateset: function () {
            return this._castingStateset;
        },

        /** initialize the ShadowedScene and local cached data structures.*/
        init: function () {
            if ( !this._shadowedScene ) return;

            this._receivingStateset = this._shadowedScene.getReceivingStateSet();

            var shadowSettings = this.getShadowedScene().getShadowSettings();
            var light = shadowSettings.getLight();

            // init texture
            var shadowTexture = new Texture();
            shadowTexture.setName( 'shadow_' + light.getName() );

            var shadowSize = shadowSettings.getTextureSize();
            shadowSize = [ shadowSize[ 0 ], shadowSize[ 1 ], 1.0 / shadowSize[ 0 ], 1.0 / shadowSize[ 1 ] ];

            shadowTexture.setTextureSize( shadowSize[ 0 ], shadowSize[ 1 ] );
            shadowTexture.setType( shadowSettings.getTextureType() );
            shadowTexture.setInternalFormat( shadowSettings.getTextureFormat() );

            shadowTexture.setMinFilter( shadowSettings.getTextureFilterMin() );
            shadowTexture.setMagFilter( shadowSettings.getTextureFilterMax() );
            /*
            var doBlur = shadowSettings.getConfig( 'blur' );
            var doDownSample = shadowSettings.getConfig( 'supersample' );
            if ( doBlur && doDownSample !== 0 ) {
                // we want to blur as VSM support that
                shadowTexture.setMinFilter( 'LINEAR' );
                shadowTexture.setMagFilter( 'LINEAR' );
            } else {
                shadowTexture.setMinFilter( 'NEAREST' );
                shadowTexture.setMagFilter( 'NEAREST' );
            }
*/
            shadowTexture.setWrapS( Texture.CLAMP_TO_EDGE );
            shadowTexture.setWrapT( Texture.CLAMP_TO_EDGE );

            this._texture = shadowTexture;

            // init camera
            var shadowCamera = new Camera();

            this.setCameraCullCallback( shadowCamera );


            shadowCamera.setRenderOrder( Camera.PRE_RENDER, 0 );
            shadowCamera.setReferenceFrame( Transform.ABSOLUTE_RF );
            shadowCamera.setViewport( new Viewport( 0, 0, shadowSize[ 0 ], shadowSize[ 1 ] ) );
            shadowCamera.setClearColor( [ 1.0, 1.0, 1.0, 1.0 ] );

            shadowCamera.attachTexture( this.getShadowedScene().getGLContext().COLOR_ATTACHMENT0, shadowTexture, 0 );
            shadowCamera.attachRenderBuffer( this.getShadowedScene().getGLContext().DEPTH_ATTACHMENT, this.getShadowedScene().getGLContext().DEPTH_COMPONENT16 );

            shadowCamera.setName( 'light_shadow_camera' + light.getName() );
            this._cameraShadow = shadowCamera;

            // init StateSets
            //////////////
            // CASTER stateset
            var prg = this.getShadowCasterShaderProgram();
            var casterStateSet = new StateSet();
            this._castingStateset = casterStateSet;
            casterStateSet.setAttributeAndMode( prg, StateAttribute.ON | StateAttribute.OVERRIDE );

            // just keep same as render
            //casterStateSet.setAttributeAndMode(new CullFace(CullFace.DISABLE), StateAttribute.ON | StateAttribute.OVERRIDE);
            casterStateSet.setAttributeAndMode( new CullFace( CullFace.BACK ), StateAttribute.ON | StateAttribute.OVERRIDE );

            // prevent unnecessary texture bindings, could loop over max texture unit
            // TODO: optimize: have a "don't touch current Texture stateAttribute"
            casterStateSet.setTextureAttributeAndMode( 0, new Texture(), StateAttribute.OFF | StateAttribute.OVERRIDE );
            casterStateSet.setTextureAttributeAndMode( 1, new Texture(), StateAttribute.OFF | StateAttribute.OVERRIDE );
            casterStateSet.setTextureAttributeAndMode( 2, new Texture(), StateAttribute.OFF | StateAttribute.OVERRIDE );
            casterStateSet.setTextureAttributeAndMode( 3, new Texture(), StateAttribute.OFF | StateAttribute.OVERRIDE );


            var near = 0.001;
            var far = 1000;
            var depthRange = new Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' );
            casterStateSet.addUniform( depthRange );

            // TODO: handle texture num
            var num = this._lightNum;

            //this._receivingStateset.addUniform( Uniform.createInt1( 0, 'Texture0' ) );

            this._receivingStateset.setTextureAttributeAndMode( num + 1, shadowTexture, StateAttribute.ON | StateAttribute.OVERRIDE );
            this._receivingStateset.addUniform( Uniform.createInt1( num + 1, 'Texture' + ( num + 1 ) ) );

            var depthRangeNum = new Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' + num );
            var shadowMapSizeNum = new Uniform.createFloat4( shadowSize, 'Shadow_MapSize_' + num );
            var projectionShadowNum = new Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'Shadow_Projection' + num );
            var viewShadowNum = new Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'Shadow_View' + num );
            var enabledLight = new Uniform.createFloat1( 1.0, 'Light' + num + '_uniform_enable' );

            this._receivingStateset.addUniform( enabledLight );
            this._receivingStateset.addUniform( projectionShadowNum );
            this._receivingStateset.addUniform( viewShadowNum );
            this._receivingStateset.addUniform( depthRangeNum );
            this._receivingStateset.addUniform( shadowMapSizeNum );



            var camera = shadowSettings._config[ 'camera' ];
            this._cameraShadowed = camera;



            this._dirty = false;
        },

        valid: function () {
            // checks
            return true;
        },

        updateShadowParams: function () {
            // could do some light/scene change check here and skip it
            var shadowSettings = this.getShadowedScene().getShadowSettings();
            var light = shadowSettings.getLight();

            this.aimShadowCastingCamera( light, light.getPosition(), light.getDirection() );





            // update accordingly
            if ( !this._dirty ) return;
            //update texture size, format, etc. from settings if different
            //
            // updated
            this._dirty = false;
        },

        resize: function ( shadowSizeFinal ) {

            var glContext = this.getShadowedScene().getGLContext();

            this._texture.setTextureSize( shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] );
            this._texture.dirty();
            // force recreation
            //this._texture.releaseGLObjects( glContext ); //broken
            Texture.textureManager.releaseTextureObject( this._texture._textureObject );
            this._texture._textureObject = undefined;
            //this._texture.apply();
            this._texture.init( glContext );

            this._cameraShadow.setViewport( new Viewport( 0, 0, shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] ) );

            // miss detach texture
            // force reattach
            this._cameraShadow.attachments = undefined;
            this._cameraShadow.frameBufferObject.attachments = [];
            this._cameraShadow.frameBufferObject.dirty();
            this._cameraShadow.attachTexture( glContext.COLOR_ATTACHMENT0, this._texture, 0 );
            this._cameraShadow.attachRenderBuffer( glContext.DEPTH_ATTACHMENT, glContext.DEPTH_COMPONENT16 );

            this._receivingStateset.getUniformList()[ 'Shadow_MapSize' + this._lightNum ].getUniform().set( shadowSizeFinal );

        },

        /*
         * compute  scene bounding box and bounding sphere
         */
        getBoundsCaster: function ( worldLightPos ) {
            var bs;
            // get the bounds of the scene

            this._cbbv.reset( worldLightPos, this._frustumReceivers, this._frustumReceivers.length );
            // Why would we restrict the bbox further used for computation to just the
            // caster bbox ?
            // we'll need both caster+receiver to determine shadow map view/projection
            this._cbbv.setTraversalMask( this.getShadowedScene().getShadowSettings().getCastsShadowTraversalMask() );
            //this._cbbv.setTraversalMask( this.getShadowedScene().getShadowSettings().getReceivesShadowTraversalMask() );


            this.getShadowedScene().nodeTraverse( this._cbbv );
            bs = this._bs;
            bs.init();
            bs.expandByBox( this._cbbv.getBoundingBox() );

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
            var view = this._cameraShadow.getViewMatrix();
            var projection = this._cameraShadow.getProjectionMatrix();

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
            //var bx = this._cbbv.getBoundingBox();
            var bs = this.getBoundsCaster( worldLightPos );
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

            var castUniforms = this._castingStateset.getUniformList();
            var receivingUniforms = this._receivingStateset.getUniformList();
            // udpate shader Parameters
            receivingUniforms[ 'Shadow_Projection' + num ].getUniform().set( projection );
            receivingUniforms[ 'Shadow_View' + num ].getUniform().set( view );
            // those help improving shadow depth precision
            // with "quantization" of depth value in this range.
            var depthRange = [ zNear, zFar, zFar - zNear, 1.0 / ( zFar - zNear ) ];
            receivingUniforms[ 'Shadow_DepthRange' + num ].getUniform().set( depthRange );
            castUniforms[ 'Shadow_DepthRange' ].getUniform().set( depthRange );

        },

        cullShadowCastingScene: function ( cullVisitor ) {
            // record the traversal mask on entry so we can reapply it later.
            var traversalMask = cullVisitor.getTraversalMask();

            cullVisitor.setTraversalMask( this.getShadowedScene().getShadowSettings().getCastsShadowTraversalMask() );

            // cast geometries into depth shadow map
            cullVisitor.pushStateSet( this._castingStateset );

            var shadowSettings = this.getShadowedScene().getShadowSettings();
            var light = shadowSettings.getLight();

            this.aimShadowCastingCamera( light, light.getPosition(), light.getDirection() );

            // do RTT from the camera traversal mimicking light pos/orient
            this._cameraShadow.accept( cullVisitor );

            cullVisitor.popStateSet();

            // reapply the original traversal mask
            cullVisitor.setTraversalMask( traversalMask );
        },

        enterCullCaster: function ( cullVisitor ) {
            // well shouldn't be called
            cullVisitor.setEnableFrustumCulling( true );
            //var m = cullVisitor.getCurrentProjectionMatrix();
            //cullVisitor.clampProjectionMatrix( m, cullVisitor._computedNear, cullVisitor._computedFar, cullVisitor._nearFarRatio );
            var mvp = this._tmpMat;
            Matrix.mult( this._cameraShadow.getProjectionMatrix(), this._cameraShadow.getViewMatrix(), mvp );
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
            Matrix.mult( this._cameraShadow.getProjectionMatrix(), this._cameraShadow.getViewMatrix(), mvp );
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
            // well release a lot of thing we it works
        },

    } ), 'osg', 'ShadowMap' );

    MACROUTILS.setTypeID( ShadowMap );

    return ShadowMap;
} );