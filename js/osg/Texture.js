/** 
 * Texture encapsulate webgl texture object
 * @class Texture
 * @inherits osg.StateAttribute
 */
osg.Texture = function() {
    osg.StateAttribute.call(this);
    this.setDefaultParameters();
};

/** @lends osg.Texture.prototype */
osg.Texture.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Texture",
    cloneType: function() { var t = new osg.Texture(); t.default_type = true; return t;},
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType; },
    getOrCreateUniforms: function(unit) {
        if (osg.Texture.uniforms === undefined) {
            osg.Texture.uniforms = [];
        }
        if (osg.Texture.uniforms[unit] === undefined) {
            var name = this.getType() + unit;
            var uniforms = {};
            uniforms[name] = osg.Uniform.createInt1(unit, name);
            var uniformKeys = [name];
            uniforms.uniformKeys = uniformKeys;

            osg.Texture.uniforms[unit] = uniforms;
        }
        // uniform for an texture attribute should directly in osg.Texture.uniforms[unit] and not in osg.Texture.uniforms[unit][Texture0]
        return osg.Texture.uniforms[unit];
    },
    setDefaultParameters: function() {
        this.mag_filter = 'LINEAR';
        this.min_filter = 'LINEAR';
        this.wrap_s = 'CLAMP_TO_EDGE';
        this.wrap_t = 'CLAMP_TO_EDGE';
        this.textureWidth = 0;
        this.textureHeight = 0;
        this.target = 'TEXTURE_2D';
    },
    setTextureSize: function(w,h) {
        this.textureWidth = w;
        this.textureHeight = h;
    },
    init: function() {
        if (!this.textureObject) {
            this.textureObject = gl.createTexture();
            this._dirty = true;
        }
    },
    getWidth: function() { return this.textureWidth; },
    getHeight: function() { return this.textureHeight; },

    setWrapS: function(value) { this.wrap_s = value; },
    setWrapT: function(value) { this.wrap_t = value; },

    setMinFilter: function(value) { this.min_filter = value; },
    setMagFilter: function(value) { this.mag_filter = value; },

    setImage: function(img) {
        this.image = img;
        this._dirty = true;
    },

    setFromCanvas: function(canvas) {
        this.init();
        gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        this.setTextureSize(canvas.width, canvas.height);
        this.applyFilterParameter();
        this._dirty = false;
    },

    isImageReady: function() {
        var image = this.image;
        if (image && image.complete) {
            if (typeof image.naturalWidth !== "undefined" &&  image.naturalWidth === 0) {
                return false;
            }
            return true;
        }
        return false;
    },

    applyFilterParameter: function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.mag_filter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.min_filter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrap_s]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrap_t]);
        if (this.min_filter === 'NEAREST_MIPMAP_NEAREST' ||
            this.min_filter === 'LINEAR_MIPMAP_NEAREST' ||
            this.min_filter === 'NEAREST_MIPMAP_LINEAR' ||
            this.min_filter === 'LINEAR_MIPMAP_LINEAR') {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    },

    apply: function(state) {
        if (this.image !== undefined) {
            if (!this.textureObject) {
                if (this.isImageReady()) {
                    if (!this.textureObject) {
                        this.init();
                        this.setTextureSize(this.image.naturalWidth, this.image.naturalHeight);
                        this._dirty = false;
                    }
                    gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
                    this.applyFilterParameter();
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
            } else {
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            }
        } else if (this.textureHeight !== 0 && this.textureWidth !== 0 ) {
            if (!this.textureObject) {
                this.init();
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                this.applyFilterParameter();
            } else {
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            }
        } else if (this.textureObject !== undefined) {
            gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    },

    /**
      set the injection code that will be used in the shader generation
      for FragmentMain part we would write something like that
      @example
      var fragmentGenerator = function(unit) {
          var str = "texColor" + unit + " = texture2D( Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
          str += "fragColor = fragColor * texColor" + unit + ";\n";
      };
      setShaderGeneratorFunction(fragmentGenerator, osg.ShaderGeneratorType.FragmentMain);

    */
    setShaderGeneratorFunction: function(
        /**Function*/ injectionFunction, 
        /**osg.ShaderGeneratorType*/ mode) {
        this[mode] = injectionFunction;
    },

    writeToShader: function(unit, type)
    {
        if (this[type])
            return this[type].call(this,unit);
        return "";
    }
});
osg.Texture.prototype[osg.ShaderGeneratorType.VertexInit] = function(unit) {
    var str = "attribute vec2 TexCoord"+unit+";\n";
    str += "varying vec2 FragTexCoord"+unit+";\n";
    return str;
};
osg.Texture.prototype[osg.ShaderGeneratorType.VertexMain] = function(unit) {
        return "FragTexCoord"+unit+" = TexCoord" + unit + ";\n";
};
osg.Texture.prototype[osg.ShaderGeneratorType.FragmentInit] = function(unit) {
    var str = "varying vec2 FragTexCoord" + unit +";\n";
    str += "uniform sampler2D Texture" + unit +";\n";
    str += "vec4 texColor" + unit + ";\n";
    return str;
};
osg.Texture.prototype[osg.ShaderGeneratorType.FragmentMain] = function(unit) {
    var str = "texColor" + unit + " = texture2D( Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
    str += "fragColor = fragColor * texColor" + unit + ";\n";
    return str;
};


osg.Texture.createFromURL = function(imageSource) {
    var a = new osg.Texture();
    if (imageSource !== undefined) {
        var img = new Image();
        img.src = imageSource;
        a.setImage(img);
    }
    return a;
};
osg.Texture.createFromImg = function(img) {
    var a = new osg.Texture();
    a.setImage(img);
    return a;
};
osg.Texture.createFromCanvas = function(ctx) {
    var a = new osg.Texture();
    a.setFromCanvas(ctx);
    return a;
};

osg.Texture.create = function(url) {
    osg.log("osg.Texture.create is deprecated, use osg.Texture.createFromURL instead");
    return osg.Texture.createFromURL(url);
};
