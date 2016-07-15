'use strict';
var Notify = require( 'osg/Notify' );
var MACROUTILS = require( 'osg/Utils' );
var osgMath = require( 'osg/Math' );
var NodeVisitor = require( 'osg/NodeVisitor' );
var CullSettings = require( 'osg/CullSettings' );
var CullStack = require( 'osg/CullStack' );
var Matrix = require( 'osg/Matrix' );
var MatrixTransform = require( 'osg/MatrixTransform' );
var AutoTransform = require( 'osg/AutoTransform' );
var Projection = require( 'osg/Projection' );
var LightSource = require( 'osg/LightSource' );
var osgPool = require( 'osgUtil/osgPool' );
var Geometry = require( 'osg/Geometry' );
var RenderLeaf = require( 'osg/RenderLeaf' );
var RenderBin = require( 'osg/RenderBin' );
var RenderStage = require( 'osg/RenderStage' );
var Node = require( 'osg/Node' );
var Lod = require( 'osg/Lod' );
var PagedLOD = require( 'osg/PagedLOD' );
var Camera = require( 'osg/Camera' );
var TransformEnums = require( 'osg/TransformEnums' );
var Vec3 = require( 'osg/Vec3' );
var Skeleton = require( 'osgAnimation/Skeleton' );
var RigGeometry = require( 'osgAnimation/RigGeometry' );
var Bone = require( 'osgAnimation/Bone' );
var MorphGeometry = require( 'osgAnimation/MorphGeometry' );

/**
 * CullVisitor traverse the tree and collect Matrix/State for the rendering traverse
 * @class CullVisitor
 */
var CullVisitor = function () {
    NodeVisitor.call( this, NodeVisitor.TRAVERSE_ACTIVE_CHILDREN );
    CullSettings.call( this );
    CullStack.call( this );

    this._rootStateGraph = undefined;
    this._currentStateGraph = undefined;
    this._currentRenderBin = undefined;
    this._currentRenderStage = undefined;
    this._rootRenderStage = undefined;
    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;

    var lookVector = Vec3.createAndSet( 0.0, 0.0, -1.0 );
    this._camera = undefined;
    /*jshint bitwise: false */
    this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
    this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
    /*jshint bitwise: true */

    this._reserveLeafStack = [ new RenderLeaf() ];
    this._reserveLeafStackCurrent = 0;

    this._reserveRenderStageStacks = {};

    this._reserveCullSettingsStack = [ new CullSettings() ];
    this._reserveCullSettingsStackCurrent = 0;

    this._renderBinStack = [];
    this.visitorType = NodeVisitor.CULL_VISITOR;

    this._identityMatrix = Matrix.create();

    this._renderer = undefined;
    this._renderStageType = RenderStage;

    this._numCamera = 0;
    this._numMatrixTransform = 0;
    this._numProjection = 0;
    this._numNode = 0;
    this._numLightSource = 0;
    this._numGeometry = 0;

};

