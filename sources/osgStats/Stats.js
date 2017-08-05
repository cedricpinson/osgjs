var MACROUTILS = require('osg/Utils');
var notify = require('osg/notify');
var BufferArray = require('osg/BufferArray');
var BlendFunc = require('osg/BlendFunc');
var Camera = require('osg/Camera');
var CullFace = require('osg/CullFace');
var Depth = require('osg/Depth');
var Node = require('osg/Node');
var Program = require('osg/Program');
var Shader = require('osg/Shader');
var Transform = require('osg/Transform');
var Texture = require('osg/Texture');
var mat4 = require('osg/glMatrix').mat4;
var Buffer = require('osgStats/Buffer');
var Counter = require('osgStats/Counter');
var TextGenerator = require('osgStats/TextGenerator');

var Stats = function(viewport) {
    this._captionsBuffer = undefined;
    this._valuesBuffer = undefined;

    this._dirtyCaptions = true;
    this._dirtyValues = true;

    this._counters = undefined;
    this._groups = undefined;

    this._labelMaxWidth = 0;
    this._viewport = viewport;

    this._node = undefined;
    this._text = undefined;
    this._offsetGroup = undefined;

    this._counters = {};
    this._groups = [];
    this._updates = [];

    this._x = 0;
    this._y = 0;
    this._width = 0;
    this._height = 0;

    this._fontFactor = 0.7;
    this._lineFactor = 1.1;
    this._characterDisplayHeight = 32.0;

    this._displayFilter = [];
    this._init(viewport);
};

