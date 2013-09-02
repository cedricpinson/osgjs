osg.Image = function(image, format) {
    osg.Object.call(this);

    this._imageObject = image;
    this._url = undefined;
    this._width = undefined;
    this._height = undefined;
};

osg.Image.prototype = osg.objectLibraryClass( 
    osg.objectInehrit( 
        osg.Object.prototype, {

            getImage: function() { return this._imageObject; },
            getURL: function() { return this._url; },
            setURL: function( url ) { this._url = url; },
            setImage: function( img ) { this._imageObject = img; },
            isCanvas: function() { return this._imageObject instanceof HTMLCanvasElement; },
            isImage: function() { return this._imageObject instanceof Image; },
            isTypedArray: function() { return this._imageObject instanceof Uint8Array; },
            setWidth: function( w ) { this._width = w; },
            setHeight: function( h ) { this._height = h; },
            getWidth: function() { 
                if ( this.isImage() ) {
                    return this._imageObject.naturalWidth;
                } else if ( this.isCanvas() ) {
                    return this._imageObject.width;
                }
                return this._width; 
            },
            getHeight: function() { 
                if ( this.isImage() ) {
                    return this._imageObject.naturalHeight;
                } else if ( this.isCanvas() ) {
                    return this._imageObject.height;
                }
                return this._height;
            },
            isReady: function() {

                // image are ready for static data
                if ( this.isCanvas() || 
                     this.isTypedArray() ) {
                    return true;
                }

                if ( this.isImage() ) {
                    var image = this._imageObject;
                    if (image.complete) {
                        if (image.naturalWidth !== undefined &&  image.naturalWidth === 0) {
                            return false;
                        }
                        return true;
                    }
                }
                return false;
            }
        }
    ), "osg","Image");

osg.Image.prototype.objectType = osg.objectType.generate("Image");