/** @lends CullVisitor.prototype */
CullVisitor.prototype = MACROUTILS.objectInherit( CullStack.prototype, MACROUTILS.objectInherit( NodeVisitor.prototype, {
    distance: function ( coord, matrix ) {
        return -( coord[ 0 ] * matrix[ 2 ] + coord[ 1 ] * matrix[ 6 ] + coord[ 2 ] * matrix[ 10 ] + matrix[ 14 ] );
    },

    getComputedNear: function () {
        return this._computedNear;
    },

    getComputedFar: function () {
        return this._computedFar;
    },

    resetStats: function () {
        this._numCamera = 0;
        this._numMatrixTransform = 0;
        this._numProjection = 0;
        this._numNode = 0;
        this._numLightSource = 0;
        this._numGeometry = 0;
    },

    handleCullCallbacksAndTraverse: function ( node ) {
        var ccb = node.getCullCallback();
        if ( ccb && !ccb.cull( node, this ) )
            return;
        this.traverse( node );
    },

    getCurrentCamera: function () {
        return this._currentRenderBin.getStage().getCamera();
    },

    updateCalculatedNearFar: ( function () {
        var nearVec = Vec3.create();
        var farVec = Vec3.create();

        return function ( matrix, drawable ) {

            var bb = drawable.getBoundingBox();
            var dNear, dFar;

            // efficient computation of near and far, only taking into account the nearest and furthest
            // corners of the bounding box.
            dNear = this.distance( bb.corner( this._bbCornerNear, nearVec ), matrix );
            dFar = this.distance( bb.corner( this._bbCornerFar, farVec ), matrix );

            if ( dNear > dFar ) {
                var tmp = dNear;
                dNear = dFar;
                dFar = tmp;
            }

            if ( dFar < 0.0 ) {
                // whole object behind the eye point so discard
                return false;
            }

            if ( dNear < this._computedNear ) {
                this._computedNear = dNear;
            }

            if ( dFar > this._computedFar ) {
                this._computedFar = dFar;
            }

            return true;

        };
    } )(),


    setStateGraph: function ( sg ) {
        this._rootStateGraph = sg;
        this._currentStateGraph = sg;
    },
    setRenderStage: function ( rg ) {
        this._rootRenderStage = rg;
        this._currentRenderBin = rg;
    },
    setRenderer: function ( renderer ) {
        this._renderer = renderer;
    },
    getRenderer: function () {
        return this._renderer;
    },

    reset: function () {
        CullStack.prototype.reset.call( this );
        // Reset the stack before reseting the current leaf index.
        // Reseting elements and refilling them later is faster than create new elements
        // That's the reason to have a leafStack, see http://jsperf.com/refill/2
        this.resetRenderLeafStack();
        this._reserveLeafStackCurrent = 0;

        this.resetCullSettingsStack();
        this._reserveCullSettingsStackCurrent = 0;

        // renderstage / renderbin pools
        var resetStages = window.Object.keys( this._reserveRenderStageStacks );
        for ( var i = 0, l = resetStages.length; i < l; i++ ) {
            var key = resetStages[ i ];
            this._reserveRenderStageStacks[ key ].reset();
        }
        RenderBin.resetStack();

        this._computedNear = Number.POSITIVE_INFINITY;
        this._computedFar = Number.NEGATIVE_INFINITY;
    },

    getCurrentRenderBin: function () {
        return this._currentRenderBin;
    },

    setCurrentRenderBin: function ( rb ) {
        this._currentRenderBin = rb;
    },

    // mimic the osg implementation
    // in osg you can push 0, in this case an identity matrix will be loaded
    addPositionedAttribute: function ( matrix, attribute ) {

        var m = matrix ? matrix : this._identityMatrix;
        this._currentRenderBin.getStage().positionedAttribute.push( [ m, attribute ] );

    },

    pushStateSet: function ( stateset ) {
        this._currentStateGraph = this._currentStateGraph.findOrInsert( stateset );
        if ( stateset.getBinName() !== undefined ) {
            var renderBinStack = this._renderBinStack;
            var currentRenderBin = this._currentRenderBin;
            renderBinStack.push( currentRenderBin );
            this._currentRenderBin = currentRenderBin.getStage().findOrInsert( stateset.getBinNumber(), stateset.getBinName() );
        }
    },

    /** Pop the top state set and hence associated state group.
     * Move the current state group to the parent of the popped
     * state group.
     */
    popStateSet: function () {
        var currentStateGraph = this._currentStateGraph;
        var stateset = currentStateGraph.getStateSet();
        this._currentStateGraph = currentStateGraph.parent;
        if ( stateset.getBinName() !== undefined ) {
            var renderBinStack = this._renderBinStack;
            if ( renderBinStack.length === 0 ) {
                this._currentRenderBin = this._currentRenderBin.getStage();
            } else {
                this._currentRenderBin = renderBinStack.pop();
            }
        }
    },

    popProjectionMatrix: function () {
        if ( this._computeNearFar === true && this._computedFar >= this._computedNear ) {
            var m = this.getCurrentProjectionMatrix();
            if ( this._clampProjectionMatrixCallback !== undefined ) {
                this._clampProjectionMatrixCallback( m, this._computedNear, this._computedFar, this._nearFarRatio );
            } else {
                Matrix.clampProjectionMatrix( m, this._computedNear, this._computedFar, this._nearFarRatio );
            }
        }
        CullStack.prototype.popProjectionMatrix.call( this );
    },

    popCameraModelViewProjectionMatrix: function () {
        this.popModelViewMatrix();
        this.popProjectionMatrix();
    },

    pushCameraModelViewProjectionMatrix: function ( camera, modelview, projection ) {
        this.pushModelViewMatrix( modelview );
        this.pushProjectionMatrix( projection );
    },

    apply: function ( node ) {
        this[ node.typeID ]( node );
    },

    createOrReuseRenderStage: function ( classInstance ) {

        var type = !classInstance ? 'RenderStage' : classInstance.className();
        var classCtor = !classInstance ? RenderStage : classInstance.constructor;

        var stack;
        if ( this._reserveRenderStageStacks[ type ] ) {
            stack = this._reserveRenderStageStacks[ type ];
        } else {
            stack = new osgPool.OsgObjectMemoryStack( classCtor );
            this._reserveRenderStageStacks[ type ] = stack;
        }
        return stack.get().init();

    },

    createOrReuseRenderLeaf: function () {
        var l = this._reserveLeafStack[ this._reserveLeafStackCurrent++ ];
        if ( this._reserveLeafStackCurrent === this._reserveLeafStack.length ) {
            this._reserveLeafStack.push( new RenderLeaf() );
        }
        return l;
    },

    resetRenderLeafStack: function () {
        for ( var i = 0, j = this._reserveLeafStackCurrent; i <= j; i++ ) {
            this._reserveLeafStack[ i ].reset();
        }
    },

    createOrReuseCullSettings: function () {
        var l = this._reserveCullSettingsStack[ this._reserveCullSettingsStackCurrent++ ];

        if ( this._reserveCullSettingsStackCurrent === this._reserveCullSettingsStack.length ) {

            this._reserveCullSettingsStack.push( new CullSettings() );

        }
        return l;
    },

    resetCullSettingsStack: function () {
        for ( var i = 0, j = this._reserveCullSettingsStackCurrent; i <= j; i++ ) {
            this._reserveCullSettingsStack[ i ].reset();
        }
    },

    // function call after the push state in the geometry apply function
    // the idea is to avoid heavy copy-paste for the rigGeometry apply
    // since the only difference is that we want to push an additional state
    // Maybe it will be useful when we'll add morph target geometry or something...
    postPushGeometry: function ( cull, node ) {

        var sourceGeometry;
        var geometryStateSetAnimation;

        if ( node instanceof RigGeometry ) {

            geometryStateSetAnimation = node.getStateSetAnimation();
            if ( geometryStateSetAnimation ) cull.pushStateSet( geometryStateSetAnimation );

            sourceGeometry = node.getSourceGeometry();

            if ( sourceGeometry instanceof MorphGeometry ) {

                geometryStateSetAnimation = sourceGeometry.getStateSetAnimation();
                if ( geometryStateSetAnimation ) cull.pushStateSet( geometryStateSetAnimation );

            }

        } else if ( node instanceof MorphGeometry ) {

            geometryStateSetAnimation = node.getStateSetAnimation();
            if ( geometryStateSetAnimation ) cull.pushStateSet( geometryStateSetAnimation );

        }

    },

    // same comment as above (postPushGeometry)
    prePopGeometry: function ( cull, node ) {

        if ( node instanceof RigGeometry ) {

            var sourceGeometry = node.getSourceGeometry();

            if ( sourceGeometry instanceof MorphGeometry ) {

                if ( sourceGeometry.getStateSetAnimation() ) cull.popStateSet();

            }

            if ( node.getStateSetAnimation() ) cull.popStateSet();

        } else if ( node instanceof MorphGeometry && node.getStateSetAnimation() ) {

            cull.popStateSet();

        }

    },

    pushLeaf: function ( node, depth ) {
        var leafs = this._currentStateGraph.leafs;
        if ( leafs.length === 0 ) {
            this._currentRenderBin.addStateGraph( this._currentStateGraph );
        }

        var leaf = this.createOrReuseRenderLeaf();

        leaf.init( this._currentStateGraph,
            node,
            this.getCurrentProjectionMatrix(),
            this.getCurrentViewMatrix(),
            this.getCurrentModelViewMatrix(),
            this.getCurrentModelWorldMatrix(),
            depth );

        leafs.push( leaf );

    }

} ) );


