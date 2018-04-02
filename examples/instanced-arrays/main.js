(function() {
    /**
     * @author Jordi Torres
     */
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var Example = function() {
        this._viewer = undefined;
        this._nInstances = 1000000;
    };

    Example.prototype = {
        createProgram: function() {
            var vertexShader = [
                '',
                '#version 100',
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec3 Offset;',
                'attribute vec2 TexCoord0;',
                'varying vec2 vTexCoord0;',
                'uniform mat4 uModelViewMatrix;',
                'uniform mat4 uProjectionMatrix;',
                'void main(void) {',
                '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4( Vertex + Offset, 1.0 );',
                '  vTexCoord0 = TexCoord0;',
                '}',
                ''
            ].join('\n');
            var fragmentShader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'varying vec2 vTexCoord0;',
                'uniform sampler2D Texture0;',
                'void main (void)',
                '{',
                '  gl_FragColor = texture2D( Texture0, vTexCoord0.xy );',
                '}',
                ''
            ].join('\n');
            var program = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexShader),
                new osg.Shader('FRAGMENT_SHADER', fragmentShader)
            );
            return program;
        },

        createOffsets: function(value) {
            var offsets = new Float32Array(value * 3);
            for (var i = 0, l = value; i < l; i++) {
                offsets[3 * i] = Math.random() * 8000;
                offsets[3 * i + 1] = Math.random() * 8000;
                offsets[3 * i + 2] = Math.random() * 8000;
            }
            return offsets;
        },

        createIndices: function() {
            var indexes = new Uint16Array(36);
            indexes[0] = 0;
            indexes[1] = 1;
            indexes[2] = 2;
            indexes[3] = 0;
            indexes[4] = 2;
            indexes[5] = 3;

            indexes[6] = 4;
            indexes[7] = 5;
            indexes[8] = 6;
            indexes[9] = 4;
            indexes[10] = 6;
            indexes[11] = 7;

            indexes[12] = 8;
            indexes[13] = 9;
            indexes[14] = 10;
            indexes[15] = 8;
            indexes[16] = 10;
            indexes[17] = 11;

            indexes[18] = 12;
            indexes[19] = 13;
            indexes[20] = 14;
            indexes[21] = 12;
            indexes[22] = 14;
            indexes[23] = 15;

            indexes[24] = 16;
            indexes[25] = 17;
            indexes[26] = 18;
            indexes[27] = 16;
            indexes[28] = 18;
            indexes[29] = 19;

            indexes[30] = 20;
            indexes[31] = 21;
            indexes[32] = 22;
            indexes[33] = 20;
            indexes[34] = 22;
            indexes[35] = 23;
            return indexes;
        },

        computeBoundCallback: function(boundingbox) {
            boundingbox.expandByVec3(osg.vec3.fromValues(-0, 0, 0));
            boundingbox.expandByVec3(osg.vec3.fromValues(8000, 8000, 8000));
        },

        createCubes: function() {
            var g = osg.createTexturedBoxGeometry(0, 0, 0, 10, 10, 10);
            var texture = new osg.Texture();
            texture.setMinFilter('LINEAR');
            texture.setMagFilter('LINEAR');
            var self = this;
            osgDB.readImageURL('../media/textures/seamless/bricks1.jpg').then(function(image) {
                texture.setImage(image);
                g.getOrCreateStateSet().setAttributeAndModes(self.createProgram());
            });

            g.getOrCreateStateSet().setTextureAttributeAndModes(0, texture);
            g.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(0, 'Texture0'));

            var offsetBuffer = new osg.BufferArray(
                osg.BufferArray.ARRAY_BUFFER,
                this.createOffsets(this._nInstances),
                3
            );
            g.getAttributes().Offset = offsetBuffer;
            // Set attribute divisors
            g.setAttribArrayDivisor('Vertex', 0);
            g.setAttribArrayDivisor('Offset', 1);

            var indices = this.createIndices();
            // We need to compute our own bounding volume as the CullVisitor is not aware of the instances bounding volume.
            g.setComputeBoundingBoxCallback(this.computeBoundCallback);
            g.getPrimitives()[0] = new osg.DrawElementsInstanced(
                osg.primitiveSet.TRIANGLES,
                new osg.BufferArray('ELEMENT_ARRAY_BUFFER', indices, 1),
                this._nInstances
            );
            return g;
        },

        createScene: function() {
            var root = new osg.Node();
            root.addChild(this.createCubes());
            return root;
        },

        run: function() {
            var canvas = document.getElementById('View');

            this._viewer = new osgViewer.Viewer(canvas);
            this._viewer.init();
            this._viewer.setupManipulator();
            this._viewer.setSceneData(this.createScene());
            var bbox = this._viewer.getSceneData().getBoundingBox();
            this._viewer.getManipulator().setTarget(bbox.center(osg.vec3.create()));
            this._viewer.getManipulator().setDistance(bbox.radius() * 2.5);
            this._viewer.run();
        }
    };

    window.addEventListener(
        'load',
        function() {
            var example = new Example();
            example.run();
        },
        true
    );
})();