MACROUTILS.createPrototypeObject(Stats, {
    getCounter: function(name) {
        return this._counters[name];
    },
    addConfig: function(config) {
        for (var valueName in config.values) {
            if (this._counters[valueName]) {
                notify.error('Counter ' + valueName + ' already exist');
                return;
            }
            var valueConfig = config.values[valueName];
            var counter = new Counter(valueConfig);
            this._counters[valueName] = counter;
        }

        if (config.groups) {
            for (var i = 0; i < config.groups.length; i++) {
                this._groups.push(config.groups[i]);
            }
        }

        if (config.update) {
            this._updates.push(config.update);
        }
    },
    update: function() {
        for (var i = 0; i < this._updates.length; i++) {
            this._updates[i](this);
        }

        this._dirtyValues = true;

        if (this._checkViewportChanged()) this._dirtyCaptions = true;

        if (this._dirtyCaptions) {
            this._generateCaptions();
            this._dirtyCaptions = false;
        }

        if (this._dirtyValues) {
            this._generateValues();
            this._dirtyValues = false;
        }
    },
    getNode: function() {
        return this._node;
    },
    setShowFilter: function(arrayOfGroupName) {
        this._dirtyCaptions = true;
        if (!arrayOfGroupName) {
            this._displayFilter.length = 0;
            return;
        }
        this._displayFilter = arrayOfGroupName.slice();
    },
    setFontSize: function(size) {
        this._characterDisplayHeight = size;
        this._fontFactor = this._characterDisplayHeight / this._text.getCharacterHeight();
        this._dirtyCaptions = true;
    },
    _init: function(viewport) {
        // 3D init
        this._captionsBuffer = new Buffer(512);
        this._valuesBuffer = new Buffer(128, BufferArray.DYNAMIC_DRAW);

        this._viewport = viewport;
        var camera = new Camera();

        camera.setRenderOrder(Camera.NESTED_RENDER, 0);
        camera.setReferenceFrame(Transform.ABSOLUTE_RF);
        var node = new Node();
        camera.addChild(node);
        camera.setName('osgStats');
        this._node = camera;

        this._text = new TextGenerator();
        var texture = new Texture();
        this._text.getCanvas().then(
            function(canvas) {
                this._dirtyCaptions = true;
                node.addChild(this._captionsBuffer.getGeometry());
                node.addChild(this._valuesBuffer.getGeometry());
                texture.setImage(canvas);
                this.setFontSize(this._characterDisplayHeight);
            }.bind(this)
        );

        var program = (function() {
            var vertexshader = [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'uniform mat4 uModelViewMatrix;',
                'uniform mat4 uProjectionMatrix;',
                '',
                'varying vec2 vTexCoord0;',
                '',
                'void main(void) {',
                '  gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex, 1.0));',
                '  vTexCoord0 = TexCoord0;',
                '}'
            ].join('\n');

            var fragmentshader = [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'varying vec2 vTexCoord0;',
                'uniform sampler2D Texture0;',

                'void main(void) {',
                '  vec4 color = texture2D( Texture0, vTexCoord0.xy);',
                '  gl_FragColor = color;',
                '  //gl_FragColor = vec4(1.0,0.0,1.0,1.0);',
                '}'
            ].join('\n');

            return new Program(
                new Shader('VERTEX_SHADER', vertexshader),
                new Shader('FRAGMENT_SHADER', fragmentshader)
            );
        })();

        node.getOrCreateStateSet().setAttributeAndModes(program);
        node.getOrCreateStateSet().setAttributeAndModes(new CullFace(0));
        node
            .getOrCreateStateSet()
            .setAttributeAndModes(new BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));
        node.getOrCreateStateSet().setAttributeAndModes(new Depth(0));
        node.getOrCreateStateSet().setTextureAttributeAndModes(0, texture);
    },
    _generateCaptions: function() {
        var initialX = 0;
        var buffer = this._captionsBuffer;
        var characterHeight = this._text.getCharacterHeight() * this._fontFactor;
        var textCursor = [initialX, this._viewport.height() - characterHeight, 0];
        this._labelMaxWidth = 0;
        buffer.reset();

        for (var i = 0; i < this._groups.length; i++) {
            var group = this._groups[i];
            var groupName = group.name;
            if (
                groupName &&
                this._displayFilter.length &&
                this._displayFilter.indexOf(groupName) === -1
            )
                continue;

            var groupText = '--- ' + group.caption + ' ---';
            var textWidth = this._text.generateText(
                textCursor,
                groupText,
                buffer,
                this._fontFactor
            );
            this._labelMaxWidth = Math.max(textWidth, this._labelMaxWidth);
            textCursor[0] = initialX;
            textCursor[1] -= this._lineFactor * characterHeight;

            for (var j = 0; j < group.values.length; j++) {
                var counterName = group.values[j];
                var counter = this._counters[counterName];
                if (!counter) continue;

                var text = counter._caption;
                textWidth = this._text.generateText(textCursor, text, buffer, this._fontFactor);
                this._labelMaxWidth = Math.max(textWidth, this._labelMaxWidth);
                textCursor[0] = initialX;
                textCursor[1] -= characterHeight;
            }
            textCursor[1] -= characterHeight;
        }

        buffer.update();
    },
    _generateValues: function() {
        var initialX = this._labelMaxWidth + 2 * this._text.getCharacterWidth() * this._fontFactor;
        var buffer = this._valuesBuffer;
        var characterHeight = this._text.getCharacterHeight() * this._fontFactor;
        var textCursor = [initialX, this._viewport.height() - characterHeight, 0];
        buffer.reset();

        for (var i = 0; i < this._groups.length; i++) {
            var group = this._groups[i];
            var groupName = group.name;
            if (
                groupName &&
                this._displayFilter.length &&
                this._displayFilter.indexOf(groupName) === -1
            )
                continue;

            textCursor[0] = initialX;
            textCursor[1] -= this._lineFactor * characterHeight;

            for (var j = 0; j < group.values.length; j++) {
                var counterName = group.values[j];
                var counter = this._counters[counterName];
                if (!counter) continue;

                var value = counter._avgMs ? counter._averageValue : counter._value;
                var text;
                if (!Number.isInteger(value)) {
                    text = value.toFixed(2);
                } else {
                    text = value.toString();
                }

                this._text.generateText(textCursor, text, buffer, this._fontFactor);
                textCursor[0] = initialX;
                textCursor[1] -= characterHeight;
            }
            textCursor[1] -= characterHeight;
        }

        buffer.update();
    },
    _checkViewportChanged: function() {
        var x = this._viewport.x();
        var y = this._viewport.y();
        var w = this._viewport.width();
        var h = this._viewport.height();
        if (x !== this._x || y !== this._y || w !== this._width || h !== this._height) {
            this._x = x;
            this._y = y;
            this._width = w;
            this._height = h;

            var camera = this._node;
            mat4.ortho(
                camera.getProjectionMatrix(),
                this._x,
                this._width,
                this._y,
                this._height,
                -5,
                5
            );
            return true;
        }
        return false;
    }
});

module.exports = Stats;
