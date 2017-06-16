'use strict';
var vec3 = require( 'osg/glMatrix' ).vec3;
var mat4 = require( 'osg/glMatrix' ).mat4;
var SphereIntersectFunctor = require( 'osgUtil/SphereIntersectFunctor' );
var intersectionEnums = require( 'osgUtil/intersectionEnums' );

var Settings = function () {
    this._sphereIntersector = undefined;
    this._intersectionVisitor = undefined;
    this._geometry = undefined;
    this._vertices = [];
    this._limitOneIntersection = false;
};

var SphereIntersector = function () {
    this._center = vec3.create();
    this._iCenter = vec3.create();
    this._radius = 1.0;
    this._iRadius = 1.0;
    this._intersections = [];
};

SphereIntersector.prototype = {
    set: function ( center, radius ) {
        // we copy iCenter and iRadius in case setCurrentTransformation is never called
        vec3.copy( this._center, center );
        vec3.copy( this._iCenter, center );
        this._radius = this._iRadius = radius;
        this.reset();
    },
    setCenter: function ( center ) {
        vec3.copy( this._center, center );
        vec3.copy( this._iCenter, center );
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

    setIntersectionLimit: function ( limit ) {
        this._intersectionLimit = limit;
    },

    getIntersectionLimit: function () {
        return this._intersectionLimit;
    },
    // Intersection Sphere/Sphere
    intersects: function ( bsphere ) {
        if ( !bsphere.valid() ) return false;
        var r = this._iRadius + bsphere.radius();
        return vec3.sqrDist( bsphere.center(), this._iCenter ) <= r * r;
    },

    intersect: ( function () {

        var settings = new Settings();
        var sif = new SphereIntersectFunctor();
        return function ( iv, node ) {

            settings._sphereIntersector = this;
            settings._intersectionVisitor = iv;
            // It's a leaf
            if ( node.getPrimitives ) {
                settings._geometry = node;
                settings._vertices = node.getVertexAttributeList();
            }
            settings._limitOneIntersection = ( this._intersectionLimit === intersectionEnums.LIMIT_ONE_PER_DRAWABLE || this._intersectionLimit === intersectionEnums.LIMIT_ONE );
            sif.set( this._iCenter, this._iRadius, settings );

            var kdtree = node.getShape();
            if ( kdtree ) {
                return kdtree.intersect( sif, kdtree.getNodes()[ 0 ] );
            }
            if ( node.computeTransformedVertices ) {
                var vList = node.getVertexAttributeList();
                var originVerts = vList.Vertex.getElements();

                // temporarily hook vertex buffer for the tri intersections
                // don't call setElements as it dirties some stuffs because of gl buffer
                vList.Vertex._elements = node.computeTransformedVertices();
                sif.apply( node );
                vList.Vertex._elements = originVerts;
            } else {
                sif.apply( node );
            }
            return this._intersections > 0;
        };
    } )(),

    getIntersections: function () {
        return this._intersections;
    },

    setCurrentTransformation: ( function () {
        var tmp = vec3.create();

        return function ( matrix ) {
            mat4.invert( matrix, matrix );
            vec3.transformMat4( this._iCenter, this._center, matrix );
            this._iRadius = this._radius * mat4.getScale( tmp, matrix )[ 0 ];
        };
    } )()
};

module.exports = SphereIntersector;
