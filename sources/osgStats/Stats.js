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
var BufferCharacter = require('osgStats/BufferCharacter');
var BufferGraph = require('osgStats/BufferGraph');
var Counter = require('osgStats/Counter');
var TextGenerator = require('osgStats/TextGenerator');

var MaxGraphValue = 120;
var Graph = function() {
    this._values = new Float32Array(MaxGraphValue);
    this._index = 0;
    this._maxValue = 0.0;
};
Graph.prototype = {
    addValue: function(value) {
        var index = this._index;
        this._maxValue = value > this._maxValue ? value : this._maxValue;
        this._maxValue *= 0.99;
        this._values[index] = value / (this._maxValue * 1.1);
        this._index = (this._index + 1) % MaxGraphValue;
    },
    computeMax: function() {
        return this.computeMedian();
        this._maxValue = 0.0;
        for (var i = 0; i < MaxGraphValue; i++) {
            var value = this._values[i];
            this._maxValue = value > this._maxValue ? value : this._maxValue;
        }
    },
    computeRunningMean: function(average, value, index) {
        var mean = (average + (index - 1) + value) / index;
        return mean * 2.0;
    },
    computeMovingMean: function(average, value, alpha) {
        var mean = alpha * value + (1.0 - alpha) * average;
        return mean * 2.0;
    },
    computeMedian: function() {
        var sortedArray = this._inputs.sort();
        var median = sortedArray[MaxGraphValue / 2];
        var max = median * 2.0;
        return max;
    }
};

var Stats = function(viewport, options) {
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

    this._backgroundWidth = 0;
    this._backgroundHeight = 0;

    this._init(viewport, options);
};

