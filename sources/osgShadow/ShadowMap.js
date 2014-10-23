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
    'osg/CullFace'
], function( Notify, MACROUTILS, Object, Node, NodeVisitor, CullVisitor, Vec3, Vec4, Matrix, BoundingBox, BoundingSphere, ComputeMatrixFromNodePath, Transform, Camera, Texture, Viewport, StateSet, StateAttribute, Uniform, ShadowTechnique, CullFace ) {
    'use strict';

    /**
     * [ComputeFrustumBoundsVisitor get a scene bounds limited by a light and camera frustum]
     * @param {[enum]} traversalMode
     * @param {[Array of Vec4]} camera frustum planes
     * @param {[Array of Vec4]} light frustum planes
     */
    var ComputeFrustumBoundsVisitor = function( traversalMode, cameraFrustum, lightFrustum ) {
        NodeVisitor.call( this, traversalMode );
        this._matrixStack = [];
        this._bb = new BoundingBox();
        this._bs = new BoundingSphere();
        this._tmpbb = new BoundingBox();
        this._cameraShadowFrustum = cameraFrustum;
        this._lightFrustum = lightFrustum;
        this._tmpPos = Vec3.create();
        this._reserveCamMaskStack = [ 0 ];
        this._reserveLightMaskStack = [ 0 ];
    };

    /*
     *
     * Optimization VFC classics:
     * - plane mask: mark inside planet and test only intersecting plane (Totally inside hierarchy is tested once)
     * - frame coherency... (rotation/translation/no move) (require flat tree...)
     *  http://www.cescg.org/CESCG-2002/DSykoraJJelinek/#s6
     *  TODO: if cull is called after update, means
     *  skeletal transform is done before (in node update callback)
     */
    ComputeFrustumBoundsVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        reset: function( worldLightPos, frustumReceivers, frustumReceiversLength ) {
            this._matrixStack.length = 0;
            this._bb.init();
            this._bs.init();
            this._near = 0.0;
            this._far = Number.POSITIVE_INFINITY;
            this._cameraPlaneMaskedByLightNear = 0;
            this._reserveCamMaskStack[ 0 ] = 0;
            this._reserveCamMaskStack.current = 0;
            this._reserveLightMaskStack[ 0 ] = 0;
            this._reserveLightMaskStack.current = 0;
            // exclude planes that would exlude object between light and shadowed zone
            // so that casting object can cast from outside shadowed zone
            this.getCameraPlaneMaskForLightNear( worldLightPos, frustumReceivers, frustumReceiversLength );
        },
        getBoundingBox: function() {
            return this._bb;
        },
        getReservedMaskStack: function( maskStack ) {
            maskStack.current++;
            if ( maskStack.current === maskStack.length ) {
                maskStack.push( 0 );
            }
            return 0;
        },
        getCameraPlaneMaskForLightNear: function( p, fArr, len ) {
            var d, f, i = len;
            while ( i-- ) {
                f = fArr[ i ];
                d = f[ 0 ] * p[ 0 ] + f[ 1 ] * p[ 1 ] + f[ 2 ] * p[ 2 ] + f[ 3 ];
                if ( d <= 0 ) {
                    this._cameraPlaneMaskedByLightNear |= i;
                }
            }
        },
        pushMatrix: function( matrix ) {
            this._matrixStack.push( matrix );
        },
        popMatrix: function() {
            return this._matrixStack.pop();
        },
        isSphereCulled: function( r, p, fArr, len, maskStack, lightMask ) {
            var maskIn = this.getReservedMaskStack( maskStack );
            var maskOutidx = maskStack.current;

            var d, f;
            var i = len;
            while ( i-- ) {
                // if sphere inside frustum
                if ( ( i & lightMask ) && ( i & maskIn ) ) {
                    f = fArr[ i ];
                    d = f[ 0 ] * p[ 0 ] + f[ 1 ] * p[ 1 ] + f[ 2 ] * p[ 2 ] + f[ 3 ];
                    if ( d <= -r ) {
                        return true; // totally outside
                    }
                    if ( d < r ) {
                        // intersect with this plane
                        this._maskStack[ maskOutidx ] |= i;
                    }
                }
            }
            // check frustum totally outside/inside sphere
            // but intersecting all planes
            // aabbox frustum against sphere
            i = len;
            while ( i-- ) {
                f = fArr[ i ];
                if ( f[ 0 ] > p[ 0 ] + r ) return true; // totally outside
                if ( f[ 0 ] < p[ 0 ] - r ) return true; // totally outside
                if ( f[ 1 ] > p[ 1 ] + r ) return true; // totally outside
                if ( f[ 1 ] < p[ 1 ] - r ) return true; // totally outside
                if ( f[ 2 ] > p[ 2 ] + r ) return true; // totally outside
                if ( f[ 2 ] < p[ 2 ] - r ) return true; // totally outside
            }
            return false; //totally inside
        },
        apply: function( node ) {
            var didTest = false;
            if ( node.getMatrix ) {
                // It's a Transform Node: hierarchical culling FTW.
                var bs = this._bs;
                node.computeBound( bs );
                if ( this.isSphereCulled( bs.radius(), bs.center(), this._cameraShadowFrustum, this._cameraShadowFrustum.length, this._reserveCamMaskStack, this._cameraPlaneMaskedByLightNear ) ) {
                    // outside, end of the line.
                    this._reserveCamMaskStack.current--;
                    return;
                }
                // exclude frustum plane 5 & 6 which is far/near which we do not know
                // as that's what we seek
                if ( this.isSphereCulled( bs.radius(), bs.center(), this._lightFrustum, 5, this._reserveLightMaskStack, 0 ) ) {
                    this._reserveCamMaskStack.current--;
                    this._reserveLightMaskStack.current--;
                    return;
                }
                //we're in at least partially
                this.applyTransform( node );
            } else if ( node.getBoundingBox ) {
                // local to world bounding sphere
                var position = this._tmpPos;
                var pos = node.getBound().center();
                Vec3.copy( pos, position );
                // TODO fix scale transform the radius
                var radius = node.getBound().radius();
                var m = ComputeMatrixFromNodePath.computeLocalToWorld( this.nodePath );
                Matrix.transformVec3( m, position, position );

                if ( this.isSphereCulled( radius, position, this._cameraShadowFrustum, this._cameraShadowFrustum.length, this._reserveCamMaskStack, this._cameraPlaneMaskedByLightNear ) ) {
                    this._reserveCamMaskStack.current--;
                    return;
                }

                // exclude frustum plane 5 & 6 which is far/near which we do not know
                // as that's what we seek
                if ( this.isSphereCulled( radius, position, this._lightFrustum, 4, this._reserveLightMaskStack, 0 ) ) {
                    this._reserveCamMaskStack.current--;
                    this._reserveLightMaskStack.current--;
                    return;
                }
                this.applyBoundingBox( node.getBoundingBox() );
            }

            this.traverse( node );

            if ( didTest ) {
                this._reserveCamMaskStack.current--;
                this._reserveLightMaskStack.current--;
            }
        },
        applyTransform: function( transform ) {
            var matrix;
            if ( this._matrixStack.length !== 0 ) {
                matrix = this._matrixStack[ this._matrixStack.length - 1 ];
            } else {
                matrix = new Array( 16 );
                Matrix.makeIdentity( matrix );
            }

            transform.computeLocalToWorldMatrix( matrix, this );

            this.pushMatrix( matrix );

            this.traverse( transform );

            this.popMatrix();
        },
        //  http://users.soe.ucsc.edu/~pang/160/f98/Gems/Gems/TransBox.c
        //  Transforms a 3D axis-aligned box via a 4x4 matrix
        // vector and returns an axis-aligned box enclosing the result.
        transformBoundingbox: function( matrix, bboxIn, bboxOut ) {
            var av, bv;
            var i, j, k;

            bboxOut._min[ 0 ] = matrix[ 12 ];
            bboxOut._min[ 1 ] = matrix[ 13 ];
            bboxOut._min[ 2 ] = matrix[ 14 ];

            bboxOut._max[ 0 ] = matrix[ 12 ];
            bboxOut._max[ 1 ] = matrix[ 13 ];
            bboxOut._max[ 2 ] = matrix[ 14 ];

            for ( i = 0; i < 3; i++ ) {
                k = i * 4;
                for ( j = 0; j < 3; j++ ) {
                    av = matrix[ k + j ] * bboxIn._min[ j ];
                    bv = matrix[ k + j ] * bboxIn._max[ j ];
                    if ( av < bv ) {
                        bboxOut._min[ i ] += av;
                        bboxOut._max[ i ] += bv;
                    } else {
                        bboxOut._min[ i ] += bv;
                        bboxOut._max[ i ] += av;
                    }
                }
            }
            return bboxOut;
        },
        applyBoundingBox: function( bbox ) {
            if ( this._matrixStack.length === 0 ) {
                this._bb.expandByBoundingBox( bbox );
            } else if ( bbox.valid() ) {
                var matrix = this._matrixStack[ this._matrixStack.length - 1 ];
                // TODO: optim: could be Matrix::transformbbox
                // (and surely be optimised)
                this.transformBoundingbox( matrix, bbox, this._tmpbb );
                this._bb.expandByBoundingBox( this._tmpbb );
            }
        }
    } );
    /**
     *  ShadowMap provides an implementation of shadow textures.
     *  @class ShadowMap
     */
    var ShadowMap = function() {
        ShadowTechnique.call( this );

        // uniforms, shaders ?
        this._lightNum = 0;
        this._shadowTextureUnit = this._lightNum + 1;
        // this._texture
        // this._cameraShadow
        this._frustumCasters = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];
        this._frustumReceivers = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];
        this._cbbv = new ComputeFrustumBoundsVisitor( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN, this._frustumReceivers, this._frustumCasters );

        this._tmpMat = Matrix.create();
        this._bs = new BoundingSphere();
    };

    /** @lends ShadowMap.prototype */
    ShadowMap.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( ShadowTechnique.prototype, {
        dirty: function() {
            this._dirty = true;
        },
        getCamera: function() {
            return this._cameraShadow;
        },
        getTexture: function() {
            return this._texture;
        },
        setShadowReceiverShaderProgram: function( prg ) {
            prg.trackAttributes = {};
            prg.trackAttributes.attributeKeys = [];
            prg.trackAttributes.attributeKeys.push( 'Material' );
            prg.trackAttributes.attributeKeys.push( 'Light' + this._lightNum );
            if ( this._receivingStateset ) this._receivingStateset.setAttributeAndMode( prg, StateAttribute.ON | StateAttribute.OVERRIDE );

            this._receiverShaderProgram = prg;
        },
        getShadowReceiverShaderProgram: function() {
            return this._receiverShaderProgram;
        },

        setShadowCasterShaderProgram: function( prg ) {
            if ( this._castingStateset ) this._castingStateset.setAttributeAndMode( prg, StateAttribute.ON | StateAttribute.OVERRIDE );
            this._castsShaderProgram = prg;
        },
        getShadowCasterShaderProgram: function() {
            return this._castsShaderProgram;
        },

        setCastingStateset: function( st ) {
            this._castingStateset = st;
        },
        getCastingStateset: function() {
            return this._castingStateset;
        },
        setReceivingStateSet: function( st ) {
            this._receivingStateset = st;
        },
        getReceivingStateSet: function() {
            return this._receivingStateset;
        },

        /** initialize the ShadowedScene and local cached data structures.*/
        init: function() {
            if ( !this._shadowedScene ) return;

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

            shadowTexture.setMinFilter( 'LINEAR' );
            shadowTexture.setMagFilter( 'LINEAR' );
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

            ////////////////
            // RECEIVERS stateset
            var receiverStateSet = new StateSet();
            prg = this.getShadowReceiverShaderProgram();
            prg.trackAttributes = {};
            prg.trackAttributes.attributeKeys = [];
            prg.trackAttributes.attributeKeys.push( 'Material' );
            prg.trackAttributes.attributeKeys.push( 'Light' + num );
            receiverStateSet.setAttributeAndMode( prg, StateAttribute.ON | StateAttribute.OVERRIDE );
            this._receivingStateset = receiverStateSet;

            //receiverStateSet.addUniform( Uniform.createInt1( 0, 'Texture0' ) );

            receiverStateSet.setTextureAttributeAndMode( num + 1, shadowTexture, StateAttribute.ON | StateAttribute.OVERRIDE );
            receiverStateSet.addUniform( Uniform.createInt1( num + 1, 'Texture' + ( num + 1 ) ) );

            var depthRangeNum = new Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' + num );
            var shadowMapSizeNum = new Uniform.createFloat4( shadowSize, 'Shadow_MapSize' + num );
            var projectionShadowNum = new Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'Shadow_Projection' + num );
            var viewShadowNum = new Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'Shadow_View' + num );
            var enabledLight = new Uniform.createFloat1( 1.0, 'Light' + num + '_uniform_enable' );

            receiverStateSet.addUniform( enabledLight );
            receiverStateSet.addUniform( projectionShadowNum );
            receiverStateSet.addUniform( viewShadowNum );
            receiverStateSet.addUniform( depthRangeNum );
            receiverStateSet.addUniform( shadowMapSizeNum );


            // draw only shadow&light, not texure
            var texturedebug = shadowSettings._config[ 'texture' ] ? 1.0 : 0.0;
            var myuniform = Uniform.createFloat1( texturedebug, 'debug' );
            receiverStateSet.addUniform( myuniform );
            // Shadow bias /acne/ peterpannin
            var bias = shadowSettings._config[ 'bias' ];
            myuniform = Uniform.createFloat1( bias, 'bias' );
            receiverStateSet.addUniform( myuniform );

            // ESM & EVSM
            var exponent = shadowSettings._config[ 'exponent' ];
            myuniform = Uniform.createFloat1( exponent, 'exponent' );
            receiverStateSet.addUniform( myuniform );
            casterStateSet.addUniform( myuniform );

            var exponent1 = shadowSettings._config[ 'exponent1' ];
            myuniform = Uniform.createFloat1( exponent1, 'exponent1' );
            receiverStateSet.addUniform( myuniform );
            casterStateSet.addUniform( myuniform );

            // VSM
            var VsmEpsilon = shadowSettings._config[ 'VsmEpsilon' ];
            myuniform = Uniform.createFloat1( VsmEpsilon, 'VsmEpsilon' );
            receiverStateSet.addUniform( myuniform );

            // Camera/Eye Position
            // TODO: add positioned uniform
            myuniform = Uniform.createFloat4( [ 0.0, 0.0, 0.0, 0.0 ], 'Camera_uniform_position' );
            receiverStateSet.addUniform( myuniform );

            var camera = shadowSettings._config[ 'camera' ];
            this._cameraShadowed = camera;



            this._dirty = false;
        },

        valid: function() {
            // checks
            return true;
        },

        updateShadowParams: function() {
            // could do some light/scene change check here and skip it
            var shadowSettings = this.getShadowedScene().getShadowSettings();
            var light = shadowSettings.getLight();

            this.aimShadowCastingCamera( light, light.getPosition(), light.getDirection() );


            //var castUniforms = this._castingStateset.getUniformList();
            var receivingUniforms = this._receivingStateset.getUniformList();

            // udpate shader Parameters
            receivingUniforms[ 'debug' ].getUniform().set( shadowSettings._config[ 'texture' ] ? 1.0 : 0.0 );
            receivingUniforms[ 'bias' ].getUniform().set( shadowSettings._config[ 'bias' ] );
            receivingUniforms[ 'exponent' ].getUniform().set( shadowSettings._config[ 'exponent' ] );
            receivingUniforms[ 'exponent1' ].getUniform().set( shadowSettings._config[ 'exponent1' ] );
            receivingUniforms[ 'VsmEpsilon' ].getUniform().set( shadowSettings._config[ 'VsmEpsilon' ] );

            // Todo: get camera position as positioned uniform ?
            var pos = this._camPos || Vec4.create();
            this._camPos = pos;
            var camera = this._cameraShadowed;
            Matrix.getTrans( camera.getViewMatrix(), pos );
            receivingUniforms[ 'Camera_uniform_position' ].getUniform().set( pos );


            // update accordingly
            if ( !this._dirty ) return;
            //update texture size, format, etc. from settings if different
            //
            // updated
            this._dirty = false;
        },

        resize: function( shadowSizeFinal ) {

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

        /** run the update traversal of the ShadowedScene and update any local cached data structures.*/
        update: function( nv ) {
            this.getShadowedScene().nodeTraverse( nv );
        },

        /*receiving shadows, cull normally, but with receiving shader/state set/texture*/
        cullShadowReceivingScene: function( cullVisitor ) {

            // WARNING: only works if camera is a direct ancestor

            // What to do here... we want to draw all scene object, not only receivers ?
            // so no mask for now
            //var traversalMask = cullVisitor.getTraversalMask();
            //cullVisitor.setTraversalMask( this.getShadowedScene().getShadowSettings().getReceivesShadowTraversalMask() );

            var frustumCulling = this._enableFrustumCulling;
            cullVisitor.setEnableFrustumCulling( false );

            // compute frustum prior to culling, without near/far
            var mvp = this._tmpMat;
            Matrix.mult( this._cameraShadowed.getProjectionMatrix(), this._cameraShadowed.getViewMatrix(), mvp );
            cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, false, true );

            cullVisitor.pushStateSet( this._receivingStateset );
            this.getShadowedScene().nodeTraverse( cullVisitor );
            cullVisitor.popStateSet();


            var epsilon = 1e-6;
            if ( cullVisitor._computedFar < cullVisitor._computedNear - epsilon ) {
                Notify.log( 'empty shadowed scene' );
                for ( var l = 0; l < 6; l++ ) {
                    for ( var k = 0; k < 4; k++ ) {
                        this._frustumReceivers[ l ][ k ] = 0.0;
                    }
                }
                this._farReceivers = 1;
                this._nearReceivers = 0.001;
                return;
            } else {
                // VFC with computed near / far from scene
                var m = cullVisitor.getCurrentProjectionMatrix();
                cullVisitor.clampProjectionMatrix( m, cullVisitor._computedNear, cullVisitor._computedFar, cullVisitor._nearFarRatio );
                Matrix.mult( m, this._cameraShadowed.getViewMatrix(), mvp );
                cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, true );
                for ( var i = 0; i < 6; i++ ) {
                    Vec4.copy( cullVisitor._frustum[ i ], this._frustumReceivers[ i ] );
                }
            }


            this._nearReceivers = cullVisitor._computedNear;
            this._farReceivers = cullVisitor._computedFar;


            // reapply the original traversal mask
            // cullVisitor.setTraversalMask( traversalMask );
            if ( frustumCulling === false ) {
                cullVisitor.setEnableFrustumCulling( false );
            }
        },

        /*
         * compute  scene bounding box and bounding sphere
         */
        getBoundsCaster: function( worldLightPos ) {
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
        aimShadowCastingCamera: function( light, lightPos, lightDir, lightUp ) {
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

        cullShadowCastingScene: function( cullVisitor ) {
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

        enterCullCaster: function( cullVisitor ) {
            // well shouldn't be called
            cullVisitor.setEnableFrustumCulling( true );
            //var m = cullVisitor.getCurrentProjectionMatrix();
            //cullVisitor.clampProjectionMatrix( m, cullVisitor._computedNear, cullVisitor._computedFar, cullVisitor._nearFarRatio );
            var mvp = this._tmpMat;
            Matrix.mult( this._cameraShadow.getProjectionMatrix(), this._cameraShadow.getViewMatrix(), mvp );
            cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, false, true );
        },

        exitCullCaster: function( cullVisitor ) {

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
            cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, true );
            for ( var i = 0; i < 6; i++ ) {
                Vec4.copy( cullVisitor._frustum[ i ], this._frustumCasters[ i ] );
            }
        },


        /** run the cull traversal of the ShadowedScene and set up the rendering for this ShadowTechnique.*/
        cull: function( cullVisitor ) {
            // make sure positioned data is done for light,
            // do it first
            this.cullShadowReceivingScene( cullVisitor );

            // now we can update camera from light accordingly
            this.updateShadowParams();
            // culled last but rendered first
            this.cullShadowCastingScene( cullVisitor );

            return false;
        },

        cleanSceneGraph: function() {
            // well release a lot of thing we it works
        },

    } ), 'osg', 'ShadowMap' );

    MACROUTILS.setTypeID( ShadowMap );

    return ShadowMap;
} );