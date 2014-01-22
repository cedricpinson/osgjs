define( [
    'osg/Utils'
], function ( MACROUTILS ) {

    var BoundingBox = function () {
        this.init();
    };
    BoundingBox.prototype = MACROUTILS.objectLibraryClass( {
        _cacheRadius2: [ 0.0, 0.0, 0.0 ],

        init: function () {
            this._min = [ Infinity, Infinity, Infinity ];
            this._max = [ -Infinity, -Infinity, -Infinity ];
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

        expandBySphere: function ( sh ) {
            if ( !sh.valid() ) {
                return;
            }
            var max = this._max;
            var min = this._min;
            min[ 0 ] = Math.min( min[ 0 ], sh._center[ 0 ] - sh._radius );
            min[ 1 ] = Math.min( min[ 1 ], sh._center[ 1 ] - sh._radius );
            min[ 2 ] = Math.min( min[ 2 ], sh._center[ 2 ] - sh._radius );

            max[ 0 ] = Math.max( max[ 0 ], sh._center[ 0 ] + sh._radius );
            max[ 1 ] = Math.max( max[ 1 ], sh._center[ 1 ] + sh._radius );
            max[ 2 ] = Math.max( max[ 2 ], sh._center[ 2 ] + sh._radius );
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

        center: function () {
            var min = this._min;
            var max = this._max;
            return [ ( min[ 0 ] + max[ 0 ] ) * 0.5, ( min[ 1 ] + max[ 1 ] ) * 0.5, ( min[ 2 ] + max[ 2 ] ) * 0.5 ];
        },

        radius: function () {
            return Math.sqrt( this.radius2() );
        },

        radius2: function () {
            var min = this._min;
            var max = this._max;
            var cache = this._cacheRadius2;
            cache[ 0 ] = max[ 0 ] - min[ 0 ];
            cache[ 1 ] = max[ 1 ] - min[ 1 ];
            cache[ 2 ] = max[ 2 ] - min[ 2 ];
            return 0.25 * ( cache[ 0 ] * cache[ 0 ] + cache[ 1 ] * cache[ 1 ] + cache[ 2 ] * cache[ 2 ] );
        },
        corner: function ( pos ) {
            /*jshint bitwise: false */
            var ret = [ 0.0, 0.0, 0.0 ];
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