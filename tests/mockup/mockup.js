define( [
    'jquery',
    'tests/mockup/scene',
    'tests/mockup/box',
    'osgAnimation/Channel',
    'osgAnimation/Animation'

], function ( $, getScene, getBoxScene, Channel, Animation ) {

    'use strict';

    var QUnit = window.QUnit;

    var checkNear = function ( a, b, threshold ) {

        if ( threshold === undefined ) {
            threshold = 1e-5;
        }

        if ( $.isArray( a ) ) {
            var expected = function ( a, b ) {
                return QUnit.jsDump.parse( a ) + ' expected ' + QUnit.jsDump.parse( b );
            };
            for ( var i = 0; i < a.length; ++i ) {
                var number = typeof a[ i ] === 'number' && typeof b[ i ] === 'number';
                if ( Math.abs( a[ i ] - b[ i ] ) > threshold || number === false ) {
                    QUnit.log( expected.bind( this, a, b ) );
                    return false;
                }
            }
        } else {
            if ( a === undefined || b === undefined ) {
                QUnit.log( function () {
                    return 'undefined value : ' + a + ', ' + b;
                } );
                return false;
            }
            if ( Math.abs( a - b ) > threshold ) {
                QUnit.log( function () {
                    return a + ' != ' + b;
                } );
                return false;
            }
        }
        return true;
    };

    var near = function ( a, b, error, message ) {

        var threshold = error;
        var text = message;

        if ( typeof threshold === 'string' )
            text = threshold;

        if ( typeof threshold !== 'number' )
            threshold = 1e-5;

        if ( $.isArray( a ) ) {
            for ( var i = 0; i < a.length; ++i ) {
                var number = typeof a[ i ] === 'number' && typeof b[ i ] === 'number' && !isNaN( a[ i ] ) && !isNaN( b[ i ] );
                if ( Math.abs( a[ i ] - b[ i ] ) > threshold || number === false ) {
                    ok( false, QUnit.jsDump.parse( a ) + ' expected ' + QUnit.jsDump.parse( b ) );
                    return;
                }
            }
        } else {
            if ( Math.abs( a - b ) > threshold ) {
                ok( false, a + ' != ' + b );
                return;
            }
        }
        ok( true, text ); //'okay: ' + QUnit.jsDump.parse(a));
    };

    var createFakeWebGLCanvas = function () {
        var obj = {
            addEventListener: function () {},
            getContext: function () {
                return createFakeRenderer();
            },
            style: {
                width: 300
            },
            getAttribute: function () {
                return 0;
            }
        };
        return obj;
    };

    var createVec3Keyframes = function () {
        var keys = [
            1, 1, 1,
            0, 0, 0,
            3, 3, 3
        ];
        var times = [ 0, 1, 2 ];
        return Channel.createVec3Channel( keys, times );
    };

    var createFloatKeyframes = function () {
        var keys = [
            1, 0, 3
        ];

        var start = 0;
        if ( arguments.length > 0 ) // offset time keyframes
            start = arguments[ 0 ];

        var times = [ start + 0, start + 1, start + 2 ];
        return Channel.createFloatChannel( keys, times );
    };

    var createFloatCubicBezierKeyframes = function () {
        var keys = [
            1, 2, 3,
            0, 1, 3,
            3, 4, 5
        ];
        var times = [ 0, 1, 2 ];
        return Channel.createFloatCubicBezierChannel( keys, times );
    };

    var createVec3CubicBezierKeyframes = function () {
        var keys = [
            1, 1, 1,
            2, 2, 2,
            5, 5, 5,

            6, 6, 6,
            9, 9, 9,
            8, 8, 8,

            6, 6, 6,
            6, 6, 6,
            6, 6, 6
        ];
        var times = [ 0, 1, 2 ];
        return Channel.createVec3CubicBezierChannel( keys, times );
    };

    var createQuatLerpKeyFrames = function () {
        var keys = [ 1.22465e-16, 1.22465e-16, 1.22465e-16, -1,
            0.300706, 7.99708e-17, 1.53623e-16, -0.953717,
            0.382683, 6.62774e-17, 1.60008e-16, -0.92388,
            0.382683, 6.62774e-17, 1.60008e-16, -0.92388,
            0.126911, -0.0991929, 0.119115, -0.979727
        ];

        var times = [ 0, 0.202899, 0.456522, 1.21739, 1.47101 ];
        return Channel.createQuatChannel( keys, times );
    };


    var createAnimation = function ( name, target1, name1, target2, name2 ) {

        var a = createFloatKeyframes();
        a.target = target1 || 'a';
        a.name = name1 || 'x';

        var b = createFloatKeyframes( 2 );
        b.target = target2 || 'b';
        b.name = name2 || 'x';

        return Animation.createAnimation( [ a, b ], name );
    };

    var createCanvas = function () {

        // mockup for phantomjs
        if ( navigator.userAgent.indexOf( 'PhantomJS' ) !== -1 ) {
            return createFakeWebGLCanvas();
        }

        var parent = document.body;

        var t = '' + ( new Date() ).getTime();
        var cnv = '<canvas id=\'' + t + '\'></canvas>';

        var mydiv = document.createElement( 'div' );
        mydiv.setAttribute( 'id', 'div_' + t );
        mydiv.innerHTML = cnv;
        parent.appendChild( mydiv );
        return document.getElementById( t );
    };

    var removeCanvas = function ( canvas ) {
        if ( !canvas ) return;
        var id = canvas.getAttribute( 'id' );
        var parent = document.getElementById( 'div_' + id );
        if ( !parent )
            return;
        parent.removeChild( canvas );
    };

    var createFakeRenderer = function () {
        return {
            TEXTURE0: 10,
            DEPTH_TEST: 1,
            CULL_FACE: 0,
            UNSIGNED_SHORT: 0,
            HIGH_FLOAT: 0,
            FRAGMENT_SHADER: 0,
            TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
            TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
            TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
            TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
            TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
            TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851A,
            MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,
            UNPACK_FLIP_Y_WEBGL: 0,
            drawElements: function () {},
            createBuffer: function () {},
            deleteBuffer: function () {},
            blendColor: function () {},
            enable: function () {},
            disable: function () {},
            depthFunc: function () {},
            pixelStorei: function () {},
            depthRange: function () {},
            depthMask: function () {},
            deleteTexture: function () {},
            activeTexture: function () {},
            bindTexture: function () {},
            bufferData: function () {},
            bindBuffer: function () {},
            blendFunc: function () {},
            getShaderPrecisionFormat: function () {
                return {
                    precision: 1
                };
            },
            getSupportedExtensions: function () {
                return {};
            },
            enableVertexAttribArray: function () {},
            vertexAttribPointer: function () {},
            createTexture: function () {},
            bindFramebuffer: function () {},
            clear: function () {},
            viewport: function () {},
            cullFace: function () {},
            texImage2D: function () {},
            texParameteri: function () {},
            createShader: function () {},
            shaderSource: function () {},
            compileShader: function () {},
            getShaderParameter: function () {
                return true;
            },
            isContextLost: function () {},
            getShaderInfoLog: function () {},
            createProgram: function () {},
            attachShader: function () {},
            validateProgram: function () {},
            linkProgram: function () {},
            getParameter: function () {},
            getProgramParameter: function () {},
            getProgramInfoLog: function () {},
            getUniformLocation: function () {
                return 0;
            },
            getAttribLocation: function () {
                return 0;
            },
            useProgram: function () {},
            uniformMatrix4fv: function () {},
            uniform1fv: function () {},
            uniform4fv: function () {},
            uniform3fv: function () {},
            uniform1iv: function () {},
            canvas: {
                clientWidth: 300,
                clientHeight: 300
            }

        };
    };

    return {
        checkNear: checkNear,
        createFakeRenderer: createFakeRenderer,
        removeCanvas: removeCanvas,
        createCanvas: createCanvas,
        createVec3Keyframes: createVec3Keyframes,
        createFloatKeyframes: createFloatKeyframes,
        createFloatCubicBezierKeyframes: createFloatCubicBezierKeyframes,
        createVec3CubicBezierKeyframes: createVec3CubicBezierKeyframes,
        createQuatLerpKeyFrames: createQuatLerpKeyFrames,
        createAnimation: createAnimation,
        near: near,
        getBoxScene: getBoxScene,
        getScene: getScene
    };

} );
