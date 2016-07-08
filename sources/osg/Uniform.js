'use strict';
var notify = require( 'osg/notify' );

/**
 * Uniform manage variable used in glsl shader.
 * @class Uniform
 */
var Uniform = function ( name ) {
    this._data = undefined;
    this._transpose = false;
    this._glCall = '';
    this._cache = undefined;
    this._name = name;
    this._type = undefined;
    this._isMatrix = false;
};

Uniform.isUniform = function ( obj ) {
    if ( typeof obj === 'object' && window.Object.getPrototypeOf( obj ) === Uniform.prototype ) {
        return true;
    }
    return false;
};

/** @lends Uniform.prototype */
Uniform.prototype = {

    getName: function () {
        return this._name;
    },

    getType: function () {
        return this._type;
    },


    apply: function UniformApply( gl, location ) {
        if ( !this._cache )
            this._cache = gl[ this._glCall ];

        if ( this._isMatrix ) {
            this._cache.call( gl, location, this._transpose, this._data );
        } else {
            this._cache.call( gl, location, this._data );
        }
    },

    // no type checking, so array should be valid
    setInternalArray: function ( array ) {
        notify.warn( 'setInternalArray deprecated, please use getInternalArray instead: ' + array.length );
        this._data = array;
    },

    getInternalArray: function () {
        return this._data;
    },

    setFloat: function ( f ) {
        this._data[ 0 ] = f;
    },

    setFloat1: function ( f ) {
        this._data[ 0 ] = f[ 0 ];
    },

    setFloat2: function ( f ) {
        this._data[ 0 ] = f[ 0 ];
        this._data[ 1 ] = f[ 1 ];
    },

    setFloat3: function ( f ) {
        this._data[ 0 ] = f[ 0 ];
        this._data[ 1 ] = f[ 1 ];
        this._data[ 2 ] = f[ 2 ];
    },

    setFloat4: function ( f ) {
        this._data[ 0 ] = f[ 0 ];
        this._data[ 1 ] = f[ 1 ];
        this._data[ 2 ] = f[ 2 ];
        this._data[ 3 ] = f[ 3 ];
    },

    setFloat9: function ( f ) {
        this._data[ 0 ] = f[ 0 ];
        this._data[ 1 ] = f[ 1 ];
        this._data[ 2 ] = f[ 2 ];
        this._data[ 3 ] = f[ 3 ];
        this._data[ 4 ] = f[ 4 ];
        this._data[ 5 ] = f[ 5 ];
        this._data[ 6 ] = f[ 6 ];
        this._data[ 7 ] = f[ 7 ];
        this._data[ 8 ] = f[ 8 ];
    },

    setFloat16: function ( f ) {
        this._data[ 0 ] = f[ 0 ];
        this._data[ 1 ] = f[ 1 ];
        this._data[ 2 ] = f[ 2 ];
        this._data[ 3 ] = f[ 3 ];
        this._data[ 4 ] = f[ 4 ];
        this._data[ 5 ] = f[ 5 ];
        this._data[ 6 ] = f[ 6 ];
        this._data[ 7 ] = f[ 7 ];
        this._data[ 8 ] = f[ 8 ];
        this._data[ 9 ] = f[ 9 ];
        this._data[ 10 ] = f[ 10 ];
        this._data[ 11 ] = f[ 11 ];
        this._data[ 12 ] = f[ 12 ];
        this._data[ 13 ] = f[ 13 ];
        this._data[ 14 ] = f[ 14 ];
        this._data[ 15 ] = f[ 15 ];
    }
};
Uniform.prototype.setVec2 = Uniform.prototype.setFloat2;
Uniform.prototype.setVec3 = Uniform.prototype.setFloat3;
Uniform.prototype.setVec4 = Uniform.prototype.setFloat4;
Uniform.prototype.setMatrix4 = Uniform.prototype.setFloat16;
Uniform.prototype.setMatrix3 = Uniform.prototype.setFloat9;
Uniform.prototype.setInt = Uniform.prototype.setFloat;
Uniform.prototype.setInt1 = Uniform.prototype.setFloat1;
Uniform.prototype.setInt2 = Uniform.prototype.setFloat2;
Uniform.prototype.setInt3 = Uniform.prototype.setFloat3;
Uniform.prototype.setInt4 = Uniform.prototype.setFloat4;

var createUniformX = function ( dataOrName, nameOrNbItem, internalArray, glSignature, type, isMatrix ) {
    var data = ( nameOrNbItem && nameOrNbItem.length ) ? dataOrName : undefined;
    var uniform = new Uniform( data !== undefined ? nameOrNbItem : dataOrName );

    uniform._data = internalArray;

    if ( data !== undefined ) {
        if ( data.length ) {
            for ( var i = 0, nbElts = data.length; i < nbElts; ++i )
                uniform._data[ i ] = data[ i ];
        } else {
            uniform._data[ 0 ] = data;
        }
    }

    uniform._glCall = glSignature;
    uniform._type = type;
    uniform._isMatrix = !!isMatrix;
    return uniform;
};

