define( [
    'osg/Utils',
    'osg/Notify',
    'osg/Object',
    'osg/GLObject',
    'osg/Timer'

], function ( MACROUTILS, Notify, Object, GLObject, Timer ) {

    'use strict';

    /**
     * BufferArray manage vertex / normal / ... array used by webgl.
     * @class BufferArray
     */
    var BufferArray = function ( type, elements, itemSize ) {
        GLObject.call( this );
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
                this._elements = elements instanceof MACROUTILS.Uint16Array ? elements : new MACROUTILS.Uint16Array( elements );
            } else {
                this._elements = elements instanceof MACROUTILS.Float32Array ? elements : new MACROUTILS.Float32Array( elements );
            }
        }
    };

    BufferArray.ELEMENT_ARRAY_BUFFER = 0x8893;
    BufferArray.ARRAY_BUFFER = 0x8892;

    // static cache of glBuffers flagged for deletion, which will actually
    // be deleted in the correct GL context.
    BufferArray._sDeletedGLBufferArrayCache = new Map();

    // static method to delete Program 
    BufferArray.deleteGLBufferArray = function ( gl, buffer ) {
        if ( !BufferArray._sDeletedGLBufferArrayCache.has( gl ) )
            BufferArray._sDeletedGLBufferArrayCache.set( gl, [] );
        BufferArray._sDeletedGLBufferArrayCache.get( gl ).push( buffer );
    };

    // static method to flush all the cached glPrograms which need to be deleted in the GL context specified
    BufferArray.flushDeletedGLBufferArrays = function ( gl, availableTime ) {
        // if no time available don't try to flush objects.
        if ( availableTime <= 0.0 ) return availableTime;
        if ( !BufferArray._sDeletedGLBufferArrayCache.has( gl ) ) return availableTime;
        var elapsedTime = 0.0;
        var beginTime = Timer.instance().tick();
        var deleteList = BufferArray._sDeletedGLBufferArrayCache.get( gl );
        var numBuffers = deleteList.length;
        for ( var i = numBuffers - 1; i >= 0 && elapsedTime < availableTime; i-- ) {
            gl.deleteBuffer( deleteList[ i ] );
            deleteList.splice( i, 1 );
            elapsedTime = Timer.instance().deltaS( beginTime, Timer.instance().tick() );
        }
        availableTime -= elapsedTime;
        return availableTime;
    };

    BufferArray.flushAllDeletedGLBufferArrays = function ( gl ) {
        if ( !BufferArray._sDeletedGLBufferArrayCache.has( gl ) ) return;
        var deleteList = BufferArray._sDeletedGLBufferArrayCache.get( gl );
        var numBuffers = deleteList.length;
        for ( var i = numBuffers - 1; i >= 0; i-- ) {
            gl.deleteBuffer( deleteList[ i ] );
            deleteList.splice( i, 1 );
        }
    };

    /** @lends BufferArray.prototype */
    BufferArray.prototype = MACROUTILS.objectInherit( GLObject.prototype, {
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

        releaseGLObjects: function () {
            if ( this._buffer !== undefined && this._buffer !== null && this._gl !== undefined ) {
                BufferArray.deleteGLBufferArray( this._gl, this._buffer );
            }
            this._buffer = undefined;
        },

        bind: function ( gl ) {
            if ( !this._gl ) this.setGraphicContext( gl );
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
    } );

    BufferArray.create = function ( type, elements, itemSize ) {
        Notify.log( 'BufferArray.create is deprecated, use new BufferArray with same arguments instead' );
        return new BufferArray( type, elements, itemSize );
    };

    return BufferArray;
} );
