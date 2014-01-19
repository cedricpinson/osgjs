define( [
    'osg/Utils',
    'osg/Object'
], function ( MACROUTILS, Object ) {

    var Image = function ( image ) {
        Object.call( this );

        this._imageObject = undefined;
        this._url = undefined;
        this._width = undefined;
        this._height = undefined;

        if ( image ) {
            this.setImage( image );
        }

        this._isGreyscale = undefined;
    };

    Image.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        dirty: function () {
            this._isGreyscale = undefined;
        },
        getImage: function () {
            return this._imageObject;
        },
        getURL: function () {
            return this._url;
        },
        setURL: function ( url ) {
            this._url = url;
        },
        setImage: function ( img ) {
            if ( !this._url && img && img.src ) {
                this._url = img.src;
            }
            this._imageObject = img;
            this.dirty();
        },
        isCanvas: function () {
            return this._imageObject instanceof HTMLCanvasElement;
        },
        isImage: function () {
            return this._imageObject instanceof window.Image;
        },
        isTypedArray: function () {
            return this._imageObject instanceof Uint8Array;
        },
        setWidth: function ( w ) {
            this._width = w;
        },
        setHeight: function ( h ) {
            this._height = h;
        },
        getWidth: function () {
            if ( this.isImage() ) {
                return this._imageObject.naturalWidth;
            } else if ( this.isCanvas() ) {
                return this._imageObject.width;
            }
            return this._width;
        },
        getHeight: function () {
            if ( this.isImage() ) {
                return this._imageObject.naturalHeight;
            } else if ( this.isCanvas() ) {
                return this._imageObject.height;
            }
            return this._height;
        },

        isGreyscale: function ( nbSamples ) {
            if ( this._isGreyscale !== undefined )
                return this._isGreyscale;

            if ( this._imageObject !== undefined && this.isReady() && this._isGreyscale === undefined ) {

                var canvas = this._imageObject;
                if ( !this.isCanvas() ) {
                    canvas = document.createElement( 'canvas' );
                }
                var ctx = canvas.getContext( '2d' );
                canvas.width = this._imageObject.width;
                canvas.height = this._imageObject.height;
                ctx.drawImage( this._imageObject, 0, 0 );

                var sampleX, sampleY;
                // cap sample if needed
                if ( !nbSamples ) {
                    sampleX = canvas.width;
                    sampleY = canvas.height;
                }
                if ( nbSamples > 0 ) {
                    nbSamples = Math.min( Math.min( canvas.width, canvas.height ), nbSamples );
                    sampleX = sampleY = nbSamples;
                }

                var isGreyscale = true;
                var xFactor = canvas.width / (sampleX );
                var yFactor = canvas.height / (sampleY );
                for ( var i = 0; i < sampleX; i++ ) {
                    for ( var j = 0; j < sampleY; j++ ) {
                        var x = Math.floor( xFactor * ( i + 0.5 ) ),
                            y = Math.floor( yFactor * ( j + 0.5 ) );
                        var data = ctx.getImageData( x, y, 1, 1 ).data;
                        if ( !( data[ 0 ] === data[ 1 ] && data[ 0 ] === data[ 2 ]) ) {
                            isGreyscale = false;
                            break;
                        }
                    }
                }
                this._isGreyscale = isGreyscale;
            }

            return this._isGreyscale;
        },

        isReady: function () {

            // image are ready for static data
            if ( this.isCanvas() ||
                this.isTypedArray() ) {
                return true;
            }

            if ( this.isImage() ) {
                var image = this._imageObject;
                if ( image.complete ) {
                    if ( image.naturalWidth !== undefined && image.naturalWidth === 0 ) {
                        return false;
                    }
                    return true;
                }
            }
            return false;
        }
    } ), 'osg', 'Image' );

    MACROUTILS.setTypeID( Image );

    return Image;
} );
