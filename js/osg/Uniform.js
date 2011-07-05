/** -*- compile-command: "jslint-cli Uniform.js" -*- */

/** 
 * Uniform manage variable used in glsl shader.
 * @class Uniform
 */
osg.Uniform = function () { this.transpose = false; this._dirty = true; };

/** @lends osg.Uniform.prototype */
osg.Uniform.prototype = {

    get: function() { // call dirty if you update this array outside
        return this.data;
    },
    set: function(array) {
        this.data = array;
        this.dirty();
    },
    dirty: function() { this._dirty = true; },
    apply: function(location) {
        if (this._dirty) {
            this.update.call(this.glData, this.data);
            this._dirty = false;
        }
        this.glCall(location, this.glData);
    },
    applyMatrix: function(location) {
        if (this._dirty) {
            this.update.call(this.glData, this.data);
            this._dirty = false;
        }
        this.glCall(location, this.transpose, this.glData);
    },
    update: function(array) {
        for (var i = 0, l = array.length; i < l; ++i ) { // FF not traced maybe short
            this[i] = array[i];
        }
    },

    _updateFloat1: function(f) {
        this[0] = f[0];
    },
    _updateFloat2: function(f) {
        this[0] = f[0];
        this[1] = f[1];
    },
    _updateFloat3: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
    },
    _updateFloat4: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
    },
    _updateFloat9: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
        this[4] = f[4];
        this[5] = f[5];
        this[6] = f[6];
        this[7] = f[7];
        this[8] = f[8];
    },
    _updateFloat16: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
        this[4] = f[4];
        this[5] = f[5];
        this[6] = f[6];
        this[7] = f[7];
        this[8] = f[8];
        this[9] = f[9];
        this[10] = f[10];
        this[11] = f[11];
        this[12] = f[12];
        this[13] = f[13];
        this[14] = f[14];
        this[15] = f[15];
    }
};

osg.Uniform.createFloat1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat1;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat2;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat3;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix2 = function(mat2, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat2;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix2fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix3 = function(mat3, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat3;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix3fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat9;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix4 = function(mat4, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat4;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix4fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat16;
    uniform.name = name;
    return uniform;
};
