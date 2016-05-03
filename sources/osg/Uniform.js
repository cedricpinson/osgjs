'use strict';
var Notify = require( 'osg/Notify' );
var Matrix = require( 'osg/Matrix' );
var Vec2 = require( 'osg/Vec2' );
var Vec3 = require( 'osg/Vec3' );
var Vec4 = require( 'osg/Vec4' );


/**
 * Uniform manage variable used in glsl shader.
 * @class Uniform
 */
var Uniform = function ( name ) {
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

    dirty: function () {
        Notify.log( 'deprecated dont use Uniform.dirty anymore' );
    },

    getType: function () {
        return this._type;
    },

    get: function () {
        Notify.log( 'deprecated use getInternalArray instead' );
        return this._data;
    },

    set: function ( array ) {
        Notify.log( 'deprecated use setInternalArray or setFloat/setInt instead' );
        var value = array;
        if ( !Array.isArray( value ) && value.byteLength === undefined )
            this._data[ 0 ] = value;
        else
            this._data = array;
    },

    apply: function UniformApply( gl, location ) {

        if ( !this._cache )
            this._cache = gl[ this._glCall ];

        if ( this._isMatrix )
            this._cache.call( gl, location, this._transpose, this._data );
        else
            this._cache.call( gl, location, this._data );
    },

    // set the internal array use but the uniform
    // the setFloat/setVecX/setMatrixX will be copied to the
    // internal array. Consider using this function as an optimization
    // to avoid copy. It's possible inside StateAttribute code but it's
    // safer to not do that in users code unless you know what you are doing
    setInternalArray: function ( array ) {
        this._data = array;
    },

    getInternalArray: function () {
        return this._data;
    },

    setFloat1: function ( f ) {
        this._data[ 0 ] = f[ 0 ];
    },

    setFloat: function ( f ) {
        this._data[ 0 ] = f;
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


var createUniformX = function ( data, uniformName, defaultConstructor, glSignature, type, isMatrix ) {
    var value = data;
    var name = uniformName;
    if ( name === undefined ) {
        name = value;
        value = defaultConstructor();
    }
    var uniform = new Uniform( name );

    // if argument is not an array or typed array, create one
    if ( !Array.isArray( value ) && value.byteLength === undefined )
        value = [ value ];

    uniform.setInternalArray( value );
    uniform._glCall = glSignature;
    uniform._type = type;
    uniform._isMatrix = Boolean( isMatrix );
    return uniform;
};

var constructorFloat = function () {
    return [ 0.0 ];
};

var constructorInt = function () {
    return [ 0 ];
};

var constructorInt2 = function () {
    return [ 0, 0 ];
};

var constructorInt3 = function () {
    return [ 0, 0, 0 ];
};

var constructorInt4 = function () {
    return [ 0, 0, 0, 0 ];
};

var constructorMat2 = function () {
    return Vec4.createAndSet( 1.0, 0.0, 0.0, 1.0 );
};

var constructorMat3 = function () {
    return [ 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0 ];
};

// works also for float array but data must be given
Uniform.createFloat1 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, constructorFloat, 'uniform1fv', 'float' );
};

Uniform.createInt1 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, constructorInt, 'uniform1iv', 'int' );
};

Uniform.createFloat2 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, Vec2.create, 'uniform2fv', 'vec2' );
};

Uniform.createInt2 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, constructorInt2, 'uniform2iv', 'vec2i' );
};

Uniform.createFloat3 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, Vec3.create, 'uniform3fv', 'vec3' );
};

Uniform.createInt3 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, constructorInt3, 'uniform3iv', 'vec3i' );
};

Uniform.createFloat4 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, Vec4.create, 'uniform4fv', 'vec4' );
};

Uniform.createInt4 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, constructorInt4, 'uniform4iv', 'vec4i' );
};

Uniform.createMatrix2 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, constructorMat2, 'uniformMatrix2fv', 'mat2', true );
};

Uniform.createMatrix3 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, constructorMat3, 'uniformMatrix3fv', 'mat3', true );
};

Uniform.createMatrix4 = function ( data, uniformName ) {
    return createUniformX( data, uniformName, Matrix.create, 'uniformMatrix4fv', 'mat4', true );
};

// alias
Uniform.float = Uniform.createFloatArray = Uniform.createFloat = Uniform.createFloat1;
Uniform.int = Uniform.createIntArray = Uniform.createInt = Uniform.createInt1;

Uniform.vec2 = Uniform.createFloat2Array = Uniform.createFloat2;
Uniform.vec2i = Uniform.createInt2Array = Uniform.createInt2;


Uniform.vec3 = Uniform.createFloat3Array = Uniform.createFloat3;
Uniform.vec3i = Uniform.createInt3Array = Uniform.createInt3;

Uniform.vec4 = Uniform.createFloat4Array = Uniform.createFloat4;
Uniform.vec4i = Uniform.createInt4Array = Uniform.createInt4;

Uniform.mat2 = Uniform.createMat2 = Uniform.createMatrix2;
Uniform.mat3 = Uniform.createMat3 = Uniform.createMatrix3;
Uniform.mat4 = Uniform.createMat4 = Uniform.createMatrix4;

module.exports = Uniform;
