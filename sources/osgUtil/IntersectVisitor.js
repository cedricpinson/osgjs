define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Matrix',
    'osg/Vec3',
    'osgUtil/TriangleIntersect'
], function( MACROUTILS, NodeVisitor, Matrix, Vec3, TriangleIntersect ) {

    var IntersectVisitor = function() {
        NodeVisitor.call( this );
        this.matrix = [];
        this.hits = [];
        this.nodePath = [];
    };
    IntersectVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        addLineSegment: function( start, end ) {
            this.start = start;
            this.end = end;
        },
        intersectSegmentWithSphere: ( function() {
            var sm = [ 0.0, 0.0, 0.0 ];
            var se = [ 0.0, 0.0, 0.0 ];
            return function( start, end, bsphere ) {
                // test for _start inside the bounding sphere
                Vec3.sub( start, bsphere.center(), sm );
                var c = Vec3.length2( sm ) - bsphere.radius2();
                if ( c < 0.0 ) {
                    return true;
                }

                // solve quadratic equation
                Vec3.sub( end, start, se );
                var a = Vec3.length2( se );
                var b = Vec3.dot( sm, se ) * 2.0;
                var d = b * b - 4.0 * a * c;
                // no intersections if d<0
                if ( d < 0.0 ) {
                    return false;
                }

                // compute two solutions of quadratic equation
                d = Math.sqrt( d );
                var div = 1.0 / ( 2.0 * a );
                var r1 = ( -b - d ) * div;
                var r2 = ( -b + d ) * div;

                // return false if both intersections are before the ray start
                if ( r1 <= 0.0 && r2 <= 0.0 ) {
                    return false;
                }

                if ( r1 >= 1.0 && r2 >= 1.0 ) {
                    return false;
                }
                return true;
            };
        } )(),
        pushModelMatrix: function( matrix ) {
            if ( this.matrix.length > 0 ) {
                var m = Matrix.copy( this.matrix[ this.matrix.length - 1 ] );
                Matrix.preMult( m, matrix );
                this.matrix.push( m );
            } else {
                this.matrix.push( matrix );
            }
        },
        getModelMatrix: function() {
            if ( this.matrix.length === 0 ) {
                return Matrix.makeIdentity( [] );
            }
            return this.matrix[ this.matrix.length - 1 ];
        },
        popModelMatrix: function() {
            return this.matrix.pop();
        },
        getWindowMatrix: function() {
            return this.windowMatrix;
        },
        getProjectionMatrix: function() {
            return this.projectionMatrix;
        },
        getViewMatrix: function() {
            return this.viewMatrix;
        },
        intersectSegmentWithShape: function( start, end, shape ) {
            return shape.intersect( start, end, this.hits, this.nodePath );
        },
        intersectSegmentWithGeometry: function( start, end, geometry ) {
            var ti = new TriangleIntersect();
            ti.setNodePath( this.nodePath );
            ti.set( start, end );
            ti.apply( geometry );
            var l = ti.hits.length;
            if ( l > 0 ) {
                for ( var i = 0; i < l; i++ ) {
                    this.hits.push( ti.hits[ i ] );
                }
                return true;
            }
            return false;
        },
        pushCamera: function( camera ) {
            // we should support hierarchy of camera
            // but right now we want just simple picking on main
            // camera
            this.projectionMatrix = camera.getProjectionMatrix();
            this.viewMatrix = camera.getViewMatrix();

            var vp = camera.getViewport();
            if ( vp !== undefined ) {
                this.windowMatrix = vp.computeWindowMatrix();
            }
        },
        applyCamera: function( camera ) {
            // we should support hierarchy of camera
            // but right now we want just simple picking on main
            // camera
            this.pushCamera( camera );
            this.traverse( camera );
        },

        applyNode: function( node, ns, ne ) {
            if ( node.getMatrix ) {
                this.pushModelMatrix( node.getMatrix() );
            }

            if ( node.primitives ) {
                var kdtree = node.getShape();
                if ( kdtree ) {
                    this.intersectSegmentWithShape( ns, ne, kdtree );
                } else
                    this.intersectSegmentWithGeometry( ns, ne, node );
            }

            if ( node.traverse ) {
                this.traverse( node );
            }

            if ( node.getMatrix ) {
                this.popModelMatrix();
            }
        },

        transformRay: function( tStart, tEnd ) {
            var matrix = [];
            Matrix.copy( this.getWindowMatrix(), matrix );
            Matrix.preMult( matrix, this.getProjectionMatrix() );
            Matrix.preMult( matrix, this.getViewMatrix() );
            Matrix.preMult( matrix, this.getModelMatrix() );

            var inv = [];
            var valid = Matrix.inverse( matrix, inv );
            // if matrix is invalid do nothing on this node
            if ( !valid ) {
                return false;
            }

            Matrix.transformVec3( inv, this.start, tStart );
            Matrix.transformVec3( inv, this.end, tEnd );

            return true;
        },

        apply: ( function() {
            var ns = [ 0.0, 0.0, 0.0 ];
            var ne = [ 0.0, 0.0, 0.0 ];
            return function( node ) {
                if ( this.transformRay( ns, ne ) === false ) {
                    return;
                }

                if ( this.enterNode( node, ns, ne ) === false ) {
                    return;
                }

                if ( node.getViewMatrix ) { // Camera/View
                    this.applyCamera( node );
                } else {
                    this.applyNode( node, ns, ne );
                }
            };
        } )(),

        enterNode: function( node, ns, ne ) {
            return this.intersectSegmentWithSphere( ns, ne, node.getBound() );
        }
    } );

    return IntersectVisitor;
} );
