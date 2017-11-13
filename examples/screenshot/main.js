'use strict';

// from require to global var
var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;
var osgGA = OSG.osgGA;

var SimpleUpdateCallback = function() {};

SimpleUpdateCallback.prototype = {
    // rotation angle
    angle: 0,

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        var dt = t - node._lastUpdate;

        if (dt < 0) {
            return true;
        }

        node._lastUpdate = t;

        // rotation
        var m = node.getMatrix();

        osg.mat4.fromRotation(m, -this.angle, [0.0, 0.0, 1.0]);

        osg.mat4.setTranslation(m, [0, 0, 0]);

        this.angle += 0.1;

        return true;
    }
};

function createScene() {
    var root = new osg.Node();
    var cube = new osg.MatrixTransform();

    // create a cube in center of the scene(0, 0, 0) and set it's size to 7
    var size = 7;
    var cubeModel = osg.createTexturedBoxGeometry(0, 0, 0, size, size, size);

    cube.addChild(cubeModel);

    // add a stateSet of texture to cube
    var material = new osg.Material();

    material.setDiffuse([1.0, 1.0, 0.2, 1.0]);
    cube.getOrCreateStateSet().setAttributeAndModes(material);

    // attach updatecallback function to cube
    var cb = new SimpleUpdateCallback();

    cube.addUpdateCallback(cb);

    // add to root and return
    root.addChild(cube);

    return root;
}

var main = function() {
    // from require to global var

    // The 3D canvas.
    var canvas = document.getElementById('View');
    canvas.width = 250;
    canvas.height = 250;
    var viewer;

    try {
        viewer = new osgViewer.Viewer(canvas, {
            antialias: false,
            alpha: true,
            premultipliedAlpha: true,
            fullscreen: false,
            preserveDrawingBuffer: false,
            enableFrustumCulling: false,
            maxDevicePixelRatio: 1.0
        });

        viewer.init();
        var rotate = new osg.MatrixTransform();

        rotate.addChild(createScene());
        viewer.setSceneData(rotate);
        viewer.setupManipulator(new osgGA.OrbitManipulator());
        // set distance
        viewer.getManipulator().setDistance(20.0);

        var takeShot = false;

        var c = document.getElementById('2DView');
        var ctx = c.getContext('2d');

        console.log(c.height, c.width);
        console.log(canvas.height, canvas.width);

        var rowSize = canvas.width * 4;
        var buffSize = rowSize * canvas.height;
        var halfHeight = Math.floor(canvas.height * 0.5);
        var pixels = new Uint8Array(buffSize);
        var rowPixelsStart = new Uint8Array(rowSize);
        var dataToDownload;

        var userEndFrame = function(state) {
            if (takeShot) {
                var gl = state.getGraphicContext();

                if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
                    gl.readPixels(
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        pixels
                    );

                    // invert image
                    // slow part...
                    // so use a optimized inplace image flip.
                    var offsetStart = 0;
                    var offsetEnd = buffSize - rowSize;
                    var i, k;

                    for (i = 0; i < halfHeight; i++) {
                        // copy start into temp
                        // typedarray set doesn't take a end param.
                        // forEach cannot be cancelled.
                        // so it's a for.
                        for (k = 0; k < rowSize; k++) {
                            rowPixelsStart[k] = pixels[offsetStart + k];
                            rowPixelsStart[k + 1] = pixels[offsetStart + k + 1];
                            rowPixelsStart[k + 2] = pixels[offsetStart + k + 2];
                            rowPixelsStart[k + 3] = pixels[offsetStart + k + 3];
                        }

                        // copy end over start
                        pixels.copyWithin(offsetStart, offsetEnd, offsetEnd + rowSize);

                        // copy temp over end
                        pixels.set(rowPixelsStart, offsetEnd);

                        // move ptr
                        offsetStart += rowSize;
                        offsetEnd -= rowSize;
                    }

                    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    imageData.data.set(pixels);
                    ctx.putImageData(imageData, 0, 0);

                    takeShot = false;
                }
            }
        };

        viewer.getCamera().setFinalDrawCallback(userEndFrame);

        document.getElementById('screenshot').addEventListener(
            'click',
            function() {
                dataToDownload = c.toDataURL('image/jpeg', 1.0); //.replace( 'image/jpeg', 'image/octet-stream' );
                window.location.href = dataToDownload;
            },
            false
        );

        window.setInterval(function() {
            takeShot = !takeShot;
        }, 1000);

        viewer.run();
    } catch (er) {
        osg.log('exception in osgViewer ' + er);
    }
};

window.addEventListener('load', main, true);
