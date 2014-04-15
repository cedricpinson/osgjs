define( [
    'osg/StateAttribute',
    'osg/Stack',
    'osg/Uniform',
    'osg/Matrix',
    'osg/ShaderGenerator',
    'osg/Map'
], function ( StateAttribute, Stack, Uniform, Matrix, ShaderGenerator, Map ) {

    var State = function () {
        this._graphicContext = undefined;

        this.currentVBO = null;
        this.vertexAttribList = [];
        this.programs = Stack.create();
        this.stateSets = Stack.create();
        this.uniforms = new Map();

        this.textureAttributeMapList = [];

        this.attributeMap = new Map();

        this.shaderGenerator = new ShaderGenerator();

        this.modelViewMatrix = Uniform.createMatrix4( Matrix.create(), 'ModelViewMatrix' );
        this.projectionMatrix = Uniform.createMatrix4( Matrix.create(), 'ProjectionMatrix' );
        this.normalMatrix = Uniform.createMatrix4( Matrix.create(), 'NormalMatrix' );

        // track uniform for color array enabled

        // Stoped HERE color array does not work
        // check point cloud example
        var arrayColorEnable = Stack.create();
        arrayColorEnable.globalDefault = Uniform.createFloat1( 0.0, 'ArrayColorEnabled' );

        this.uniforms.setMap( {
            ArrayColorEnabled: arrayColorEnable
        } );


        this.vertexAttribMap = {};
        this.vertexAttribMap._disable = [];
        this.vertexAttribMap._keys = [];
    };

    State.prototype = {

        setGraphicContext: function ( graphicContext ) {
            this._graphicContext = graphicContext;
        },
        getGraphicContext: function () {
            return this._graphicContext;
        },

        pushStateSet: function ( stateset ) {
            this.stateSets.push( stateset );

            if ( stateset.attributeMap ) {
                this.pushAttributeMap( this.attributeMap, stateset.attributeMap );
            }
            if ( stateset.textureAttributeMapList ) {
                var list = stateset.textureAttributeMapList;
                for ( var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++ ) {
                    if ( list[ textureUnit ] === undefined ) {
                        continue;
                    }
                    if ( !this.textureAttributeMapList[ textureUnit ] ) {
                        this.textureAttributeMapList[ textureUnit ] = new Map();
                    }
                    this.pushAttributeMap( this.textureAttributeMapList[ textureUnit ], list[ textureUnit ] );
                }
            }

            if ( stateset.uniforms ) {
                this.pushUniformsList( this.uniforms, stateset.uniforms );
            }
        },

        applyStateSet: function ( stateset ) {
            this.pushStateSet( stateset );
            this.apply();
            this.popStateSet();
        },

        popAllStateSets: function () {
            while ( this.stateSets.length ) {
                this.popStateSet();
            }
        },
        popStateSet: function () {
            var stateset = this.stateSets.pop();
            if ( stateset.program ) {
                this.programs.pop();
            }
            if ( stateset.attributeMap ) {
                this.popAttributeMap( this.attributeMap, stateset.attributeMap );
            }
            if ( stateset.textureAttributeMapList ) {
                var list = stateset.textureAttributeMapList;
                for ( var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++ ) {
                    if ( list[ textureUnit ] === undefined ) {
                        continue;
                    }
                    this.popAttributeMap( this.textureAttributeMapList[ textureUnit ], list[ textureUnit ] );
                }
            }

            if ( stateset.uniforms ) {
                this.popUniformsList( this.uniforms, stateset.uniforms );
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

            if ( attributeStack === undefined ) {
                attributeStack = Stack.create();
                attributeMap[ key ] = attributeStack;
                attributeMap[ key ].globalDefault = attribute.cloneType();
                this.attributeMap.dirty();
            }

            if ( attributeStack.lastApplied !== attribute ) {
                //        if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
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

            var textureUnitAttributeMap = this.textureAttributeMapList[ unit ];
            var attributeStack = textureUnitAttributeMap[ key ];

            if ( attributeStack === undefined ) {

                attributeStack = Stack.create();
                textureUnitAttributeMap[ key ] = attributeStack;
                textureUnitAttributeMap.dirty();
                attributeStack.globalDefault = attribute.cloneType();

            }

            if ( attributeStack.lastApplied !== attribute ) {

                if ( attribute.apply ) {
                    attribute.apply( this );
                }
                attributeStack.lastApplied = attribute;
                attributeStack.asChanged = true;
            }
        },

        getLastProgramApplied: function () {
            return this.programs.lastApplied;
        },

        pushGeneratedProgram: function () {
            var program;
            var attributeMap = this.attributeMap;

            if ( attributeMap.Program !== undefined && attributeMap.Program.length !== 0 ) {
                program = attributeMap.Program.back().object;
                var value = attributeMap.Program.back().value;
                if ( program !== undefined && value !== StateAttribute.OFF ) {
                    this.programs.push( this.getObjectPair( program, value ) );
                    return program;
                }
            }

            var attributes = {
                'textureAttributeMapList': this.textureAttributeMapList,
                'attributeMap': this.attributeMap
            };

            var generator = this.stateSets.back().getShaderGenerator();
            if ( generator === undefined ) {
                generator = this.shaderGenerator;
            }
            program = generator.getOrCreateProgram( attributes );
            this.programs.push( this.getObjectPair( program, StateAttribute.ON ) );
            return program;
        },

        popGeneratedProgram: function () {
            this.programs.pop();
        },

        applyWithoutProgram: function () {
            this.applyAttributeMap( this.attributeMap );
            this.applyTextureAttributeMapList( this.textureAttributeMapList );
        },

        computeForeignUniforms: function( programUniformMap, activeUniformMap ) {
            var uniformMapKeys = programUniformMap.getKeys();
            var uniformMap = programUniformMap;

            var foreignUniforms = [];
            for ( var i = 0, l = uniformMapKeys.length; i < l; i++ ) {
                var name = uniformMapKeys[ i ];
                var location = uniformMap[ name ];
                if ( location !== undefined && activeUniformMap[ name ] === undefined ) {
                    // filter 'standard' uniform matrix that will be applied for all shader
                    if ( name !== this.modelViewMatrix.name &&
                         name !== this.projectionMatrix.name &&
                         name !== this.normalMatrix.name &&
                         name !== 'ArrayColorEnabled' ) {
                             foreignUniforms.push( name );
                         }
                }
            }
            return foreignUniforms;
        },

        removeUniformsNotRequiredByProgram: function( activeUniformMap, programUniformMap ) {

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



        cacheUniformsForGeneratedProgram: function( program ) {

            var foreignUniforms = this.computeForeignUniforms( program.uniformsCache, program.activeUniforms );
            program.foreignUniforms = foreignUniforms;


            // remove uniforms listed by attributes (getActiveUniforms) but not required by the program
            this.removeUniformsNotRequiredByProgram( program.activeUniforms, program.uniformsCache );

        },

        applyGeneratedProgram: function( program ) {

            // note that about TextureAttribute that need uniform on unit we would need to improve
            // the current uniformList ...

            // when we apply the shader for the first time, we want to compute the active uniforms for this shader and the list of uniforms not extracted from attributes called foreignUniforms

            // typically the following code will be executed once on the first execution of generated program

            var foreignUniformKeys = program.foreignUniforms;
            if ( !foreignUniformKeys ) {
                this.cacheUniformsForGeneratedProgram( program );
                foreignUniformKeys = program.foreignUniforms;
            }


            var programUniformMap = program.uniformsCache;
            var activeUniformMap = program.activeUniforms;


            // apply active uniforms
            // caching uniforms from attribtues make it impossible to overwrite uniform with a custom uniform instance not used in the attributes
            var i,l, name, location;
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

                    if ( uniformStack.length === 0 ) {
                        uniform = uniformStack.globalDefault;
                    } else {
                        uniform = uniformStack.back().object;
                    }

                    uniform.apply( this._graphicContext, location );
                }

            }
        },

        apply: function () {
            this.applyAttributeMap( this.attributeMap );
            this.applyTextureAttributeMapList( this.textureAttributeMapList );

            this.pushGeneratedProgram();
            var program = this.programs.back().object;
            if ( this.programs.lastApplied !== program ) {
                program.apply( this );
                this.programs.lastApplied = program;
            }

            if ( program.generated === true ) {

                // will cache uniform and apply them with the program

                this.applyGeneratedProgram( program );

            } else {

                // custom program so we will iterate on uniform from the program and apply them
                // but in order to be able to use Attribute in the state graph we will check if
                // our program want them. It must be defined by the user
                this.applyCustomProgram( program );

            }
        },



        getActiveUniformsFromProgramAttributes: function( program, activeUniformsList ) {

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

        getActiveUniformsFromProgramTextureAttributes: function( program, activeUniformsList ) {

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

        cacheUniformsForCustomProgram: function( program, activeUniformsList ) {

            this.getActiveUniformsFromProgramAttributes( program, activeUniformsList );

            this.getActiveUniformsFromProgramTextureAttributes( program, activeUniformsList );

            var gl = this._graphicContext;

            // now we have a list on uniforms we want to track but we will filter them to use only what is needed by our program
            // not that if you create a uniforms whith the same name of a tracked attribute, and it will override it
            var uniformsFinal = new Map();

            for ( var i = 0, l = activeUniformsList.length; i < l; i++ ) {
                var u = activeUniformsList[ i ];
                var loc = gl.getUniformLocation( program.program, u.name );
                if ( loc !== undefined && loc !== null ) {
                    uniformsFinal[ u.name ] = u;
                }
            }
            uniformsFinal.dirty();
            program.trackUniforms = uniformsFinal;

        },

        applyCustomProgram: (function() {

            var activeUniformsList = [];

            return function( program ) {

                // custom program so we will iterate on uniform from the program and apply them
                // but in order to be able to use Attribute in the state graph we will check if
                // our program want them. It must be defined by the user

                // first time we see attributes key, so we will keep a list of uniforms from attributes
                activeUniformsList.length = 0;

                // fill the program with cached active uniforms map from attributes and texture attributes
                if ( program.trackAttributes !== undefined && program.trackUniforms === undefined ) {
                    this.cacheUniformsForCustomProgram( program, activeUniformsList );
                }

                var programUniformMap = program.uniformsCache;
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

                        if ( uniformStack.length === 0 ) {
                            uniform = uniformStack.globalDefault;
                        } else {
                            uniform = uniformStack.back().object;
                        }
                        uniform.apply( this._graphicContext, location );

                    }
                }
            };
        })(),

        applyAttributeMap: function ( attributeMap ) {
            var attributeStack;

            var attributeMapKeys = attributeMap.getKeys();

            for ( var i = 0, l = attributeMapKeys.length; i < l; i++ ) {
                var key = attributeMapKeys[ i ];

                attributeStack = attributeMap[ key ];
                if ( attributeStack === undefined ) {
                    continue;
                }
                var attribute;
                if ( attributeStack.length === 0 ) {
                    attribute = attributeStack.globalDefault;
                } else {
                    attribute = attributeStack.back().object;
                }

                if ( attributeStack.asChanged ) {
                    //            if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
                    if ( attributeStack.lastApplied !== attribute ) {
                        if ( attribute.apply ) {
                            attribute.apply( this );
                        }
                        attributeStack.lastApplied = attribute;
                    }
                    attributeStack.asChanged = false;
                }
            }
        },

        getObjectPair: function ( uniform, value ) {
            return {
                object: uniform,
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
                name = uniform.name;
                if ( uniformMap[ name ] === undefined ) {
                    uniformMap[ name ] = Stack.create();
                    uniformMap[ name ].globalDefault = uniform;
                    uniformMap.dirty();
                }
                var value = uniformPair.getValue();
                var stack = uniformMap[ name ];
                if ( stack.length === 0 ) {
                    stack.push( this.getObjectPair( uniform, value ) );
                } else if ( ( stack[ stack.length - 1 ].value & StateAttribute.OVERRIDE ) && !( value & StateAttribute.PROTECTED ) ) {
                    stack.push( stack[ stack.length - 1 ] );
                } else {
                    stack.push( this.getObjectPair( uniform, value ) );
                }
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

        applyTextureAttributeMapList: function ( textureAttributesMapList ) {
            var gl = this._graphicContext;
            var textureAttributeMap;

            for ( var textureUnit = 0, l = textureAttributesMapList.length; textureUnit < l; textureUnit++ ) {
                textureAttributeMap = textureAttributesMapList[ textureUnit ];
                if ( textureAttributeMap === undefined ) {
                    continue;
                }


                var textureAttributeMapKeys = textureAttributeMap.getKeys();

                for ( var i = 0, lt = textureAttributeMapKeys.length; i < lt; i++ ) {
                    var key = textureAttributeMapKeys[ i ];

                    var attributeStack = textureAttributeMap[ key ];
                    if ( attributeStack === undefined ) {
                        continue;
                    }

                    var attribute;
                    if ( attributeStack.length === 0 ) {
                        attribute = attributeStack.globalDefault;
                    } else {
                        attribute = attributeStack.back().object;
                    }
                    if ( attributeStack.asChanged ) {

                        gl.activeTexture( gl.TEXTURE0 + textureUnit );
                        attribute.apply( this, textureUnit );
                        attributeStack.lastApplied = attribute;
                        attributeStack.asChanged = false;

                    }
                }
            }
        },
        setGlobalDefaultValue: function ( attribute ) {

            var key = attribute.getTypeMember();
            var attributeMap = this.attributeMap;

            if ( attributeMap[ key ] ) {
                attributeMap[ key ].globalDefault = attribute;

            } else {
                attributeMap[ key ] = Stack.create();
                attributeMap[ key ].globalDefault = attribute;

                this.attributeMap.dirty();
            }
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
                    attributeMap[ type ] = Stack.create();
                    attributeMap[ type ].globalDefault = attribute.cloneType();

                    attributeMap.dirty();
                }

                var value = attributePair.getValue();

                attributeStack = attributeMap[ type ];
                if ( attributeStack.length === 0 ) {
                    attributeStack.push( this.getObjectPair( attribute, value ) );
                } else if ( ( attributeStack[ attributeStack.length - 1 ].value & StateAttribute.OVERRIDE ) && !( value & StateAttribute.PROTECTED ) ) {
                    attributeStack.push( attributeStack[ attributeStack.length - 1 ] );
                } else {
                    attributeStack.push( this.getObjectPair( attribute, value ) );
                }

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
            if ( this.currentIndexVBO !== array ) {
                array.bind( gl );
                this.currentIndexVBO = array;
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

            // it takes 4.26% of global cpu
            // there would be a way to cache it and track state if the program has not changed ...
            var program = this.programs.lastApplied;

            if ( program !== undefined ) {
                var gl = this.getGraphicContext();
                var color  = program.attributesCache.Color;
                var updateColorUniform = false;
                var hasColorAttrib = false;
                if ( color !== undefined ) {
                    hasColorAttrib = this.vertexAttribMap[ color ];
                }

                var uniform = this.uniforms.ArrayColorEnabled.globalDefault;
                if ( this.previousHasColorAttrib !== hasColorAttrib ) {
                    updateColorUniform = true;
                }

                this.previousHasColorAttrib = hasColorAttrib;

                if ( updateColorUniform ) {
                    if ( hasColorAttrib ) {
                        uniform.get()[ 0 ] = 1.0;
                    } else {
                        uniform.get()[ 0 ] = 0.0;
                    }
                    uniform.dirty();
                }

                uniform.apply( gl, program.uniformsCache.ArrayColorEnabled );
            }
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

            if ( vertexAttribMap[ attrib ] !== array ) {

                if ( !binded ) {
                    array.bind( gl );
                }

                if ( !vertexAttribMap[ attrib ] ) {
                    gl.enableVertexAttribArray( attrib );

                    if ( vertexAttribMap[ attrib ] === undefined ) {
                        vertexAttribMap._keys.push( attrib );
                    }
                }

                vertexAttribMap[ attrib ] = array;
                gl.vertexAttribPointer( attrib, array._itemSize, gl.FLOAT, normalize, 0, 0 );
            }
        }

    };

    return State;
} );
