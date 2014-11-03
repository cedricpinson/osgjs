define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Vec4',
    'osg/Matrix',
    'osg/Uniform',
    'osg/StateSet',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/CullVisitor'
], function ( Notify, MACROUTILS, Vec4, Matrix, Uniform, StateSet, Node, NodeVisitor, CullVisitor ) {
    'use strict';
    /**
     *  ShadowedScene provides a mechanism for decorating a scene that the needs to have shadows cast upon it.
     *  @class ShadowedScene
     *  @{@link [http://trac.openscenegraph.org/projects/osg//wiki/Support/ProgrammingGuide/osgShadow]}
     *  @{@link [http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf]};
     */
    var ShadowedScene = function () {
        Node.call( this );

        // TODO: all  techniques
        this._shadowTechnique = undefined;

        this._shadowSettings = undefined;

        this._frustumReceivers = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];

        this._tmpMat = Matrix.create();
    };

    /** @lends ShadowedScene.prototype */
    ShadowedScene.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Node.prototype, {
        getShadowTechnique: function () {
            // TODO: all  techniques
            return this._shadowTechnique;
        },
        // TODO: all  techniques
        setShadowTechnique: function ( technique ) {
            // TODO: all  techniques
            if ( this._shadowTechnique ) {
                if ( this._shadowTechnique === technique ) return;

                if ( this._shadowTechnique.valid() ) {
                    this._shadowTechnique.cleanSceneGraph();
                    this._shadowTechnique._shadowedScene = 0;
                }
            }
            this._shadowTechnique = technique;

            if ( this._shadowTechnique.valid() ) {
                this._shadowTechnique._shadowedScene = this;
                this._shadowTechnique.dirty();
            }
        },
        getShadowSettings: function () {
            return this._shadowSettings;
        },
        setShadowSettings: function ( ss ) {
            this._shadowSettings = ss;
        },
        /** Clean scene graph from any shadow technique specific nodes, state and drawables.*/
        cleanSceneGraph: function () {
            // TODO: all  techniques
            if ( this._shadowTechnique && this._shadowTechnique.valid() ) {
                this._shadowTechnique.cleanSceneGraph();
            }
        },
        /** Dirty any cache data structures held in the attached ShadowTechnqiue.*/
        dirty: function () {
            // TODO: all  techniques
            if ( this._shadowTechnique && this._shadowTechnique.valid() ) {
                this._shadowTechnique.dirty();
            }
        },
        nodeTraverse: function ( /*nv*/) {
            Node.prototype.traverse.apply( this, arguments );
        },
        traverse: function ( nodeVisitor ) {

            CullVisitor = CullVisitor || require( 'osg/CullVisitor' );

            if ( nodeVisitor.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {

                // init
                // TODO: all  techniques
                if ( this._shadowTechnique && this._shadowTechnique.valid() && this._shadowTechnique._dirty ) {
                    this._shadowTechnique.init();
                }

                this.nodeTraverse( nodeVisitor );

            } else if ( nodeVisitor.getVisitorType() === NodeVisitor.CULL_VISITOR ) {

                var cullVisitor = nodeVisitor;

                if ( cullVisitor instanceof CullVisitor ) {
                    // cull Shadowed Scene
                    this.cullShadowReceivingScene( nodeVisitor );

                    // cull Casters
                    // TODO: all  techniques
                    if ( this._shadowTechnique && this._shadowTechnique.valid() ) {
                        this._shadowTechnique.cullShadowCastingScene( cullVisitor );
                    }
                }
            } else {
                this.nodeTraverse( nodeVisitor );
            }



        },
        setGLContext: function ( gl ) {
            this._glContext = gl;
        },
        getGLContext: function () {
            return this._glContext;
        },
        init: function () {

            ////////////////
            // RECEIVERS stateSet
            var receiverStateSet = new StateSet();
            // NOW USING NODE SHADERS
            this._receivingStateset = receiverStateSet;

            var shadowSettings = this.getShadowSettings();
            //
            // draw only shadow & light, not texture
            var texturedebug = shadowSettings._config[ 'texture' ] ? 1.0 : 0.0;
            var myuniform = Uniform.createFloat1( texturedebug, 'debug' );
            this._receivingStateset.addUniform( myuniform );
            // Shadow bias /acne/ peter panning
            var bias = shadowSettings._config[ 'bias' ];
            myuniform = Uniform.createFloat1( bias, 'bias' );
            this._receivingStateset.addUniform( myuniform );
            // ESM & EVSM
            var exponent = shadowSettings._config[ 'exponent' ];
            myuniform = Uniform.createFloat1( exponent, 'exponent' );
            this._receivingStateset.addUniform( myuniform );
            var exponent1 = shadowSettings._config[ 'exponent1' ];
            myuniform = Uniform.createFloat1( exponent1, 'exponent1' );
            this._receivingStateset.addUniform( myuniform );
            // VSM
            var VsmEpsilon = shadowSettings._config[ 'VsmEpsilon' ];
            myuniform = Uniform.createFloat1( VsmEpsilon, 'VsmEpsilon' );
            this._receivingStateset.addUniform( myuniform );
            // Camera/Eye Position
            // TODO: add positioned uniform
            myuniform = Uniform.createFloat4( [ 0.0, 0.0, 0.0, 0.0 ], 'Camera_uniform_position' );
            this._receivingStateset.addUniform( myuniform );



            // TODO: all  techniques
            if ( this._shadowTechnique && this._shadowTechnique.valid() ) {
                this._shadowTechnique.init( receiverStateSet );
            }
        },
        setReceivingStateSet: function ( st ) {
            this._receivingStateset = st;
        },
        getReceivingStateSet: function () {
            return this._receivingStateset;
        },
        /*receiving shadows, cull normally, but with receiving shader/state set/texture*/
        cullShadowReceivingScene: function ( cullVisitor ) {

            // WARNING: only works if there is a camera as ancestor
            // TODO: Better (Multi)Camera detection handling
            this._cameraShadowed = cullVisitor.getCurrentCamera();


            var receivingUniforms = this._receivingStateset.getUniformList();

            // update shader Parameters
            receivingUniforms[ 'debug' ].getUniform().set( this._shadowSettings._config[ 'texture' ] ? 1.0 : 0.0 );
            receivingUniforms[ 'bias' ].getUniform().set( this._shadowSettings._config[ 'bias' ] );
            receivingUniforms[ 'exponent' ].getUniform().set( this._shadowSettings._config[ 'exponent' ] );
            receivingUniforms[ 'exponent1' ].getUniform().set( this._shadowSettings._config[ 'exponent1' ] );
            receivingUniforms[ 'VsmEpsilon' ].getUniform().set( this._shadowSettings._config[ 'VsmEpsilon' ] );

            // TODO: get camera position as positioned uniform ?
            var pos = this._camPos || Vec4.create();
            this._camPos = pos;
            Matrix.getTrans( this._cameraShadowed.getViewMatrix(), pos );
            receivingUniforms[ 'Camera_uniform_position' ].getUniform().set( pos );


            // What to do here... we want to draw all scene object, not only receivers ?
            // so no mask for now
            //var traversalMask = cullVisitor.getTraversalMask();
            //cullVisitor.setTraversalMask( this.getShadowSettings().getReceivesShadowTraversalMask() );

            var frustumCulling = cullVisitor._enableFrustumCulling;
            cullVisitor.setEnableFrustumCulling( true );

            // compute frustum prior to culling, without near/far
            var mvp = this._tmpMat;
            Matrix.mult( this._cameraShadowed.getProjectionMatrix(), this._cameraShadowed.getViewMatrix(), mvp );
            cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, true );

            cullVisitor.pushStateSet( this._receivingStateset );
            this.nodeTraverse( cullVisitor );
            cullVisitor.popStateSet();


            var epsilon = 1e-6;
            if ( cullVisitor._computedFar < cullVisitor._computedNear - epsilon ) {
                Notify.log( 'empty shadowed scene' );
                for ( var l = 0; l < 6; l++ ) {
                    this._frustumReceivers[ l ][ 0 ] = -1.0;
                    this._frustumReceivers[ l ][ 1 ] = 1.01;
                    this._frustumReceivers[ l ][ 2 ] = -1.0;
                    this._frustumReceivers[ l ][ 3 ] = 1.01;
                }
                this._farReceivers = 1;
                this._nearReceivers = 0.001;
                return;
            } else {
                // VFC with computed near / far from scene
                var m = cullVisitor.getCurrentProjectionMatrix();
                cullVisitor.clampProjectionMatrix( m, cullVisitor._computedNear, cullVisitor._computedFar, cullVisitor._nearFarRatio );
                Matrix.mult( m, this._cameraShadowed.getViewMatrix(), mvp );
                cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, false );
                for ( var i = 0; i < 6; i++ ) {
                    Vec4.copy( cullVisitor._frustum[ i ], this._frustumReceivers[ i ] );
                }
            }


            this._nearReceivers = cullVisitor._computedNear;
            this._farReceivers = cullVisitor._computedFar;


            // reapply the original traversal mask
            // cullVisitor.setTraversalMask( traversalMask );
            if ( frustumCulling === false || frustumCulling === undefined ) {
                cullVisitor.setEnableFrustumCulling( false );
            }
        },


    } ), 'osg', 'ShadowedScene' );
    MACROUTILS.setTypeID( ShadowedScene );

    return ShadowedScene;
} );