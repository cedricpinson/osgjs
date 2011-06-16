/** 
 * Program encapsulate an vertex and fragment shader
 * @class Program
 */
osg.Program = function (vShader, fShader) { 
    if (osg.Program.instanceID === undefined) {
        osg.Program.instanceID = 0;
    }
    this.instanceID = osg.Program.instanceID;
    this._dirty = true;
    osg.Program.instanceID+= 1;

    this.program = null;
    this.vertex = vShader;
    this.fragment = fShader;
    this.dirty = true;
};

/** @lends osg.Program.prototype */
osg.Program.prototype = {
    isDirty: function() { return this._dirty; },
    attributeType: "Program",
    cloneType: function() { var p = osg.Program.create(); p.default_program = true; return p; },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setVertexShader: function(vs) { program.vertex = vs; },
    setFragmentShader: function(fs) { program.fragment = fs; },
    apply: function(state) {
        if (!this.program || this._dirty) {

            if (this.default_program === true) {
                return;
            }

            if (!this.vertex.shader) {
                this.vertex.compile();
            }
            if (!this.fragment.shader) {
                this.fragment.compile();
            }
            this.program = gl.createProgram();
            gl.attachShader(this.program, this.vertex.shader);
            gl.attachShader(this.program, this.fragment.shader);
            gl.linkProgram(this.program);
            gl.validateProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                osg.log("can't link program\n" + "vertex shader:\n" + this.vertex.text +  "\n fragment shader:\n" + this.fragment.text);
                osg.log(gl.getProgramInfoLog(this.program));
                debugger;
                return null;
            }

            this.uniformsCache = {};
            this.uniformsCache.uniformKeys = [];
            this.attributesCache = {};
            this.attributesCache.attributeKeys = [];

            this.cacheUniformList(this.vertex.text);
            this.cacheUniformList(this.fragment.text);
            //osg.log(this.uniformsCache);

            this.cacheAttributeList(this.vertex.text);

            this._dirty = false;
        }

        gl.useProgram(this.program);
    },

    cacheUniformList: function(str) {
        var r = str.match(/uniform\s+\w+\s+\w+/g);
        if (r !== null) {
            for (var i in r) {
                var uniform = r[i].match(/uniform\s+\w+\s+(\w+)/)[1];
                var l = gl.getUniformLocation(this.program, uniform);
                if (l !== undefined && l !== null) {
                    if (this.uniformsCache[uniform] === undefined) {
                        this.uniformsCache[uniform] = l;
                        this.uniformsCache.uniformKeys.push(uniform);
                    }
                }
            }
        }
    },

    cacheAttributeList: function(str) {
        var r = str.match(/attribute\s+\w+\s+\w+/g);
        if (r !== null) {
            for (var i in r) {
                var attr = r[i].match(/attribute\s+\w+\s+(\w+)/)[1];
                var l = gl.getAttribLocation(this.program, attr);
                if (l !== -1 && l !== undefined) {
                    if (this.attributesCache[attr] === undefined) {
                        this.attributesCache[attr] = l;
                        this.attributesCache.attributeKeys.push(attr);
                    }
                }
            }
        }
    }


};

osg.Program.create = function(vShader, fShader) {
    console.log("osg.Program.create is deprecated use new osg.Program(vertex, fragment) instead");
    var program = new osg.Program(vShader, fShader);
    return program;
};
