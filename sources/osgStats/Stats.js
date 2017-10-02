var utils = require('osg/utils');
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
var BufferStats = require('osgStats/BufferStats');
var Counter = require('osgStats/Counter');
var Graph = require('osgStats/Graph');
var TextGenerator = require('osgStats/TextGenerator');

var createShader = function() {
    var vertexshader = [
        'attribute vec4 Vertex;',
        'uniform mat4 uModelViewMatrix;',
        'uniform mat4 uProjectionMatrix;',
        '',
        'varying vec2 vTexCoord0;',
        '',
        'void main(void) {',
        '  vTexCoord0 = Vertex.zw;',
        '  gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex.xy,0.0, 1.0));',
        '}'
    ].join('\n');

    var fragmentshader = [
        'varying vec2 vTexCoord0;',
        'uniform sampler2D Texture0;',

        'void main(void) {',
        '  vec4 color = vec4(1.0);',
        '  vec2 uv =  vTexCoord0;',
        '  int isText = 0;',
        '  if ( uv.y < 0.0 ) {',
        '     isText = 1;',
        '     uv.y = -uv.y;',
        '  }',
        '  if ( uv.y >= ' + (BufferStats.backgroundColor - 1).toFixed(1) + ' ) {', // background
        '     color = vec4(0.0,0.0,0.0,0.5);',
        '     uv.y -= ' + BufferStats.backgroundColor.toFixed(1) + ';',
        '  } else if ( uv.y >= ' + (BufferStats.redColor - 1).toFixed(1) + ' ) {',
        '     color = vec4(1.0,0.0,0.0,1.0);',
        '     uv.y -= ' + BufferStats.redColor.toFixed(1) + ';',
        '  } else if ( uv.y == ' + (BufferStats.greyColor - 1).toFixed(1) + ' ) {',
        '     color = vec4(0.5,0.5,0.5,1.0);',
        '     uv.y -= ' + BufferStats.greyColor.toFixed(1) + ';',
        '  } else {',
        '     uv.y -= ' + BufferStats.whiteColor.toFixed(1) + ';',
        '  }',
        '  if ( isText == 1 ) {',
        '     color *= texture2D( Texture0, uv.xy);',
        '  }',
        '  gl_FragColor = color;',
        '}'
    ].join('\n');

    return new Program(
        new Shader('VERTEX_SHADER', vertexshader),
        new Shader('FRAGMENT_SHADER', fragmentshader)
    );
};

var Stats = function(viewport, options) {
    this._captionsBuffer = undefined;
    this._valuesBuffer = undefined;

    this._dirtyCaptions = true;
    this._dirtyValues = true;

    this._labelMaxWidth = 0;
    this._viewport = viewport;

    this._node = undefined;
    this._text = undefined;
    this._offsetGroup = undefined;

    this._counters = {};
    this._groups = {};
    this._updates = [];
    this._displayableCounters = {};
    this._x = 0;
    this._y = 0;
    this._width = 0;
    this._height = 0;

    this._lineFactor = 1.1;
    this._displayFilter = [];

    this._backgroundWidth = 0;
    this._backgroundHeight = 0;

    this._bufferStats = new BufferStats();
    this._historyGraph = {};

    this._graphToDisplay = [];

    this._init(options);
};

