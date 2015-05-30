define( [
    'osg/Utils',
    'osg/Notify',
    'osg/GLObject',
    'osg/StateAttribute',
    'osg/Map',
    'osg/Timer'
], function ( MACROUTILS, Notify, GLObject, StateAttribute, CustomMap, Timer ) {
    'use strict';

    /**
     * Program encapsulate an vertex and fragment shader
     * @class Program
     */
    var Program = function ( vShader, fShader ) {
        GLObject.call( this );
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

    // static cache of glPrograms flagged for deletion, which will actually
    // be deleted in the correct GL context.
    Program._sDeletedGLProgramCache = new Map();

    // static method to delete Program 
    Program.deleteGLProgram = function ( gl, program ) {
        if ( !Program._sDeletedGLProgramCache.has( gl ) )
            Program._sDeletedGLProgramCache.set( gl, [] );
        Program._sDeletedGLProgramCache.get( gl ).push( program );
    };
    // static method to flush all the cached glPrograms which need to be deleted in the GL context specified
    Program.flushDeletedGLPrograms = function ( gl, availableTime ) {
        // if no time available don't try to flush objects.
        if ( availableTime <= 0.0 ) return availableTime;
        if ( !Program._sDeletedGLProgramCache.has( gl ) ) return availableTime;
        var elapsedTime = 0.0;
        var beginTime = Timer.instance().tick();
        var deleteList = Program._sDeletedGLProgramCache.get( gl );
        var numPrograms = deleteList.length;
        for ( var i = numPrograms - 1; i >= 0 && elapsedTime < availableTime; i-- ) {
            gl.deleteProgram( deleteList[ i ] );
            deleteList.splice( i, 1 );
            elapsedTime = Timer.instance().deltaS( beginTime, Timer.instance().tick() );
        }
        availableTime -= elapsedTime;
        return availableTime;
    };

    Program.flushAllDeletedGLPrograms = function ( gl ) {
        if ( !Program._sDeletedGLProgramCache.has( gl ) ) return;
        var deleteList = Program._sDeletedGLProgramCache.get( gl );
        var numPrograms = deleteList.length;
        for ( var i = numPrograms - 1; i >= 0; i-- ) {
            gl.deleteProgram( deleteList[ i ] );
            deleteList.splice( i, 1 );
        }
    };

    /** @lends Program.prototype */
    Program.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( GLObject.prototype, MACROUTILS.objectInherit( StateAttribute.prototype, {

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

        getProgram: function () {
            return this._program;
        },

        releaseGLObjects: function () {
            // Call to releaseGLOBjects on shaders
            if ( this._vertex !== undefined ) this._vertex.releaseGLObjects();
            if ( this._fragment !== undefined ) this._fragment.releaseGLObjects();
            if ( this._program === null ) return;
            if ( this._gl !== undefined ) {
                Program.deleteGLProgram( this._gl, this._program );
            }
            this._program = undefined;
        },

        apply: function ( state ) {

            if ( this._nullProgram ) return;

            if ( !this._gl ) {
                this.setGraphicContext( state.getGraphicContext() );
            }
            var gl = this._gl;
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

                    if ( !gl.getProgramParameter( this._program, gl.LINK_STATUS ) && !gl.isContextLost() ) {
                        var errLink = gl.getProgramInfoLog( this._program );

                        Notify.error( errLink );
                        Notify.log( 'can\'t link program\n' + 'vertex shader:\n' + this._vertex.text + '\n fragment shader:\n' + this._fragment.text, true, false );
                        // rawgl trick is for webgl inspector
                        var debugShader = ( gl.rawgl !== undefined ? gl.rawgl : gl );
                        if ( debugShader !== undefined && debugShader.getExtension !== undefined ) debugShader = debugShader.getExtension( 'WEBGL_debug_shaders' );
                        if ( debugShader && errLink === 'Failed to create D3D shaders.\n' ) {

                            Notify.error( debugShader.getTranslatedShaderSource( this._vertex.shader ), true, false );
                            Notify.error( debugShader.getTranslatedShaderSource( this._fragment.shader ), true, false );
                        }

                        compileClean = false;
                    }
                    // TODO: better usage of validate.
                    // as it's intended at shader program usage
                    // validating against current gl state
                    // Not for compilation stage
                    // gl.validateProgram( this._program );

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

                this._uniformsCache = new CustomMap();
                this._attributesCache = new CustomMap();

                this.cacheUniformList( gl, this._vertex.text );
                this.cacheUniformList( gl, this._fragment.text );

                this.cacheAttributeList( gl, this._vertex.text );

                this.setDirty( false );
            }

            state.applyProgram( this._program );
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
    } ) ), 'osg', 'Program' );

    return Program;
} );