// Camera cull visitor call
// ANY CHANGE, any change : double check in rendere Camera code
// for the first camera
CullVisitor.prototype[ Camera.typeID ] = function ( camera ) {
    this._numCamera++;

    var stateset = camera.getStateSet();
    if ( stateset ) this.pushStateSet( stateset );

    var modelview = this._reservedMatrixStack.get();
    var projection = this._reservedMatrixStack.get();

    if ( camera.getReferenceFrame() === TransformEnums.RELATIVE_RF ) {

        var lastProjectionMatrix = this.getCurrentProjectionMatrix();
        Matrix.mult( lastProjectionMatrix, camera.getProjectionMatrix(), projection );

        var lastViewMatrix = this.getCurrentModelViewMatrix();
        Matrix.mult( lastViewMatrix, camera.getViewMatrix(), modelview );

    } else {

        // absolute
        Matrix.copy( camera.getViewMatrix(), modelview );
        Matrix.copy( camera.getProjectionMatrix(), projection );

    }


    // save current state of the camera
    var previousZnear = this._computedNear;
    var previousZfar = this._computedFar;

    // save cullSettings
    // TODO Perf: why it's not a stack
    // and is pollutin  GC ?
    var previousCullsettings = this.createOrReuseCullSettings();
    previousCullsettings.setCullSettings( this );

    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;
    //

    this.setCullSettings( camera );
    // global override
    // upon who setted the parameter
    // if it's cullvisitor
    // it's an OVERRIDER for enableFrustumCulling
    // allowing for global EnableFrustimCulling
    if ( previousCullsettings.getSettingSourceOverrider() === this && previousCullsettings.getEnableFrustumCulling() ) {
        this.setEnableFrustumCulling( true );
    }


    this.pushCameraModelViewProjectionMatrix( camera, modelview, projection );

    if ( camera.getViewport() ) {
        this.pushViewport( camera.getViewport() );
    }


    // nested camera
    if ( camera.getRenderOrder() === Camera.NESTED_RENDER ) {

        this.handleCullCallbacksAndTraverse( camera );

    } else {
        // not tested

        var renderBin = this.getCurrentRenderBin();
        var previousStage = renderBin.getStage();

        // use render to texture stage
        var rtts = this.createOrReuseRenderStage( this._rootRenderStage );

        rtts.setCamera( camera );
        rtts.setClearDepth( camera.getClearDepth() );
        rtts.setClearColor( camera.getClearColor() );
        rtts.setClearMask( camera.getClearMask() );

        var vp;
        if ( camera.getViewport() === undefined ) {
            vp = previousStage.getViewport();
        } else {
            vp = camera.getViewport();
        }
        rtts.setViewport( vp );

        // skip positional state for now
        // ...

        this.setCurrentRenderBin( rtts );

        this.handleCullCallbacksAndTraverse( camera );

        this.setCurrentRenderBin( renderBin );

        if ( camera.getRenderOrder() === Camera.PRE_RENDER ) {
            this.getCurrentRenderBin().getStage().addPreRenderStage( rtts, camera.renderOrderNum );
        } else {
            this.getCurrentRenderBin().getStage().addPostRenderStage( rtts, camera.renderOrderNum );
        }
    }

    this.popCameraModelViewProjectionMatrix( camera );

    if ( camera.getViewport() ) {
        this.popViewport();
    }

    // restore previous state of the camera
    this.setCullSettings( previousCullsettings );
    this._computedNear = previousZnear;
    this._computedFar = previousZfar;

    if ( stateset ) this.popStateSet();

};


