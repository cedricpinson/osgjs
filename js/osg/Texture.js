/** 
 * Texture encapsulate webgl texture object
 * @class Texture
 * @inherits osg.StateAttribute
 */
osg.Texture = function() {
    osg.StateAttribute.call(this);
    this.setDefaultParameters();
};
osg.Texture.DEPTH_COMPONENT = 0x1902;
osg.Texture.ALPHA = 0x1906;
osg.Texture.RGB = 0x1907;
osg.Texture.RGBA = 0x1908;
osg.Texture.LUMINANCE = 0x1909;
osg.Texture.LUMINANCE_ALPHA = 0x190A;

// filter mode
osg.Texture.LINEAR = 0x2601;
osg.Texture.NEAREST = 0x2600;
osg.Texture.NEAREST_MIPMAP_NEAREST = 0x2700;
osg.Texture.LINEAR_MIPMAP_NEAREST = 0x2701;
osg.Texture.NEAREST_MIPMAP_LINEAR = 0x2702;
osg.Texture.LINEAR_MIPMAP_LINEAR = 0x2703;

// wrap mode
osg.Texture.CLAMP_TO_EDGE = 0x812F;
osg.Texture.REPEAT = 0x2901;
osg.Texture.MIRRORED_REPEAT = 0x8370;

// target
osg.Texture.TEXTURE_2D = 0x0DE1;

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
        this.mag_filter = osg.Texture.LINEAR;
        this.min_filter = osg.Texture.LINEAR;
        this.wrap_s = osg.Texture.CLAMP_TO_EDGE;
        this.wrap_t = osg.Texture.CLAMP_TO_EDGE;
        this.textureWidth = 0;
        this.textureHeight = 0;
        this._unrefImageDataAfterApply = false;
        this.setInternalFormat(osg.Texture.RGBA);
        this._textureTarget = osg.Texture.TEXTURE_2D;
    },
    getTextureTarget: function() { return this._textureTarget;},
    getTextureObject: function() { return this._textureObject;},
    setTextureSize: function(w,h) {
        this.textureWidth = w;
        this.textureHeight = h;
    },
    init: function(gl) {
        if (!this._textureObject) {
            this._textureObject = gl.createTexture();
            this._dirty = true;
        }
    },
    getWidth: function() { return this.textureWidth; },
    getHeight: function() { return this.textureHeight; },

    setWrapS: function(value) {
        if (typeof(value) === "string") {
            this.wrap_s = osg.Texture[value];
        } else {
            this.wrap_s = value; 
        }
    },
    setWrapT: function(value) { 
        if (typeof(value) === "string") {
            this.wrap_t = osg.Texture[value];
        } else {
            this.wrap_t = value; 
        }
    },

    setMinFilter: function(value) { 
        if (typeof(value) === "string") {
            this.min_filter = osg.Texture[value];
        } else {
            this.min_filter = value; 
        }
    },
    setMagFilter: function(value) { 
        if (typeof(value) === "string") {
            this.mag_filter = osg.Texture[value];
        } else {
            this.mag_filter = value; 
        }
    },

    setImage: function(img, imageFormat) {
        this._imageFormat = imageFormat;
        if (!this._imageFormat) {
            this._imageFormat = osg.Texture.RGBA;
        }
        this.setInternalFormat(this._imageFormat);
        this._image = img;
        this._dirty = true;
    },
    setUnrefImageDataAfterApply: function(bool) {
        this._unrefImageDataAfterApply = bool;
    },
    setInternalFormat: function(internalFormat) {
        this._internalFormat = internalFormat;
    },
    setFromCanvas: function(canvas) {
        this.setImage(canvas);
    },

    isImageReady: function() {
        var image = this._image;
        if (image && image.complete) {
            if (typeof image.naturalWidth !== "undefined" &&  image.naturalWidth === 0) {
                return false;
            }
            return true;
        }
        return false;
    },

    applyFilterParameter: function(graphicContext) {
        if (graphicContext) { // for backward compatibility
            var gl = graphicContext;
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.mag_filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.min_filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap_s);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap_t);
        if (this.min_filter === osg.Texture.NEAREST_MIPMAP_NEAREST ||
            this.min_filter === osg.Texture.LINEAR_MIPMAP_NEAREST ||
            this.min_filter === osg.Texture.NEAREST_MIPMAP_LINEAR ||
            this.min_filter === osg.Texture.LINEAR_MIPMAP_LINEAR) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    },

    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._textureObject !== undefined && !this.isDirty()) {
            gl.bindTexture(gl.TEXTURE_2D, this._textureObject);
        } else if (this.default_type) {
            gl.bindTexture(gl.TEXTURE_2D, null);
        } else {
            if (this._image !== undefined) {
                if (this.isImageReady()) {
                    if (!this._textureObject) {
                        this.init(gl);
                    }
                    this.setTextureSize(this._image.naturalWidth, this._image.naturalHeight);
                    this.setDirty(false);
                    gl.bindTexture(gl.TEXTURE_2D, this._textureObject);
                    gl.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat, this._imageFormat, gl.UNSIGNED_BYTE, this._image);
                    this.applyFilterParameter(gl);

                    if (this._unrefImageDataAfterApply) {
                        delete this._image;
                    }
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

            } else if (this.textureHeight !== 0 && this.textureWidth !== 0 ) {
                if (!this._textureObject) {
                    this.init(gl);
                }
                gl.bindTexture(gl.TEXTURE_2D, this._textureObject);
                gl.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat, this.textureWidth, this.textureHeight, 0, this._internalFormat, gl.UNSIGNED_BYTE, null);
                this.applyFilterParameter(gl);
                this.setDirty(false);
            }
        }
    },
    apply2: function(state) {
        var gl = state.getGraphicContext();
        if (this._image !== undefined) {
            if (!this.textureObject) {
                if (this.isImageReady()) {
                    if (!this.textureObject) {
                        this.init(gl);
                        this.setTextureSize(this._image.naturalWidth, this._image.naturalHeight);
                        this._dirty = false;
                    }
                    gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                    gl.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat, this._imageFormat, gl.UNSIGNED_BYTE, this._image);
                    this.applyFilterParameter(gl);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
            } else {
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            }
        } else if (this.textureHeight !== 0 && this.textureWidth !== 0 ) {
            if (!this.textureObject) {
                this.init(gl);
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                gl.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat, this.textureWidth, this.textureHeight, 0, this._internalFormat, gl.UNSIGNED_BYTE, null);
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


osg.Texture.createFromURL = function(imageSource, format) {
    var a = new osg.Texture();
    if (imageSource !== undefined) {
        var img = new Image();
        img.src = imageSource;
        a.setImage(img, format);
    }
    return a;
};
osg.Texture.createFromImg = function(img, format) {
    var a = new osg.Texture();
    a.setImage(img, format);
    return a;
};
osg.Texture.createFromCanvas = function(ctx, format) {
    var a = new osg.Texture();
    a.setFromCanvas(ctx, format);
    return a;
};

osg.Texture.create = function(url) {
    osg.log("osg.Texture.create is deprecated, use osg.Texture.createFromURL instead");
    return osg.Texture.createFromURL(url);
};
