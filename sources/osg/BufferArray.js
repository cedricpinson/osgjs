define( [
    'osg/Utils',
    'osg/Notify',
    'osg/Object'

], function ( MACROUTILS, Notify, Object ) {

    /**
     * BufferArray manage vertex / normal / ... array used by webgl.
     * @class BufferArray
     */
    var BufferArray = function ( type, elements, itemSize ) {

        // maybe could inherit from Object
        this._instanceID = Object.getInstanceID();

        this.dirty();

        this._itemSize = itemSize;
        if ( typeof ( type ) === 'string' ) {
            type = BufferArray[ type ];
        }
        this._type = type;

        if ( elements !== undefined ) {
            if ( this._type === BufferArray.ELEMENT_ARRAY_BUFFER ) {
                this._elements = new MACROUTILS.Uint16Array( elements );
            } else {
                this._elements = new MACROUTILS.Float32Array( elements );
            }
        }
    };

    BufferArray.ELEMENT_ARRAY_BUFFER = 0x8893;
    BufferArray.ARRAY_BUFFER = 0x8892;


    /** @lends BufferArray.prototype */
    BufferArray.prototype = {
        setItemSize: function ( size ) {
            this._itemSize = size;
        },
        isValid: function () {
            if ( this._buffer !== undefined ||
                this._elements !== undefined ) {
                return true;
            }
            return false;
        },

        releaseGLObjects: function ( gl ) {
            if ( this._buffer !== undefined && this._buffer !== null ) {
                gl.deleteBuffer( this._buffer );
            }
            this._buffer = undefined;
        },

        bind: function ( gl ) {

            var type = this._type;
            var buffer = this._buffer;

            if ( buffer ) {
                gl.bindBuffer( type, buffer );
                return;
            }

            if ( !buffer && this._elements.length > 0 ) {
                this._buffer = gl.createBuffer();
                this._numItems = this._elements.length / this._itemSize;
                gl.bindBuffer( type, this._buffer );
            }
        },
        getItemSize: function () {
            return this._itemSize;
        },
        dirty: function () {
            this._dirty = true;
        },
        isDirty: function () {
            return this._dirty;
        },
        compile: function ( gl ) {
            if ( this._dirty ) {
                MACROUTILS.timeStamp( 'osgjs.metrics:bufferData' );
                gl.bufferData( this._type, this._elements, gl.STATIC_DRAW );
                this._dirty = false;
            }
        },
        getElements: function () {
            return this._elements;
        },
        setElements: function ( elements ) {
            this._elements = elements;
            this._dirty = true;
        }
    };

    BufferArray.create = function ( type, elements, itemSize ) {
        Notify.log( 'BufferArray.create is deprecated, use new BufferArray with same arguments instead' );
        return new BufferArray( type, elements, itemSize );
    };

    return BufferArray;
} );
