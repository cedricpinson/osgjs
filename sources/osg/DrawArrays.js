define( [
    'osg/Notify',
    'osg/PrimitiveSet'
], function ( Notify, PrimitiveSet ) {

    /**
     * DrawArrays manage rendering primitives
     * @class DrawArrays
     */
    var DrawArrays = function ( mode, first, count ) {
        this.mode = mode;
        if ( mode !== undefined ) {
            if ( typeof ( mode ) === 'string' ) {
                mode = PrimitiveSet[ mode ];
            }
            this.mode = mode;
        }
        this.first = first;
        this.count = count;
    };

    /** @lends DrawArrays.prototype */
    DrawArrays.prototype = {
        draw: function ( state ) {
            var gl = state.getGraphicContext();
            gl.drawArrays( this.mode, this.first, this.count );
        },
        getMode: function () {
            return this.mode;
        },
        getCount: function () {
            return this.count;
        },
        getFirst: function () {
            return this.first;
        }
    };
    DrawArrays.create = function ( mode, first, count ) {
        Notify.log( 'DrawArrays.create is deprecated, use new DrawArrays with same arguments' );
        var d = new DrawArrays( mode, first, count );
        return d;
    };

    return DrawArrays;
} );