var createMat2 = function ( nbItem ) {
    var out = new Float32Array( nbItem * 4 );
    for ( var i = 0; i < out.length; i += 4 ) out[ i ] = out[ i + 3 ] = 1.0;
    return out;
};

var createMat3 = function ( nbItem ) {
    var out = new Float32Array( nbItem * 9 );
    for ( var i = 0; i < out.length; i += 9 ) out[ i ] = out[ i + 4 ] = out[ i + 8 ] = 1.0;
    return out;
};

var createMat4 = function ( nbItem ) {
    var out = new Float32Array( nbItem * 16 );
    for ( var i = 0; i < out.length; i += 16 ) out[ i ] = out[ i + 5 ] = out[ i + 10 ] = out[ i + 15 ] = 1.0;
    return out;
};

// possibles signatures
// name
// data, name
// name, nbItem
var _getNbItem = function ( itemSize, dataOrName, nameOrNbItem ) {
    if ( nameOrNbItem && !nameOrNbItem.length ) return nameOrNbItem; // name, nbItem
    if ( typeof dataOrName !== 'string' ) return ( dataOrName.length || 1 ) / itemSize; // data, name
    return 1; // name
};

// works also for float array but data must be given
Uniform.createFloat1 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Float32Array( 1 * _getNbItem( 1, dataOrName, nameOrNbItem ) ), 'uniform1fv', 'float' );
};
Uniform.createFloat2 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Float32Array( 2 * _getNbItem( 2, dataOrName, nameOrNbItem ) ), 'uniform2fv', 'vec2' );
};
Uniform.createFloat3 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Float32Array( 3 * _getNbItem( 3, dataOrName, nameOrNbItem ) ), 'uniform3fv', 'vec3' );
};
Uniform.createFloat4 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Float32Array( 4 * _getNbItem( 4, dataOrName, nameOrNbItem ) ), 'uniform4fv', 'vec4' );
};

Uniform.createInt1 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Int32Array( 1 * _getNbItem( 1, dataOrName, nameOrNbItem ) ), 'uniform1iv', 'int' );
};
Uniform.createInt2 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Int32Array( 2 * _getNbItem( 2, dataOrName, nameOrNbItem ) ), 'uniform2iv', 'vec2i' );
};
Uniform.createInt3 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Int32Array( 3 * _getNbItem( 3, dataOrName, nameOrNbItem ) ), 'uniform3iv', 'vec3i' );
};
Uniform.createInt4 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, new Int32Array( 4 * _getNbItem( 4, dataOrName, nameOrNbItem ) ), 'uniform4iv', 'vec4i' );
};

Uniform.createMatrix2 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, createMat2( _getNbItem( 4, dataOrName, nameOrNbItem ) ), 'uniformMatrix2fv', 'mat2', true );
};

Uniform.createMatrix3 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, createMat3( _getNbItem( 9, dataOrName, nameOrNbItem ) ), 'uniformMatrix3fv', 'mat3', true );
};

Uniform.createMatrix4 = function ( dataOrName, nameOrNbItem ) {
    return createUniformX( dataOrName, nameOrNbItem, createMat4( _getNbItem( 16, dataOrName, nameOrNbItem ) ), 'uniformMatrix4fv', 'mat4', true );
};

// alias
Uniform.float = Uniform.createFloatArray = Uniform.createFloat = Uniform.createFloat1;
Uniform.vec2 = Uniform.createFloat2Array = Uniform.createFloat2;
Uniform.vec3 = Uniform.createFloat3Array = Uniform.createFloat3;
Uniform.vec4 = Uniform.createFloat4Array = Uniform.createFloat4;

Uniform.int = Uniform.createIntArray = Uniform.createInt = Uniform.createInt1;
Uniform.vec2i = Uniform.createInt2Array = Uniform.createInt2;
Uniform.vec3i = Uniform.createInt3Array = Uniform.createInt3;
Uniform.vec4i = Uniform.createInt4Array = Uniform.createInt4;

Uniform.mat2 = Uniform.createMat2Array = Uniform.createMat2 = Uniform.createMatrix2;
Uniform.mat3 = Uniform.createMat3Array = Uniform.createMat3 = Uniform.createMatrix3;
Uniform.mat4 = Uniform.createMat4Array = Uniform.createMat4 = Uniform.createMatrix4;

module.exports = Uniform;
