define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Vec3'
], function ( Notify, MACROUTILS, Vec3 ) {

    'use strict';

    var BoundingBox = function () {
        this._min = Vec3.create();
        this._max = Vec3.create();
        this.init();
    };
    BoundingBox.prototype = MACROUTILS.objectLibraryClass( {

        init: function () {
            Vec3.copy( Vec3.infinity, this._min );
            Vec3.copy( Vec3.negativeInfinity, this._max );
        },

        copy: function ( bbox ) {
            var min = this._min;
            var bmin = bbox._min;
            min[ 0 ] = bmin[ 0 ];
            min[ 1 ] = bmin[ 1 ];
            min[ 2 ] = bmin[ 2 ];

            var max = this._max;
            var bmax = bbox._max;
            max[ 0 ] = bmax[ 0 ];
            max[ 1 ] = bmax[ 1 ];
            max[ 2 ] = bmax[ 2 ];
        },

        valid: function () {
            return ( this._max[ 0 ] >= this._min[ 0 ] && this._max[ 1 ] >= this._min[ 1 ] && this._max[ 2 ] >= this._min[ 2 ] );
        },

        expandByBoundingSphere: function ( bs ) {
            if ( !bs.valid() ) {
                return;
            }
            var max = this._max;
            var min = this._min;
            min[ 0 ] = Math.min( min[ 0 ], bs._center[ 0 ] - bs._radius );
            min[ 1 ] = Math.min( min[ 1 ], bs._center[ 1 ] - bs._radius );
            min[ 2 ] = Math.min( min[ 2 ], bs._center[ 2 ] - bs._radius );

            max[ 0 ] = Math.max( max[ 0 ], bs._center[ 0 ] + bs._radius );
            max[ 1 ] = Math.max( max[ 1 ], bs._center[ 1 ] + bs._radius );
            max[ 2 ] = Math.max( max[ 2 ], bs._center[ 2 ] + bs._radius );
        },

        expandBySphere: function ( bs ) {
            Notify.log( 'BoundingBox.expandBySphere is deprecated, use instead BoundBox.expandByBoundingSphere' );
            return this.expandByBoundingSphere( bs );
        },

        expandByVec3: function ( v ) {
            var min = this._min;
            var max = this._max;
            min[ 0 ] = Math.min( min[ 0 ], v[ 0 ] );
            min[ 1 ] = Math.min( min[ 1 ], v[ 1 ] );
            min[ 2 ] = Math.min( min[ 2 ], v[ 2 ] );

            max[ 0 ] = Math.max( max[ 0 ], v[ 0 ] );
            max[ 1 ] = Math.max( max[ 1 ], v[ 1 ] );
            max[ 2 ] = Math.max( max[ 2 ], v[ 2 ] );
        },

        expandByBoundingBox: function ( bb ) {
            if ( !bb.valid() )
                return;

            var min = this._min;
            var max = this._max;
            var bbmin = bb._min;
            var bbmax = bb._max;

            if ( bbmin[ 0 ] < min[ 0 ] ) min[ 0 ] = bbmin[ 0 ];
            if ( bbmax[ 0 ] > max[ 0 ] ) max[ 0 ] = bbmax[ 0 ];

            if ( bbmin[ 1 ] < min[ 1 ] ) min[ 1 ] = bbmin[ 1 ];
            if ( bbmax[ 1 ] > max[ 1 ] ) max[ 1 ] = bbmax[ 1 ];

            if ( bbmin[ 2 ] < min[ 2 ] ) min[ 2 ] = bbmin[ 2 ];
            if ( bbmax[ 2 ] > max[ 2 ] ) max[ 2 ] = bbmax[ 2 ];
        },

        center: function ( result ) {
            var min = this._min;
            var max = this._max;
            if ( result === undefined ) {
                // TODO: deprecated warning?
                Notify.warn( 'deprecated use center( result ) instead !' );
                result = Vec3.create();
            }
            Vec3.set( ( min[ 0 ] + max[ 0 ] ) * 0.5, ( min[ 1 ] + max[ 1 ] ) * 0.5, ( min[ 2 ] + max[ 2 ] ) * 0.5, result );
            return result;
        },

        radius: function () {
            return Math.sqrt( this.radius2() );
        },

        radius2: ( function () {
            var cache = [ 0.0, 0.0, 0.0 ];
            return function () {
                var min = this._min;
                var max = this._max;
                cache[ 0 ] = max[ 0 ] - min[ 0 ];
                cache[ 1 ] = max[ 1 ] - min[ 1 ];
                cache[ 2 ] = max[ 2 ] - min[ 2 ];
                return 0.25 * ( cache[ 0 ] * cache[ 0 ] + cache[ 1 ] * cache[ 1 ] + cache[ 2 ] * cache[ 2 ] );
            };
        } )(),

        getMin: function () {
            return this._min;
        },

        getMax: function () {
            return this._max;
        },

        setMin: function ( min ) {
            Vec3.copy( min, this._min );
            return this;
        },

        setMax: function ( max ) {
            Vec3.copy( max, this._max );
            return this;
        },

        xMax: function () {
            return this._max[ 0 ];
        },

        yMax: function () {
            return this._max[ 1 ];
        },

        zMax: function () {
            return this._max[ 2 ];
        },

        xMin: function () {
            return this._min[ 0 ];
        },

        yMin: function () {
            return this._min[ 1 ];
        },

        zMin: function () {
            return this._min[ 2 ];
        },

        corner: function ( pos, resultVec ) {
            /*jshint bitwise: false */
            var ret = resultVec;
            if ( ret === undefined )
                ret = [ 0.0, 0.0, 0.0 ];

            if ( pos & 1 ) {
                ret[ 0 ] = this._max[ 0 ];
            } else {
                ret[ 0 ] = this._min[ 0 ];
            }
            if ( pos & 2 ) {
                ret[ 1 ] = this._max[ 1 ];
            } else {
                ret[ 1 ] = this._min[ 1 ];
            }
            if ( pos & 4 ) {
                ret[ 2 ] = this._max[ 2 ];
            } else {
                ret[ 2 ] = this._min[ 2 ];
            }
            return ret;
            /*jshint bitwise: true */
        }
    }, 'osg', 'BoundingBox' );

    return BoundingBox;
} );
