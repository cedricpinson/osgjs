define( [
    'osg/StateAttribute',
    'osg/Stack',
    'osg/Uniform',
    'osg/Matrix',
    'osg/ShaderGenerator'
], function ( StateAttribute, Stack, Uniform, Matrix, ShaderGenerator ) {

    var State = function () {
        this._graphicContext = undefined;

        this.currentVBO = null;
        this.vertexAttribList = [];
        this.programs = Stack.create();
        this.stateSets = Stack.create();
        this.uniforms = {};
        this.uniforms.uniformKeys = [];

        this.textureAttributeMapList = [];

        this.attributeMap = {};
        this.attributeMap.attributeKeys = [];

        this.modeMap = {};

        this.shaderGenerator = new ShaderGenerator();

        this.modelViewMatrix = Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'ModelViewMatrix' );
        this.projectionMatrix = Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'ProjectionMatrix' );
        this.normalMatrix = Uniform.createMatrix4( Matrix.makeIdentity( [] ), 'NormalMatrix' );

        // track uniform for color array enabled
        this.uniforms.ArrayColorEnabled = Stack.create();
        this.uniforms.ArrayColorEnabled.globalDefault = Uniform.createFloat1( 0.0, 'ArrayColorEnabled' );
        this.uniforms.ArrayColorEnabled.uniformKeys = [];
        this.uniforms.ArrayColorEnabled.uniformKeys.push( 'ArrayColorEnabled' );


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
                        this.textureAttributeMapList[ textureUnit ] = {};
                        this.textureAttributeMapList[ textureUnit ].attributeKeys = [];
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
            var attributeStack = this.attributeMap[ key ];
            if ( attributeStack === undefined ) {
                attributeStack = Stack.create();
                this.attributeMap[ key ] = attributeStack;
                this.attributeMap[ key ].globalDefault = attribute.cloneType();
                this.attributeMap.attributeKeys.push( key );
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
                this.textureAttributeMapList[ unit ] = {};
                this.textureAttributeMapList[ unit ].attributeKeys = [];
            }

            var attributeStack = this.textureAttributeMapList[ unit ][ key ];
            if ( attributeStack === undefined ) {
                attributeStack = Stack.create();
                this.textureAttributeMapList[ unit ][ key ] = attributeStack;
                attributeStack.globalDefault = attribute.cloneType();
                this.textureAttributeMapList[ unit ].attributeKeys.push( key );
            }

            if ( attributeStack.lastApplied !== attribute ) {
                //if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
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
            if ( this.attributeMap.Program !== undefined && this.attributeMap.Program.length !== 0 ) {
                program = this.attributeMap.Program.back().object;
                var value = this.attributeMap.Program.back().value;
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

        apply: function () {
            var gl = this._graphicContext;



            this.applyAttributeMap( this.attributeMap );
            this.applyTextureAttributeMapList( this.textureAttributeMapList );

            this.pushGeneratedProgram();
            var program = this.programs.back().object;
            if ( this.programs.lastApplied !== program ) {
                program.apply( this );
                this.programs.lastApplied = program;
            }

            var programUniforms;
            var activeUniforms;
            var i,l;
            var key;
            var self = this;
            var uniformMap;
            if ( program.generated === true ) {
                // note that about TextureAttribute that need uniform on unit we would need to improve
                // the current uniformList ...

                programUniforms = program.uniformsCache;
                activeUniforms = program.activeUniforms;
                uniformMap = this.uniforms;
                ( function () {

                    var programUniforms = program.uniformsCache;
                    var activeUniforms = program.activeUniforms;
                    var foreignUniforms = program.foreignUniforms;

                    // when we apply the shader for the first time, we want to compute the active uniforms for this shader and the list of uniforms not extracted from attributes called foreignUniforms

                    // typically the following code will be executed once on the first execution of generated program
                    if ( !foreignUniforms ) {

                        ( function () {

                            foreignUniforms = [];
                            for ( var i = 0, l = programUniforms.uniformKeys.length; i < l; i++ ) {
                                var name = programUniforms.uniformKeys[ i ];
                                var location = programUniforms[ name ];
                                if ( location !== undefined && activeUniforms[ name ] === undefined ) {
                                    // filter 'standard' uniform matrix that will be applied for all shader
                                    if ( name !== self.modelViewMatrix.name &&
                                         name !== self.projectionMatrix.name &&
                                         name !== self.normalMatrix.name &&
                                         name !== 'ArrayColorEnabled' ) {
                                             foreignUniforms.push( name );
                                         }
                                }
                            }
                            program.foreignUniforms = foreignUniforms;

                        } )();


                        // remove uniforms listed by attributes (getActiveUniforms) but not required by the program
                        ( function () {

                            for ( var i = 0, l = activeUniforms.uniformKeys.length; i < l; i++ ) {
                                var name = activeUniforms.uniformKeys[ i ];
                                var location = programUniforms[ name ];
                                if ( location === undefined || location === null ) {
                                    delete activeUniforms[ name ];
                                }
                            }
                            // regenerate uniforms keys
                            var keys = window.Object.keys( activeUniforms );
                            for ( var j = 0, m = keys.length; j < m; j++ ) {
                                if ( keys[ j ] === 'uniformKeys' ) {
                                    keys.splice( j, 1 );
                                    break;
                                }
                            }
                            activeUniforms.uniformKeys = keys;
                        } )();
                    }


                    // apply active uniforms
                    // caching uniforms from attribtues make it impossible to overwrite uniform with a custom uniform instance not used in the attributes
                    ( function () {
                        for ( var i = 0, l = activeUniforms.uniformKeys.length; i < l; i++ ) {
                            var name = activeUniforms.uniformKeys[ i ];
                            var location = programUniforms[ name ];
                            activeUniforms[ name ].apply( gl, location );
                        }
                    } )();


                    // apply now foreign uniforms, it's uniforms needed by the program but not contains in attributes used to generate this program
                    ( function () {
                        for ( var i = 0, l = foreignUniforms.length; i < l; i++ ) {
                            var name = foreignUniforms[ i ];
                            var uniformStack = uniformMap[ name ];
                            var location = programUniforms[ name ];
                            var uniform;
                            if ( uniformStack !== undefined ) {
                                if ( uniformStack.length === 0 ) {
                                    uniform = uniformStack.globalDefault;
                                } else {
                                    uniform = uniformStack.back().object;
                                }
                                uniform.apply( gl, location );
                            }
                        }
                    } )();

                } )();

            } else {

                //this.applyUniformList(this.uniforms, {});

                // custom program so we will iterate on uniform from the program and apply them
                // but in order to be able to use Attribute in the state graph we will check if
                // our program want them. It must be defined by the user
                var programObject = program.program;
                var location1;
                var uniformStack;
                var uniform;

                programUniforms = program.uniformsCache;
                uniformMap = this.uniforms;

                // first time we see attributes key, so we will keep a list of uniforms from attributes
                activeUniforms = [];
                var trackAttributes = program.trackAttributes;
                var trackUniforms = program.trackUniforms;
                var attribute;
                var uniforms;
                var a,b;
                var attributeStack;
                // loop on wanted attributes and texture attribute to track state graph uniforms from those attributes
                if ( trackAttributes !== undefined && trackUniforms === undefined ) {
                    var attributeKeys = program.trackAttributes.attributeKeys;
                    if ( attributeKeys !== undefined ) {
                        for ( i = 0, l = attributeKeys.length; i < l; i++ ) {
                            key = attributeKeys[ i ];
                            attributeStack = this.attributeMap[ key ];
                            if ( attributeStack === undefined ) {
                                continue;
                            }
                            // we just need the uniform list and not the attribute itself
                            attribute = attributeStack.globalDefault;
                            if ( attribute.getOrCreateUniforms === undefined ) {
                                continue;
                            }
                            uniforms = attribute.getOrCreateUniforms();
                            for ( a = 0, b = uniforms.uniformKeys.length; a < b; a++ ) {
                                activeUniforms.push( uniforms[ uniforms.uniformKeys[ a ] ] );
                            }
                        }
                    }

                    var textureAttributeKeysList = program.trackAttributes.textureAttributeKeys;
                    if ( textureAttributeKeysList !== undefined ) {
                        for ( i = 0, l = textureAttributeKeysList.length; i < l; i++ ) {
                            var tak = textureAttributeKeysList[ i ];
                            if ( tak === undefined ) {
                                continue;
                            }
                            for ( var j = 0, m = tak.length; j < m; j++ ) {
                                key = tak[ j ];
                                var attributeList = this.textureAttributeMapList[ i ];
                                if ( attributeList === undefined ) {
                                    continue;
                                }
                                attributeStack = attributeList[ key ];
                                if ( attributeStack === undefined ) {
                                    continue;
                                }
                                attribute = attributeStack.globalDefault;
                                if ( attribute.getOrCreateUniforms === undefined ) {
                                    continue;
                                }
                                uniforms = attribute.getOrCreateUniforms( i );
                                for ( a = 0, b = uniforms.uniformKeys.length; a < b; a++ ) {
                                    activeUniforms.push( uniforms[ uniforms.uniformKeys[ a ] ] );
                                }
                            }
                        }
                    }
                    // now we have a list on uniforms we want to track but we will filter them to use only what is needed by our program
                    // not that if you create a uniforms whith the same name of a tracked attribute, and it will override it
                    var uniformsFinal = {};
                    for ( i = 0, l = activeUniforms.length; i < l; i++ ) {
                        var u = activeUniforms[ i ];
                        var loc = gl.getUniformLocation( programObject, u.name );
                        if ( loc !== undefined && loc !== null ) {
                            uniformsFinal[ u.name ] = activeUniforms[ i ];
                        }
                    }
                    program.trackUniforms = uniformsFinal;
                }

                for ( i = 0, l = programUniforms.uniformKeys.length; i < l; i++ ) {
                    var uniformKey = programUniforms.uniformKeys[ i ];
                    location1 = programUniforms[ uniformKey ];

                    uniformStack = uniformMap[ uniformKey ];
                    if ( uniformStack === undefined ) {
                        if ( program.trackUniforms !== undefined ) {
                            uniform = program.trackUniforms[ uniformKey ];
                            if ( uniform !== undefined ) {
                                uniform.apply( gl, location1 );
                            }
                        }
                    } else {
                        if ( uniformStack.length === 0 ) {
                            uniform = uniformStack.globalDefault;
                        } else {
                            uniform = uniformStack.back().object;
                        }
                        uniform.apply( gl, location1 );
                    }
                }
            }
        },

        applyUniformList: function ( uniformMap, uniformList ) {
            var gl = this.getGraphicContext();
            var program = this.getLastProgramApplied();
            var location;
            var uniformStack;
            var uniform;

            var programUniforms = program.uniformsCache;

            for ( var i = 0, l = programUniforms.uniformKeys.length; i < l; i++ ) {
                var uniformKey = programUniforms.uniformKeys[ i ];
                location = programUniforms[ uniformKey ];

                // get the one in the list
                uniform = uniformList[ uniformKey ];

                // not found ? check on the stack
                if ( uniform === undefined ) {
                    uniformStack = uniformMap[ uniformKey ];
                    if ( uniformStack === undefined ) {
                        continue;
                    }
                    if ( uniformStack.length === 0 ) {
                        uniform = uniformStack.globalDefault;
                    } else {
                        uniform = uniformStack.back().object;
                    }
                }
                uniform.apply( gl, location );
            }
        },

        applyAttributeMap: function ( attributeMap ) {
            var attributeStack;

            for ( var i = 0, l = attributeMap.attributeKeys.length; i < l; i++ ) {
                var key = attributeMap.attributeKeys[ i ];

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
        pushUniformsList: function ( uniformMap, uniformList ) {
            /*jshint bitwise: false */
            var name;
            var uniform;
            for ( var i = 0, l = uniformList.uniformKeys.length; i < l; i++ ) {
                var key = uniformList.uniformKeys[ i ];
                var uniformPair = uniformList[ key ];
                uniform = uniformPair.getUniform();
                name = uniform.name;
                if ( uniformMap[ name ] === undefined ) {
                    uniformMap[ name ] = Stack.create();
                    uniformMap[ name ].globalDefault = uniform;
                    uniformMap.uniformKeys.push( name );
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
        popUniformsList: function ( uniformMap, uniformList ) {
            for ( var i = 0, l = uniformList.uniformKeys.length; i < l; i++ ) {
                var key = uniformList.uniformKeys[ i ];
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

                for ( var i = 0, lt = textureAttributeMap.attributeKeys.length; i < lt; i++ ) {
                    var key = textureAttributeMap.attributeKeys[ i ];

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
                        //                if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
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
            if ( this.attributeMap[ key ] ) {
                this.attributeMap[ key ].globalDefault = attribute;
            } else {
                this.attributeMap[ key ] = Stack.create();
                this.attributeMap[ key ].globalDefault = attribute;

                this.attributeMap.attributeKeys.push( key );
            }
        },

        pushAttributeMap: function ( attributeMap, attributeList ) {
            /*jshint bitwise: false */
            var attributeStack;
            for ( var i = 0, l = attributeList.attributeKeys.length; i < l; i++ ) {
                var type = attributeList.attributeKeys[ i ];
                var attributePair = attributeList[ type ];
                var attribute = attributePair.getAttribute();
                if ( attributeMap[ type ] === undefined ) {
                    attributeMap[ type ] = Stack.create();
                    attributeMap[ type ].globalDefault = attribute.cloneType();

                    attributeMap.attributeKeys.push( type );
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
        popAttributeMap: function ( attributeMap, attributeList ) {
            var attributeStack;
            for ( var i = 0, l = attributeList.attributeKeys.length; i < l; i++ ) {
                var type = attributeList.attributeKeys[ i ];
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
                var updateColorUniform = false;
                var hasColorAttrib = false;
                if ( program.attributesCache.Color !== undefined ) {
                    hasColorAttrib = this.vertexAttribMap[ program.attributesCache.Color ];
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
                //Notify.log(uniform.get()[0]);
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
