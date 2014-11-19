define( [
    'osg/Utils',
    'osg/Notify',
    'osg/StateAttribute',
    'osg/Map'
], function ( MACROUTILS, Notify, StateAttribute, Map ) {
    'use strict';

    /**
     * Program encapsulate an vertex and fragment shader
     * @class Program
     */
    var Program = function ( vShader, fShader ) {
        StateAttribute.call( this );

        this.program = null;
        this.setVertexShader( vShader );
        this.setFragmentShader( fShader );
        this.dirty = true;
    };

    /** @lends Program.prototype */
    Program.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {

        attributeType: 'Program',
        cloneType: function () {
            var p = new Program();
            p.defaultProgram = true;
            return p;
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType;
        },
        setVertexShader: function ( vs ) {
            this.vertex = vs;
        },
        setFragmentShader: function ( fs ) {
            this.fragment = fs;
        },
        getVertexShader: function () {
            return this.vertex;
        },
        getFragmentShader: function () {
            return this.fragment;
        },
        apply: function ( state ) {
            var gl = state.getGraphicContext();
            if ( !this.program || this.isDirty() ) {

                if ( this.defaultProgram === true ) {
                    return;
                }
                var compileClean;
                if ( !this.vertex.shader ) {
                    compileClean = this.vertex.compile( gl );
                }
                if ( !this.fragment.shader ) {
                    compileClean = this.fragment.compile( gl );
                }
                if ( compileClean ) {
                    this.program = gl.createProgram();
                    gl.attachShader( this.program, this.vertex.shader );
                    gl.attachShader( this.program, this.fragment.shader );
                    MACROUTILS.timeStamp( 'osgjs.metrics:linkShader' );
                    gl.linkProgram( this.program );
                    gl.validateProgram( this.program );
                    if ( !gl.getProgramParameter( this.program, gl.LINK_STATUS ) && !gl.isContextLost() ) {
                        Notify.error( gl.getProgramInfoLog( this.program ) );
                        Notify.log( 'can\'t link program\n' + 'vertex shader:\n' + this.vertex.text + '\n fragment shader:\n' + this.fragment.text, true, false );
                        compileClean = false;
                        //debugger;
                    }
                }
                if ( !compileClean ) {
                    // Any error, Any
                    // Pink must die.
                    if ( !Program.prototype._failSafeCache ) {
                        this.vertex.failSafe( gl );
                        this.fragment.failSafe( gl );
                        this.program = gl.createProgram();
                        gl.attachShader( this.program, this.vertex.shader );
                        gl.attachShader( this.program, this.fragment.shader );
                        gl.linkProgram( this.program );
                        gl.validateProgram( this.program );

                        // cache to compile and allocate only once
                        // not polluting the inspector
                        Program.prototype._failSafeCache = this.program;
                    }
                    Notify.warn( 'FailSafe shader Activated ' );
                    this.program = this._failSafeCache;
                }

                this.uniformsCache = new Map();
                this.attributesCache = new Map();

                this.cacheUniformList( gl, this.vertex.text );
                this.cacheUniformList( gl, this.fragment.text );

                this.cacheAttributeList( gl, this.vertex.text );

                this.setDirty( false );
            }

            gl.useProgram( this.program );
        },

        cacheUniformList: function ( gl, str ) {
            var r = str.match( /uniform\s+\w+\s+\w+/g );
            var map = this.uniformsCache;
            if ( r !== null ) {
                for ( var i = 0, l = r.length; i < l; i++ ) {
                    var uniform = r[ i ].match( /uniform\s+\w+\s+(\w+)/ )[ 1 ];
                    var location = gl.getUniformLocation( this.program, uniform );
                    if ( location !== undefined && location !== null ) {
                        if ( map[ uniform ] === undefined ) {
                            map[ uniform ] = location;
                            this.uniformsCache.dirty();
                        }
                    }
                }
            }
        },

        cacheAttributeList: function ( gl, str ) {
            var r = str.match( /attribute\s+\w+\s+\w+/g );
            var map = this.attributesCache;
            if ( r !== null ) {
                for ( var i = 0, l = r.length; i < l; i++ ) {
                    var attr = r[ i ].match( /attribute\s+\w+\s+(\w+)/ )[ 1 ];
                    var location = gl.getAttribLocation( this.program, attr );
                    if ( location !== -1 && location !== undefined ) {
                        if ( map[ attr ] === undefined ) {
                            map[ attr ] = location;
                            this.attributesCache.dirty();
                        }
                    }
                }
            }
        }
    } ), 'osg', 'Program' );

    Program.create = function ( vShader, fShader ) {
        Notify.log( 'Program.create is deprecated use new Program(vertex, fragment) instead' );
        var program = new Program( vShader, fShader );
        return program;
    };

    return Program;
} );