MACROUTILS.createPrototypeObject(Stats, {
    getCounter: function(name) {
        if (!this._counters[name]) {
            this._counters[name] = new Counter({
                caption: name,
                average: true
            });
        }

        return this._counters[name];
    },
    addConfig: function(config) {
        for (var valueName in config.values) {
            if (this._counters[valueName]) {
                notify.warn('Counter ' + valueName + ' already exist, overring it');
            }
            var valueConfig = config.values[valueName];
            var counter = new Counter(valueConfig);
            this._counters[valueName] = counter;
        }

        if (config.groups) {
            for (var i = 0; i < config.groups.length; i++) {
                var groupConfig = config.groups[i];
                var group = {
                    name: groupConfig.name ? groupConfig.name : groupConfig.caption,
                    caption: groupConfig.caption,
                    values: groupConfig.values
                };
                this._groups.push(group);
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
    setShowFilter: function(groupNamesArray) {
        this._dirtyCaptions = true;
        if (!groupNamesArray) {
            this._displayFilter.length = 0;
            return;
        }
        this._displayFilter = groupNamesArray.slice();
    },
    setFontSize: function(size) {
        this._characterDisplayHeight = size;
        this._fontFactor = this._characterDisplayHeight / this._text.getCharacterHeight();
        this._dirtyCaptions = true;
    },
    _init: function(viewport, options) {
        // 3D init
        this._captionsBuffer = new BufferCharacter(512);
        this._valuesBuffer = new BufferCharacter(128, BufferArray.DYNAMIC_DRAW);
        this._graphesBuffer = new BufferGraph(MaxGraphValue * 200);
        this._historyGraph = {};

        this._viewport = viewport;
        var camera = new Camera();

        camera.setRenderOrder(Camera.POST_RENDER, 0);
        camera.setReferenceFrame(Transform.ABSOLUTE_RF);
        camera.setClearMask(0x0); // dont clear anything
        var node = new Node();
        camera.addChild(node);
        camera.setName('osgStats');
        this._node = camera;

        this._text = new TextGenerator();

        if (options) {
            var statsGroupList = options.getString('statsFilter');
            if (statsGroupList) {
                var filterList = statsGroupList.split(';');
                this.setShowFilter(filterList);
            }
            var statsFontSize = options.getNumber('statsFontSize');
            if (statsFontSize !== undefined) this._characterDisplayHeight = statsFontSize;
        }

        var texture = new Texture();
        this._text.getCanvas().then(
            function(canvas) {
                this._dirtyCaptions = true;
                node.addChild(this._captionsBuffer.getGeometry());
                node.addChild(this._valuesBuffer.getGeometry());
                node.addChild(this._graphesBuffer.getGeometry());
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
                '  vec4 color;',
                '  if ( vTexCoord0.y <= -10.0 ) {',
                '     color = vec4(0.0,0.0,0.0,0.5);',
                '  } else if ( vTexCoord0.x <= -1.0 ) {',
                '     color = vec4(1.0,0.0,0.0,1.0);',
                '  } else {',
                '     color = texture2D( Texture0, vTexCoord0.xy);',
                '  }',
                '  gl_FragColor = color;',
                '}'
            ].join('\n');

            return new Program(
                new Shader('VERTEX_SHADER', vertexshader),
                new Shader('FRAGMENT_SHADER', fragmentshader)
            );
        })();

        node.getOrCreateStateSet().setAttributeAndModes(program);
        node.getOrCreateStateSet().setAttributeAndModes(new CullFace(CullFace.DISABLE));
        node
            .getOrCreateStateSet()
            .setAttributeAndModes(new BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));
        node.getOrCreateStateSet().setAttributeAndModes(new Depth(Depth.DISABLE));
        node.getOrCreateStateSet().setTextureAttributeAndModes(0, texture);
    },
    _generateBackground: function() {},
    _generateCaptions: function() {
        var initialX = 0;
        var buffer = this._captionsBuffer;
        var characterHeight = this._text.getCharacterHeight() * this._fontFactor;
        var textCursor = [initialX, this._viewport.height() - characterHeight, 0];
        this._labelMaxWidth = 0;
        buffer.reset();

        // generate background
        this._text.generateBackground(
            this._captionsBuffer,
            0,
            this._viewport.height() - this._backgroundHeight,
            this._backgroundWidth,
            this._backgroundHeight
        );

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

    _generateGraph: function(graph, initialX, y) {
        var buffer = this._graphesBuffer;
        var vertexes = buffer._vertexes;
        var uvs = buffer._uvs;
        var nbPoints = buffer._nbPoints;
        var height = this._text.getCharacterHeight() * this._fontFactor - 2.0;
        for (var i = 0; i < MaxGraphValue; i++) {
            var graphIndex = (graph._index + i) % MaxGraphValue;
            var graphValue = graph._values[graphIndex];

            var bufferIndex = (nbPoints + i) * 2;
            var vertexIndex = bufferIndex * 3;
            var uvIndex = bufferIndex * 2;

            var value = graphValue;
            if (value > 1.0) value = 1.0;
            value *= height;
            if (value < 1.0) value = 1.0;
            vertexes[vertexIndex] = initialX + i * 2;
            vertexes[vertexIndex + 1] = y;

            vertexes[vertexIndex + 3] = initialX + i * 2;
            vertexes[vertexIndex + 4] = y + value;

            uvs[uvIndex + 0] = -1.0;
            uvs[uvIndex + 2] = -1.0;
        }
        buffer._nbPoints += MaxGraphValue;
    },

    _generateValues: function() {
        var characterWidth = this._text.getCharacterWidth();
        var valuesOffsetX = this._labelMaxWidth + 2 * characterWidth * this._fontFactor;
        var graphOffsetX = characterWidth * 6 * this._fontFactor;
        var buffer = this._valuesBuffer;
        var characterHeight = this._text.getCharacterHeight() * this._fontFactor;
        var textCursor = [valuesOffsetX, this._viewport.height() - characterHeight, 0];
        buffer.reset();
        this._graphesBuffer.reset();
        var hasGraph = false;
        for (var i = 0; i < this._groups.length; i++) {
            var group = this._groups[i];
            var groupName = group.name;
            if (
                groupName &&
                this._displayFilter.length &&
                this._displayFilter.indexOf(groupName) === -1
            )
                continue;

            textCursor[0] = valuesOffsetX;
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

                if (counter._graph) {
                    hasGraph = true;
                    if (!this._historyGraph[counterName]) {
                        this._historyGraph[counterName] = new Graph();
                    }

                    this._historyGraph[counterName].addValue(value);

                    this._generateGraph(
                        this._historyGraph[counterName],
                        valuesOffsetX + graphOffsetX,
                        textCursor[1]
                    );
                }

                textCursor[0] = valuesOffsetX;
                textCursor[1] -= characterHeight;
            }
            textCursor[1] -= characterHeight;
        }

        var totalWidth = valuesOffsetX + graphOffsetX;

        if (hasGraph) totalWidth += MaxGraphValue * 2 + 1;
        var totalHeight = this._viewport.height() - textCursor[1] - 2 * characterHeight;

        if (this._backgroundWidth !== totalWidth || this._backgroundHeight !== totalHeight) {
            this._backgroundWidth = totalWidth;
            this._backgroundHeight = totalHeight;
            this._dirtyCaptions = true;
        }

        this._graphesBuffer.update();
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
