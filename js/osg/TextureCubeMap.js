/** 
 * TextureCubeMap
 * @class TextureCubeMap
 * @inherits osg.Texture
 */
osg.TextureCubeMap = function() {
    osg.Texture.call(this);
    this._images = {};
};

/** @lends osg.TextureCubeMap.prototype */
osg.TextureCubeMap.prototype = osg.objectInehrit(osg.Texture.prototype, {
    _className: "TextureCubeMap",
    setDefaultParameters: function() {
        osg.Texture.prototype.setDefaultParameters.call(this);
        this._textureTarget = osg.Texture.TEXTURE_CUBE_MAP;
    },
    cloneType: function() { var t = new osg.TextureCubeMap(); t.default_type = true; return t;},
    setImage: function(face, img, imageFormat) {
        if ( typeof(face) === "string" ) {
            face = osg.Texture[face];
        }

        if (this._images[face] === undefined) {
            this._images[face] = {};
        }

        if ( typeof(imageFormat) === "string") {
            imageFormat = osg.Texture[imageFormat];
        }
        if (imageFormat === undefined) {
            imageFormat = osg.Texture.RGBA;
        }

        this._images[face].image = img;
        this._images[face].format = imageFormat;
        this._images[face].dirty = true;
        this.dirty();
    },
    getImage: function(face) { return this._images[face].image; },

    applyTexImage2D_load: function(gl, target, level, internalFormat, format, type, image) {
        if (!image) {
            return false;
        }

        if (!osg.Texture.prototype.isImageReady(image)) {
            return false;
        }

        if (image instanceof Image) {
            this.setTextureSize(image.naturalWidth, image.naturalHeight);
        } else if (image instanceof HTMLCanvasElement) {
            this.setTextureSize(image.width, image.height);
        }

        gl.texImage2D(target, 0, internalFormat, format, type, image);
        return true;
    },

    _applyImageTarget: function(gl, internalFormat, target) {
        var imgObject = this._images[target];
        if (!imgObject) {
            return 0;
        }

        if (!imgObject.dirty) {
            return 1;
        }

        if (this.applyTexImage2D_load(gl,
                                      target,
                                      0,
                                      internalFormat,
                                      imgObject.format,
                                      gl.UNSIGNED_BYTE,
                                      imgObject.image) ) {
            imgObject.dirty = false;
            if (this._unrefImageDataAfterApply) {
                delete this._images[target];
            }
            return 1;
        }
        return 0;
    },

    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._textureObject !== undefined && !this.isDirty()) {
            gl.bindTexture(this._textureTarget, this._textureObject);

        } else if (this.default_type) {
            gl.bindTexture(this._textureTarget, null);
        } else {
            var images = this._images;
            if (!this._textureObject) {
                this.init(gl);
            }
            gl.bindTexture(this._textureTarget, this._textureObject);

            var internalFormat = this._internalFormat;

            var valid = 0;
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_X);
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_X);

            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);

            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
            if (valid === 6) {
                this.setDirty(false);
                this.applyFilterParameter(gl, this._textureTarget);
                this.generateMipmap(gl, this._textureTarget);
            }
        } // render to cubemap not yet implemented
    }
});
