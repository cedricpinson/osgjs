/**
 * @author Jordi Torres
 */

define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Matrix'
], function ( MACROUTILS, NodeVisitor, Matrix ) {

    var IntersectionVisitor = function () {
        NodeVisitor.call( this );
        // We could need to use a stack of intersectors in case we want
        // to use several intersectors. Right now we use only one. 
        this._intersector = undefined;
        this._projectionStack = [];
        this._modelStack = [];
        this._viewStack = [];
        this._windowStack = [];
    };

    IntersectionVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
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
            this._windowStack.push( viewport.computeWindowMatrix() );
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
            var mat = Matrix.create();
            return function () {
                Matrix.copy( this.getWindowMatrix(), mat );
                Matrix.preMult( mat, this.getProjectionMatrix() );
                Matrix.preMult( mat, this.getViewMatrix() );
                Matrix.preMult( mat, this.getModelMatrix() );

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
            this.pushProjectionMatrix( camera.getProjectionMatrix() );
            this.pushViewMatrix( camera.getViewMatrix() );
            this.pushModelMatrix( Matrix.create() );
            // In OSG a push_clone is done, 
            // here we update the current transform for simplicity
            this._intersector.setCurrentTransformation( this.getTransformation() );
            this.traverse( camera );
            this.popModelMatrix();
            this.popViewMatrix();
            this.popProjectionMatrix();
            if ( vp !== undefined ) {
                this.popWindowMatrix();
            }
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
            if ( this._modelStack.length > 0 ) {
                var m = Matrix.copy( this.getModelMatrix(), Matrix.create() );
                Matrix.preMult( m, node.getMatrix() );
                this.pushModelMatrix( m );
            } else {
                this.pushModelMatrix( node.getMatrix() );
            }
            // In OSG a push_clone is done, 
            // here we update the current transform for simplicity
            this._intersector.setCurrentTransformation( this.getTransformation() );
            this.traverse( node );
            this.popModelMatrix();
        },
    } );

    return IntersectionVisitor;
} );
