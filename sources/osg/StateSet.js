define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Object',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Object, Map ) {

    /**
     * StateSet encapsulate StateAttribute
     * @class StateSet
     */
    var StateSet = function () {
        Object.call( this );
        this.id = StateSet.instance++;

        this.attributeMap = new Map();

        this.textureAttributeMapList = [];

        this._binName = undefined;
        this._binNumber = 0;

        this._shaderGenerator = undefined;

        this.uniforms = new Map();

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

            var name = uniform.name;
            this.uniforms.getMap()[ name ] = this.getAttributePair( uniform, mode );
            this.uniforms.dirty();
        },
        getUniform: function ( uniform ) {
            var map = this.uniforms.getMap();
            if ( map[ uniform ] ) return map[ uniform ].getAttribute();

            return undefined;
        },
        getUniformList: function () {
            return this.uniforms.getMap();
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
            if ( this.textureAttributeMapList[ unit ] === undefined ) return undefined;

            var textureMapContent = this.textureAttributeMapList[ unit ].getMap();
            if ( textureMapContent[ attribute ] === undefined ) return undefined;

            return textureMapContent[ attribute ].getAttribute();
        },

        removeTextureAttribute: function ( unit, attributeName ) {
            if ( this.textureAttributeMapList[ unit ] === undefined ) return;

            var textureAttributeMapContent = this.textureAttributeMapList[ unit ].getMap();
            if ( textureAttributeMapContent[ attributeName ] === undefined ) return;


            delete textureAttributeMapContent[ attributeName ];
            this.textureAttributeMapList[ unit ].dirty();
        },

        getAttribute: function ( attributeType ) {
            if ( this.attributeMap.getMap()[ attributeType ] === undefined ) {
                return undefined;
            }
            return this.attributeMap.getMap()[ attributeType ].getAttribute();
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

            if ( this.attributeMap.getMap()[ attributeName ] !== undefined ) {
                delete this.attributeMap.getMap()[ attributeName ];
                this.attributeMap.dirty();
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
            var attributeMapKeys = attributes.getKeys();
            var attributeMapContent = attributes.getMap();
            var l = attributeMapKeys.length;
            var list = new Array( l );
            for ( var i = 0; i < l; i++ ) {
                list[ i ] = attributeMapContent[ attributeMapKeys[ i ] ];
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
                this.textureAttributeMapList[ unit ] = new Map();
            }

            var name = attributePair.getAttribute().getTypeMember();
            var textureUnitAttributeMap = this.textureAttributeMapList[ unit ];

            var textureUnitAttributeMapContent = textureUnitAttributeMap.getMap();
            textureUnitAttributeMapContent[ name ] = attributePair;
            textureUnitAttributeMap.dirty();

        },

        // for internal use, you should not call it directly
        _setAttribute: function ( attributePair ) {

            var name = attributePair.getAttribute().getTypeMember();
            this.attributeMap.getMap()[ name ] = attributePair;
            this.attributeMap.dirty();

        }

    } ), 'osg', 'StateSet' );
    StateSet.prototype.setTextureAttributeAndModes = StateSet.prototype.setTextureAttributeAndMode;
    StateSet.prototype.setAttributeAndModes = StateSet.prototype.setAttributeAndMode;

    return StateSet;
} );
