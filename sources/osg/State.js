'use strict';
var Map = require( 'osg/Map' );
var Matrix = require( 'osg/Matrix' );
var Notify = require( 'osg/Notify' );
var Object = require( 'osg/Object' );
var Program = require( 'osg/Program' );
var StateAttribute = require( 'osg/StateAttribute' );
var Stack = require( 'osg/Stack' );
var Uniform = require( 'osg/Uniform' );
var MACROUTILS = require( 'osg/Utils' );
var WebGLCaps = require( 'osg/WebGLCaps' );

var State = function ( shaderGeneratorProxy ) {
    Object.call( this );

    this._graphicContext = undefined;
    this._shaderGeneratorProxy = shaderGeneratorProxy;

    if ( shaderGeneratorProxy === undefined )
        console.break();

    this._currentVAO = null;
    this._currentIndexVBO = null;

    this.vertexAttribList = [];
    this.stateSets = new Stack();
    this._shaderGeneratorNames = new Stack();
    this.uniforms = new Map();

    this.textureAttributeMapList = [];

    this.attributeMap = new Map();

    this.modelWorldMatrix = Uniform.createMatrix4( Matrix.create(), 'ModelWorldMatrix' );
    this.viewMatrix = Uniform.createMatrix4( Matrix.create(), 'ViewMatrix' );
    this.modelViewMatrix = Uniform.createMatrix4( Matrix.create(), 'ModelViewMatrix' );
    this.projectionMatrix = Uniform.createMatrix4( Matrix.create(), 'ProjectionMatrix' );
    this.normalMatrix = Uniform.createMatrix4( Matrix.create(), 'NormalMatrix' );

    // track uniform for color array enabled
    var arrayColorEnable = new Stack();
    arrayColorEnable.globalDefault = Uniform.createFloat1( 0.0, 'ArrayColorEnabled' );

    this.uniforms.setMap( {
        ArrayColorEnabled: arrayColorEnable
    } );


    this._previousColorAttribPair = {};
    this.vertexAttribMap = {};
    this.vertexAttribMap._disable = [];
    this.vertexAttribMap._keys = [];

    this._frameStamp = undefined;

    // we dont use Map because in this use case with a few entries
    // {} is faster
    this._programCommonUniformsCache = {};

    // keep pointer on the last applied modelview matrix
    this._modelViewMatrix = undefined;
    // keep pointer on the last applied projection matrix
    this._projectionMatrix = undefined;


    // keep track of last applied program
    this._program = undefined;
    // inject a default program to initialize the stack Program
    this.applyAttribute( new Program() );

    this._numPushStateSet = 0;
};

