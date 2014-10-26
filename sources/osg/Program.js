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

        this._program = null;

        // used to know if it's a default program
        // a default program does nothing but avoid to do some
        // useless logic
        // if we vertex or fragment shader are set it's not a default
        // program anymore
        this._nullProgram = true;

        this._vertex = undefined;
        this._fragment = undefined;

        this._uniformsCache = undefined;
        this._attributesCache = undefined;

        if ( vShader )
            this.setVertexShader( vShader );

        if ( fShader )
            this.setFragmentShader( fShader );
    };

    /** @lends Program.prototype */
    Program.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'Program',

        cloneType: function () {
            return new Program();
        },

        setVertexShader: function ( vs ) {
            this._vertex = vs;
            this._nullProgram = false;
        },

        setFragmentShader: function ( fs ) {
            this._fragment = fs;
            this._nullProgram = false;
        },

        getVertexShader: function () {
            return this._vertex;
        },
        getFragmentShader: function () {
            return this._fragment;
        },

        apply: function ( state ) {

            if (this._nullProgram) return;

            var gl = state.getGraphicContext();

            if ( !this._program || this.isDirty() ) {

                var compileClean;

                if ( !this._vertex.shader ) {
                    compileClean = this._vertex.compile( gl );
                }

                if ( !this._fragment.shader ) {
                    compileClean = this._fragment.compile( gl );
                }

                if ( compileClean ) {

                    this._program = gl.createProgram();

                    gl.attachShader( this._program, this._vertex.shader );
                    gl.attachShader( this._program, this._fragment.shader );
                    MACROUTILS.timeStamp( 'osgjs.metrics:linkShader' );
                    gl.linkProgram( this._program );
                    gl.validateProgram( this._program );

                    if ( !gl.getProgramParameter( this._program, gl.LINK_STATUS ) && !gl.isContextLost() ) {
                        Notify.error( gl.getProgramInfoLog( this._program ) );
                        Notify.log( 'can\'t link program\n' + 'vertex shader:\n' + this._vertex.text + '\n fragment shader:\n' + this._fragment.text, true, false );
                        compileClean = false;

                    }
                }

                if ( !compileClean ) {
                    // Any error, Any
                    // Pink must die.
                    if ( !Program.prototype._failSafeCache ) {

                        var program = gl.createProgram();
                        this._vertex.failSafe( gl );
                        this._fragment.failSafe( gl );

                        gl.attachShader( program, this._vertex.shader );
                        gl.attachShader( program, this._fragment.shader );
                        gl.linkProgram( program );
                        gl.validateProgram( program );

                        // cache to compile and allocate only once
                        // not polluting the inspector
                        Program.prototype._failSafeCache = program;
                    }
                    Notify.warn( 'FailSafe shader Activated ' );
                    this._program = this._failSafeCache;
                }

                this._uniformsCache = new Map();
                this._attributesCache = new Map();

                this.cacheUniformList( gl, this._vertex.text );
                this.cacheUniformList( gl, this._fragment.text );

                this.cacheAttributeList( gl, this._vertex.text );

                this.setDirty( false );
            }

            gl.useProgram( this._program );
        },

        cacheUniformList: function ( gl, str ) {
            var r = str.match( /uniform\s+\w+\s+\w+/g );
            var map = this._uniformsCache;
            if ( r !== null ) {
                for ( var i = 0, l = r.length; i < l; i++ ) {
                    var uniform = r[ i ].match( /uniform\s+\w+\s+(\w+)/ )[ 1 ];
                    var location = gl.getUniformLocation( this._program, uniform );
                    if ( location !== undefined && location !== null ) {
                        if ( map[ uniform ] === undefined ) {
                            map[ uniform ] = location;
                            this._uniformsCache.dirty();
                        }
                    }
                }
            }
        },

        cacheAttributeList: function ( gl, str ) {
            var r = str.match( /attribute\s+\w+\s+\w+/g );
            var map = this._attributesCache;
            if ( r !== null ) {
                for ( var i = 0, l = r.length; i < l; i++ ) {
                    var attr = r[ i ].match( /attribute\s+\w+\s+(\w+)/ )[ 1 ];
                    var location = gl.getAttribLocation( this._program, attr );
                    if ( location !== -1 && location !== undefined ) {
                        if ( map[ attr ] === undefined ) {
                            map[ attr ] = location;
                            this._attributesCache.dirty();
                        }
                    }
                }
            }
        }
    } ), 'osg', 'Program' );

    return Program;
} );
