define( [
    'osg/Vec3',
    'osg/TriangleIndexFunctor'
], function ( Vec3, TriangleIndexFunctor ) {

    var TriangleIntersection = function ( index, normal, r1, v1, r2, v2, r3, v3 ) {
        this.index = index;
        this.normal = normal;
        this.r1 = r1;
        this.v1 = v1;
        this.r2 = r2;
        this.v2 = v2;
        this.r3 = r3;
        this.v3 = v3;
    };

    var TriangleIntersector = function () {
        this._intersections = [];
        this._nodePath = [];
        this._index = 0;
    };

    TriangleIntersector.prototype = {
        setNodePath: function ( np ) {
            this._nodePath = np;
        },
        set: function ( start, end ) {
            this._start = start;
            this._end = end;
            this._dir = Vec3.sub( end, start, [ 0.0, 0.0, 0.0 ] );
            this._length = Vec3.length( this._dir );
            this._invLength = 1.0 / this._length;
            Vec3.mult( this._dir, this._invLength, this._dir );
        },

        apply: function ( node ) {
            if ( !node.getAttributes().Vertex ) {
                return;
            }
            var vertices = node.getAttributes().Vertex.getElements();
            var self = this;
            var v1 = [ 0.0, 0.0, 0.0 ];
            var v2 = [ 0.0, 0.0, 0.0 ];
            var v3 = [ 0.0, 0.0, 0.0 ];
            var cb = function ( i1, i2, i3 ) {
                if ( i1 === i2 || i1 === i3 || i2 === i3 )
                    return;
                var j = i1 * 3;
                v1[ 0 ] = vertices[ j ];
                v1[ 1 ] = vertices[ j + 1 ];
                v1[ 2 ] = vertices[ j + 2 ];
                j = i2 * 3;
                v2[ 0 ] = vertices[ j ];
                v2[ 1 ] = vertices[ j + 1 ];
                v2[ 2 ] = vertices[ j + 2 ];
                j = i3 * 3;
                v3[ 0 ] = vertices[ j ];
                v3[ 1 ] = vertices[ j + 1 ];
                v3[ 2 ] = vertices[ j + 2 ];
                self.intersect( v1, v2, v3 );
            };
            var tif = new TriangleIndexFunctor( node, cb );
            tif.apply();
        },

        intersect: ( function () {
            var normal = [ 0.0, 0.0, 0.0 ];
            var e2 = [ 0.0, 0.0, 0.0 ];
            var e1 = [ 0.0, 0.0, 0.0 ];
            var tvec = [ 0.0, 0.0, 0.0 ];
            var pvec = [ 0.0, 0.0, 0.0 ];
            var qvec = [ 0.0, 0.0, 0.0 ];
            var epsilon = 1E-20;
            return function ( v0, v1, v2 ) {
                this._index++;
                var d = this._dir;

                Vec3.sub( v2, v0, e2 );
                Vec3.sub( v1, v0, e1 );
                Vec3.cross( d, e2, pvec );

                var det = Vec3.dot( pvec, e1 );
                if ( det > -epsilon && det < epsilon )
                    return;
                var invDet = 1.0 / det;

                Vec3.sub( this._start, v0, tvec );

                var u = Vec3.dot( pvec, tvec ) * invDet;
                if ( u < 0.0 || u > 1.0 )
                    return;

                Vec3.cross( tvec, e1, qvec );

                var v = Vec3.dot( qvec, d ) * invDet;
                if ( v < 0.0 || ( u + v ) > 1.0 )
                    return;

                var t = Vec3.dot( qvec, e2 ) * invDet;

                if ( t < epsilon || t > this._length ) //no intersection
                    return;

                var r0 = 1.0 - u - v;
                var r1 = u;
                var r2 = v;
                var r = t * this._invLength;

                var interX = v0[ 0 ] * r0 + v1[ 0 ] * r1 + v2[ 0 ] * r2;
                var interY = v0[ 1 ] * r0 + v1[ 1 ] * r1 + v2[ 1 ] * r2;
                var interZ = v0[ 2 ] * r0 + v1[ 2 ] * r1 + v2[ 2 ] * r2;

                Vec3.cross( e1, e2, normal );
                Vec3.normalize( normal, normal );

                this._intersections.push( {
                    'ratio': r,
                    'nodepath': this._nodePath.slice( 0 ), // Note: If you are computing intersections from a viewer the first node is the camera of the viewer
                    'TriangleIntersection': new TriangleIntersection( this._index - 1, normal.slice( 0 ), r0, v0.slice( 0 ), r1, v1.slice( 0 ), r2, v2.slice( 0 ) ),
                    'point': [ interX, interY, interZ ]
                } );
                this.hit = true;
            };
        } )()
    };

    return TriangleIntersector;
} );
