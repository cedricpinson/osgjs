define( [
    'osg/BoundingBox',
    'osg/Geometry',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/NodeVisitor',
    'osg/Utils'

], function ( BoundingBox, Geometry, Matrix, MatrixTransform, NodeVisitor, MACROUTILS ) {

    'use strict';

    var ComputeBoundsVisitor = function ( traversalMode ) {
        NodeVisitor.call( this, traversalMode );

        // keep a matrix in memory to avoid to create matrix
        this._reserveMatrixStack = [
            Matrix.create()
        ];
        this._reserveMatrixStack.current = 0;


        this._matrixStack = [];
        this._bb = new BoundingBox();
    };

    ComputeBoundsVisitor.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( NodeVisitor.prototype, {

        reset: function () {
            this._reserveMatrixStack.current = 0;
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

            var matrix = this._getReservedMatrix();
            var stackLength = this._matrixStack.length;

            if ( stackLength )
                Matrix.copy( this._matrixStack[ stackLength - 1 ], matrix );

            transform.computeLocalToWorldMatrix( matrix, this );

            this.pushMatrix( matrix );

            this.traverse( transform );

            this.popMatrix();
        },

        apply: function ( node ) {

            if ( node instanceof MatrixTransform ) {
                this.applyTransform( node );
                return;

            } else if ( node instanceof Geometry ) {
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


        applyBoundingBox: ( function () {
            var bbOut = new BoundingBox();

            return function ( bbox ) {

                var stackLength = this._matrixStack.length;

                if ( !stackLength )
                    this._bb.expandByBoundingBox( bbox );
                else if ( bbox.valid() ) {
                    var matrix = this._matrixStack[ stackLength - 1 ];
                    Matrix.transformBoundingBox( matrix, bbox, bbOut );
                    this._bb.expandByBoundingBox( bbOut );
                }

            };
        } )(),

        getMatrixStack: function () {
            return this._matrixStack;
        },

        _getReservedMatrix: function () {

            var m = this._reserveMatrixStack[ this._reserveMatrixStack.current++ ];

            if ( this._reserveMatrixStack.current === this._reserveMatrixStack.length ) {

                this._reserveMatrixStack.push( Matrix.create() );

            } else {

                Matrix.makeIdentity( m );

            }

            return m;
        }

    } ), 'osg', 'ComputeBoundsVisitor' );

    return ComputeBoundsVisitor;
} );
