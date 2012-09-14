/** -*- compile-command: "jslint-cli Texture.js" -*- */

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
osg.Texture.TEXTURE_CUBE_MAP = 0x8513;
osg.Texture.TEXTURE_BINDING_CUBE_MAP       = 0x8514;
osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;
osg.Texture.MAX_CUBE_MAP_TEXTURE_SIZE      = 0x851C;

osg.Texture.UNSIGNED_BYTE = 0x1401;
osg.Texture.FLOAT = 0x1406;


/** @lends osg.Texture.prototype */
osg.Texture.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Texture",
    _className: "Texture",
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
            uniforms.texture = osg.Uniform.createInt1(unit, name);
            uniforms.uniformKeys = Object.keys(uniforms);
            osg.Texture.uniforms[unit] = uniforms;
        }
        // uniform for an texture attribute should directly in osg.Texture.uniforms[unit] and not in osg.Texture.uniforms[unit][Texture0]
        return osg.Texture.uniforms[unit];
    },
    setDefaultParameters: function() {
        this._magFilter = osg.Texture.LINEAR;
        this._minFilter = osg.Texture.LINEAR;
        this._wrapS = osg.Texture.CLAMP_TO_EDGE;
        this._wrapT = osg.Texture.CLAMP_TO_EDGE;
        this._textureWidth = 0;
        this._textureHeight = 0;
        this._unrefImageDataAfterApply = false;
        this.setInternalFormat(osg.Texture.RGBA);
        this._textureTarget = osg.Texture.TEXTURE_2D;
        this._type = osg.Texture.UNSIGNED_BYTE;
    },
    getTextureTarget: function() { return this._textureTarget;},
    getTextureObject: function() { return this._textureObject;},
    setTextureSize: function(w,h) {
        this._textureWidth = w;
        this._textureHeight = h;
    },
    init: function(gl) {
        if (!this._textureObject) {
            this._textureObject = gl.createTexture();
            this.dirty();
        }
    },
    getWidth: function() { return this._textureWidth; },
    getHeight: function() { return this._textureHeight; },
    releaseGLObjects: function(gl) {
        if (this._textureObject !== undefined && this._textureObject !== null) {
            gl.deleteTexture(this._textureObject);
            this._textureObject = null;
            this._image = undefined;
        }
    },
    setWrapS: function(value) {
        if (typeof(value) === "string") {
            this._wrapS = osg.Texture[value];
        } else {
            this._wrapS = value; 
        }
    },
    setWrapT: function(value) { 
        if (typeof(value) === "string") {
            this._wrapT = osg.Texture[value];
        } else {
            this._wrapT = value; 
        }
    },

    getWrapT: function() { return this._wrapT; },
    getWrapS: function() { return this._wrapS; },
    getMinFilter: function(value) { return this._minFilter; },
    getMagFilter: function(value) { return this._magFilter; },

    setMinFilter: function(value) {
        if (typeof(value) === "string") {
            this._minFilter = osg.Texture[value];
        } else {
            this._minFilter = value; 
        }
    },
    setMagFilter: function(value) { 
        if (typeof(value) === "string") {
            this._magFilter = osg.Texture[value];
        } else {
            this._magFilter = value; 
        }
    },

    setImage: function(img, imageFormat) {
        this._image = img;
        this.setImageFormat(imageFormat);
        this.dirty();
    },
    getImage: function() { return this._image; },
    setImageFormat: function(imageFormat) {
        if (imageFormat) {
            if (typeof(imageFormat) === "string") {
                imageFormat = osg.Texture[imageFormat];
            }
            this._imageFormat = imageFormat;
        } else {
            this._imageFormat = osg.Texture.RGBA;
        }
        this.setInternalFormat(this._imageFormat);
    },
    setType: function(value) {
        if (typeof(value) === "string") {
            this._type = osg.Texture[value];
        } else {
            this._type = value; 
        }
    },
    setUnrefImageDataAfterApply: function(bool) {
        this._unrefImageDataAfterApply = bool;
    },
    setInternalFormat: function(internalFormat) { this._internalFormat = internalFormat; },
    getInternalFormat: function() { return this._internalFormat; },
    setFromCanvas: function(canvas, format) {
        this.setImage(canvas, format);
    },
    setFromTypedArray: function(rawData, format) {
        this.setImage(rawData, format);
    },

    isImageReady: function(image) {
        if (image) {
            if (image instanceof Image) {
                if (image.complete) {
                    if (image.naturalWidth !== undefined &&  image.naturalWidth === 0) {
                        return false;
                    }
                    return true;
                }
            } else if (image instanceof HTMLCanvasElement) {
                return true;
            } else if (image instanceof Uint8Array) {
                return true;
            }
        }
        return false;
    },

    applyFilterParameter: function(gl, target) {
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, this._magFilter);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, this._minFilter);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, this._wrapS);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, this._wrapT);
    },

    generateMipmap: function(gl, target) {
        if (this._minFilter === gl.NEAREST_MIPMAP_NEAREST ||
            this._minFilter === gl.LINEAR_MIPMAP_NEAREST ||
            this._minFilter === gl.NEAREST_MIPMAP_LINEAR ||
            this._minFilter === gl.LINEAR_MIPMAP_LINEAR) {
            gl.generateMipmap(target);
        }
    },

    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._textureObject !== undefined && !this.isDirty()) {
            gl.bindTexture(this._textureTarget, this._textureObject);
        } else if (this.default_type) {
            gl.bindTexture(this._textureTarget, null);
        } else {
            var image = this._image;
            if (image !== undefined) {
                if (this.isImageReady(image)) {
                    if (!this._textureObject) {
                        this.init(gl);
                    }

                    this.setDirty(false);
                    gl.bindTexture(this._textureTarget, this._textureObject);

                    if (image instanceof Image) {
                        this.setTextureSize(image.naturalWidth, image.naturalHeight);
                        gl.texImage2D(this._textureTarget, 0, this._internalFormat, this._imageFormat, this._type, this._image);

                    } else if (image instanceof HTMLCanvasElement) {
                        this.setTextureSize(image.width, image.height);
                        gl.texImage2D(this._textureTarget, 0, this._internalFormat, this._imageFormat, this._type, this._image);

                    } else if (image instanceof Uint8Array) {
                        gl.texImage2D(this._textureTarget, 0, this._internalFormat, this._textureWidth, this._textureHeight, 0, this._internalFormat, this._type, this._image);
                    }

                    this.applyFilterParameter(gl, this._textureTarget);
                    this.generateMipmap(gl, this._textureTarget);

                    if (this._unrefImageDataAfterApply) {
                        this._image = undefined;
                    }
                } else {
                    gl.bindTexture(this._textureTarget, null);
                }

            } else if (this._textureHeight !== 0 && this._textureWidth !== 0 ) {
                if (!this._textureObject) {
                    this.init(gl);
                }
                gl.bindTexture(this._textureTarget, this._textureObject);
                gl.texImage2D(this._textureTarget, 0, this._internalFormat, this._textureWidth, this._textureHeight, 0, this._internalFormat, this._type, null);
                this.applyFilterParameter(gl, this._textureTarget);
                this.generateMipmap(gl, this._textureTarget);
                this.setDirty(false);
            }
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

    generateShader: function(unit, type)
    {
        if (this[type]) {
            return this[type].call(this,unit);
        }
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
    var texture = new osg.Texture();
    osgDB.Promise.when(osgDB.readImage(imageSource)).then(
        function(img) {
            texture.setImage(img, format);
        }
    );
    return texture;
};
osg.Texture.createFromImg = function(img, format) {
    var a = new osg.Texture();
    a.setImage(img, format);
    return a;
};
osg.Texture.createFromImage = osg.Texture.createFromImg;
osg.Texture.createFromCanvas = function(ctx, format) {
    var a = new osg.Texture();
    a.setFromCanvas(ctx, format);
    return a;
};

osg.Texture.create = function(url) {
    osg.log("osg.Texture.create is deprecated, use osg.Texture.createFromURL instead");
    return osg.Texture.createFromURL(url);
};
