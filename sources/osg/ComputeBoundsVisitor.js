define( [
    'osg/BoundingBox',
    'osg/Geometry',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/NodeVisitor',
    'osg/Utils',
    'osg/Vec3'

], function ( BoundingBox, Geometry, Matrix, MatrixTransform, NodeVisitor, MACROUTILS, Vec3 ) {

    'use strict';

    var ComputeBoundsVisitor = function ( traversalMode ) {
        NodeVisitor.call( this, traversalMode );

        this._matrixStack = [];
        this._bb = new BoundingBox();
    };

    ComputeBoundsVisitor.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( NodeVisitor.prototype, {

        reset: function () {
            this._matrixStack.length = 0;
            this._bb.init();
        },

        getBoundingBox: function () {
            return this._bb;
        },

        // not implemented
        //void getPolytope(osg::Polytope& polytope, float margin=0.1) const;
        //void getBase(osg::Polytope& polytope, float margin=0.1) const;

        //applyDrawable: function ( drawable ) {},

        applyTransform: function ( transform ) {

            var matrix = Matrix.create();
            var stackLength = this._matrixStack.length;

            if ( stackLength )
                Matrix.copy( this._matrixStack[ stackLength - 1], matrix);

            transform.computeLocalToWorldMatrix( matrix, this );

            this.pushMatrix(matrix);

            this.traverse(transform);

            this.popMatrix();
        },

        apply: function( node ) {

            var typeID = node.getTypeID();

            if ( typeID === MatrixTransform.getTypeID() ) {
                this.applyTransform( node );
                return;

            } else if ( typeID === Geometry.getTypeID() ) {
                this.applyBoundingBox( node.getBoundingBox() );
                return;
            }

            this.traverse( node );

        },

        pushMatrix: function ( matrix ) {
            this._matrixStack.push( matrix );
        },

        popMatrix: function () {
            this._matrixStack.pop();
        },


        applyBoundingBox: (function() {

            var tmpVec = Vec3.create();
            var tmpCorner = Vec3.create();

            return function ( bbox ) {

                var stackLength = this._matrixStack.length;

                if ( !stackLength )
                    this._bb.expandByBoundingBox( bbox );
                else if ( bbox.valid() ) {
                    var matrix = this._matrixStack[ stackLength - 1];

                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(0, tmpCorner), tmpVec));
                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(1, tmpCorner), tmpVec));
                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(2, tmpCorner), tmpVec));
                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(3, tmpCorner), tmpVec));
                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(4, tmpCorner), tmpVec));
                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(5, tmpCorner), tmpVec));
                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(6, tmpCorner), tmpVec));
                    this._bb.expandByVec3( Matrix.transformVec3( matrix, bbox.corner(7, tmpCorner), tmpVec));

                }

            };
        } )(),

        getMatrixStack: function () {
            return this._matrixStack;
        }

    } ), 'osg', 'ComputeBoundsVisitor' );

    return ComputeBoundsVisitor;
} );
