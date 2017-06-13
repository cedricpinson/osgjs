'use strict';

var vec3 = require( 'osg/glMatrix' ).vec3;
var PrimitiveFunctor = require( 'osg/PrimitiveFunctor' );
var Plane = require( 'osg/Plane' );
var intersectionEnums = require( 'osgUtil/intersectionEnums' );

var PolytopeIntersection = function () {
    this._intersectionPoints = [];
    this._primitiveIndex = undefined;
    this._distance = 0;
    this._maxDistance = 0;
    this._nodePath = undefined;
    this._drawable = undefined;
    this._matrix = undefined;
    this._localIntersectionPoint = undefined;
    this._numIntersectionPoints = 0;
};

// Settings are needed.
var PolytopeIntersectFunctor = function ( settings ) {
    this._src = [];
    this._dest = [];
    this._settings = settings;
    this._primitiveIndex = 0;
    this._hit = false;
    this._maxNumIntersectionsPoints = 6;
    this._primitiveMask = intersectionEnums.ALL_PRIMITIVES;
};

PolytopeIntersectFunctor.prototype = {

    enter: function ( bbox ) {
        if ( this._settings._polytopeIntersector.getPolytope().containsBoundingBox( bbox ) ) {
            this._settings._polytopeIntersector.getPolytope().pushCurrentMask();
            return true;
        } else {
            return false;
        }
    },

    leave: function () {
        this._settings._polytopeIntersector.getPolytope().popCurrentMask();
    },

    addIntersection: function () {

        var uniq = function ( a ) {
            var seen = {};
            var out = [];
            var len = a.length;
            var j = 0;
            for ( var i = 0; i < len; i++ ) {
                var item = a[ i ];
                if ( seen[ item ] !== 1 ) {
                    seen[ item ] = 1;
                    out[ j++ ] = item;
                }
            }
            return out;
        };

        this._src = uniq( this._src );

        var center = vec3.create();
        var maxDistance = -Number.MAX_VALUE;
        var referencePlane = this._settings._referencePlane;
        for ( var i = 0; i < this._src.length; ++i ) {
            vec3.add( center, center, this._src[ i ] );
            var d = Plane.distanceToPlane( referencePlane, this._src[ i ] );
            if ( d > maxDistance ) maxDistance = d;
        }

        vec3.scale( center, center, 1.0 / this._src.length );

        var intersection = new PolytopeIntersection();
        intersection._primitiveIndex = this._primitiveIndex;
        intersection._distance = Plane.distanceToPlane( referencePlane, center );
        intersection._maxDistance = maxDistance;
        intersection._nodePath = this._settings._intersectionVisitor.getNodePath().slice();
        intersection._drawable = this._settings._geometry;
        intersection._matrix = this._settings._intersectionVisitor.getModelMatrix();
        intersection._localIntersectionPoint = vec3.clone( center );




        intersection._numIntersectionPoints = ( this._src.length < this._maxNumIntersectionsPoints ) ? this._src.length : this._maxNumIntersectionsPoints;

        for ( i = 0; i < intersection._numIntersectionPoints; ++i ) {
            intersection._intersectionPoints.push( vec3.clone( this._src[ i ] ) );
        }

        this._settings._polytopeIntersector.insertIntersection( intersection );
        this._hit = true;

    },

    contains: function () {
        var polytope = this._settings._polytopeIntersector.getPolytope();
        var planeList = polytope.getPlanes();

        var resultMask = polytope.getCurrentMask();
        if ( !resultMask ) return true;

        var selectorMask = 0x1;

        for ( var i = 0; i < planeList.length; ++i ) {
            if ( resultMask & selectorMask ) {
                this._dest = [];
                var plane = planeList[ i ];
                var vPrevious = this._src[ 1 ];
                var dPrevious = Plane.distanceToPlane( plane, vPrevious );
                for ( var j = 0; j < this._src.length; ++j ) {
                    var vCurrent = this._src[ j ];
                    var dCurrent = Plane.distanceToPlane( plane, vCurrent );
                    if ( dPrevious >= 0.0 ) {
                        this._dest.push( vec3.clone( vPrevious ) );
                    }
                    if ( dPrevious * dCurrent < 0.0 ) {
                        var distance = dPrevious - dCurrent;
                        var rCurrent = dPrevious / distance;
                        //(*v_previous)*(1.0-r_current) + (*v_current)*r_current;
                        var vnew = vec3.add( vec3.create(), vec3.scale( vec3.create(), vPrevious, 1.0 - rCurrent ), vec3.scale( vec3.create(), vCurrent, rCurrent ) );
                        this._dest.push( vnew );
                    }
                    dPrevious = dCurrent;
                    vPrevious = vCurrent;
                }
                if ( dPrevious >= 0.0 ) {
                    this._dest.push( vec3.clone( vPrevious ) );
                }
                if ( this._dest.length <= 1 ) {
                    return false;
                }
                // swap values
                var swap = this._src.slice();
                this._src = this._dest.slice();
                this._dest = swap;
            }
            selectorMask <<= 1;
        }

        return true;
    },

    containsPoint: function ( v0 ) {
        if ( this._settings._polytopeIntersector.getPolytope().containsVertex( v0 ) ) {
            // initialize the set of vertices to test.
            this._src = [];
            this._src[ 0 ] = v0;
            return true;
        }
        return false;
    },
    containsLine: function ( v0, v1 ) {
        // initialize the set of vertices to test.
        this._src = [];
        this._src[ 0 ] = v0;
        this._src[ 1 ] = v1;

        return this.contains();
    },
    containsTriangle: function ( v0, v1, v2 ) {
        // initialize the set of vertices to test.
        this._src = [];
        this._src[ 0 ] = v0;
        this._src[ 1 ] = v1;
        this._src[ 2 ] = v2;
        return this.contains();
    },

    operatorPoint: function ( v ) {
        if ( this._settings._limitOneIntersection && this._hit ) return;
        if ( ( this._settings._primitiveMask & intersectionEnums.POINT_PRIMITIVES ) === 0 ) return;
        this._primitiveIndex++;
        var polytope = this._settings._polytopeIntersector.getPolytope();
        var planeList = polytope.getPlanes();
        var d;
        var resultMask = polytope.getCurrentMask();
        if ( resultMask ) {
            var selectorMask = 0x1;
            for ( var i = 0, j = planeList.length; i < j; ++i ) {
                if ( resultMask & selectorMask ) {
                    d = Plane.distanceToPlane( planeList[ i ], v );
                    if ( d < 0.0 ) {
                        // point is outside the polytope
                        return;
                    }
                }
            }
        }
        this._src[ 0 ] = v;
        this.addIntersection();
    },


    operatorLine: function ( v0, v1 ) {
        if ( this._settings._limitOneIntersection && this._hit ) return;
        if ( ( this._settings._primitiveMask & intersectionEnums.LINE_PRIMITIVES ) === 0 ) return;
        this._primitiveIndex++;

        this._src = [];
        this._src[ 0 ] = v0;
        this._src[ 1 ] = v1;
        this._src[ 2 ] = v0;
        if ( this.contains() ) {
            this.addIntersection();
        }
    },

    operatorTriangle: function ( v0, v1, v2 ) {
        if ( this._settings._limitOneIntersection && this._hit ) return;
        if ( ( this._settings._primitiveMask & intersectionEnums.TRIANGLE_PRIMITIVES ) === 0 ) return;
        this._primitiveIndex++;

        this._src = [];
        this._src[ 0 ] = v0;
        this._src[ 1 ] = v1;
        this._src[ 2 ] = v2;
        this._src[ 3 ] = v0;
        if ( this.contains() ) {
            this.addIntersection();
        }
    },

    intersectPoint: ( function () {
        var v = vec3.create();
        return function ( vertices, primitiveIndex, p0 ) {
            if ( this._settings._limitOneIntersection && this._hit ) return;
            if ( ( this._settings._primitiveMask & intersectionEnums.POINT_PRIMITIVES ) === 0 ) return;
            vec3.set( v, vertices[ 3 * p0 ], vertices[ 3 * p0 + 1 ], vertices[ 3 * p0 + 2 ] );
            if ( this.containsPoint( v ) ) {
                this._primitiveIndex = primitiveIndex;
                this.addIntersection();
            }
        };
    } )(),

    intersectLine: ( function () {
        var v0 = vec3.create();
        var v1 = vec3.create();
        return function ( vertices, primitiveIndex, p0, p1 ) {
            if ( this._settings._limitOneIntersection && this._hit ) return;
            if ( ( this._settings._primitiveMask & intersectionEnums.LINE_PRIMITIVES ) === 0 ) return;
            vec3.set( v0, vertices[ 3 * p0 ], vertices[ 3 * p0 + 1 ], vertices[ 3 * p0 + 2 ] );
            vec3.set( v1, vertices[ 3 * p1 ], vertices[ 3 * p1 + 1 ], vertices[ 3 * p1 + 2 ] );
            if ( this.containsLine( v0, v1 ) ) {
                this._primitiveIndex = primitiveIndex;
                this.addIntersection();
            }
        };
    } )(),

    intersectTriangle: ( function () {
        var v0 = vec3.create();
        var v1 = vec3.create();
        var v2 = vec3.create();
        return function ( vertices, primitiveIndex, p0, p1, p2 ) {
            if ( this._settings._limitOneIntersection && this._hit ) return;
            if ( ( this._settings._primitiveMask & intersectionEnums.TRIANGLE_PRIMITIVES ) === 0 ) return;
            vec3.set( v0, vertices[ 3 * p0 ], vertices[ 3 * p0 + 1 ], vertices[ 3 * p0 + 2 ] );
            vec3.set( v1, vertices[ 3 * p1 ], vertices[ 3 * p1 + 1 ], vertices[ 3 * p1 + 2 ] );
            vec3.set( v2, vertices[ 3 * p2 ], vertices[ 3 * p2 + 1 ], vertices[ 3 * p2 + 2 ] );
            if ( this.containsTriangle( v0, v1, v2 ) ) {
                this._primitiveIndex = primitiveIndex;
                this.addIntersection();
            }
        };
    } )(),

    apply: function ( node ) {
        if ( !node.getAttributes().Vertex ) {
            return;
        }
        var vertices = node.getAttributes().Vertex.getElements();
        var self = this;
        // The callback must be defined as a closure
        /* jshint asi: true */
        var cb = function () {
            return {
                operatorPoint: function ( v ) {
                    self.operatorPoint( v );
                },
                operatorLine: function ( v1, v2 ) {
                    self.operatorLine( v1, v2 );
                },
                operatorTriangle: function ( v1, v2, v3 ) {
                    self.operatorTriangle( v1, v2, v3 );
                }
            }
        };
        var pf = new PrimitiveFunctor( node, cb, vertices );
        pf.apply();
    },


};


module.exports = PolytopeIntersectFunctor;
