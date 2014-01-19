define( [
    'osg/Utils'
], function ( MACROUTILS ) {
        /**
     * Uniform manage variable used in glsl shader.
     * @class Uniform
     */
    var Uniform = function () {
        this.transpose = false;
        this._dirty = true;
        this.name = '';
        this.type = undefined;
    };

    Uniform.isUniform = function ( obj ) {
        if ( obj.prototype === Uniform.prototype ) {
            return true;
        }
        return false;
    };

    /** @lends Uniform.prototype */
    Uniform.prototype = {
        getName: function () {
            return this.name;
        },
        getType: function () {
            return this.type;
        },

        get: function () { // call dirty if you update this array outside
            return this.data;
        },
        set: function ( array ) {
            this.data = array;
            this.dirty();
        },
        dirty: function () {
            this._dirty = true;
        },
        apply: function ( gl, location ) {
            if ( this._dirty ) {
                this.update.call( this.glData, this.data );
                this._dirty = false;
            }
            this.glCall( gl, location, this.glData );
        },
        applyMatrix: function ( gl, location ) {
            if ( this._dirty ) {
                this.update.call( this.glData, this.data );
                this._dirty = false;
            }
            this.glCall( gl, location, this.transpose, this.glData );
        },
        update: function ( array ) {
            for ( var i = 0, l = array.length; i < l; ++i ) { // FF not traced maybe short
                this[ i ] = array[ i ];
            }
        },

        _updateArray: function ( array ) {
            for ( var i = 0, l = array.length; i < l; ++i ) { // FF not traced maybe short
                this[ i ] = array[ i ];
            }
        },

        _updateFloat1: function ( f ) {
            this[ 0 ] = f[ 0 ];
        },
        _updateFloat2: function ( f ) {
            this[ 0 ] = f[ 0 ];
            this[ 1 ] = f[ 1 ];
        },
        _updateFloat3: function ( f ) {
            this[ 0 ] = f[ 0 ];
            this[ 1 ] = f[ 1 ];
            this[ 2 ] = f[ 2 ];
        },
        _updateFloat4: function ( f ) {
            this[ 0 ] = f[ 0 ];
            this[ 1 ] = f[ 1 ];
            this[ 2 ] = f[ 2 ];
            this[ 3 ] = f[ 3 ];
        },
        _updateFloat9: function ( f ) {
            this[ 0 ] = f[ 0 ];
            this[ 1 ] = f[ 1 ];
            this[ 2 ] = f[ 2 ];
            this[ 3 ] = f[ 3 ];
            this[ 4 ] = f[ 4 ];
            this[ 5 ] = f[ 5 ];
            this[ 6 ] = f[ 6 ];
            this[ 7 ] = f[ 7 ];
            this[ 8 ] = f[ 8 ];
        },
        _updateFloat16: function ( f ) {
            this[ 0 ] = f[ 0 ];
            this[ 1 ] = f[ 1 ];
            this[ 2 ] = f[ 2 ];
            this[ 3 ] = f[ 3 ];
            this[ 4 ] = f[ 4 ];
            this[ 5 ] = f[ 5 ];
            this[ 6 ] = f[ 6 ];
            this[ 7 ] = f[ 7 ];
            this[ 8 ] = f[ 8 ];
            this[ 9 ] = f[ 9 ];
            this[ 10 ] = f[ 10 ];
            this[ 11 ] = f[ 11 ];
            this[ 12 ] = f[ 12 ];
            this[ 13 ] = f[ 13 ];
            this[ 14 ] = f[ 14 ];
            this[ 15 ] = f[ 15 ];
        }
    };

    Uniform.createFloat1 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0 ];
        }
        var uniform = new Uniform();
        uniform.data = [ value ];
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform1fv( location, glData );
        };
        uniform.glData = new MACROUTILS.Float32Array( uniform.data );
        uniform.update = Uniform.prototype._updateFloat1;
        uniform.set = function ( value ) {
            if ( typeof value === 'number' ) {
                this.data[ 0 ] = value;
            } else {
                this.data = value;
            }
            this.dirty();
        };

        uniform.name = name;
        uniform.type = 'float';
        return uniform;
    };
    Uniform.createFloat = Uniform.createFloat1;
    Uniform[ 'float' ] = Uniform.createFloat1;
    Uniform.createFloatArray = function ( array, name ) {
        var u = Uniform.createFloat.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };

    Uniform.createFloat2 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0, 0 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform2fv( location, glData );
        };
        uniform.glData = new MACROUTILS.Float32Array( uniform.data );
        uniform.update = Uniform.prototype._updateFloat2;
        uniform.name = name;
        uniform.type = 'vec2';
        return uniform;
    };
    Uniform.vec2 = Uniform.createFloat2;
    Uniform.createFloat2Array = function ( array, name ) {
        var u = Uniform.createFloat2.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };

    Uniform.createFloat3 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0, 0, 0 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform3fv( location, glData );
        };
        uniform.glData = new MACROUTILS.Float32Array( uniform.data );
        uniform.update = Uniform.prototype._updateFloat3;
        uniform.name = name;
        uniform.type = 'vec3';
        return uniform;
    };
    Uniform.vec3 = Uniform.createFloat3;
    Uniform.createFloat3Array = function ( array, name ) {
        var u = Uniform.createFloat3.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };

    Uniform.createFloat4 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0, 0, 0, 0 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform4fv( location, glData );
        };
        uniform.glData = new MACROUTILS.Float32Array( uniform.data );
        uniform.update = Uniform.prototype._updateFloat4;
        uniform.name = name;
        uniform.type = 'vec4';
        return uniform;
    };
    Uniform.vec4 = Uniform.createFloat4;
    Uniform.createFloat4Array = function ( array, name ) {
        var u = Uniform.createFloat4.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };

    Uniform.createInt1 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0 ];
        }
        var uniform = new Uniform();
        uniform.data = [ value ];
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform1iv( location, glData );
        };
        uniform.set = function ( value ) {
            if ( typeof value === 'number' ) {
                this.data[ 0 ] = value;
            } else {
                this.data = value;
            }
            this.dirty();
        };

        uniform.glData = new MACROUTILS.Int32Array( uniform.data );
        uniform.name = name;
        uniform.type = 'int';
        return uniform;
    };
    Uniform[ 'int' ] = Uniform.createInt1;
    Uniform.createInt = Uniform.createInt1;
    Uniform.createIntArray = function ( array, name ) {
        var u = Uniform.createInt.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };


    Uniform.createInt2 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0, 0 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform2iv( location, glData );
        };
        uniform.glData = new MACROUTILS.Int32Array( uniform.data );
        uniform.name = name;
        uniform.type = 'vec2i';
        return uniform;
    };
    Uniform.vec2i = Uniform.createInt2;
    Uniform.createInt2Array = function ( array, name ) {
        var u = Uniform.createInt2.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };

    Uniform.createInt3 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0, 0, 0 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform3iv( location, glData );
        };
        uniform.glData = new MACROUTILS.Int32Array( uniform.data );
        uniform.name = name;
        uniform.type = 'vec3i';
        return uniform;
    };
    Uniform.vec3i = Uniform.createInt3;
    Uniform.createInt3Array = function ( array, name ) {
        var u = Uniform.createInt3.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };

    Uniform.createInt4 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 0, 0, 0, 0 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, glData ) {
            gl.uniform4iv( location, glData );
        };
        uniform.glData = new MACROUTILS.Int32Array( uniform.data );
        uniform.name = name;
        uniform.type = 'vec4i';
        return uniform;
    };
    Uniform.vec4i = Uniform.createInt4;

    Uniform.createInt4Array = function ( array, name ) {
        var u = Uniform.createInt4.call( this, array, name );
        u.update = Uniform.prototype._updateArray;
        return u;
    };

    Uniform.createMatrix2 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 1, 0, 0, 1 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, transpose, glData ) {
            gl.uniformMatrix2fv( location, transpose, glData );
        };
        uniform.apply = uniform.applyMatrix;
        uniform.transpose = false;
        uniform.glData = new MACROUTILS.Float32Array( uniform.data );
        uniform.update = Uniform.prototype._updateFloat4;
        uniform.name = name;
        uniform.type = 'mat2';
        return uniform;
    };
    Uniform.createMat2 = Uniform.createMatrix2;
    Uniform.mat2 = Uniform.createMat2;

    Uniform.createMatrix3 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, transpose, glData ) {
            gl.uniformMatrix3fv( location, transpose, glData );
        };
        uniform.apply = uniform.applyMatrix;
        uniform.transpose = false;
        uniform.glData = new MACROUTILS.Float32Array( uniform.data );
        uniform.update = Uniform.prototype._updateFloat9;
        uniform.name = name;
        uniform.type = 'mat3';
        return uniform;
    };
    Uniform.createMat3 = Uniform.createMatrix3;
    Uniform.mat3 = Uniform.createMatrix3;

    Uniform.createMatrix4 = function ( data, uniformName ) {
        var value = data;
        var name = uniformName;
        if ( name === undefined ) {
            name = value;
            value = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
        }
        var uniform = new Uniform();
        uniform.data = value;
        uniform.glCall = function ( gl, location, transpose, glData ) {
            gl.uniformMatrix4fv( location, transpose, glData );
        };
        uniform.apply = uniform.applyMatrix;
        uniform.transpose = false;
        uniform.glData = new MACROUTILS.Float32Array( uniform.data );
        uniform.update = Uniform.prototype._updateFloat16;
        uniform.name = name;
        uniform.type = 'mat4';
        return uniform;
    };
    Uniform.createMat4 = Uniform.createMatrix4;
    Uniform.mat4 = Uniform.createMatrix4;

    return Uniform;
} );
