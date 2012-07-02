function check_near(a, b, threshold) {
    if (threshold === undefined) {
        threshold = 1e-5;
    }

    if (jQuery.isArray(a)) {
        for (var i = 0; i < a.length; ++i) {
            var number = typeof a[i] === "number" && typeof b[i] === "number";
            if (Math.abs(a[i]-b[i]) > threshold || number === false) {
                QUnit.log(false, QUnit.jsDump.parse(a) + " expected " + QUnit.jsDump.parse(b));
                return false;
            }
        }
    } else {
        if (a === undefined || b === undefined) {
            QUnit.log(false, "undefined value : " + a + ", " + b);
            return false;
        }
        if (Math.abs(a-b) > threshold) {
            QUnit.log(false, a + " != " + b);
            return false;
        }
    }
    return true;
}

function near(a, b, threshold)
{
    if (threshold === undefined) {
        threshold = 1e-5;
    }

    if (jQuery.isArray(a)) {
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
}

function createCanvas() {
    var parent = document.body;

    var t = "" + (new Date()).getTime();
    var cnv = "<canvas id='" + t + "'></canvas>";

    var mydiv = document.createElement('div');
    mydiv.setAttribute('id', "div_"+t);
    mydiv.innerHTML = cnv;
    parent.appendChild(mydiv);
    return document.getElementById(t);
}
function removeCanvas(canvas) {
    var id = canvas.getAttribute('id');
    var parent = document.getElementById("div_"+id);
    parent.removeChild(canvas);
}
function createFakeRenderer() {
    return { 'TEXTURE0': 10,
             'DEPTH_TEST': 1,
             'CULL_FACE': 0,
             'UNSIGNED_SHORT': 0,
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
             cullFace: function() {}
           };
}



