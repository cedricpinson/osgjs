/*jshint sub:true*/

'use strict';

// allow State cache
// allow play of webgl commands
var WebGLStateCache = function ( gl, cache, record, asyncCmd ) {

    var arrayCompare = function ( a, b ) {
        if ( a && b && a.length === b.length ) {
            for ( var n = 0; n < a.length; n++ ) {
                if ( a[ n ] !== b[ n ] ) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    };

    var wrapperCall = function ( glCall, glName, glArgs, glArgsNum ) {

        var out;

        //avoid calling apply,call.
        switch ( glArgsNum ) {

        case 0:
            out = gl[ glName ]();
            break;
        case 1:
            out = gl[ glName ]( glArgs[ 0 ] );
            break;
        case 2:
            out = gl[ glName ]( glArgs[ 0 ], glArgs[ 1 ] );
            break;
        case 3:
            out = gl[ glName ]( glArgs[ 0 ], glArgs[ 1 ], glArgs[ 2 ] );
            break;
        case 4:
            out = gl[ glName ]( glArgs[ 0 ], glArgs[ 1 ], glArgs[ 2 ], glArgs[ 3 ] );
            break;
        case 5:
            out = gl[ glName ]( glArgs[ 0 ], glArgs[ 1 ], glArgs[ 2 ], glArgs[ 3 ], glArgs[ 4 ] );
            break;
        case 6:
            out = gl[ glName ]( glArgs[ 0 ], glArgs[ 1 ], glArgs[ 2 ], glArgs[ 3 ], glArgs[ 4 ], glArgs[ 5 ] );
            break;

        default:
            console.log( 'MaxCall: ' + glArgs.length );
            out = gl[ glName ].apply( gl, glArgs );
        }

        return out;

    };

    this.gl = gl;

    function initializeStateCache( gl ) {

        var n;
        var stateCache = {};

        var stateParameters = [
            'ACTIVE_TEXTURE',
            'ARRAY_BUFFER_BINDING',
            'BLEND',
            'BLEND_COLOR',
            'BLEND_DST_ALPHA',
            'BLEND_DST_RGB',
            'BLEND_EQUATION_ALPHA',
            'BLEND_EQUATION_RGB',
            'BLEND_SRC_ALPHA',
            'BLEND_SRC_RGB',
            'COLOR_CLEAR_VALUE',
            'COLOR_WRITEMASK',
            'CULL_FACE',
            'CULL_FACE_MODE',
            'CURRENT_PROGRAM',
            'DEPTH_FUNC',
            'DEPTH_RANGE',
            'DEPTH_WRITEMASK',
            'ELEMENT_ARRAY_BUFFER_BINDING',
            'FRAMEBUFFER_BINDING',
            'FRONT_FACE',
            'GENERATE_MIPMAP_HINT',
            'LINE_WIDTH',
            'PACK_ALIGNMENT',
            'POLYGON_OFFSET_FACTOR',
            'POLYGON_OFFSET_FILL',
            'POLYGON_OFFSET_UNITS',
            'RENDERBUFFER_BINDING',
            'POLYGON_OFFSET_FACTOR',
            'POLYGON_OFFSET_FILL',
            'POLYGON_OFFSET_UNITS',
            'SAMPLE_COVERAGE_INVERT',
            'SAMPLE_COVERAGE_VALUE',
            'SCISSOR_BOX',
            'SCISSOR_TEST',
            'STENCIL_BACK_FAIL',
            'STENCIL_BACK_FUNC',
            'STENCIL_BACK_PASS_DEPTH_FAIL',
            'STENCIL_BACK_PASS_DEPTH_PASS',
            'STENCIL_BACK_REF',
            'STENCIL_BACK_VALUE_MASK',
            'STENCIL_BACK_WRITEMASK',
            'STENCIL_CLEAR_VALUE',
            'STENCIL_FAIL',
            'STENCIL_FUNC',
            'STENCIL_PASS_DEPTH_FAIL',
            'STENCIL_PASS_DEPTH_PASS',
            'STENCIL_REF',
            'STENCIL_TEST',
            'STENCIL_VALUE_MASK',
            'STENCIL_WRITEMASK',
            'UNPACK_ALIGNMENT',
            'UNPACK_COLORSPACE_CONVERSION_WEBGL',
            'UNPACK_FLIP_Y_WEBGL',
            'UNPACK_PREMULTIPLY_ALPHA_WEBGL',
            'VENDOR',
            'VERSION',
            'UNPACK_PREMULTIPLY_ALPHA_WEBGL',
            'VIEWPORT'
        ];

        var param, glparam, glparamname;

        for ( n = 0; n < stateParameters.length; n++ ) {

            try {
                param = stateParameters[ n ];
                glparamname = gl[ param ];
                glparam = gl.getParameter( glparamname );
                stateCache[ glparamname ] = param;
                //stateCache[glparam] = param;
                stateCache[ param ] = glparam;
            } catch ( e ) {
                // Ignored
            }

        }

        var maxTextureUnits = gl.getParameter( gl.MAX_TEXTURE_IMAGE_UNITS );
        var originalActiveTexture = gl.getParameter( gl.ACTIVE_TEXTURE );

        for ( n = 0; n < maxTextureUnits; n++ ) {

            gl.activeTexture( gl.TEXTURE0 + n );
            stateCache[ 'TEXTURE_BINDING_2D_' + n ] = gl.getParameter( gl.TEXTURE_BINDING_2D );
            stateCache[ 'TEXTURE_BINDING_CUBE_MAP_' + n ] = gl.getParameter( gl.TEXTURE_BINDING_CUBE_MAP );

        }

        gl.activeTexture( originalActiveTexture );
        var maxVertexAttribs = gl.getParameter( gl.MAX_VERTEX_ATTRIBS );
        for ( n = 0; n < maxVertexAttribs; n++ ) {

            stateCache[ 'VERTEX_ATTRIB_ARRAY_ENABLED_' + n ] = gl.getVertexAttrib( n, gl.VERTEX_ATTRIB_ARRAY_ENABLED );
            stateCache[ 'VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_' + n ] = gl.getVertexAttrib( n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING );
            stateCache[ 'VERTEX_ATTRIB_ARRAY_SIZE_' + n ] = gl.getVertexAttrib( n, gl.VERTEX_ATTRIB_ARRAY_SIZE );
            stateCache[ 'VERTEX_ATTRIB_ARRAY_STRIDE_' + n ] = gl.getVertexAttrib( n, gl.VERTEX_ATTRIB_ARRAY_STRIDE );
            stateCache[ 'VERTEX_ATTRIB_ARRAY_TYPE_' + n ] = gl.getVertexAttrib( n, gl.VERTEX_ATTRIB_ARRAY_TYPE );
            stateCache[ 'VERTEX_ATTRIB_ARRAY_NORMALIZED_' + n ] = gl.getVertexAttrib( n, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED );
            stateCache[ 'VERTEX_ATTRIB_ARRAY_POINTER_' + n ] = gl.getVertexAttribOffset( n, gl.VERTEX_ATTRIB_ARRAY_POINTER );
            stateCache[ 'CURRENT_VERTEX_ATTRIB_' + n ] = gl.getVertexAttrib( n, gl.CURRENT_VERTEX_ATTRIB );

        }

        return stateCache;

    }

    var stateCache = initializeStateCache( gl );

    this._stateCache = stateCache;
    this._uniformCache = {};
    this._wrapper = {

        _gl: gl,

        _stateCache: stateCache,

        _programUniformCache: new WeakMap(),

        _callsStack: [],
        _callsStackCurrent: 0,

        _record: record,

        _async: asyncCmd,
        _sync: !asyncCmd,

        _cache: cache,

        // can we replay last frame
        // because we recorded entirely
        // and no 'sync' calls was done
        _lastFrameCanAsync: false,

        isAsync: function () {
            return this._async;
        },

        isRecording: function () {
            return this._record;
        },

        resetCalls: function () {

            this._callsStackCurrent = 0;
            this._lastFrameCanAsync = true;
            //this._uniformsCache = {}
        },

        addCall: function ( callFunc, params, callName ) {

            var c;
            if ( this._callsStackCurrent === this._callsStack.length ) {

                c = {
                    callFunc: callFunc,
                    name: callName,
                    parameters: new Array( 10 ),
                    paramNum: 0
                };
                this._callsStack.push( c );

            } else {

                c = this._callsStack[ this._callsStackCurrent ];
                c.callFunc = callFunc;
                c.name = callName;
            }

            // copying arguments makes deopt V8 on arguments.slice
            // trycopy
            if ( params ) {
                var l = params.length;
                for ( var i = 0; i < l; i++ ) {
                    c.parameters[ i ] = params[ i ];
                }
                c.paramNum = l;
            } else {
                c.paramNum = 0;
            }

            this._callsStackCurrent++;
            return c;

        },

        logCalls: function () {

            for ( var i = 0, l = this._callsStackCurrent; i < l; i++ ) {

                var glCall = this._callsStack[ i ];
                var logMsg = i + ': ' + glCall.name;
                var l = glCall.parameters.length;
                if ( l > 0 ) {

                    logMsg += ' (';
                    for ( var k = 0; k < l; k++ ) {
                        logMsg += glCall.parameters[ k ];
                    }
                    logMsg += ')';

                }
                console.log( logMsg );

            }

        },

        replayCalls: function () {


            for ( var i = 0, l = this._callsStackCurrent; i < l; i++ ) {

                var glCall = this._callsStack[ i ];

                wrapperCall( glCall.callFunc, glCall.name, glCall.parameters, glCall.paramNum );
                /*
                //avoid calling apply,call.
                switch ( glCall.paramNum ) {

                case 0:
                    glCall.callFunc.call( this._gl );
                    continue;
                case 1:
                    glCall.callFunc.call( this._gl, glCall.parameters[ 0 ] );
                    continue;
                case 2:
                    glCall.callFunc.call( this._gl, glCall.parameters[ 0 ], glCall.parameters[ 1 ] );
                    continue;
                case 3:
                    glCall.callFunc.call( this._gl, glCall.parameters[ 0 ], glCall.parameters[ 1 ], glCall.parameters[ 2 ] );
                    continue;
                case 4:
                    glCall.callFunc.call( this._gl, glCall.parameters[ 0 ], glCall.parameters[ 1 ], glCall.parameters[ 2 ], glCall.parameters[ 3 ] );
                    continue;
                case 5:
                    glCall.callFunc.call( this._gl, glCall.parameters[ 0 ], glCall.parameters[ 1 ], glCall.parameters[ 2 ], glCall.parameters[ 3 ], glCall.parameters[ 4 ] );
                    continue;

                default:
                    console.log( 'MaxCall' + glCall.paramNum );
                    /// wrong !! should useparamNum
                    glCall.callFunc.apply( this._gl, glCall.parameters );
                }
*/
            }

        },


        // now the gl calls
        activeTexture: function ( texture ) {

            if ( this._stateCache[ 'ACTIVE_TEXTURE' ] === texture ) return;


            this._stateCache[ 'ACTIVE_TEXTURE' ] = texture;

            if ( this._sync ) this._gl.activeTexture( texture );
            if ( this._record ) this.addCall( this._gl.activeTexture, arguments, 'activeTexture' );

        },

        bindBuffer: function ( target, buffer ) {

            //var idx = target;
            //switch(target) {
            //case this.ARRAY_BUFFER_BINDING:
            //    idx = 'ARRAY_BUFFER_BINDING';
            //    break;
            //case this.ELEMENT_ARRAY_BUFFER:
            //    idx = 'ELEMENT_ARRAY_BUFFER';
            //    break;
            //}

            if ( this._stateCache[ target ] == buffer ) return;


            this._stateCache[ target ] = buffer;

            if ( this._sync ) this._gl.bindBuffer( target, buffer );
            if ( this._record ) this.addCall( this._gl.bindBuffer, arguments, 'bindBuffer' );
        },

        bindFramebuffer: function ( target, framebuffer ) {

            if ( this._stateCache[ 'FRAMEBUFFER_BINDING' ] === framebuffer ) return;

            this._stateCache[ 'FRAMEBUFFER_BINDING' ] = framebuffer;

            if ( this._sync ) this._gl.bindFramebuffer( target, framebuffer );
            if ( this._record ) this.addCall( this._gl.bindFramebuffer, arguments, 'bindFramebuffer' );
        },

        bindRenderbuffer: function ( target, renderbuffer ) {

            if ( this._stateCache[ 'RENDERBUFFER_BINDING' ] === renderbuffer ) return;

            this._stateCache[ 'RENDERBUFFER_BINDING' ] = renderbuffer;

            if ( this._sync ) this._gl.bindRenderbuffer( target, renderbuffer );
            if ( this._record ) this.addCall( this._gl.bindRenderbuffer, arguments, 'bindRenderbuffer' );
        },

        bindTexture: function ( target, texture ) {

            if ( !texture ) // check framebuffer VS texture bind
                return;

            var activeTexture = ( this._stateCache[ 'ACTIVE_TEXTURE' ] - this.TEXTURE0 );

            var idx;
            switch ( target ) {
            case this.TEXTURE_2D:
                idx = 'TEXTURE_BINDING_2D_' + activeTexture;
                break;
            case this.TEXTURE_CUBE_MAP:
                idx = 'TEXTURE_BINDING_CUBE_MAP_' + activeTexture;
                break;
            }

            if ( this._stateCache[ idx ] === texture ) return;

            this._stateCache[ idx ] = texture;

            if ( this._sync ) this._gl.bindTexture( target, texture );
            if ( this._record ) this.addCall( this._gl.bindTexture, arguments, 'bindTexture' );

        },

        blendEquation: function ( mode ) {

            if ( this._stateCache[ 'BLEND_EQUATION_RGB' ] === mode && this._stateCache[ 'BLEND_EQUATION_ALPHA' ] === mode ) return;

            this._stateCache[ 'BLEND_EQUATION_RGB' ] = mode;
            this._stateCache[ 'BLEND_EQUATION_ALPHA' ] = mode;


            if ( this._sync ) this._gl.blendEquation( mode );
            if ( this._record ) this.addCall( this._gl.blendEquation, arguments, 'blendEquation' );

        },

        blendEquationSeparate: function ( modeRGB, modeAlpha ) {

            if ( ( this._stateCache[ 'BLEND_EQUATION_RGB' ] === modeRGB ) && ( this._stateCache[ 'BLEND_EQUATION_ALPHA' ] == modeAlpha ) ) return;

            this._stateCache[ 'BLEND_EQUATION_RGB' ] = modeRGB;
            this._stateCache[ 'BLEND_EQUATION_ALPHA' ] = modeAlpha;

            if ( this._sync ) this._gl.blendEquation( modeRGB, modeAlpha );
            if ( this._record ) this.addCall( this._gl.blendEquation, arguments, 'blendEquation' );
        },

        blendFunc: function ( sfactor, dfactor ) {

            if ( this._stateCache[ 'BLEND_SRC_RGB' ] == sfactor && this._stateCache[ 'BLEND_SRC_ALPHA' ] === sfactor && this._stateCache[ 'BLEND_DST_RGB' ] === dfactor && this._stateCache[ 'BLEND_DST_ALPHA' ] === dfactor ) return;

            this._stateCache[ 'BLEND_SRC_RGB' ] = sfactor;
            this._stateCache[ 'BLEND_SRC_ALPHA' ] = sfactor;
            this._stateCache[ 'BLEND_DST_RGB' ] = dfactor;
            this._stateCache[ 'BLEND_DST_ALPHA' ] = dfactor;


            if ( this._sync )
                this._gl.blendFunc( sfactor, dfactor );
            if ( this._record ) this.addCall( this._gl.blendFunc, arguments, 'blendFunc' );
        },

        blendFuncSeparate: function ( srcRGB, dstRGB, srcAlpha, dstAlpha ) {

            if ( ( this._stateCache[ 'BLEND_SRC_RGB' ] === sfactor ) && ( this._stateCache[ 'BLEND_SRC_ALPHA' ] === sfactor ) && ( this._stateCache[ 'BLEND_DST_RGB' ] === dfactor ) && ( this._stateCache[ 'BLEND_DST_ALPHA' ] === dfactor ) ) return;

            this._stateCache[ 'BLEND_SRC_RGB' ] = srcRGB;
            this._stateCache[ 'BLEND_SRC_ALPHA' ] = srcAlpha;
            this._stateCache[ 'BLEND_DST_RGB' ] = dstRGB;
            this._stateCache[ 'BLEND_DST_ALPHA' ] = dstAlpha;

            if ( this._sync )
                this._gl.blendFuncSeparate( srcRGB, dstRGB, srcAlpha, dstAlpha );
            if ( this._record ) this.addCall( this._gl.blendFuncSeparate, arguments, 'blendFuncSeparate' );
        },

        clearColor: function ( red, green, blue, alpha ) {

            var clearVal = this._stateCache[ 'COLOR_CLEAR_VALUE' ];
            if ( clearVal[ 0 ] === red && clearVal[ 1 ] === green && clearVal[ 2 ] === blue && clearVal[ 3 ] === alpha ) return;

            this._stateCache[ 'COLOR_CLEAR_VALUE' ] = [ red, green, blue, alpha ];

            if ( this._sync )
                this._gl.clearColor( red, green, blue, alpha );
            if ( this._record ) this.addCall( this._gl.clearColor, arguments, 'clearColor' );
        },

        clearDepth: function ( depth ) {

            if ( this._stateCache[ 'DEPTH_CLEAR_VALUE' ] === depth ) return;
            this._stateCache[ 'DEPTH_CLEAR_VALUE' ] = depth;

            if ( this._sync ) this._gl.clearDepth( depth );
            if ( this._record ) this.addCall( this._gl.clearDepth, arguments, 'clearDepth' );
        },

        clearStencil: function ( s ) {

            if ( this._stateCache[ 'STENCIL_CLEAR_VALUE' ] === s ) return;
            this._stateCache[ 'STENCIL_CLEAR_VALUE' ] = s;

            if ( this._sync )
                this._gl.clearStencil( s );
            if ( this._record ) this.addCall( this._gl.clearStencil, arguments, 'clearStencil' );
        },

        colorMask: function ( red, green, blue, alpha ) {

            var clearVal = this._stateCache[ 'COLOR_WRITEMASK' ];
            if ( clearVal[ 0 ] === red && clearVal[ 1 ] === green && clearVal[ 2 ] === blue && clearVal[ 3 ] === alpha ) return;

            this._stateCache[ 'COLOR_WRITEMASK' ] = [ red, green, blue, alpha ];

            if ( this._sync )
                this._gl.colorMask( red, green, blue, alpha );
            if ( this._record ) this.addCall( this._gl.colorMask, arguments, 'colorMask' );
        },

        cullFace: function ( mode ) {

            if ( this._stateCache[ 'CULL_FACE_MODE' ] === mode ) return;

            this._stateCache[ 'CULL_FACE_MODE' ] = mode;

            if ( this._sync )
                this._gl.cullFace( mode );
            if ( this._record ) this.addCall( this._gl.cullFace, arguments, 'cullFace' );
        },

        depthFunc: function ( func ) {

            if ( this._stateCache[ 'DEPTH_FUNC' ] === func ) return;

            this._stateCache[ 'DEPTH_FUNC' ] = func;

            if ( this._sync )
                this._gl.depthFunc( func );
            if ( this._record ) this.addCall( this._gl.depthFunc, arguments, 'depthFunc' );
        },

        depthMask: function ( flag ) {

            if ( this._stateCache[ 'DEPTH_WRITEMASK' ] === flag ) return;

            this._stateCache[ 'DEPTH_WRITEMASK' ] = flag;

            if ( this._sync )
                this._gl.depthMask( flag );
            if ( this._record ) this.addCall( this._gl.depthMask, arguments, 'depthMask' );
        },

        depthRange: function ( zNear, zFar ) {

            var dRange = this._stateCache[ 'DEPTH_RANGE' ];
            if ( dRange[ 0 ] === zNear && dRange[ 1 ] === zFar ) return;

            this._stateCache[ 'DEPTH_RANGE' ] = [ zNear, zFar ];

            if ( this._sync )
                this._gl.depthRange( zNear, zFar );
            if ( this._record ) this.addCall( this._gl.depthRange, arguments, 'depthRange' );
        },

        toggleIdx: function ( cap ) {

            return this._stateCache[ cap ];
            /* switch(cap) {
             case this.BLEND:
                return  'BLEND';
             case this.CULL_FACE:
                return 'CULL_FACE';
             case this.DEPTH_TEST:
                 return 'DEPTH_TEST';
             case this.POLYGON_OFFSET_FILL:
                 return 'POLYGON_OFFSET_FILL';
             case this.SAMPLE_ALPHA_TO_COVERAGE:
                return 'SAMPLE_ALPHA_TO_COVERAGE';
             case this.SAMPLE_COVERAGE:
                 return 'SAMPLE_COVERAGE';
             case this.SCISSOR_TEST:
                 return 'SCISSOR_TEST';
             case this.STENCIL_TEST:
                 return 'STENCIL_TEST';
             }*/
        },

        toggleNeeded: function ( idx, value ) {

            if ( this._stateCache[ idx ] !== value ) return true;
            return false;

        },

        disable: function ( cap ) {

            var idx = this.toggleIdx( cap );
            if ( this.toggleNeeded( idx, false ) ) {
                this._stateCache[ idx ] = false;

                if ( this._sync )
                    this._gl.disable( cap );
                if ( this._record ) this.addCall( this._gl.disable, arguments, 'disable' );
            }

        },

        enable: function ( cap ) {

            var idx = this.toggleIdx( cap );
            if ( this.toggleNeeded( idx, true ) ) {
                this._stateCache[ idx ] = true;
                if ( this._sync )
                    this._gl.enable( cap );
                if ( this._record ) this.addCall( this._gl.enable, arguments, 'enable' );
            }

        },

        disableVertexAttribArray: function ( index ) {

            if ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_ENABLED_' + index ] === false ) return;
            this._stateCache[ 'VERTEX_ATTRIB_ARRAY_ENABLED_' + index ] = false;

            if ( this._sync )
                this._gl.disableVertexAttribArray( index );
            if ( this._record ) this.addCall( this._gl.disableVertexAttribArray, arguments, 'disableVertexAttribArray' );
        },

        enableVertexAttribArray: function ( index ) {

            if ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_ENABLED_' + index ] === true ) return;
            this._stateCache[ 'VERTEX_ATTRIB_ARRAY_ENABLED_' + index ] = true;

            if ( this._sync )
                this._gl.enableVertexAttribArray( index );
            if ( this._record ) this.addCall( this._gl.enableVertexAttribArray, arguments, 'enableVertexAttribArray' );
        },

        frontFace: function ( mode ) {

            if ( this._stateCache[ 'FRONT_FACE' ] === mode ) return;
            this._stateCache[ 'FRONT_FACE' ] = mode;

            if ( this._sync )
                this._gl.frontFace( mode );
            if ( this._record ) this.addCall( this._gl.frontFace, arguments, 'frontFace' );
        },

        hint: function ( target, mode ) {

            if ( target === this.GENERATE_MIPMAP_HINT ) {

                if ( this._stateCache[ 'GENERATE_MIPMAP_HINT' ] === mode ) return;
                this._stateCache[ 'GENERATE_MIPMAP_HINT' ] = mode;

            }


            if ( this._sync )
                this._gl.hint( target, mode );
            if ( this._record ) this.addCall( this._gl.hint, arguments, 'hint' );
        },

        lineWidth: function ( width ) {

            if ( this._stateCache[ 'LINE_WIDTH' ] === width ) return;
            this._stateCache[ 'LINE_WIDTH' ] = width;

            if ( this._sync )
                this._gl.lineWidth( width );
            if ( this._record ) this.addCall( this._gl.lineWidth, arguments, 'lineWidth' );

        },
        pixelStorei: function ( pname, param ) {

            var idx = this._stateCache[ pname ];
            /* switch(pname) {
             case this.PACK_ALIGNMENT:
                 idx = 'PACK_ALIGNMENT';
                 break;
             case this.UNPACK_ALIGNMENT:
                 idx = 'UNPACK_ALIGNMENT';
                 break;
             case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
                 idx = 'UNPACK_COLORSPACE_CONVERSION_WEBGL';
                 break;
             case this.UNPACK_FLIP_Y_WEBGL:
                 idx = 'UNPACK_FLIP_Y_WEBGL';
                 break;
             case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
                 idx = 'UNPACK_PREMULTIPLY_ALPHA_WEBGL';
                 break;
             }*/
            if ( this._stateCache[ idx ] === param ) return;
            this._stateCache[ idx ] = param;

            if ( this._sync )
                this._gl.pixelStorei( pname, param );
            if ( this._record ) this.addCall( this._gl.pixelStorei, arguments, 'pixelStorei' );
        },

        polygonOffset: function ( factor, units ) {

            if ( this._stateCache[ 'POLYGON_OFFSET_FACTOR' ] === factor && this._stateCache[ 'POLYGON_OFFSET_UNITS' ] === units ) return;
            this._stateCache[ 'POLYGON_OFFSET_FACTOR' ] = factor;
            this._stateCache[ 'POLYGON_OFFSET_UNITS' ] = units;


            if ( this._sync )
                this._gl.polygonOffset( factor, units );
            if ( this._record ) this.addCall( this._gl.polygonOffset, arguments, 'polygonOffset' );
        },

        sampleCoverage: function ( value, invert ) {

            if ( this._stateCache[ 'SAMPLE_COVERAGE_VALUE' ] === value && this._stateCache[ 'SAMPLE_COVERAGE_INVERT' ] === invert ) return;
            this._stateCache[ 'SAMPLE_COVERAGE_VALUE' ] = value;
            this._stateCache[ 'SAMPLE_COVERAGE_INVERT' ] = invert;

            if ( this._sync )
                this._gl.sampleCoverage( value, invert );
            if ( this._record ) this.addCall( this._gl.sampleCoverage, arguments, 'sampleCoverage' );
        },

        scissor: function ( x, y, width, height ) {

            var scissorBox = this._stateCache[ 'SCISSOR_BOX' ];
            if ( scissorBox[ 0 ] === x && scissorBox[ 1 ] === y && scissorBox[ 2 ] === width && scissorBox[ 3 ] === height ) return;

            this._stateCache[ 'SCISSOR_BOX' ] = [ x, y, width, height ];

            if ( this._sync )
                this._gl.scissor( x, y, width, height );
            if ( this._record ) this.addCall( this._gl.scissor, arguments, 'scissor' );
        },

        stencilFunc: function ( func, ref, mask ) {

            if ( ( this._stateCache[ 'STENCIL_FUNC' ] === func ) && ( this._stateCache[ 'STENCIL_REF' ] === ref ) && ( this._stateCache[ 'STENCIL_VALUE_MASK' ] === mask ) && ( this._stateCache[ 'STENCIL_BACK_FUNC' ] === func ) && ( this._stateCache[ 'STENCIL_BACK_REF' ] === ref ) && ( this._stateCache[ 'STENCIL_BACK_VALUE_MASK' ] === mask ) ) return;


            this._stateCache[ 'STENCIL_FUNC' ] = func;
            this._stateCache[ 'STENCIL_REF' ] = ref;
            this._stateCache[ 'STENCIL_VALUE_MASK' ] = mask;
            this._stateCache[ 'STENCIL_BACK_FUNC' ] = func;
            this._stateCache[ 'STENCIL_BACK_REF' ] = ref;
            this._stateCache[ 'STENCIL_BACK_VALUE_MASK' ] = mask;

            if ( this._sync )
                this._gl.stencilFunc( func, ref, mask );
            if ( this._record ) this.addCall( this._gl.stencilFunc, arguments, 'stencilFunc' );
        },

        stencilFuncSeparate: function ( face, func, ref, mask ) {

            switch ( face ) {
            case this.FRONT:
                if ( ( this._stateCache[ 'STENCIL_FUNC' ] === func ) && ( this._stateCache[ 'STENCIL_REF' ] === ref ) && ( this._stateCache[ 'STENCIL_VALUE_MASK' ] == mask ) ) return;

                this._stateCache[ 'STENCIL_FUNC' ] = func;
                this._stateCache[ 'STENCIL_REF' ] = ref;
                this._stateCache[ 'STENCIL_VALUE_MASK' ] = mask;
                break;
            case this.BACK:
                if ( ( this._stateCache[ 'STENCIL_BACK_FUNC' ] === func ) && ( this._stateCache[ 'STENCIL_BACK_REF' ] === ref ) && ( this._stateCache[ 'STENCIL_BACK_VALUE_MASK' ] == mask ) ) return;
                this._stateCache[ 'STENCIL_BACK_FUNC' ] = func;
                this._stateCache[ 'STENCIL_BACK_REF' ] = ref;
                this._stateCache[ 'STENCIL_BACK_VALUE_MASK' ] = mask;
                break;
            case this.FRONT_AND_BACK:
                if ( ( this._stateCache[ 'STENCIL_FUNC' ] === func ) && ( this._stateCache[ 'STENCIL_REF' ] === ref ) && ( this._stateCache[ 'STENCIL_VALUE_MASK' ] == mask ) && ( this._stateCache[ 'STENCIL_BACK_FUNC' ] === func ) && ( this._stateCache[ 'STENCIL_BACK_REF' ] === ref ) && ( this._stateCache[ 'STENCIL_BACK_VALUE_MASK' ] === mask ) ) return;
                this._stateCache[ 'STENCIL_FUNC' ] = func;
                this._stateCache[ 'STENCIL_REF' ] = ref;
                this._stateCache[ 'STENCIL_VALUE_MASK' ] = mask;
                this._stateCache[ 'STENCIL_BACK_FUNC' ] = func;
                this._stateCache[ 'STENCIL_BACK_REF' ] = ref;
                this._stateCache[ 'STENCIL_BACK_VALUE_MASK' ] = mask;
                break;
            }

            if ( this._sync )
                this._gl.stencilFuncSeparate( face, func, ref, mask );
            if ( this._record ) this.addCall( this._gl.stencilFuncSeparate, arguments, 'stencilFuncSeparate' );
        },

        stencilMask: function ( mask ) {

            if ( ( this._stateCache[ 'STENCIL_WRITEMASK' ] === mask ) && ( this._stateCache[ 'STENCIL_BACK_WRITEMASK' ] === mask ) ) return;

            this._stateCache[ 'STENCIL_WRITEMASK' ] = mask;
            this._stateCache[ 'STENCIL_BACK_WRITEMASK' ] = mask;

            if ( this._sync )
                this._gl.stencilMask( mask );
            if ( this._record ) this.addCall( this._gl.stencilMask, arguments, 'stencilMask' );

        },
        stencilMaskSeparate: function ( face, mask ) {

            switch ( face ) {
            case this.FRONT:
                if ( this._stateCache[ 'STENCIL_WRITEMASK' ] === mask ) return;
                this._stateCache[ 'STENCIL_WRITEMASK' ] = mask;
                break;
            case this.BACK:
                if ( this._stateCache[ 'STENCIL_BACK_WRITEMASK' ] === mask ) return;
                this._stateCache[ 'STENCIL_BACK_WRITEMASK' ] = mask;
                break;
            case this.FRONT_AND_BACK:
                if ( ( this._stateCache[ 'STENCIL_WRITEMASK' ] === mask ) && ( this._stateCache[ 'STENCIL_BACK_WRITEMASK' ] === mask ) ) return;
                this._stateCache[ 'STENCIL_WRITEMASK' ] = mask;
                this._stateCache[ 'STENCIL_BACK_WRITEMASK' ] = mask;
                break;
            }

            if ( this._sync )
                this._gl.stencilMaskSeparate( face, mask );
            if ( this._record ) this.addCall( this._gl.stencilMaskSeparate, arguments, 'stencilMaskSeparate' );

        },
        stencilOp: function ( fail, zfail, zpass ) {
            if ( ( this._stateCache[ 'STENCIL_FAIL' ] === fail ) && ( this._stateCache[ 'STENCIL_PASS_DEPTH_FAIL' ] === zfail ) && ( this._stateCache[ 'STENCIL_PASS_DEPTH_PASS' ] === zpass ) && ( this._stateCache[ 'STENCIL_BACK_FAIL' ] === fail ) && ( this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_FAIL' ] === zfail ) && ( this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_PASS' ] === zpass ) ) return;

            this._stateCache[ 'STENCIL_FAIL' ] = fail;
            this._stateCache[ 'STENCIL_PASS_DEPTH_FAIL' ] = zfail;
            this._stateCache[ 'STENCIL_PASS_DEPTH_PASS' ] = zpass;
            this._stateCache[ 'STENCIL_BACK_FAIL' ] = fail;
            this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_FAIL' ] = zfail;
            this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_PASS' ] = zpass;

            if ( this._sync )
                this._gl.stencilOp( fail, zfail, zpass );
            if ( this._record ) this.addCall( this._gl.stencilOp, arguments, 'stencilOp' );
        },

        stencilOpSeparate: function ( face, fail, zfail, zpass ) {

            switch ( face ) {
            case this.FRONT:
                if ( ( this._stateCache[ 'STENCIL_FAIL' ] === fail ) && ( this._stateCache[ 'STENCIL_PASS_DEPTH_FAIL' ] === zfail ) && ( this._stateCache[ 'STENCIL_PASS_DEPTH_PASS' ] === zpass ) ) return;
                this._stateCache[ 'STENCIL_FAIL' ] = fail;
                this._stateCache[ 'STENCIL_PASS_DEPTH_FAIL' ] = zfail;
                this._stateCache[ 'STENCIL_PASS_DEPTH_PASS' ] = zpass;
                break;
            case this.BACK:
                if ( ( this._stateCache[ 'STENCIL_BACK_FAIL' ] === fail ) && ( this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_FAIL' ] === zfail ) && ( this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_PASS' ] === zpass ) ) return;
                this._stateCache[ 'STENCIL_BACK_FAIL' ] = fail;
                this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_FAIL' ] = zfail;
                this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_PASS' ] = zpass;
                break;
            case this.FRONT_AND_BACK:
                if ( ( this._stateCache[ 'STENCIL_FAIL' ] === fail ) && ( this._stateCache[ 'STENCIL_PASS_DEPTH_FAIL' ] === zfail ) && ( this._stateCache[ 'STENCIL_PASS_DEPTH_PASS' ] === zpass ) && ( this._stateCache[ 'STENCIL_BACK_FAIL' ] === fail ) && ( this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_FAIL' ] == zfail ) && ( this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_PASS' ] === zpass ) ) return;
                this._stateCache[ 'STENCIL_FAIL' ] = fail;
                this._stateCache[ 'STENCIL_PASS_DEPTH_FAIL' ] = zfail;
                this._stateCache[ 'STENCIL_PASS_DEPTH_PASS' ] = zpass;
                this._stateCache[ 'STENCIL_BACK_FAIL' ] = fail;
                this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_FAIL' ] = zfail;
                this._stateCache[ 'STENCIL_BACK_PASS_DEPTH_PASS' ] = zpass;
                break;
            }

            if ( this._sync )
                this._gl.stencilOpSeparate( face, fail, zfail, zpass );
            if ( this._record ) this.addCall( this._gl.stencilOpSeparate, arguments, 'stencilOpSeparate' );
        },

        viewport: function ( x, y, width, height ) {

            var viewportVal = this._stateCache[ 'VIEWPORT' ];
            if ( viewportVal && viewportVal[ 0 ] === x && viewportVal[ 1 ] === y && viewportVal[ 2 ] === width && viewportVal[ 3 ] === height ) return;

            if ( this._stateCache[ 'VIEWPORT' ] ) this._stateCache[ 'VIEWPORT' ] = [ x, y, width, height ];
            else {
                this._stateCache[ 'VIEWPORT' ] = [ x, y, width, height ];
            }
            if ( this._sync ) {
                this._gl.viewport( x, y, width, height );
            }
            if ( this._record ) {
                this.addCall( this._gl.viewport, arguments, 'viewport' );
            }

        },


        useProgram: function ( program ) {

            if ( this._stateCache[ 'CURRENT_PROGRAM' ] === program ) return;

            this._stateCache[ 'CURRENT_PROGRAM' ] = program;

            // TODO: UNIFORM Cache Program reset and start
            if ( !this._programUniformCache.has( program ) ) {
                this._programUniformCache.set( program, new WeakMap() );
            }
            this._uniformCache = this._programUniformCache.get( program );

            //this._programUniformCache[ program ] = this._uniformCache;
            //this._programUniformCache.set( program, this._uniformCache );

            if ( this._sync ) {
                this._gl.useProgram( program );
            }
            if ( this._record ) {
                this.addCall( this._gl.useProgram, arguments, 'useProgram' );
            }
        },



        uniformN: function ( location, v, transpose ) {

            // TODO: transpose
            if ( !location ) {
                return true;
            }

            if ( !this._uniformCache ) {
                return true; // no program binded
            }
            //var program = this._stateCache[ 'CURRENT_PROGRAM' ];
            //if ( !program ) return true;

            var oldV = this._uniformCache.get( location );
            if ( arrayCompare( oldV, v ) ) {
                return true;
            };

            // todo array stack
            this._uniformCache.set( location, v.slice( 0 ) );

            return false;

        },

        uniform1f: function ( location, v0 ) {

            var check = this.uniformN.call( this, location, [ v0 ] );

            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform1f( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform1f, arguments, 'uniform1f' );
            }
        },
        uniform2f: function ( location, v0, v1 ) {
            var check = this.uniformN.call( this, location, [ v0, v1 ] );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform2f( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform2f, arguments, 'uniform2f' );
            }
        },
        uniform3f: function ( location, v0, v1, v2 ) {
            var check = this.uniformN.call( this, location, [ v0, v1, v2 ] );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform3f( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform3f, arguments, 'uniform3f' );
            }
        },
        uniform4f: function ( location, v0, v1, v2, v3 ) {
            this.uniformN.call( this, location, [ v0, v1, v2, v3 ] );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform4f( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform4f, arguments, 'uniform4f' );
            }
        },
        uniform1i: function ( location, v0 ) {
            var check = this.uniformN.call( this, location, [ v0 ] );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform1i( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform1i, arguments, 'uniform1i' );
            }
        },
        uniform2i: function ( location, v0, v1 ) {
            var check = this.uniformN.call( this, location, [ v0, v1 ] );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform2i( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform2i, arguments, 'uniform2i' );
            }
        },
        uniform3i: function ( location, v0, v1, v2 ) {
            var check = this.uniformN.call( this, location, [ v0, v1, v2 ] );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform3i( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform3i, arguments, 'uniform3i' );
            }
        },
        uniform4i: function ( location, v0, v1, v2, v3 ) {
            var check = this.uniformN.call( this, location, [ v0, v1, v2, v3 ] );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform4i( location, v );
            }

            if ( this._record ) {
                this.addCall( this._gl.uniform4i, arguments, 'uniform4i' );
            }
        },
        // ARRAY
        uniform1fv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform1fv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform1fv, arguments, 'uniform1fv' );
            }
        },
        uniform2fv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform2fv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform2fv, arguments, 'uniform2fv' );
            }
        },
        uniform3fv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform3fv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform3fv, arguments, 'uniform3fv' );
            }
        },
        uniform4fv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform4fv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform4fv, arguments, 'uniform4fv' );
            }
        },
        uniform1iv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform1iv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform1iv, arguments, 'uniform1iv' );
            }
        },
        uniform2iv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform2iv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform2iv, arguments, 'uniform2iv' );
            }
        },
        uniform3iv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform3iv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform4iv, arguments, 'uniform3iv' );
            }
        },
        uniform4iv: function ( location, v ) {
            var check = this.uniformN.call( this, location, v );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniform4iv( location, v );
            }

            if ( this._record ) {
                arguments[ 1 ] = v.slice( 0 );
                this.addCall( this._gl.uniform4iv, arguments, 'uniform4iv' );
            }
        },
        uniformMatrix2fv: function ( location, transpose, v ) {
            var check = this.uniformN.call( this, location, v, transpose );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniformMatrix2fv( location, transpose, v );
            }

            if ( this._record ) {
                arguments[ 2 ] = v.slice( 0 );
                this.addCall( this._gl.uniformMatrix2fv, arguments, 'uniformMatrix2fv' );
            }
        },
        uniformMatrix3fv: function ( location, transpose, v ) {

            var check = this.uniformN.call( this, location, v, transpose );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniformMatrix3fv( location, transpose, v );
            }

            if ( this._record ) {
                arguments[ 2 ] = v.slice( 0 );
                this.addCall( this._gl.uniformMatrix3fv, arguments, 'uniformMatrix3fv' );
            }
        },
        uniformMatrix4fv: function ( location, transpose, v ) {
            var check = this.uniformN.call( this, location, v, transpose );
            if ( check ) return;

            if ( this._sync ) {
                this._gl.uniformMatrix4fv( location, transpose, v );
            }

            if ( this._record ) {
                arguments[ 2 ] = v.slice( 0 );
                this.addCall( this._gl.uniformMatrix4fv, arguments, 'uniformMatrix4fv' );
            }
        }


        /*
,
                vertexAttrib1f: function ( indx, x ) {


                    var check = arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], [ x, 0, 0, 1 ] );
                    if ( check ) return;

                    if ( this._sync ) {
                        this._gl.vertexAttrib1f( indx, x );
                    }

                    if ( this._record ) {
                        this.addCall( this._gl.vertexAttrib1f, arguments, 'vertexAttrib1f' );
                    }

                },
                vertexAttrib2f: function ( indx, x, y ) {
                    return arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], [ x, y, 0, 1 ] );
                },
                vertexAttrib3f: function ( indx, x, y, z ) {
                    return arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], [ x, y, z, 1 ] );
                },
                vertexAttrib4f: function ( indx, x, y, z, w ) {
                    return arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], [ x, y, z, w ] );
                },
                vertexAttrib1fv: function ( indx, v ) {
                    return arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], [ v[ 0 ], 0, 0, 1 ] );
                },
                vertexAttrib2fv: function ( indx, v ) {
                    return arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], [ v[ 0 ], v[ 1 ], 0, 1 ] );
                },
                vertexAttrib3fv: function ( indx, v ) {
                    return arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], [ v[ 0 ], v[ 1 ], v[ 2 ], 1 ] );
                },
                vertexAttrib4fv: function ( indx, v ) {
                    return arrayCompare( this._stateCache[ 'CURRENT_VERTEX_ATTRIB_' + indx ], v );
                },

                vertexAttribPointer: function ( indx, size, type, normalized, stride, offset ) {

                    var check = ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_SIZE_' + indx ] === size ) && ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_TYPE_' + indx ] == type ) && ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_NORMALIZED_' + indx ] === normalized ) && ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_STRIDE_' + indx ] === stride ) && ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_POINTER_' + indx ] === offset ) && ( this._stateCache[ 'VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_' + indx ] === this._stateCache[ 'ARRAY_BUFFER_BINDING' ] );

                    if ( check ) return;

                    if ( this._sync ) {
                        this._gl.vertexAttribPointer( indx, size, type, normalized, stride, offset );
                    }

                    if ( this._record ) {
                        this.addCall( this._gl.vertexAttribPointer, arguments, 'vertexAttribPointer' );
                    }
                }
        */



    };

    var syncFuncs = [ 'attachShader', 'bindAttribLocation', 'blendColor', 'bufferData', 'bufferSubData', 'checkFramebufferStatus', 'compileShader', 'compressedTexImage2D', 'compressedTexSubImage2D', 'copyTexImage2D', 'copyTexSubImage2D', 'createBuffer', 'createFramebuffer', 'createProgram', 'createRenderbuffer', 'createShader', 'createTexture', 'deleteBuffer', 'deleteFramebuffer', 'deleteProgram', 'deleteRenderbuffer', 'deleteShader', 'deleteTexture', 'detachShader', 'finish', 'flush', 'framebufferRenderbuffer', 'framebufferTexture2D', 'generateMipmap', 'getActiveAttrib', 'getActiveUniform', 'getAttachedShaders', 'getAttribLocation', 'getBufferParameter', 'getContextAttributes', 'getError', 'getExtension', 'getFramebufferAttachmentParameter', 'getParameter', 'getProgramParameter', 'getProgramInfoLog', 'getRenderbufferParameter', 'getShaderParameter', 'getShaderInfoLog', 'getShaderPrecisionFormat', 'getShaderSource', 'getSupportedExtensions', 'getTexParameter', 'getUniform', 'getUniformLocation', 'getVertexAttrib', 'getVertexAttribOffset', 'isBuffer', 'isContextLost', 'isEnabled', 'isFramebuffer', 'isProgram', 'isRenderbuffer', 'isShader', 'isTexture', 'linkProgram', 'readPixels', 'renderbufferStorage', 'shaderSource', 'texParameterf', 'texParameteri', 'texImage2D', 'texSubImage2D' ];

    //  need to check if particular cache needed really (how often we do repeat?)
    var asyncNonCached = [ 'clear', 'drawArrays', 'drawElements', 'uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv', 'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv', 'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv', 'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv', 'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv', 'validateProgram', 'vertexAttrib1f', 'vertexAttrib2f', 'vertexAttrib3f', 'vertexAttrib4f', 'vertexAttrib1fv', 'vertexAttrib2fv', 'vertexAttrib3fv', 'vertexAttrib4fv', 'vertexAttribPointer' ];

    // TODO
    // uniforms.

    for ( var propertyName in gl ) {
        if ( this._wrapper[ propertyName ] === undefined ) {

            if ( typeof gl[ propertyName ] === 'function' ) {
                var pName = propertyName;


                if ( //this._wrapper.isRecording() &&
                    syncFuncs.indexOf( pName ) === -1 ) {

                    this._wrapper[ pName ] = ( function () {

                        var pN = pName;
                        return function () {

                            // no check for state cache
                            var out;
                            if ( this._sync ) {
                                out = wrapperCall( gl[ pN ], pN, arguments, arguments.length );
                            }

                            if ( this._record ) {

                                this.addCall( gl[ pN ], arguments, pN );

                            }
                            return out;
                        };

                    } )();


                } else {

                    this._wrapper[ pName ] = ( function () {

                        var pN = pName;
                        return function () {

                            if ( !this._sync ) {
                                // it's a function necesseting synchronisation
                                // replay all calls first
                                this.replayCalls();
                            }

                            var out = wrapperCall( gl[ pN ], pN, arguments, arguments.length );

                            if ( !this._sync ) {
                                // reset as not to replay at next sync calls
                                this.resetCalls();
                            }

                            //if ( this._record ) {
                            // mark frame as non async'able
                            this._lastFrameCanAsync = false;
                            // }

                            //this._wrapper[ pN + 'real' ] = gl[ pN ].bind( gl );

                            return out;

                        };

                    } )();

                }
            } else {
                this._wrapper[ propertyName ] = gl[ propertyName ];
            }
        }
    }
    //    console.log( syncFuncs );

    return this._wrapper;
};

module.exports = WebGLStateCache;
