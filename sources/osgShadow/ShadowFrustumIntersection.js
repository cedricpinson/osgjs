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
    'osg/ComputeMatrixFromNodePath'
], function ( Notify, MACROUTILS, Object, Node, NodeVisitor, CullVisitor, Vec3, Vec4, Matrix, BoundingBox, BoundingSphere, ComputeMatrixFromNodePath ) {
    'use strict';
    /**
     * [ComputeFrustumBoundsVisitor get a scene bounds limited by a light and camera frustum]
     * @param {[enum]} traversalMode
     * @param {[Array of Vec4]} camera frustum planes
     * @param {[Array of Vec4]} light frustum planes
     */
    var ComputeFrustumBoundsVisitor = function ( traversalMode, cameraFrustum, lightFrustum ) {
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
        reset: function ( worldLightPos, frustumReceivers, frustumReceiversLength ) {
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
        getBoundingBox: function () {
            return this._bb;
        },
        getReservedMaskStack: function ( maskStack ) {
            maskStack.current++;
            if ( maskStack.current === maskStack.length ) {
                maskStack.push( 0 );
            }
            return 0;
        },
        getCameraPlaneMaskForLightNear: function ( p, fArr, len ) {
            var d, f, i = len;
            while ( i-- ) {
                f = fArr[ i ];
                d = f[ 0 ] * p[ 0 ] + f[ 1 ] * p[ 1 ] + f[ 2 ] * p[ 2 ] + f[ 3 ];
                if ( d <= 0 ) {
                    this._cameraPlaneMaskedByLightNear |= i;
                }
            }
        },
        pushMatrix: function ( matrix ) {
            this._matrixStack.push( matrix );
        },
        popMatrix: function () {
            return this._matrixStack.pop();
        },
        isSphereCulled: function ( r, p, fArr, len, maskStack, lightMask ) {
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
        apply: function ( node ) {
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
        applyTransform: function ( transform ) {
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
        transformBoundingbox: function ( matrix, bboxIn, bboxOut ) {
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
        applyBoundingBox: function ( bbox ) {
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

    return ComputeFrustumBoundsVisitor;

} );