CullVisitor.prototype[ MatrixTransform.typeID ] = function ( node ) {
    this._numMatrixTransform++;

    // Camera and lights must enlarge node parent bounding boxes for this not to cull
    if ( this.isCulled( node, this.nodePath ) ) {
        return;
    }
    // push the culling mode.
    this.pushCurrentMask();

    var matrix = this._reservedMatrixStack.get();
    var lastMatrixStack = this.getCurrentModelViewMatrix();
    Matrix.copy( lastMatrixStack, matrix );
    node.computeLocalToWorldMatrix( matrix );
    this.pushModelViewMatrix( matrix );


    var stateset = node.getStateSet();

    if ( stateset ) this.pushStateSet( stateset );

    this.handleCullCallbacksAndTraverse( node );

    if ( stateset ) this.popStateSet();


    this.popModelViewMatrix();

    // pop the culling mode.
    this.popCurrentMask();
};

CullVisitor.prototype[ Projection.typeID ] = function ( node ) {
    this._numProjection++;

    var lastMatrixStack = this.getCurrentProjectionMatrix();
    var matrix = this._reservedMatrixStack.get();
    Matrix.mult( lastMatrixStack, node.getProjectionMatrix(), matrix );
    this.pushProjectionMatrix( matrix );

    var stateset = node.getStateSet();
    if ( stateset ) this.pushStateSet( stateset );

    this.handleCullCallbacksAndTraverse( node );

    if ( stateset ) this.popStateSet();

    this.popProjectionMatrix();
};

