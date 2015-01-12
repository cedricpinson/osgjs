define( [
    'osg/Map',
    'osg/Notify',
    'osg/Object',
    'osg/StateAttribute',
    'osg/Utils',

], function ( Map, Notify, Object, StateAttribute, MACROUTILS ) {

    'use strict';

    /** Stores a set of modes and attributes which represent a set of OpenGL state.
     *  Notice that a \c StateSet contains just a subset of the whole OpenGL state.
     * <p>In OSG, each \c Drawable and each \c Node has a reference to a
     * \c StateSet. These <tt>StateSet</tt>s can be shared between
     * different <tt>Drawable</tt>s and <tt>Node</tt>s (that is, several
     * <tt>Drawable</tt>s and <tt>Node</tt>s can reference the same \c StateSet).
     * Indeed, this practice is recommended whenever possible,
     * as this minimizes expensive state changes in the graphics pipeline.
     */
    var StateSet = function () {
        Object.call( this );

        this.attributeMap = new Map();

        this.textureAttributeMapList = [];

        this._binName = undefined;
        this._binNumber = 0;

        this._shaderGeneratorName = undefined;
        this._updateCallbackList = [];

        this.uniforms = new Map();

    };

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


    StateSet.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {
        getAttributePair: function ( attribute, value ) {
            return new StateSet.AttributePair( attribute, value );
        },
        addUniform: function ( uniform, mode ) {
            if ( mode === undefined ) {
                mode = StateAttribute.ON;
            }

            var name = uniform.name;
            this.uniforms[ name ] = this.getAttributePair( uniform, mode );
            this.uniforms.dirty();
        },
        removeUniform: function ( uniform ) {
            this.uniforms.remove( uniform.getName() );
        },
        removeUniformByName: function ( uniformName ) {
            this.uniforms.remove( uniformName );
        },
        getUniform: function ( uniform ) {
            var uniformMap = this.uniforms;
            if ( uniformMap[ uniform ] ) return uniformMap[ uniform ].getAttribute();

            return undefined;
        },
        getUniformList: function () {
            return this.uniforms;
        },

        setTextureAttributeAndModes: function ( unit, attribute, mode ) {
            if ( mode === undefined ) {
                mode = StateAttribute.ON;
            }
            this._setTextureAttribute( unit, this.getAttributePair( attribute, mode ) );
        },
        setTextureAttributeAndMode: function ( unit, attribute, mode ) {
            Notify.log( 'StateSet.setTextureAttributeAndMode is deprecated, insteady use setTextureAttributeAndModes' );
            this.setTextureAttributeAndModes( unit, attribute, mode );
        },

        getNumTextureAttributeLists: function () {
            return this.textureAttributeMapList.length;
        },
        getTextureAttribute: function ( unit, attribute ) {
            if ( this.textureAttributeMapList[ unit ] === undefined ) return undefined;

            var textureMap = this.textureAttributeMapList[ unit ];
            if ( textureMap[ attribute ] === undefined ) return undefined;

            return textureMap[ attribute ].getAttribute();
        },

        removeTextureAttribute: function ( unit, attributeName ) {
            if ( this.textureAttributeMapList[ unit ] === undefined ) return;

            var textureAttributeMap = this.textureAttributeMapList[ unit ];
            if ( textureAttributeMap[ attributeName ] === undefined ) return;


            textureAttributeMap.remove( attributeName );
            this.textureAttributeMapList[ unit ].dirty();
        },

        getAttribute: function ( attributeType ) {
            if ( this.attributeMap[ attributeType ] === undefined ) {
                return undefined;
            }
            return this.attributeMap[ attributeType ].getAttribute();
        },

        setAttributeAndModes: function ( attribute, mode ) {
            if ( mode === undefined ) {
                mode = StateAttribute.ON;
            }
            this._setAttribute( this.getAttributePair( attribute, mode ) );
        },

        setAttributeAndMode: function ( attribute, mode ) {
            Notify.log( 'StateSet.setAttributeAndMode is deprecated, insteady use setAttributeAndModes' );
            this.setAttributeAndModes( attribute, mode );
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

        getUpdateCallbackList: function () {
            return this._updateCallbackList;
        },
        removeUpdateCallback: function ( cb ) {
            var arrayIdx = this._updateCallbackList.indexOf( cb );
            if ( arrayIdx !== -1 )
                this._updateCallbackList.splice( arrayIdx, 1 );
        },
        addUpdateCallback: function ( cb ) {
            this._updateCallbackList.push( cb );
        },
        hasUpdateCallback: function ( cb ) {
            return this._updateCallbackList.indexOf( cb ) !== -1;
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
            var attributeMap = this.attributeMap;
            var attributeMapKeys = attributeMap.getKeys();

            var l = attributeMapKeys.length;
            var list = [];
            for ( var i = 0; i < l; i++ ) {
                list.push( attributeMap[ attributeMapKeys[ i ] ] );
            }
            return list;
        },
        setShaderGeneratorName: function ( generatorName ) {
            this._shaderGeneratorName = generatorName;
        },
        getShaderGeneratorName: function () {
            return this._shaderGeneratorName;
        },
        releaseGLObjects: function ( state ) {
            // TODO: We should release Program/Shader attributes too
            for ( var i = 0, j = this.textureAttributeMapList.length; i < j; i++ ) {
                this.getTextureAttribute( i, 'Texture' ).releaseGLObjects( state );
            }
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

            textureUnitAttributeMap[ name ] = attributePair;
            textureUnitAttributeMap.dirty();

        },

        // for internal use, you should not call it directly
        _setAttribute: function ( attributePair ) {

            var name = attributePair.getAttribute().getTypeMember();
            this.attributeMap[ name ] = attributePair;
            this.attributeMap.dirty();

        }

    } ), 'osg', 'StateSet' );

    return StateSet;
} );
