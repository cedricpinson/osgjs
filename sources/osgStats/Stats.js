import utils from 'osg/utils';
import BlendFunc from 'osg/BlendFunc';
import Camera from 'osg/Camera';
import CullFace from 'osg/CullFace';
import Depth from 'osg/Depth';
import MatrixTransform from 'osg/MatrixTransform';
import Program from 'osg/Program';
import Shader from 'osg/Shader';
import Transform from 'osg/Transform';
import Texture from 'osg/Texture';
import { mat4, vec2, vec3 } from 'osg/glMatrix';
import BufferStats from 'osgStats/BufferStats';
import Counter from 'osgStats/Counter';
import Graph from 'osgStats/Graph';
import TextGenerator from 'osgStats/TextGenerator';
import IntersectionVisitor from 'osgUtil/IntersectionVisitor';
import LineSegmentIntersector from 'osgUtil/LineSegmentIntersector';
import shape from 'osg/shape';
import BoundingBox from 'osg/BoundingBox';

// Stats usages:
// url usable in Options
//
// to active the stats: ?stats=1
//
// to filter content in the stats: statsFilter=cull;myGroup;webgl
//
// to change the fontSize: statsFontSize=40
//
// You can also change the configuration before running the viewer to adds counters
// var config = {
//     values: {
//         myCounter: {
//             caption: 'my uber counter',
//             average: true,
//             graph: true,
//             over: 16
//         },
//         myCounter2: {
//             caption: 'a second counter',
//             graph: true,
//             below: 16
//         }
//         groups: [
//             {
//                 name: myGroup,
//                 caption: 'blah my group',
//                 values: [ 'myCounter', 'myCounter2' ]
//             }
//         ]
//     };
//     getViewerStats().addConfig(config)
//     getViewerStats().setShowFilter(['cull', 'myGroup']) // will display only cull
//     and myGroup groups
//     getViewerStats().setFontSize(50)

var getCanvasCoord = function(vec, e) {
    if (e.touches && e.touches.length) {
        var touch = e.touches[0];
        vec[0] = touch.pageX;
        vec[1] = touch.pageY;
    } else {
        vec[0] = e.offsetX === undefined ? e.layerX : e.offsetX;
        vec[1] = e.offsetY === undefined ? e.layerY : e.offsetY;
    }
};

var PICKING_NODEMASK = 0x8000;

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
        '#define SHADER_NAME STATS',
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

