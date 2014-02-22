define( [
    'osg/Notify'

], function ( Notify ) {

    var TextureProfile = function( target, internalFormat, width, height ) {
        this._target = target;
        this._internalFormat = internalFormat;
        this._width = width;
        this._height = height;
        this._size = 0;
        this.computeSize();
    };

    TextureProfile.prototype = {
        match: function( textureProfile ) {
            return textureProfile._target === this._target &&
                textureProfile._internalFormat === this._internalFormat &&
                textureProfile._width === this._width &&
                textureProfile._height === this._height;
        },
        computeSize: function() {
            var Texture = require( 'osg/Texture' );

            var numBitsPerTexel = 0;
            switch( this._internalFormat) {
            case(1): numBitsPerTexel = 8; break;
            case(Texture.ALPHA): numBitsPerTexel = 8; break;
            case(Texture.LUMINANCE): numBitsPerTexel = 8; break;

            case(Texture.LUMINANCE_ALPHA): numBitsPerTexel = 16; break;
            case(2): numBitsPerTexel = 16; break;

            case(Texture.RGB): numBitsPerTexel = 24; break;
            case(3): numBitsPerTexel = 24; break;

            case(Texture.RGBA): numBitsPerTexel = 32; break;
            case(4): numBitsPerTexel = 32; break;

            }
            this._size = (Math.ceil( this._width * this._height * numBitsPerTexel)/8.0);
        },

        getSize: function() { return this._size; }

    };
    TextureProfile.getHash = function() {
        var array = Array.prototype.slice.call( arguments );
        var hash = '';
        array.forEach( function( element ) {
            hash += element;
        });
        return hash;
    };


    var TextureObject = function( texture, id, textureSet ) {
        this._texture = texture;
        this._id = id;
        this._textureSet = textureSet;
    };

    TextureObject.prototype = {
        target: function() { return this._textureSet._profile._target; },
        id: function() { return this._id; },
        getTextureSet: function() {
            return this._textureSet;
        },
        reset: function() {
            this._textureObject = null;
            this._texture = undefined;
        },
        bind: function( gl ) {
            gl.bindTexture( this.target(), this._id );
        }
    };

    var TextureObjectSet = function( profile ) {
        this._profile = profile;
        this._usedTextureObjects = [];
        this._orphanedTextureObjects = [];
    };

    TextureObjectSet.prototype = {
        getProfile: function() { return this._profile; },
        getUsedTextureObjects: function() { return this._usedTextureObjects; },
        getOrphanedTextureObjects: function() { return this._orphanedTextureObjects; },
        takeOrGenerate: function( gl, texture ) {

            var textureObject;
            if ( this._orphanedTextureObjects.length > 0 ) {
                textureObject = this.takeFromOrphans();
                textureObject.setTexture( texture );
                this._usedTextureObjects.push( textureObject );
                return textureObject;
            }

            var textureID = gl.createTexture();
            textureObject = new TextureObject( texture, textureID, this );
            this._usedTextureObjects.push( textureObject );

            return textureObject;
        },

        // get texture object from pool
        takeFromOrphans: function() {
            if ( this._orphanedTextureObjects.length ) {
                var textureObject = this._orphanedTextureObjects.pop();
                this._usedTextureObjects.push( textureObject );
                return textureObject;
            }
            return undefined;
        },

        // release texture object
        orphan: function( textureObject ) {
            var index = this._usedTextureObjects.indexOf( textureObject );
            if ( index > -1 ) {
                this._orphanedTextureObjects.push( this._usedTextureObjects[ index ] );
                this._usedTextureObjects.splice( index, 1 );
            }
        },
        flushAllDeletedTextureObjects: function( gl ) {
            var nbTextures = this._orphanedTextureObjects.length;
            var size = this.getProfile().getSize();
            this._orphanedTextureObjects.forEach( function( textureObject ) {
                gl.deleteTexture( textureObject.id() );
                textureObject.reset();
            });
            this._orphanedTextureObjects.length = 0;
            Notify.info( 'TextureManager: released ' + nbTextures + ' with ' + (nbTextures*size/(1024*1024)) + ' MB' );
        }
    };


    var TextureManager = function() {
        this._textureSetMap = {};
    };

    TextureManager.prototype = {

        generateTextureObject: function( gl,
                                         texture,
                                         target,
                                         internalFormat,
                                         width,
                                         height )
        {
            var hash = TextureProfile.getHash( target, internalFormat, width, height );

            if ( this._textureSetMap[ hash ] === undefined ) {
                 this._textureSetMap[ hash ] = new TextureObjectSet( new TextureProfile( target, internalFormat, width, height ) );
            }

            var textureSet = this._textureSetMap[ hash ];
            var textureObject = textureSet.takeOrGenerate( gl, texture );
            return textureObject;
        },
        reportStats: function() {
            var total = 0;
            Object.keys( this._textureSetMap ).forEach( function( key ) {
                var profile = this._textureSetMap[ key ].getProfile();
                var size = profile.getSize() / ( 1024 * 1024 );
                var nb = this._textureSetMap[ key ].getUsedTextureObjects().length;
                size *= nb;
                total += size ;
                Notify.notice( ''+ size + ' MB with ' + nb + ' texture of ' + profile._width +'x' + profile._height + ' ' + profile._internalFormat);
            }, this );
            Notify.notice( ''+ total + ' MB in total');

        },

        flushAllDeletedTextureObjects: function( gl ) {
            Object.keys( this._textureSetMap ).forEach( function( key ) {
                this._textureSetMap[ key ].flushAllDeletedTextureObjects( gl );
            }, this );
        },

        releaseTextureObject: function( textureObject ) {
            if ( textureObject ) {
                var ts = textureObject.getTextureSet();
                ts.orphan( textureObject );
            }
        }

    };

    return TextureManager;

});
