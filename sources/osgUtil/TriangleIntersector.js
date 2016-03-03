'use strict';
var Vec3 = require( 'osg/Vec3' );
var TriangleIndexFunctor = require( 'osg/TriangleIndexFunctor' );
var Notify = require( 'osg/Notify' );

var TriangleIntersection = function ( normal, i1, i2, i3, r1, r2, r3 ) {
    this.normal = normal;

    this.i1 = i1;
    this.i2 = i2;
    this.i3 = i3;

    this.r1 = r1;
    this.r2 = r2;
    this.r3 = r3;
};

var TriangleIntersector = function () {

    if ( arguments && arguments.length ) {
        Notify.warn( 'using ctor as initialiser is deprecated, use set(start, end)' );
    }

    this._intersections = [];
    this._nodePath = [];
    this._dir = Vec3.create();
};

TriangleIntersector.prototype = {
    reset: function () {
        this._intersections.length = 0;
    },
    setNodePath: function ( np ) {
        this._nodePath = np;
    },
    set: function ( start, end ) {
        this._start = start;
        this._end = end;
        this._dir = Vec3.sub( end, start, this._dir );
        this._length = Vec3.length( this._dir );
        this._invLength = 1.0 / this._length;
        Vec3.mult( this._dir, this._invLength, this._dir );
    },

    apply: ( function () {

        var v1 = Vec3.create();
        var v2 = Vec3.create();
        var v3 = Vec3.create();
        var tif = new TriangleIndexFunctor();

        return function ( node ) {

            if ( !node.getAttributes().Vertex ) {
                return;
            }
            var vertices = node.getAttributes().Vertex.getElements();
            var self = this;

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

                self.intersect( v1, v2, v3, i1, i2, i3 );
            };
            tif.init( node, cb );
            tif.apply();

        };
    } )(),

    intersect: ( function () {

        var normal = Vec3.create();
        var e2 = Vec3.create();
        var e1 = Vec3.create();
        var tvec = Vec3.create();
        var pvec = Vec3.create();
        var qvec = Vec3.create();
        var epsilon = 1E-20;

        return function ( v0, v1, v2, i0, i1, i2 ) {

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

            // GC TriangleIntersection & Point
            this._intersections.push( {
                ratio: r,
                backface: det < 0.0,
                nodepath: this._nodePath.slice( 0 ), // Note: If you are computing intersections from a viewer the first node is the camera of the viewer
                TriangleIntersection: new TriangleIntersection( normal.slice( 0 ), i0, i1, i2, r0, r1, r2 ),
                point: Vec3.createAndSet( interX, interY, interZ )
            } );
            this.hit = true;
        };
    } )()
};

module.exports = TriangleIntersector;
