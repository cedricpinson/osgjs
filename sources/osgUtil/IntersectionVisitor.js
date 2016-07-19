'use strict';
var MACROUTILS = require( 'osg/Utils' );
var NodeVisitor = require( 'osg/NodeVisitor' );
var Matrix = require( 'osg/Matrix' );
var MatrixMemoryPool = require( 'osg/MatrixMemoryPool' );
var TransformEnums = require( 'osg/TransformEnums' );


var IntersectionVisitor = function () {
    NodeVisitor.call( this );
    // We could need to use a stack of intersectors in case we want
    // to use several intersectors. Right now we use only one.
    this._intersector = undefined;
    this._projectionStack = [ Matrix.identity ];
    this._modelStack = [ Matrix.identity ];
    this._viewStack = [ Matrix.identity ];
    this._windowStack = [ Matrix.identity ];

    this.reset();
};

IntersectionVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
    reset: function () {
        IntersectionVisitor._reservedMatrixStack.reset();
    },
    setIntersector: function ( intersector ) {
        this._intersector = intersector;
    },
    getIntersector: function () {
        return this._intersector;
    },
    // Model matrix
    pushModelMatrix: function ( matrix ) {
        this._modelStack.push( matrix );
    },
    getModelMatrix: function () {
        return ( this._modelStack.length ) ? this._modelStack[ this._modelStack.length - 1 ] : undefined;

    },
    popModelMatrix: function () {
        return this._modelStack.pop();
    },
    // View Matrix
    pushViewMatrix: function ( matrix ) {
        this._viewStack.push( matrix );

    },
    getViewMatrix: function () {
        return ( this._viewStack.length ) ? this._viewStack[ this._viewStack.length - 1 ] : undefined;

    },
    popViewMatrix: function () {
        return this._viewStack.pop();
    },
    // Projection Matrix
    pushProjectionMatrix: function ( matrix ) {
        this._projectionStack.push( matrix );
    },
    getProjectionMatrix: function () {
        return ( this._projectionStack.length ) ? this._projectionStack[ this._projectionStack.length - 1 ] : undefined;

    },
    popProjectionMatrix: function () {
        return this._projectionStack.pop();
    },
    // Window Matrix
    pushWindowMatrix: function ( matrix ) {
        this._windowStack.push( matrix );
    },
    pushWindowMatrixUsingViewport: function ( viewport ) {
        this._windowStack.push( viewport.computeWindowMatrix( IntersectionVisitor._reservedMatrixStack.get() ) );
    },
    getWindowMatrix: function () {
        return ( this._windowStack.length ) ? this._windowStack[ this._windowStack.length - 1 ] : undefined;
    },
    popWindowMatrix: function () {
        return this._windowStack.pop();
    },
    getTransformation: ( function () {
        // We should move this to the intersector when we need to use different coordinate frames
        // Now we only support WINDOW coordinate frame

        // /!\ 64 bit precision because the picking is jittery otherwise
        // It's probably caused by one of the camera matrix that has too big/small values
        // but currently it's the ony fix we have
        var mat = new Float64Array( 16 );

        return function () {
            Matrix.copy( this.getWindowMatrix() || Matrix.identity, mat );
            Matrix.preMult( mat, this.getProjectionMatrix() || Matrix.identity );
            Matrix.preMult( mat, this.getViewMatrix() || Matrix.identity );
            Matrix.preMult( mat, this.getModelMatrix() || Matrix.identity );

            return mat;
        };
    } )(),

    enter: function ( node ) {
        // Call to each intersector
        return this._intersector.enter( node );
    },

    apply: function ( node ) {
        // Here we need to decide which apply method to use
        if ( node.getViewMatrix ) {
            // It's a Camera
            this.applyCamera( node );
        } else {
            if ( node.getMatrix ) {
                // It's a Transform Node
                this.applyTransform( node );
            } else {
                // It's a leaf or an intermediate node
                this.applyNode( node );
            }
        }
    },

    applyCamera: function ( camera ) {
        // We use an absolute reference frame for simplicity
        var vp = camera.getViewport();
        if ( vp !== undefined ) {
            this.pushWindowMatrixUsingViewport( vp );
        }

        var projection, view, model;
        if ( camera.getReferenceFrame() === TransformEnums.RELATIVE_RF && this.getViewMatrix() && this.getProjectionMatrix() ) {
            // relative
            projection = Matrix.mult( this.getProjectionMatrix(), camera.getProjectionMatrix(), IntersectionVisitor._reservedMatrixStack.get() );
            view = this.getViewMatrix();
            model = Matrix.mult( this.getModelMatrix(), camera.getViewMatrix(), IntersectionVisitor._reservedMatrixStack.get() );
        } else {
            // absolute
            projection = camera.getProjectionMatrix();
            view = camera.getViewMatrix();
            model = Matrix.makeIdentity( IntersectionVisitor._reservedMatrixStack.get() );
        }

        this.pushProjectionMatrix( projection );
        this.pushViewMatrix( view );
        this.pushModelMatrix( model );

        // TODO maybe we should do something like OSG for the transformation given
        // to the intersector (having a stack)
        this._intersector.setCurrentTransformation( this.getTransformation() );
        this.traverse( camera );

        this.popModelMatrix();
        this.popViewMatrix();
        this.popProjectionMatrix();
        if ( vp !== undefined ) {
            this.popWindowMatrix();
        }
        this._intersector.setCurrentTransformation( this.getTransformation() );
    },

    applyNode: function ( node ) {
        if ( !this.enter( node ) ) return;
        if ( node.primitives ) {
            this._intersector.intersect( this, node );
            // If it is a leaf (it has primitives) we can safely return
            return;
        }
        if ( node.traverse ) {
            this.traverse( node );
        }
    },

    applyTransform: function ( node ) {
        // Now only use PROJECTION coordinate frame
        if ( !this.enter( node ) ) return;
        // Accumulate Transform
        if ( node.getReferenceFrame() === TransformEnums.ABSOLUTE_RF ) {
            var matrix = IntersectionVisitor._reservedMatrixStack.get();
            this.pushViewMatrix( Matrix.makeIdentity( matrix ) );
            this.pushModelMatrix( node.getMatrix() );
        } else if ( this._modelStack.length > 0 ) {
            var m = Matrix.copy( this.getModelMatrix(), IntersectionVisitor._reservedMatrixStack.get() );
            Matrix.preMult( m, node.getMatrix() );
            this.pushModelMatrix( m );
        } else {
            this.pushModelMatrix( node.getMatrix() );
        }

        // TODO see above
        this._intersector.setCurrentTransformation( this.getTransformation() );
        this.traverse( node );

        this.popModelMatrix();
        if ( node.getReferenceFrame() === TransformEnums.ABSOLUTE_RF )
            this.popViewMatrix();
        this._intersector.setCurrentTransformation( this.getTransformation() );
    }
} );

IntersectionVisitor._reservedMatrixStack = new MatrixMemoryPool();

module.exports = IntersectionVisitor;