// here it's treated as a group node for culling
// as there's isn't any in osgjs
// so frustumCulling is done here
CullVisitor.prototype[ Node.typeID ] = function ( node ) {
    this._numNode++;

    // Camera and lights must enlarge node parent bounding boxes for this not to cull
    if ( this.isCulled( node, this.nodePath ) ) {
        return;
    }

    // push the culling mode.
    this.pushCurrentMask();

    var stateset = node.getStateSet();
    if ( stateset ) this.pushStateSet( stateset );

    this.handleCullCallbacksAndTraverse( node );

    if ( stateset ) this.popStateSet();

    // pop the culling mode.
    this.popCurrentMask();
};

// same code like MatrixTransform
CullVisitor.prototype[ AutoTransform.typeID ] = CullVisitor.prototype[ MatrixTransform.typeID ];

// same code like Node
CullVisitor.prototype[ Lod.typeID ] = CullVisitor.prototype[ Node.typeID ];

// same code like Node
CullVisitor.prototype[ PagedLOD.typeID ] = CullVisitor.prototype[ Node.typeID ];


CullVisitor.prototype[ LightSource.typeID ] = function ( node ) {
    this._numLightSource++;

    var stateset = node.getStateSet();
    if ( stateset ) this.pushStateSet( stateset );

    var light = node.getLight();
    if ( light ) {
        if ( node.getReferenceFrame() === TransformEnums.RELATIVE_RF )
            this.addPositionedAttribute( this.getCurrentModelViewMatrix(), light );
        else
            this.addPositionedAttribute( null, light );
    }


    this.handleCullCallbacksAndTraverse( node );

    if ( stateset ) this.popStateSet();
};

CullVisitor.prototype[ Geometry.typeID ] = ( function () {

    var tempVec = Vec3.create();
    var loggedOnce = false;
    return function geometryApply( node ) {

        this._numGeometry++;

        var modelview = this.getCurrentModelViewMatrix();
        var bb = node.getBoundingBox();
        if ( this._computeNearFar && bb.valid() ) {
            if ( !this.updateCalculatedNearFar( modelview, node ) ) {
                return;
            }
        }

        // using modelview is not a pb because geometry
        // is a leaf node, else traversing the graph would be an
        // issue because we use modelview after
        var ccb = node.getCullCallback();
        if ( ccb && !ccb.cull( node, this ) )
            return;

        var stateset = node.getStateSet();
        if ( stateset ) this.pushStateSet( stateset );

        this.postPushGeometry( this, node );

        var depth = 0;
        if ( bb.valid() ) {
            depth = this.distance( bb.center( tempVec ), modelview );
        }
        if ( osgMath.isNaN( depth ) ) {

            if ( !loggedOnce ) {
                Notify.warn( 'warning geometry has a NaN depth, ' + modelview + ' center ' + tempVec );
                loggedOnce = true;
            }

        } else {

            this.pushLeaf( node, depth );

        }

        this.prePopGeometry( this, node );
        if ( stateset ) this.popStateSet();
    };
} )();

CullVisitor.prototype[ Skeleton.typeID ] = CullVisitor.prototype[ MatrixTransform.typeID ];

CullVisitor.prototype[ RigGeometry.typeID ] = CullVisitor.prototype[ Geometry.typeID ];

CullVisitor.prototype[ MorphGeometry.typeID ] = CullVisitor.prototype[ Geometry.typeID ];

CullVisitor.prototype[ Bone.typeID ] = CullVisitor.prototype[ MatrixTransform.typeID ];

module.exports = CullVisitor;
