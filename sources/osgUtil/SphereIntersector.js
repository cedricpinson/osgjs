'use strict';
var Vec3 = require( 'osg/Vec3' );
var Matrix = require( 'osg/Matrix' );
var TriangleSphereIntersector = require( 'osgUtil/TriangleSphereIntersector' );


var SphereIntersector = function () {
    this._center = Vec3.create();
    this._iCenter = Vec3.create();
    this._radius = 1.0;
    this._iRadius = 1.0;
    this._intersections = [];
};

SphereIntersector.prototype = {
    set: function ( center, radius ) {
        // we copy iCenter and iRadius in case setCurrentTransformation is never called
        Vec3.copy( center, this._center );
        Vec3.copy( center, this._iCenter );
        this._radius = this._iRadius = radius;
        this.reset();
    },
    setCenter: function ( center ) {
        Vec3.copy( center, this._center );
        Vec3.copy( center, this._iCenter );
    },
    setRadius: function ( radius ) {
        this._radius = this._iRadius = radius;
    },
    reset: function () {
        // Clear the intersections vector
        this._intersections.length = 0;
    },
    enter: function ( node ) {
        // Not working if culling disabled ??
        return !node.isCullingActive() || this.intersects( node.getBound() );
    },
    // Intersection Sphere/Sphere 
    intersects: function ( bsphere ) {
        if ( !bsphere.valid() ) return false;
        var r = this._iRadius + bsphere.radius();
        return Vec3.distance2( this._iCenter, bsphere.center() ) <= r * r;
    },

    intersect: ( function () {

        var ti = new TriangleSphereIntersector();

        return function ( iv, node ) {

            var kdtree = node.getShape();
            if ( kdtree )
                return kdtree.intersectSphere( this._iCenter, this._iRadius, this._intersections, iv.nodePath );

            ti.reset();
            ti.setNodePath( iv.nodePath );
            ti.set( this._iCenter, this._iRadius );

            // handle rig transformed vertices
            if ( node.computeTransformedVertices ) {
                var vList = node.getVertexAttributeList();
                var originVerts = vList.Vertex.getElements();
                vList.Vertex.setElements( node.computeTransformedVertices() );

                ti.apply( node );

                vList.Vertex.setElements( originVerts );
            } else {
                ti.apply( node );
            }

            var l = ti._intersections.length;
            for ( var i = 0; i < l; i++ ) {
                this._intersections.push( ti._intersections[ i ] );
            }

            return l > 0;
        };
    } )(),

    getIntersections: function () {
        return this._intersections;
    },

    setCurrentTransformation: ( function () {
        var tmp = Vec3.create();

        return function ( matrix ) {
            Matrix.inverse( matrix, matrix );
            Matrix.transformVec3( matrix, this._center, this._iCenter );
            this._iRadius = this._radius * Matrix.getScale( matrix, tmp )[ 0 ];
        };
    } )()
};

module.exports = SphereIntersector;