var Stats = function(viewer, options) {
    this._captionsBuffer = undefined;
    this._valuesBuffer = undefined;

    this._dirtyCaptions = true;
    this._dirtyValues = true;

    this._viewer = viewer;
    this._labelMaxWidth = 0;
    this._viewport = viewer.getCamera().getViewport();

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

    this._maxCaptionTextLength = 32;

    this._lineFactor = 1.1;
    this._displayFilter = [];

    this._backgroundWidth = 0;
    this._backgroundHeight = 0;

    this._bufferStats = new BufferStats();
    this._historyGraph = {};

    this._graphToDisplay = [];

    this._valuesMaxWidth = 6 * 12;

    this._showGraph = false;

    // inputs data
    this._backgroundPicking = shape.createTexturedQuadGeometry(0, 0, 0, 10, 0, 0, 0, 10, 0);
    this._dragStop = vec2.create();
    this._dragStart = vec2.create();
    this._startTransformation = mat4.create();

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
                    values: groupConfig.values,
                    textCursorY: new Float32Array(groupConfig.values.length)
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
        var node = new MatrixTransform();
        node.setName('StatsNode');
        node.addChild(this._backgroundPicking);
        this._nodeTransform = node;
        this._backgroundPicking.setNodeMask(0);

        camera.addChild(node);
        camera.setName('osgStats');
        camera.setViewport(this._viewport);
        this._node = camera;
        this._text = new TextGenerator();

        var fontSize = 12;
        if (options) {
            var statsGroupList = options.getString('statsFilter');
            if (statsGroupList) {
                var filterList = statsGroupList.split(';');
                this.setShowFilter(filterList);
            }
            var statsFontSize = options.getNumber('statsFontSize');
            if (statsFontSize !== undefined) fontSize = statsFontSize;

            this._showGraph = options.getBoolean('statsShowGraph');
        }

        var texture = new Texture();
        texture.setMinFilter(Texture.NEAREST);
        texture.setMagFilter(Texture.NEAREST);
        this._text.setFontSize(fontSize * this._viewer.getCanvasPixelRatio());
        this._text.getCanvas().then(
            function(canvas) {
                this._dirtyCaptions = true;
                var geometry = this._bufferStats.getGeometry();
                geometry.setName('StatsGeometry');
                geometry.setNodeMask(~PICKING_NODEMASK);
                node.addChild(geometry);
                texture.setImage(canvas);
                // invalidate the bounding box, we dont want it
                // to be used
                geometry.setBound(new BoundingBox());
            }.bind(this)
        );

        node.getOrCreateStateSet().setAttributeAndModes(createShader());
        node.getOrCreateStateSet().setAttributeAndModes(new CullFace(CullFace.DISABLE));
        var blendFunc = new BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA');
        node.getOrCreateStateSet().setAttributeAndModes(blendFunc);
        node.getOrCreateStateSet().setAttributeAndModes(new Depth(Depth.DISABLE));
        node.getOrCreateStateSet().setTextureAttributeAndModes(0, texture);

        var canvas = this._viewer.getGraphicContext().canvas;

        this._canvas = canvas;

        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        canvas.addEventListener('mouseout', this.onMouseUp.bind(this));

        canvas.addEventListener('touchmove', this.onMouseMove.bind(this));
        canvas.addEventListener('touchstart', this.onMouseDown.bind(this));
        canvas.addEventListener('touchend', this.onMouseUp.bind(this));
        canvas.addEventListener('touchcancel', this.onMouseUp.bind(this));
    },
    onMouseDown: function(e) {
        var hits = this.computeNearestIntersection(e);
        this._onStats = !!hits.length;
        if (!this._onStats) return;

        this._viewer.setEnableManipulator(false);

        e.preventDefault();
        mat4.copy(this._startTransformation, this._nodeTransform.getMatrix());
        getCanvasCoord(this._dragStart, e);
        this._dragStop[1] = this._dragStart[1];
    },
    onMouseMove: (function() {
        return function(e) {
            if (!this._onStats) return;

            getCanvasCoord(this._dragStop, e);
            var dy = this._dragStop[1] - this._dragStart[1];
            mat4.translate(
                this._nodeTransform.getMatrix(),
                this._startTransformation,
                vec3.fromValues(0, -dy, 0)
            );
        };
    })(),
    onMouseUp: function() {
        this._viewer.setEnableManipulator(true);
        this._onStats = false;
    },
    computeNearestIntersection: (function() {
        var coord = vec2.create();
        var lsi = new LineSegmentIntersector();
        var origIntersect = vec3.create();
        var dstIntersect = vec3.create();
        var iv = new IntersectionVisitor();
        iv.setIntersector(lsi);
        return function(e) {
            getCanvasCoord(coord, e);

            // canvas to webgl coord
            var viewer = this._viewer;
            var canvas = this._canvas;
            var x = coord[0] * (viewer._canvasWidth / canvas.clientWidth);
            var y = (canvas.clientHeight - coord[1]) * (viewer._canvasHeight / canvas.clientHeight);

            lsi.reset();
            lsi.set(vec3.set(origIntersect, x, y, 0.0), vec3.set(dstIntersect, x, y, 1.0));
            iv.reset();

            this._backgroundPicking.setNodeMask(PICKING_NODEMASK);
            iv.setTraversalMask(PICKING_NODEMASK);
            this._node.accept(iv);
            var hits = lsi.getIntersections();
            this._backgroundPicking.setNodeMask(0x0);

            return hits;
        };
    })(),
    _updateBackgroundPicking: function(x, y, w, h) {
        var vertexes = this._backgroundPicking.getVertexAttributeList().Vertex.getElements();
        vertexes[0] = x;
        vertexes[1] = y + h;

        vertexes[3] = x;
        vertexes[4] = y;

        vertexes[6] = x + w;
        vertexes[7] = y;

        vertexes[9] = x + w;
        vertexes[10] = y + h;
        this._backgroundPicking.dirtyBound();
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

        this._updateBackgroundPicking(
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

                group.textCursorY[j] = textCursorY;

                var text = counter._caption;
                // could need to split the label on multi line
                var nbSplits = text.length / this._maxCaptionTextLength;
                for (var c = 0; c < nbSplits; c++) {
                    var start = c * this._maxCaptionTextLength;
                    var splitText = text.substr(start, this._maxCaptionTextLength);
                    textWidth = this._bufferStats.generateText(
                        textCursorX,
                        textCursorY,
                        splitText,
                        this._text,
                        BufferStats.whiteColor
                    );
                    this._labelMaxWidth = Math.max(textWidth, this._labelMaxWidth);
                    textCursorY -= characterHeight;
                    textCursorX = initialX;
                }
            }
            textCursorY -= characterHeight;
        }
        this._bufferStats.captionsEnd();
    },
    _generateValues: function() {
        var characterWidth = this._text.getCharacterWidth();
        var valuesOffsetX = this._labelMaxWidth + 2 * characterWidth;
        var graphOffsetX = this._valuesMaxWidth + 2 * characterWidth;
        var characterHeight = this._text.getCharacterHeight();
        var textCursorX = valuesOffsetX;
        var textCursorY;

        var filters = this._displayFilter;
        var valuesMaxWidth = 0;
        for (var groupName in this._groups) {
            if (groupName && filters.length && filters.indexOf(groupName) === -1) continue;

            var group = this._groups[groupName];
            textCursorX = valuesOffsetX;

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

                textCursorY = group.textCursorY[j];
                var color = BufferStats.whiteColor;
                var over = counter.getOver();
                var below = counter.getBelow();
                if (over !== 0) color = value > over ? BufferStats.redColor : color;
                else if (below !== 0) color = value < below ? BufferStats.redColor : color;

                var valueWidth = this._bufferStats.generateText(
                    textCursorX,
                    textCursorY,
                    text,
                    this._text,
                    color
                );
                valuesMaxWidth = Math.max(valueWidth, valuesMaxWidth);

                if (this._showGraph && counter._graph) {
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
            }
        }
        this._bufferStats.valuesEnd();

        this._valuesMaxWidth = valuesMaxWidth;

        for (var g = 0; g < this._graphToDisplay.length; g++) {
            var graph = this._graphToDisplay[g];
            this._bufferStats.generateGraph(graph, characterHeight - 2.0);
        }

        var totalWidth = valuesOffsetX + graphOffsetX;

        if (this._graphToDisplay.length) totalWidth += Graph.maxGraphValue * 2 + 1;
        var totalHeight = this._viewport.height() - textCursorY;

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

export default Stats;
