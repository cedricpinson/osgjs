define( [
    'tests/mockup/scene',
    'tests/mockup/box'

], function( getScene, getBoxScene) {

    var check_near = function (a, b, threshold) {

        if (threshold === undefined) {
            threshold = 1e-5;
        }

        if ( $.isArray(a)) {
            for (var i = 0; i < a.length; ++i) {
                var number = typeof a[i] === "number" && typeof b[i] === "number";
                if (Math.abs(a[i]-b[i]) > threshold || number === false) {
                    QUnit.log( function() { return QUnit.jsDump.parse(a) + " expected " + QUnit.jsDump.parse(b); });
                    return false;
                }
            }
        } else {
            if (a === undefined || b === undefined) {
                QUnit.log(function() { return "undefined value : " + a + ", " + b;});
                return false;
            }
            if (Math.abs(a-b) > threshold) {
                QUnit.log(function() { return a + " != " + b;});
                return false;
            }
        }
        return true;
    };

    var near = function (a, b, threshold) {
        if (threshold === undefined) {
            threshold = 1e-5;
        }

        if ( $.isArray(a)) {
            for (var i = 0; i < a.length; ++i) {
                var number = typeof a[i] === "number" && typeof b[i] === "number" && !isNaN(a[i]) && !isNaN(b[i]);
                if (Math.abs(a[i]-b[i]) > threshold || number === false) {
                    ok(false, QUnit.jsDump.parse(a) + " expected " + QUnit.jsDump.parse(b));
                    return;
                }
            }
        } else {
            if (Math.abs(a-b) > threshold) {
                ok(false, a + " != " + b);
                return;
            }
        }
        ok(true, "okay: " + QUnit.jsDump.parse(a));
    };

    var createCanvas = function() {
        var parent = document.body;

        var t = "" + (new Date()).getTime();
        var cnv = "<canvas id='" + t + "'></canvas>";

        var mydiv = document.createElement('div');
        mydiv.setAttribute('id', "div_"+t);
        mydiv.innerHTML = cnv;
        parent.appendChild(mydiv);
        return document.getElementById(t);
    };

    var removeCanvas = function(canvas) {
        var id = canvas.getAttribute('id');
        var parent = document.getElementById("div_"+id);
        parent.removeChild(canvas);
    };

    var createFakeRenderer = function() {
        return { 'TEXTURE0': 10,
                 'DEPTH_TEST': 1,
                 'CULL_FACE': 0,
                 'UNSIGNED_SHORT': 0,
                 'TEXTURE_CUBE_MAP_POSITIVE_X': 0x8515,
                 'TEXTURE_CUBE_MAP_NEGATIVE_X': 0x8516,
                 'TEXTURE_CUBE_MAP_POSITIVE_Y': 0x8517,
                 'TEXTURE_CUBE_MAP_NEGATIVE_Y': 0x8518,
                 'TEXTURE_CUBE_MAP_POSITIVE_Z': 0x8519,
                 'TEXTURE_CUBE_MAP_NEGATIVE_Z': 0x851A,
                 'MAX_CUBE_MAP_TEXTURE_SIZE': 0x851C,
                 drawElements: function() {},
                 createBuffer: function() {},
                 deleteBuffer: function(arg) {},
                 blendColor: function() {},
                 enable: function() {},
                 disable: function() {},
                 depthFunc: function() {},
                 depthRange: function() {},
                 depthMask: function() {},
                 activeTexture: function() {},
                 bindTexture: function() {},
                 bufferData: function() {},
                 bindBuffer: function() {},
                 blendFunc: function() {},
                 enableVertexAttribArray: function() {},
                 vertexAttribPointer: function() {},
                 createTexture: function() {},
                 bindFramebuffer: function() {},
                 clear: function() {},
                 viewport: function() {},
                 cullFace: function() {},
                 texImage2D: function() {},
                 texParameteri: function() {},
                 createShader: function() {},
                 shaderSource: function() {},
                 compileShader: function() { },
                 getShaderParameter: function() { return true; },
                 isContextLost: function() {},
                 getShaderInfoLog: function() {},
                 createProgram: function() {},
                 attachShader: function() {},
                 validateProgram: function() {},
                 linkProgram: function() {},
                 getProgramParameter: function() {},
                 getProgramInfoLog: function() {},
                 getUniformLocation: function() { return 0;},
                 getAttribLocation: function() { return 0;},
                 useProgram: function() { },
                 uniformMatrix4fv: function() { },
                 uniform1fv: function() { },
                 uniform4fv: function() { },
                 uniform3fv: function() { },
                 uniform1iv: function() { }
               };
    };

    return {
        check_near: check_near,
        createFakeRenderer: createFakeRenderer,
        removeCanvas: removeCanvas,
        createCanvas: createCanvas,
        near: near,
        getBoxScene: getBoxScene,
        getScene: getScene
    };

});
