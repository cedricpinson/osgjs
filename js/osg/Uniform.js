/** -*- compile-command: "jslint-cli Uniform.js" -*- */

/** 
 * Uniform manage variable used in glsl shader.
 * @class Uniform
 */
osg.Uniform = function () { 
    this.transpose = false; 
    this._dirty = true; 
    this.name = "";
    this.type = undefined;
};

osg.Uniform.isUniform = function(obj)  {
    if (obj.prototype === osg.Uniform.prototype) {
        return true;
    }
    return false;
};
/** @lends osg.Uniform.prototype */
osg.Uniform.prototype = {
    getName: function() { return this.name;},
    getType: function() { return this.type;},

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

    _updateArray: function(array) {
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

osg.Uniform.createFloat1 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0];
    }
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat1;
    uniform.set = function(value) {
        if (typeof value === "number") {
            this.data[0] = value;
        } else {
            this.data = value;
        }
        this.dirty();
    };

    uniform.name = name;
    uniform.type = "float";
    return uniform;
};
osg.Uniform.createFloat = osg.Uniform.createFloat1;
osg.Uniform.float = osg.Uniform.createFloat1;
osg.Uniform.createFloatArray = function(array , name) {
    var u = osg.Uniform.createFloat.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};

osg.Uniform.createFloat2 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0,0];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, glData) {
        gl.uniform2fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat2;
    uniform.name = name;
    uniform.type = "vec2";
    return uniform;
};
osg.Uniform.vec2 = osg.Uniform.createFloat2;
osg.Uniform.createFloat2Array = function(array , name) {
    var u = osg.Uniform.createFloat2.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};

osg.Uniform.createFloat3 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0,0,0];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, glData) {
        gl.uniform3fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat3;
    uniform.name = name;
    uniform.type = "vec3";
    return uniform;
};
osg.Uniform.vec3 = osg.Uniform.createFloat3;
osg.Uniform.createFloat3Array = function(array , name) {
    var u = osg.Uniform.createFloat3.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};

osg.Uniform.createFloat4 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0,0,0,0];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, glData) {
        gl.uniform4fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
    uniform.name = name;
    uniform.type = "vec4";
    return uniform;
};
osg.Uniform.vec4 = osg.Uniform.createFloat4;
osg.Uniform.createFloat4Array = function(array , name) {
    var u = osg.Uniform.createFloat4.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};

osg.Uniform.createInt1 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0];
    }
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1iv(location, glData);
    };
    uniform.set = function(value) {
        if (typeof value === "number") {
            this.data[0] = value;
        } else {
            this.data = value;
        }
        this.dirty();
    };

    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    uniform.type = "int";
    return uniform;
};
osg.Uniform.int = osg.Uniform.createInt1;
osg.Uniform.createInt = osg.Uniform.createInt1;
osg.Uniform.createIntArray = function(array , name) {
    var u = osg.Uniform.createInt.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};


osg.Uniform.createInt2 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0,0];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, glData) {
        gl.uniform2iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    uniform.type = "vec2i";
    return uniform;
};
osg.Uniform.vec2i = osg.Uniform.createInt2;
osg.Uniform.createInt2Array = function(array , name) {
    var u = osg.Uniform.createInt2.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};

osg.Uniform.createInt3 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0,0,0];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, glData) {
        gl.uniform3iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    uniform.type = "vec3i";
    return uniform;
};
osg.Uniform.vec3i = osg.Uniform.createInt3;
osg.Uniform.createInt3Array = function(array , name) {
    var u = osg.Uniform.createInt3.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};

osg.Uniform.createInt4 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [0,0,0,0];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, glData) {
        gl.uniform4iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    uniform.type = "vec4i";
    return uniform;
};
osg.Uniform.vec4i = osg.Uniform.createInt4;

osg.Uniform.createInt4Array = function(array , name) {
    var u = osg.Uniform.createInt4.call(this, array, name);
    u.update = osg.Uniform.prototype._updateArray;
    return u;
};

osg.Uniform.createMatrix2 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [1,0,0,1];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix2fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
    uniform.name = name;
    uniform.type = "mat2";
    return uniform;
};
osg.Uniform.createMat2 = osg.Uniform.createMatrix2;
osg.Uniform.mat2 = osg.Uniform.createMat2;

osg.Uniform.createMatrix3 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [1,0,0, 0,1,0, 0,0,1];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix3fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat9;
    uniform.name = name;
    uniform.type = "mat3";
    return uniform;
};
osg.Uniform.createMat3 = osg.Uniform.createMatrix3;
osg.Uniform.mat3 = osg.Uniform.createMatrix3;

osg.Uniform.createMatrix4 = function(data, uniformName) {
    var value = data;
    var name = uniformName;
    if (name === undefined) {
        name = value;
        value = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    }
    var uniform = new osg.Uniform();
    uniform.data = value;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix4fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat16;
    uniform.name = name;
    uniform.type = "mat4";
    return uniform;
};
osg.Uniform.createMat4 = osg.Uniform.createMatrix4;
osg.Uniform.mat4 = osg.Uniform.createMatrix4;