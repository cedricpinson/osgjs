define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Object'
], function ( MACROUTILS, StateAttribute, Object ) {

    /**
     * StateSet encapsulate StateAttribute
     * @class StateSet
     */
    var StateSet = function () {
        Object.call( this );
        this.id = StateSet.instance++;
        this.attributeMap = {};
        this.attributeMap.attributeKeys = [];

        this.textureAttributeMapList = [];

        this._binName = undefined;
        this._binNumber = 0;

        this._shaderGenerator = undefined;
    };
    StateSet.instance = 0;

    StateSet.AttributePair = function ( attr, value ) {
        this._object = attr;
        this._value = value;
    };
    StateSet.AttributePair.prototype = {
        getAttribute: function () {
            return this._object;
        },
        getUniform: function () {
            return this._object;
        },
        getValue: function () {
            return this._value;
        }
    };

    /** @lends StateSet.prototype */
    StateSet.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Object.prototype, {
        getAttributePair: function ( attribute, value ) {
            return new StateSet.AttributePair( attribute, value );
        },
        addUniform: function ( uniform, mode ) {
            if ( mode === undefined ) {
                mode = StateAttribute.ON;
            }
            if ( !this.uniforms ) {
                this.uniforms = {};
                this.uniforms.uniformKeys = [];
            }
            var name = uniform.name;
            this.uniforms[ name ] = this.getAttributePair( uniform, mode );
            if ( this.uniforms.uniformKeys.indexOf( name ) === -1 ) {
                this.uniforms.uniformKeys.push( name );
            }
        },
        getUniform: function ( uniform ) {
            if ( this.uniforms && this.uniforms[ uniform ] ) {
                return this.uniforms[ uniform ].getAttribute();
            }
            return undefined;
        },
        getUniformList: function () {
            return this.uniforms;
        },

        setTextureAttributeAndMode: function ( unit, attribute, mode ) {
            if ( mode === undefined ) {
                mode = StateAttribute.ON;
            }
            this._setTextureAttribute( unit, this.getAttributePair( attribute, mode ) );
        },
        getNumTextureAttributeLists: function () {
            return this.textureAttributeMapList.length;
        },
        getTextureAttribute: function ( unit, attribute ) {
            if ( this.textureAttributeMapList[ unit ] === undefined || this.textureAttributeMapList[ unit ][ attribute ] === undefined ) {
                return undefined;
            }
            return this.textureAttributeMapList[ unit ][ attribute ].getAttribute();
        },

        removeTextureAttribute: function ( unit, attributeName ) {
            if ( this.textureAttributeMapList[ unit ] === undefined || this.textureAttributeMapList[ unit ][ attributeName ] === undefined ) {
                return;
            }

            delete this.textureAttributeMapList[ unit ][ attributeName ];
            var idx = this.textureAttributeMapList[ unit ].attributeKeys.indexOf( attributeName );
            this.textureAttributeMapList[ unit ].attributeKeys.splice( idx, 1 );
        },

        getAttribute: function ( attributeType ) {
            if ( this.attributeMap[ attributeType ] === undefined ) {
                return undefined;
            }
            return this.attributeMap[ attributeType ].getAttribute();
        },
        setAttributeAndMode: function ( attribute, mode ) {
            if ( mode === undefined ) {
                mode = StateAttribute.ON;
            }
            this._setAttribute( this.getAttributePair( attribute, mode ) );
        },
        setAttribute: function ( attribute, mode ) {
            if ( mode === undefined ) {
                mode = StateAttribute.ON;
            }
            this._setAttribute( this.getAttributePair( attribute, mode ) );
        },

        // TODO: check if it's an attribute type or a attribute to remove it
        removeAttribute: function ( attributeName ) {
            if ( this.attributeMap[ attributeName ] !== undefined ) {
                delete this.attributeMap[ attributeName ];
                var idx = this.attributeMap.attributeKeys.indexOf( attributeName );
                this.attributeMap.attributeKeys.splice( idx, 1 );
            }
        },

        setRenderingHint: function ( hint ) {
            if ( hint === 'OPAQUE_BIN' ) {
                this.setRenderBinDetails( 0, 'RenderBin' );
            } else if ( hint === 'TRANSPARENT_BIN' ) {
                this.setRenderBinDetails( 10, 'DepthSortedBin' );
            } else {
                this.setRenderBinDetails( 0, '' );
            }
        },

        setRenderBinDetails: function ( num, binName ) {
            this._binNumber = num;
            this._binName = binName;
        },
        getAttributeMap: function () {
            return this.attributeMap;
        },
        getBinNumber: function () {
            return this._binNumber;
        },
        getBinName: function () {
            return this._binName;
        },
        setBinNumber: function ( binNum ) {
            this._binNumber = binNum;
        },
        setBinName: function ( binName ) {
            this._binName = binName;
        },
        getAttributeList: function () {
            var attributes = this.attributeMap;
            var keys = attributes.attributeKeys;
            var l = keys.length;
            var list = new Array( l );
            for ( var i = 0; i < l; i++ ) {
                list[ i ] = attributes[ keys[ i ] ];
            }
            return list;
        },
        setShaderGenerator: function ( generator ) {
            this._shaderGenerator = generator;
        },
        getShaderGenerator: function () {
            return this._shaderGenerator;
        },
        _getUniformMap: function () {
            return this.uniforms;
        },

        // for internal use, you should not call it directly
        _setTextureAttribute: function ( unit, attributePair ) {
            if ( this.textureAttributeMapList[ unit ] === undefined ) {
                this.textureAttributeMapList[ unit ] = {};
                this.textureAttributeMapList[ unit ].attributeKeys = [];
            }
            var name = attributePair.getAttribute().getTypeMember();
            this.textureAttributeMapList[ unit ][ name ] = attributePair;
            if ( this.textureAttributeMapList[ unit ].attributeKeys.indexOf( name ) === -1 ) {
                this.textureAttributeMapList[ unit ].attributeKeys.push( name );
            }
        },
        // for internal use, you should not call it directly
        _setAttribute: function ( attributePair ) {
            var name = attributePair.getAttribute().getTypeMember();
            this.attributeMap[ name ] = attributePair;
            if ( this.attributeMap.attributeKeys.indexOf( name ) === -1 ) {
                this.attributeMap.attributeKeys.push( name );
            }
        }

    } ), 'osg', 'StateSet' );
    StateSet.prototype.setTextureAttributeAndModes = StateSet.prototype.setTextureAttributeAndMode;
    StateSet.prototype.setAttributeAndModes = StateSet.prototype.setAttributeAndMode;

    return StateSet;
} );