State.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

    getCacheUniformsApplyRenderLeaf: function () {
        return this._programCommonUniformsCache;
    },

    setGraphicContext: function ( graphicContext ) {
        this._graphicContext = graphicContext;
        this._extVAO = WebGLCaps.instance( graphicContext ).getWebGLExtension( 'OES_vertex_array_object' );
    },

    getGraphicContext: function () {
        return this._graphicContext;
    },

    getShaderGeneratorProxy: function () {
        return this._shaderGeneratorProxy;
    },

    pushCheckOverride: function ( stack, object, maskValue ) {
        // object can be a Uniform, an Attribute, or a shader generator name
        if ( stack.values().length === 0 ) {
            stack.push( this.getObjectPair( object, maskValue ) );
        } else if ( ( stack.back().value & StateAttribute.OVERRIDE ) && !( maskValue & StateAttribute.PROTECTED ) ) {
            stack.push( stack.back() );
        } else {
            stack.push( this.getObjectPair( object, maskValue ) );
        }
    },

    pushStateSet: function ( stateset ) {
        this._numPushStateSet++;
        this.stateSets.push( stateset );

        if ( stateset.attributeMap ) {
            this.pushAttributeMap( this.attributeMap, stateset.attributeMap );
        }

        if ( stateset.textureAttributeMapList ) {
            var list = stateset.textureAttributeMapList;
            for ( var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++ ) {
                if ( !list[ textureUnit ] ) {
                    continue;
                }

                var textureUnitAttributeMap = this.getOrCreateTextureAttributeMap( textureUnit );
                this.pushAttributeMap( textureUnitAttributeMap, list[ textureUnit ] );
            }
        }

        if ( stateset.uniforms ) {
            this.pushUniformsList( this.uniforms, stateset.uniforms );
        }
        var generatorPair = stateset.getShaderGeneratorPair();
        if ( generatorPair )
            this.pushCheckOverride( this._shaderGeneratorNames, generatorPair.getShaderGeneratorName(), generatorPair.getValue() );
    },

    getStateSetStackSize: function () {
        return this.stateSets.values().length;
    },

    insertStateSet: ( function () {
        var tmpStack = [];

        return function ( pos, stateSet ) {

            tmpStack.length = 0;
            var length = this.getStateSetStackSize();
            while ( length > pos ) {
                tmpStack.push( this.stateSets.back() );
                this.popStateSet();
                length--;
            }

            this.pushStateSet( stateSet );

            for ( var i = tmpStack.length - 1; i >= 0; i-- ) {
                this.pushStateSet( tmpStack[ i ] );
            }

        };
    } )(),

    removeStateSet: ( function () {
        var tmpStack = [];

        return function ( pos ) {

            var length = this.getStateSetStackSize();
            if ( pos >= length ) {
                Notify.warn( 'Warning State:removeStateSet ', pos, ' out of range' );
                return;
            }

            tmpStack.length = 0;

            // record the StateSet above the one we intend to remove
            while ( length - 1 > pos ) {
                tmpStack.push( this.stateSets.back() );
                this.popStateSet();
                length--;
            }

            // remove the intended StateSet as well
            this.popStateSet();

            // push back the original ones that were above the remove StateSet
            for ( var i = tmpStack.length - 1; i >= 0; i-- ) {
                this.pushStateSet( tmpStack[ i ] );
            }

        };
    } )(),


    // needed because we use a cache during the frame to avoid
    // applying uniform or operation. At each frame we need to
    // invalidate those informations
    resetCacheFrame: function () {
        this._modelViewMatrix = this._projectionMatrix = undefined;
    },

    resetStats: function () {
        this._numPushStateSet = 0;
    },

    // apply program if needed
    applyProgram: function ( program ) {
        if ( this._program === program ) return;
        this._program = program;
        this.getGraphicContext().useProgram( program );
    },

    applyModelViewMatrix: ( function () {

        var normal = Matrix.create();

        return function StateApplyModelViewMatrix ( matrix ) {

            if ( this._modelViewMatrix === matrix ) return false;

            var program = this.getLastProgramApplied();

            var mu = this.modelViewMatrix;
            var mul = program._uniformsCache[ mu.getName() ];
            if ( mul ) {

                mu.setInternalArray( matrix );
                mu.apply( this.getGraphicContext(), mul );
            }

            var sendNormal;
            if ( this._modelViewMatrix ) {
                sendNormal = false;
                // check if we need to push normal
                // test rotation component, if not diff
                // we dont need to send normal
                for ( var i = 0; i < 11; i++ ) {
                    if ( matrix[ i ] !== this._modelViewMatrix[ i ] ) {
                        sendNormal = true;
                        break;
                    }
                }
            } else {
                sendNormal = true;
            }

            if ( sendNormal ) {
                mu = this.normalMatrix;
                mul = program._uniformsCache[ mu.getName() ];
                if ( mul ) {
                    Matrix.copy( matrix, normal );

                    normal[ 12 ] = 0.0;
                    normal[ 13 ] = 0.0;
                    normal[ 14 ] = 0.0;

                    Matrix.inverse( normal, normal );
                    Matrix.transpose( normal, normal );

                    mu.setInternalArray( normal );
                    mu.apply( this.getGraphicContext(), mul );
                }
            }

            this._modelViewMatrix = matrix;
            return true;
        };
    } )(),

    applyProjectionMatrix: function ( matrix ) {

        if ( this._projectionMatrix === matrix ) return;

        this._projectionMatrix = matrix;
        var program = this.getLastProgramApplied();
        var mu = this.projectionMatrix;

        var mul = program._uniformsCache[ mu.getName() ];
        if ( mul ) {

            mu.setInternalArray( matrix );
            mu.apply( this.getGraphicContext(), mul );

        }
    },

    applyStateSet: function ( stateset ) {
        this.pushStateSet( stateset );
        this.apply();
        this.popStateSet();
    },

    getStateSetStackHash: function () {
        var values = this.stateSets.values();
        var sum = 0;
        for ( var i = 0, l = values.length; i < l; i++ )
            sum += values[ i ].getInstanceID();
        return sum;
    },

    popAllStateSets: function () {
        while ( this.stateSets.values().length ) {
            this.popStateSet();
        }
    },

    popStateSet: function () {

        if ( this.stateSets.empty() ) return;

        var stateset = this.stateSets.pop();

        if ( stateset.attributeMap ) {
            this.popAttributeMap( this.attributeMap, stateset.attributeMap );
        }

        if ( stateset.textureAttributeMapList ) {
            var list = stateset.textureAttributeMapList;
            for ( var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++ ) {
                if ( !list[ textureUnit ] ) {
                    continue;
                }
                this.popAttributeMap( this.textureAttributeMapList[ textureUnit ], list[ textureUnit ] );
            }
        }

        if ( stateset.uniforms ) {
            this.popUniformsList( this.uniforms, stateset.uniforms );
        }

        if ( stateset.getShaderGeneratorPair() ) {
            this._shaderGeneratorNames.pop();
        }
    },

    haveAppliedAttribute: function ( attribute ) {

        var key = attribute.getTypeMember();
        var attributeStack = this.attributeMap[ key ];
        attributeStack.lastApplied = attribute;
        attributeStack.asChanged = true;

    },

    applyAttribute: function ( attribute ) {

        var key = attribute.getTypeMember();

        var attributeMap = this.attributeMap;
        var attributeStack = attributeMap[ key ];

        if ( !attributeStack ) {
            attributeStack = new Stack();
            attributeMap[ key ] = attributeStack;
            attributeMap[ key ].globalDefault = attribute.cloneType();
            this.attributeMap.dirty();
        }

        if ( attributeStack.lastApplied !== attribute ) {

            if ( attribute.apply ) {
                attribute.apply( this );
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },

    applyTextureAttribute: function ( unit, attribute ) {


        var gl = this.getGraphicContext();
        gl.activeTexture( gl.TEXTURE0 + unit );
        var key = attribute.getTypeMember();


        if ( !this.textureAttributeMapList[ unit ] ) {
            this.textureAttributeMapList[ unit ] = new Map();
        }

        var textureUnitAttributeMap = this.getOrCreateTextureAttributeMap( unit );
        var attributeStack = textureUnitAttributeMap[ key ];

        if ( !attributeStack ) {

            attributeStack = new Stack();
            textureUnitAttributeMap[ key ] = attributeStack;
            textureUnitAttributeMap.dirty();
            attributeStack.globalDefault = attribute.cloneType();

        }

        if ( attributeStack.lastApplied !== attribute ) {

            if ( attribute.apply ) {

                // there is a texture we bind it.
                attribute.apply( this, unit );

                // TODO: optimization:
                // if attribute.isTextureNull()
                // only bind if last Framebuffer Texture Binded
                // are the same as those we try to write from
                // need rewrite of the fbo attachments system to keep history
                // and state to keep last fbo textures binded.
                // (applyTextureAttributeStack concerned too)
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },

    getLastProgramApplied: function () {
        return this.attributeMap.Program.lastApplied;
    },

    applyDefault: function () {
        // reset GL State To Default
        // we skip the textures/uniforms/shaders call since they are not necessary

        // noticed that we accumulate lot of stack, maybe because of the stateGraph
        // CP: ^^ really ? check it / report an issue
        this.popAllStateSets();

        this.applyAttributeMap( this.attributeMap );
        this.applyTextureAttributeMapList( this.textureAttributeMapList );
    },

    apply: function () {

        var lastProgram = this.getLastProgramApplied();

        this.applyAttributeMap( this.attributeMap );
        this.applyTextureAttributeMapList( this.textureAttributeMapList );

        var generatedProgram = this._generateAndApplyProgram();

        if ( generatedProgram ) {
            // will cache uniform and apply them with the program

            this._applyGeneratedProgramUniforms( this.attributeMap.Program.lastApplied );

        } else {

            // custom program so we will iterate on uniform from the program and apply them
            // but in order to be able to use Attribute in the state graph we will check if
            // our program want them. It must be defined by the user
            this._applyCustomProgramUniforms( this.attributeMap.Program.lastApplied );

        }

        // reset reference of last applied matrix
        if ( lastProgram !== this.getLastProgramApplied() ) {
            this._modelViewMatrix = undefined;
            this._projectionMatrix = undefined;
        }
    },


    applyAttributeMap: function ( attributeMap ) {

        var attributeStack;
        var attributeMapKeys = attributeMap.getKeys();

        for ( var i = 0, l = attributeMapKeys.length; i < l; i++ ) {
            var key = attributeMapKeys[ i ];

            attributeStack = attributeMap[ key ];
            if ( !attributeStack || !attributeStack.asChanged ) {
                continue;
            }

            var attribute;
            if ( attributeStack.values().length === 0 ) {
                attribute = attributeStack.globalDefault;
            } else {
                attribute = attributeStack.back().object;
            }

            /*develblock:start*/
            Notify.assert( key === attribute.getTypeMember(), 'State:applyAttributeMap attribute key ' + key + ' !== ' + attribute.getTypeMember() );
            /*develblock:end*/


            if ( attributeStack.lastApplied !== attribute ) {

                if ( attribute.apply )
                    attribute.apply( this );

                attributeStack.lastApplied = attribute;

            }
            attributeStack.asChanged = false;

        }
    },

    getObjectPair: function ( object, value ) {
        return {
            object: object,
            value: value
        };
    },

    pushUniformsList: function ( uniformMap, stateSetUniformMap ) {
        /*jshint bitwise: false */
        var name;
        var uniform;

        var stateSetUniformMapKeys = stateSetUniformMap.getKeys();

        for ( var i = 0, l = stateSetUniformMapKeys.length; i < l; i++ ) {
            var key = stateSetUniformMapKeys[ i ];
            var uniformPair = stateSetUniformMap[ key ];
            uniform = uniformPair.getUniform();
            name = uniform.getName();
            if ( uniformMap[ name ] === undefined ) {
                uniformMap[ name ] = new Stack();
                uniformMap[ name ].globalDefault = uniform;
                uniformMap.dirty();
            }

            this.pushCheckOverride( uniformMap[ name ], uniform, uniformPair.getValue() );
        }
        /*jshint bitwise: true */
    },

    popUniformsList: function ( uniformMap, stateSetUniformMap ) {

        var stateSetUniformMapKeys = stateSetUniformMap.getKeys();

        for ( var i = 0, l = stateSetUniformMapKeys.length; i < l; i++ ) {
            var key = stateSetUniformMapKeys[ i ];
            uniformMap[ key ].pop();
        }
    },


    // this funtion must called only if stack has changed
    // check applyTextureAttributeMapList
    _applyTextureAttributeStack: function ( gl, textureUnit, attributeStack ) {

        var attribute;
        if ( attributeStack.values().length === 0 ) {
            attribute = attributeStack.globalDefault;
        } else {
            attribute = attributeStack.back().object;
        }

        // if the the stack has changed but the last applied attribute is the same
        // then we dont need to apply it again
        if ( attributeStack.lastApplied !== attribute ) {

            gl.activeTexture( gl.TEXTURE0 + textureUnit );
            attribute.apply( this, textureUnit );

            attributeStack.lastApplied = attribute;
        }

        attributeStack.asChanged = false;
    },

    applyTextureAttributeMapList: function ( textureAttributesMapList ) {
        var gl = this._graphicContext;
        var textureAttributeMap;

        for ( var textureUnit = 0, l = textureAttributesMapList.length; textureUnit < l; textureUnit++ ) {
            textureAttributeMap = textureAttributesMapList[ textureUnit ];
            if ( !textureAttributeMap ) {
                continue;
            }


            var textureAttributeMapKeys = textureAttributeMap.getKeys();

            for ( var i = 0, lt = textureAttributeMapKeys.length; i < lt; i++ ) {
                var key = textureAttributeMapKeys[ i ];

                var attributeStack = textureAttributeMap[ key ];

                // skip if not stack or not changed in stack
                if ( !attributeStack || !attributeStack.asChanged ) continue;

                this._applyTextureAttributeStack( gl, textureUnit, attributeStack );
                // var attribute;
                // if ( attributeStack.values().length === 0 ) {
                //     attribute = attributeStack.globalDefault;
                // } else {
                //     attribute = attributeStack.back().object;
                // }
                // if ( attributeStack.asChanged ) {

                //     gl.activeTexture( gl.TEXTURE0 + textureUnit );
                //     attribute.apply( this, textureUnit );
                //     attributeStack.lastApplied = attribute;
                //     attributeStack.asChanged = false;

                // }
            }
        }
    },

    setGlobalDefaultValue: function ( attribute ) {
        Notify.log( 'setGlobalDefaultValue is deprecated, use instead setGlobalDefaultAttribute' );
        this.setGlobalDefaultAttribute( attribute );
    },

    setGlobalDefaultAttribute: function ( attribute ) {
        var typeMember = attribute.getTypeMember();
        var attributeMap = this.attributeMap;

        if ( attributeMap[ typeMember ] === undefined ) {
            attributeMap[ typeMember ] = new Stack();
            attributeMap.dirty();
        }

        attributeMap[ typeMember ].globalDefault = attribute;
    },

    getGlobalDefaultAttribute: function ( typeMember ) {
        var attributeMap = this.attributeMap;
        if ( attributeMap[ typeMember ] === undefined ) return undefined;

        return attributeMap[ typeMember ].globalDefault;
    },

    setGlobalDefaultTextureAttribute: function ( unit, attribute ) {
        var attributeMap = this.getOrCreateTextureAttributeMap( unit );

        var typeMember = attribute.getTypeMember();
        if ( attributeMap[ typeMember ] === undefined ) {
            attributeMap[ typeMember ] = new Stack();
            attributeMap.dirty();
        }

        var as = attributeMap[ typeMember ];
        as.globalDefault = attribute;
    },

    getGlobalDefaultTextureAttribute: function ( unit, typeMember ) {
        var attributeMap = this.getOrCreateTextureAttributeMap( unit );
        var as = attributeMap[ typeMember ];
        return as.globalDefault;
    },

    getOrCreateTextureAttributeMap: function ( unit ) {
        if ( !this.textureAttributeMapList[ unit ] ) this.textureAttributeMapList[ unit ] = new Map();
        return this.textureAttributeMapList[ unit ];
    },

    pushAttributeMap: function ( attributeMap, stateSetAttributeMap ) {
        /*jshint bitwise: false */
        var attributeStack;
        var stateSetAttributeMapKeys = stateSetAttributeMap.getKeys();

        for ( var i = 0, l = stateSetAttributeMapKeys.length; i < l; i++ ) {

            var type = stateSetAttributeMapKeys[ i ];
            var attributePair = stateSetAttributeMap[ type ];
            var attribute = attributePair.getAttribute();

            if ( attributeMap[ type ] === undefined ) {
                attributeMap[ type ] = new Stack();
                attributeMap[ type ].globalDefault = attribute.cloneType();

                attributeMap.dirty();
            }

            attributeStack = attributeMap[ type ];
            this.pushCheckOverride( attributeStack, attribute, attributePair.getValue() );
            attributeStack.asChanged = true;
        }
        /*jshint bitwise: true */
    },

    popAttributeMap: function ( attributeMap, stateSetAttributeMap ) {

        var attributeStack;
        var stateSetAttributeMapKeys = stateSetAttributeMap.getKeys();

        for ( var i = 0, l = stateSetAttributeMapKeys.length; i < l; i++ ) {

            var type = stateSetAttributeMapKeys[ i ];
            attributeStack = attributeMap[ type ];
            attributeStack.pop();
            attributeStack.asChanged = true;

        }
    },

    setIndexArray: function ( array ) {

        var gl = this._graphicContext;

        if ( this._currentIndexVBO !== array ) {
            array.bind( gl );
            this._currentIndexVBO = array;
        }

        if ( array.isDirty() ) {
            array.compile( gl );
        }

    },

    lazyDisablingOfVertexAttributes: function () {
        var keys = this.vertexAttribMap._keys;
        for ( var i = 0, l = keys.length; i < l; i++ ) {
            var attr = keys[ i ];
            if ( this.vertexAttribMap[ attr ] ) {
                this.vertexAttribMap._disable[ attr ] = true;
            }
        }
    },

    enableVertexColor: function () {

        var program = this.attributeMap.Program.lastApplied;

        if ( !program._uniformsCache.ArrayColorEnabled ||
            !program._attributesCache.Color ) return; // no color uniform or attribute used, exit

        // update uniform
        var uniform = this.uniforms.ArrayColorEnabled.globalDefault;

        var previousColorEnabled = this._previousColorAttribPair[ program.getInstanceID() ];

        if ( !previousColorEnabled ) {
            uniform.setFloat( 1.0 );
            uniform.apply( this.getGraphicContext(), program._uniformsCache.ArrayColorEnabled );
            this._previousColorAttribPair[ program.getInstanceID() ] = true;
        }

    },


    disableVertexColor: function () {

        var program = this.attributeMap.Program.lastApplied;

        if ( !program._uniformsCache.ArrayColorEnabled ||
            !program._attributesCache.Color ) return; // no color uniform or attribute used, exit

        // update uniform
        var uniform = this.uniforms.ArrayColorEnabled.globalDefault;

        var previousColorEnabled = this._previousColorAttribPair[ program.getInstanceID() ];

        if ( previousColorEnabled ) {
            uniform.setFloat( 0.0 );
            uniform.apply( this.getGraphicContext(), program._uniformsCache.ArrayColorEnabled );
            this._previousColorAttribPair[ program.getInstanceID() ] = false;
        }

    },


    applyDisablingOfVertexAttributes: function () {

        var keys = this.vertexAttribMap._keys;
        for ( var i = 0, l = keys.length; i < l; i++ ) {
            if ( this.vertexAttribMap._disable[ keys[ i ] ] === true ) {
                var attr = keys[ i ];
                this._graphicContext.disableVertexAttribArray( attr );
                this.vertexAttribMap._disable[ attr ] = false;
                this.vertexAttribMap[ attr ] = false;
            }
        }
    },

    clearVertexAttribCache: function () {

        var vertexAttribMap = this.vertexAttribMap;
        var keys = vertexAttribMap._keys;
        for ( var i = 0, l = keys.length; i < l; i++ ) {
            var attr = keys[ i ];
            vertexAttribMap[ attr ] = undefined;
            vertexAttribMap._disable[ attr ] = false;
        }

        this.vertexAttribMap._disable.length = 0;
        this.vertexAttribMap._keys.length = 0;

    },

    /**
     *  set a vertex array object.
     *  return true if binded the vao and false
     *  if was already binded
     */
    setVertexArrayObject: function ( vao ) {

        if ( this._currentVAO !== vao ) {

            this._extVAO.bindVertexArrayOES( vao );
            this._currentVAO = vao;

            // disable cache to force a re enable of array
            if ( !vao ) this.clearVertexAttribCache();

            // disable currentIndexVBO to force to bind indexArray from Geometry
            // if there is a change of vao
            this._currentIndexVBO = undefined;

            return true;
        }
        return false;
    },

    setVertexAttribArray: function ( attrib, array, normalize ) {

        var vertexAttribMap = this.vertexAttribMap;
        vertexAttribMap._disable[ attrib ] = false;
        var gl = this._graphicContext;
        var binded = false;

        if ( array.isDirty() ) {
            array.bind( gl );
            array.compile( gl );
            binded = true;
        }

        var currentArray = vertexAttribMap[ attrib ];
        if ( currentArray !== array ) {

            if ( !binded ) {
                array.bind( gl );
            }

            if ( !currentArray ) {
                gl.enableVertexAttribArray( attrib );

                // can be === false (so undefined check is important)
                if ( currentArray === undefined )
                    vertexAttribMap._keys.push( attrib );

            }

            vertexAttribMap[ attrib ] = array;
            gl.vertexAttribPointer( attrib, array.getItemSize(), array.getType(), normalize, 0, 0 );
        }
    },


    _getActiveUniformsFromProgramAttributes: function ( program, activeUniformsList ) {

        var attributeMapStack = this.attributeMap;

        var attributeKeys = program.trackAttributes.attributeKeys;

        if ( attributeKeys.length > 0 ) {

            for ( var i = 0, l = attributeKeys.length; i < l; i++ ) {

                var key = attributeKeys[ i ];
                var attributeStack = attributeMapStack[ key ];
                if ( attributeStack === undefined ) {
                    continue;
                }

                // we just need the uniform list and not the attribute itself
                var attribute = attributeStack.globalDefault;
                if ( attribute.getOrCreateUniforms === undefined ) {
                    continue;
                }

                var uniformMap = attribute.getOrCreateUniforms();
                var uniformKeys = uniformMap.getKeys();

                for ( var a = 0, b = uniformKeys.length; a < b; a++ ) {
                    activeUniformsList.push( uniformMap[ uniformKeys[ a ] ] );
                }
            }

        }
    },

    _getActiveUniformsFromProgramTextureAttributes: function ( program, activeUniformsList ) {

        var textureAttributeKeysList = program.trackAttributes.textureAttributeKeys;
        if ( textureAttributeKeysList === undefined ) return;

        for ( var unit = 0, nbUnit = textureAttributeKeysList.length; unit < nbUnit; unit++ ) {

            var textureAttributeKeys = textureAttributeKeysList[ unit ];
            if ( textureAttributeKeys === undefined ) continue;

            var unitTextureAttributeList = this.textureAttributeMapList[ unit ];
            if ( unitTextureAttributeList === undefined ) continue;

            for ( var i = 0, l = textureAttributeKeys.length; i < l; i++ ) {
                var key = textureAttributeKeys[ i ];

                var attributeStack = unitTextureAttributeList[ key ];
                if ( attributeStack === undefined ) {
                    continue;
                }
                // we just need the uniform list and not the attribute itself
                var attribute = attributeStack.globalDefault;
                if ( attribute.getOrCreateUniforms === undefined ) {
                    continue;
                }
                var uniformMap = attribute.getOrCreateUniforms();
                var uniformMapKeys = uniformMap.getKeys();

                for ( var a = 0, b = uniformMapKeys.length; a < b; a++ ) {
                    activeUniformsList.push( uniformMap[ uniformMapKeys[ a ] ] );
                }
            }
        }
    },

    _cacheUniformsForCustomProgram: function ( program, activeUniformsList ) {

        this._getActiveUniformsFromProgramAttributes( program, activeUniformsList );

        this._getActiveUniformsFromProgramTextureAttributes( program, activeUniformsList );

        var gl = this._graphicContext;

        // now we have a list on uniforms we want to track but we will filter them to use only what is needed by our program
        // not that if you create a uniforms whith the same name of a tracked attribute, and it will override it
        var uniformsFinal = new Map();

        for ( var i = 0, l = activeUniformsList.length; i < l; i++ ) {
            var u = activeUniformsList[ i ];
            var uniformName = u.getName();
            var loc = gl.getUniformLocation( program._program, uniformName );
            if ( loc !== undefined && loc !== null ) {
                uniformsFinal[ uniformName ] = u;
            }
        }
        uniformsFinal.dirty();
        program.trackUniforms = uniformsFinal;

    },

    _applyCustomProgramUniforms: ( function () {

        var activeUniformsList = [];

        return function ( program ) {

            // custom program so we will iterate on uniform from the program and apply them
            // but in order to be able to use Attribute in the state graph we will check if
            // our program want them. It must be defined by the user

            // first time we see attributes key, so we will keep a list of uniforms from attributes
            activeUniformsList.length = 0;

            // fill the program with cached active uniforms map from attributes and texture attributes
            if ( program.trackAttributes !== undefined && program.trackUniforms === undefined ) {
                this._cacheUniformsForCustomProgram( program, activeUniformsList );
            }

            var programUniformMap = program._uniformsCache;
            var programUniformKeys = programUniformMap.getKeys();
            var uniformMapStackContent = this.uniforms;

            var programTrackUniformMap;
            if ( program.trackUniforms )
                programTrackUniformMap = program.trackUniforms;

            var uniform;
            for ( var i = 0, l = programUniformKeys.length; i < l; i++ ) {
                var uniformKey = programUniformKeys[ i ];
                var location = programUniformMap[ uniformKey ];
                var uniformStack = uniformMapStackContent[ uniformKey ];

                if ( uniformStack === undefined ) {

                    if ( programTrackUniformMap !== undefined ) {
                        uniform = programTrackUniformMap[ uniformKey ];
                        if ( uniform !== undefined ) {
                            uniform.apply( this._graphicContext, location );
                        }
                    }

                } else {

                    if ( uniformStack.values().length === 0 ) {
                        uniform = uniformStack.globalDefault;
                    } else {
                        uniform = uniformStack.back().object;
                    }
                    uniform.apply( this._graphicContext, location );

                }
            }
        };
    } )(),


    // apply a generated program if necessary
    // It build a Shader from the shader generator
    // it apply for the following condition
    // the user has not put a Pogram in the stack or if he has he added one with OFF
    _generateAndApplyProgram: function () {

        var attributeMap = this.attributeMap;
        if ( attributeMap.Program !== undefined && attributeMap.Program.values().length !== 0 && attributeMap.Program.back().value !== StateAttribute.OFF )
            return undefined;

        // no custom program look into the stack of ShaderGenerator name
        // what we should use to generate a program

        var last = this._shaderGeneratorNames.back();
        var shaderGenerator = this._shaderGeneratorProxy.getShaderGenerator( last ? last.object : undefined );

        var program = shaderGenerator.getOrCreateProgram( this );
        this.applyAttribute( program );
        return program;
    },

    _computeForeignUniforms: function ( programUniformMap, activeUniformMap ) {

        var uniformMapKeys = programUniformMap.getKeys();
        var uniformMap = programUniformMap;

        var foreignUniforms = [];
        for ( var i = 0, l = uniformMapKeys.length; i < l; i++ ) {

            var name = uniformMapKeys[ i ];
            var location = uniformMap[ name ];

            if ( location !== undefined && activeUniformMap[ name ] === undefined ) {

                // filter 'standard' uniform matrix that will be applied for all shader
                if ( name !== this.modelViewMatrix.getName() &&
                    name !== this.modelWorldMatrix.getName() &&
                    name !== this.viewMatrix.getName() &&
                    name !== this.projectionMatrix.getName() &&
                    name !== this.normalMatrix.getName() &&
                    name !== 'ArrayColorEnabled' ) {
                    foreignUniforms.push( name );
                }
            }

        }

        return foreignUniforms;
    },

    _removeUniformsNotRequiredByProgram: function ( activeUniformMap, programUniformMap ) {

        var activeUniformMapKeys = activeUniformMap.getKeys();

        for ( var i = 0, l = activeUniformMapKeys.length; i < l; i++ ) {
            var name = activeUniformMapKeys[ i ];
            var location = programUniformMap[ name ];
            if ( location === undefined || location === null ) {
                delete activeUniformMap[ name ];
                activeUniformMap.dirty();
            }
        }
    },


    _cacheUniformsForGeneratedProgram: function ( program ) {

        var foreignUniforms = this._computeForeignUniforms( program._uniformsCache, program.activeUniforms );
        program.foreignUniforms = foreignUniforms;


        // remove uniforms listed by attributes (getActiveUniforms) but not required by the program
        this._removeUniformsNotRequiredByProgram( program.activeUniforms, program._uniformsCache );

    },

    _applyGeneratedProgramUniforms: function ( program ) {

        // note that about TextureAttribute that need uniform on unit we would need to improve
        // the current uniformList ...

        // when we apply the shader for the first time, we want to compute the active uniforms for this shader and the list of uniforms not extracted from attributes called foreignUniforms

        // typically the following code will be executed once on the first execution of generated program

        var foreignUniformKeys = program.foreignUniforms;
        if ( !foreignUniformKeys ) {
            this._cacheUniformsForGeneratedProgram( program );
            foreignUniformKeys = program.foreignUniforms;
        }


        var programUniformMap = program._uniformsCache;
        var activeUniformMap = program.activeUniforms;


        // apply active uniforms
        // caching uniforms from attribtues make it impossible to overwrite uniform with a custom uniform instance not used in the attributes
        var i, l, name, location;
        var activeUniformKeys = activeUniformMap.getKeys();

        for ( i = 0, l = activeUniformKeys.length; i < l; i++ ) {

            name = activeUniformKeys[ i ];
            location = programUniformMap[ name ];
            activeUniformMap[ name ].apply( this._graphicContext, location );

        }

        var uniformMapStack = this.uniforms;

        // apply now foreign uniforms, it's uniforms needed by the program but not contains in attributes used to generate this program
        for ( i = 0, l = foreignUniformKeys.length; i < l; i++ ) {

            name = foreignUniformKeys[ i ];
            var uniformStack = uniformMapStack[ name ];
            location = programUniformMap[ name ];
            var uniform;
            if ( uniformStack !== undefined ) {
                if ( uniformStack.values().length === 0 ) {
                    uniform = uniformStack.globalDefault;
                    Notify.warn( 'Uniform Default Not attached to a StateSet in Scene Hierarchy: ' + uniformStack.globalDefault.getName() );
                } else {
                    uniform = uniformStack.back().object;
                }

                uniform.apply( this._graphicContext, location );
            }

        }
    }


} ), 'osg', 'State' );

module.exports = State;
