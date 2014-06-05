define ( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Uniform',
    'osg/Map',
    'osg/Texture'
] , function(  MACROUTILS,  StateAttribute, Map, Uniform, TextureProxy ) {


    var TextureMaterial = function( texture, channelName ) {
        this._realType = null;
        this._texture = texture;
        this._channel = new TextureMaterial.Channel( channelName );
        this._texCoordUnit = undefined;
        this._usePremultiplyAlpha = false;
        this._useAlpha = false;
        this._sRGB = true;
        this._samplerName = 'sTexture'+ channelName;
    };

    TextureMaterial.ChannelType = [ 'DiffuseColor',
                                    'DiffuseIntensity',
                                    'Opacity',
                                    'SpecularColor',
                                    'SpecularHardness',
                                    'EmitColor',
                                    'MirrorCubemap',
                                    'AlphaMask',
                                    'Geometry'
                                  ];

    TextureMaterial.uniforms = [];
    TextureMaterial.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {
        attributeType: 'Texture',
        channelType: TextureMaterial.ChannelType,

        // must return 'Normal' or 'Bump'
        getRealType: function () {
            if ( this._realType === null && this.getImage().isReady() ) {
                this._realType = ( this.getImage().isGreyscale( 5 ) ) ? 'Bump' : 'Normal' ;
            }
            return this._realType;
        },
        setRealType: function(t) { this._realType = t; },
        getImage: function() { return this._texture.getImage(); },
        cloneType: function() { var t = new TextureMaterial(new TextureProxy()); return t;},
        getTexture: function() { return this._texture; },
        setPremultiplyAlpha: function(v) { this._usePremultiplyAlpha = v;},
        getPremultiplyAlpha: function() { return this._usePremultiplyAlpha;},
        setUseAlpha: function(v) { this._useAlpha = v;},
        getUseAlpha: function() { return this._useAlpha;},
        setSRGB: function(v) { this._sRGB = v;},
        getSRGB: function() { return this._sRGB;},
        setTexture: function( texture ) { this._texture = texture; },
        setTexCoordUnit: function(unit) { this._texCoordUnit = unit;},
        getTexCoordUnit: function() { return this._texCoordUnit;},
        getType: function() { return this.attributeType;},
        getTypeMember: function() { return this.attributeType; },
        setFactor: function( factor ) { this._channel.setFactor( factor ); },
        getChannelType: function() { return this.channelType; },
        getChannel: function() { return this._channel; },
        dirty: function() { this._dirty= true;},
        setDirty: function(bool) { this._dirty= bool; },

        getOrCreateUniformSharedOnTextureUnit: function() {
            var map = TextureMaterial.uniformsSharedOnTextureUnit;

            if ( map )
                return map;

            // handle texture unit uniform here
            // Here there is an issue because we need to add the used uniform for
            // this channel name
            var uniforms = {};
            TextureMaterial.ChannelType.forEach( function( channelName ) {

                var uniformTextureUnitName = 'sTexture'+ channelName;
                if ( !uniforms[ uniformTextureUnitName ] ) {
                    uniforms[ uniformTextureUnitName ] = Uniform.createInt( 0, uniformTextureUnitName );
                }

                var uniformName = 'u' + channelName + 'Factor';
                uniforms [ channelName ] = Uniform.createFloat1( uniformName );

                if ( channelName === 'Geometry' ) { // give the texture size only for bump mapping
                    uniformName = 'uTextureGeometrySize';
                    uniforms[ channelName + 'Size' ] = Uniform.createFloat2( [ 0.0, 0.0 ], uniformName );
                }

            });

            TextureMaterial.uniformsSharedOnTextureUnit = new Map( uniforms );

            return TextureMaterial.uniformsSharedOnTextureUnit;
        },

        getOrCreateUniforms: function ( unit ) {
            var obj = TextureMaterial.uniforms;

            if ( obj[ unit ] ) return obj[ unit ];

            var uniformMap = this.getOrCreateUniformSharedOnTextureUnit();
            obj[ unit ] = uniformMap;

            return obj[ unit ];
        },

        getSamplerName: function() {
            return this._samplerName;
        },

        apply: function ( state, unit ) {
            if ( this._texture !== undefined )
                this._texture.apply( state );

            var channelName = this._channel.getName();

            // no channel name, it must be a clone type
            if ( !channelName ) {
                return;
            }

            var uniformMap = this.getOrCreateUniforms( unit );

            if ( uniformMap[ channelName ].get()[ 0 ] !== this._channel.getFactor() ) {
                uniformMap[ channelName ].get()[ 0 ] = this._channel.getFactor();
                uniformMap[ channelName ].dirty();
            }

            var textureSampler = uniformMap[ this.getSamplerName() ];
            if ( textureSampler.get()[0] !== unit ) {
                textureSampler.get()[0] = unit;
                textureSampler.dirty();
            }

            if ( channelName === 'Geometry' ) {
                uniformMap[ 'GeometrySize' ].get()[ 0 ] = this._texture.getWidth();
                uniformMap[ 'GeometrySize' ].get()[ 1 ] = this._texture.getHeight();
                uniformMap[ 'GeometrySize' ].dirty();
            }

        },

        getHash: function() {
            var hash = [ this.className() ];

            var tag = this._channel.getName();
            var texture = this.getTexture();
            if (texture !== undefined)
                tag += ':' + texture.getInternalFormat();
            hash.push( tag );

            return [
                hash.join( ', ' ),
                this._realType,
                this._texCoordUnit,
                this._sRGB,
                this._usePremultiplyAlpha,
                this._useAlpha
            ].join( ' / ' );
        }
    }), 'osgShader' , 'TextureMaterial' );

    MACROUTILS.setTypeID( TextureMaterial );

    TextureMaterial.Channel = function( name, amount ) {
        this._name = name;
        var f = amount;
        if (f === undefined) {
            f = 1.0;
        }
        this._factor = f;
    };

    TextureMaterial.Channel.prototype = {
        setName: function(n) { this._name = n;},
        getName: function() { return this._name;},
        setFactor: function(n) { this._factor = n;},
        getFactor: function() { return this._factor;}
    };

    return TextureMaterial;

});