utils.createPrototypeObject(Stats, {
    getCounter: function(name) {
        if (!this._counters[name]) {
            this._counters[name] = new Counter({
                caption: name,
                average: true
            });
        }

        return this._counters[name];
    },
    getBufferStats: function() {
        return this._bufferStats;
    },
    addConfig: function(config) {
        if (config.init && !config.init()) return;

        for (var valueName in config.values) {
            var valueConfig = config.values[valueName];
            var counter = new Counter(valueConfig);
            this._counters[valueName] = counter;
        }

        if (config.groups) {
            for (var i = 0; i < config.groups.length; i++) {
                var groupConfig = config.groups[i];
                var group = {
                    caption: groupConfig.caption,
                    values: groupConfig.values
                };

                var name = groupConfig.name ? groupConfig.name : groupConfig.caption;
                this._groups[name] = group;
            }
        }

        if (config.update) {
            this._updates.push(config.update);
        }
    },
    reset: function() {
        this._bufferStats.resetCaptions();
        this._bufferStats.resetValues();

        this._dirtyCaptions = true;
        this._dirtyValue = true;

        this._bufferStats.resize(this._bufferStats._maxNbVertexes);
    },
    update: function() {
        for (var i = 0; i < this._updates.length; i++) {
            this._updates[i](this);
        }
        this._dirtyValues = true;

        if (this._checkViewportChanged() || this._checkCounterDisplayableChanged())
            this._dirtyCaptions = true;

        if (this._dirtyCaptions) {
            this._bufferStats.resetCaptions();
            this._generateCaptions();
            this._dirtyCaptions = false;
        }

        if (this._dirtyValues) {
            this._bufferStats.resetValues();
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
    _init: function(options) {
        // 3D init
        var camera = new Camera();

        camera.setRenderOrder(Camera.POST_RENDER, 0);
        camera.setReferenceFrame(Transform.ABSOLUTE_RF);
        camera.setClearMask(0x0); // dont clear anything
        var node = new Node();
        camera.addChild(node);
        camera.setName('osgStats');
        this._node = camera;

        this._text = new TextGenerator();

        var fontSize = 16;
        if (options) {
            var statsGroupList = options.getString('statsFilter');
            if (statsGroupList) {
                var filterList = statsGroupList.split(';');
                this.setShowFilter(filterList);
            }
            var statsFontSize = options.getNumber('statsFontSize');
            if (statsFontSize !== undefined) fontSize = statsFontSize;
        }

        var texture = new Texture();
        texture.setMinFilter(Texture.NEAREST);
        texture.setMagFilter(Texture.NEAREST);
        this._text.setFontSize(fontSize);
        this._text.getCanvas().then(
            function(canvas) {
                this._dirtyCaptions = true;
                node.addChild(this._bufferStats.getGeometry());
                texture.setImage(canvas);
            }.bind(this)
        );

        node.getOrCreateStateSet().setAttributeAndModes(createShader());
        node.getOrCreateStateSet().setAttributeAndModes(new CullFace(CullFace.DISABLE));
        node
            .getOrCreateStateSet()
            .setAttributeAndModes(new BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));
        node.getOrCreateStateSet().setAttributeAndModes(new Depth(Depth.DISABLE));
        node.getOrCreateStateSet().setTextureAttributeAndModes(0, texture);
    },
    _generateCaptions: function() {
        var initialX = 0;
        var characterHeight = this._text.getCharacterHeight();
        var textCursorX = initialX;
        var textCursorY = this._viewport.height() - characterHeight;

        this._labelMaxWidth = 0;

        // generate background
        this._bufferStats.generateBackground(
            0,
            this._viewport.height() - this._backgroundHeight,
            this._backgroundWidth,
            this._backgroundHeight
        );

        var filters = this._displayFilter;
        for (var groupName in this._groups) {
            if (groupName && filters.length && filters.indexOf(groupName) === -1) continue;

            var group = this._groups[groupName];
            var groupText = '--- ' + group.caption + ' ---';
            var textWidth = this._bufferStats.generateText(
                textCursorX,
                textCursorY,
                groupText,
                this._text,
                BufferStats.whiteColor
            );
            this._labelMaxWidth = Math.max(textWidth, this._labelMaxWidth);
            textCursorX = initialX;
            textCursorY -= this._lineFactor * characterHeight;

            for (var j = 0; j < group.values.length; j++) {
                var counterName = group.values[j];
                var counter = this._counters[counterName];
                if (!counter || !counter.isDisplayable()) continue;

                var text = counter._caption;
                textWidth = this._bufferStats.generateText(
                    textCursorX,
                    textCursorY,
                    text,
                    this._text,
                    BufferStats.whiteColor
                );
                this._labelMaxWidth = Math.max(textWidth, this._labelMaxWidth);
                textCursorX = initialX;
                textCursorY -= characterHeight;
            }
            textCursorY -= characterHeight;
        }
        this._bufferStats.captionsEnd();
    },
    _generateValues: function() {
        var characterWidth = this._text.getCharacterWidth();
        var valuesOffsetX = this._labelMaxWidth + 2 * characterWidth;
        var graphOffsetX = characterWidth * 6;
        var characterHeight = this._text.getCharacterHeight();
        var textCursorX = valuesOffsetX;
        var textCursorY = this._viewport.height() - characterHeight;

        var filters = this._displayFilter;
        for (var groupName in this._groups) {
            if (groupName && filters.length && filters.indexOf(groupName) === -1) continue;

            var group = this._groups[groupName];
            textCursorX = valuesOffsetX;
            textCursorY -= this._lineFactor * characterHeight;

            for (var j = 0; j < group.values.length; j++) {
                var counterName = group.values[j];
                var counter = this._counters[counterName];
                if (!counter || !counter.isDisplayable()) continue;

                var value = counter.getAverageMs() ? counter.getAverageValue() : counter.getValue();
                var text;
                if (!Number.isInteger(value)) {
                    text = value.toFixed(2);
                } else {
                    text = value.toString();
                }

                var color = BufferStats.whiteColor;
                var over = counter.getOver();
                var below = counter.getBelow();
                if (over !== 0) color = value > over ? BufferStats.redColor : color;
                else if (below !== 0) color = value < below ? BufferStats.redColor : color;

                this._bufferStats.generateText(textCursorX, textCursorY, text, this._text, color);

                if (counter._graph) {
                    if (!this._historyGraph[counterName]) {
                        this._historyGraph[counterName] = new Graph();
                    }
                    this._graphToDisplay.push(this._historyGraph[counterName]);
                    this._historyGraph[counterName].setDisplayPosition(
                        valuesOffsetX + graphOffsetX,
                        textCursorY
                    );
                    this._historyGraph[counterName].addValue(value, color);
                }

                textCursorX = valuesOffsetX;
                textCursorY -= characterHeight;
            }
            textCursorY -= characterHeight;
        }

        this._bufferStats.valuesEnd();

        for (var g = 0; g < this._graphToDisplay.length; g++) {
            var graph = this._graphToDisplay[g];
            this._bufferStats.generateGraph(graph, characterHeight - 2.0);
        }

        var totalWidth = valuesOffsetX + graphOffsetX;

        if (this._graphToDisplay.length) totalWidth += Graph.maxGraphValue * 2 + 1;
        var totalHeight = this._viewport.height() - textCursorY - 2 * characterHeight;

        if (this._backgroundWidth !== totalWidth || this._backgroundHeight !== totalHeight) {
            this._backgroundWidth = totalWidth;
            this._backgroundHeight = totalHeight;
            this._dirtyCaptions = true;
        }
        this._graphToDisplay.length = 0;

        this._bufferStats.graphsEnd();
        this._bufferStats.update();
    },
    _checkCounterDisplayableChanged: function() {
        var changed = false;
        for (var key in this._counters) {
            var counter = this._counters[key];
            if (this._displayableCounters[key] !== counter.isDisplayable()) {
                this._displayableCounters[key] = counter.isDisplayable();
                changed = true;
            }
        }
        return changed;
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
