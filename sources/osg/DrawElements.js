define( [
    'osg/Notify',
    'osg/PrimitiveSet'
], function ( Notify, PrimitiveSet ) {

    /**
     * DrawElements manage rendering of indexed primitives
     * @class DrawElements
     */
    var DrawElements = function ( mode, indices ) {
        this.mode = PrimitiveSet.POINTS;
        if ( mode !== undefined ) {
            if ( typeof ( mode ) === 'string' ) {
                mode = PrimitiveSet[ mode ];
            }
            this.mode = mode;
        }
        this.count = 0;
        this.offset = 0;
        this.indices = indices;
        if ( indices !== undefined ) {
            this.setIndices( indices );
        }
    };

    /** @lends DrawElements.prototype */
    DrawElements.prototype = {
        getMode: function () {
            return this.mode;
        },
        draw: function ( state ) {
            state.setIndexArray( this.indices );
            var gl = state.getGraphicContext();
            gl.drawElements( this.mode, this.count, gl.UNSIGNED_SHORT, this.offset );
        },
        setIndices: function ( indices ) {
            this.indices = indices;
            this.count = indices.getElements().length;
        },
        getIndices: function () {
            return this.indices;
        },
        setFirst: function ( val ) {
            this.offset = val;
        },
        getFirst: function () {
            return this.offset;
        },
        setCount: function ( val ) {
            this.count = val;
        },
        getCount: function () {
            return this.count;
        }

    };

    DrawElements.create = function ( mode, indices ) {
        Notify.log( 'DrawElements.create is deprecated, use new DrawElements with same arguments' );
        return new DrawElements( mode, indices );
    };

    return DrawElements;
} );