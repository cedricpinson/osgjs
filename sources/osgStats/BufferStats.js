import utils from 'osg/utils';
import BufferArray from 'osg/BufferArray';
import Geometry from 'osg/Geometry';
import primitiveSet from 'osg/primitiveSet';
import DrawElements from 'osg/DrawElements';
import DrawArrays from 'osg/DrawArrays';
import notify from 'osg/notify';
import Graph from 'osgStats/Graph';

// captions data (4 vertexes, indexes)
// values data   (4 vertexes, indexes)
// graph data    (2 vertexes, drawArrays)

var BufferStats = function() {
    this._usageHint = BufferArray.DYNAMIC_DRAW;
    // equivalent of 512 characters for caption, 128 of values characters
    // and 6 graph of 120 lines
    var nbVertexes = (1024 + 256) * 4 + 6 * 2 * 120;
    this._nbVertexes = 0;
    this._maxNbVertexes = 0;

    this._captionNbVertexes = 0;
    this._valuesNbVertexes = 0;
    this._graphsNbVertexes = 0;

    this.resize(nbVertexes);
};

BufferStats.backgroundColor = 10.0;
BufferStats.redColor = 7.0;
BufferStats.greyColor = 4.0;
BufferStats.whiteColor = 1.0;

utils.createPrototypeObject(BufferStats, {
    getGeometry: function() {
        return this._geometry;
    },
    generateBackground: function(x, y, w, h) {
        var vertexes = this._vertexes;
        this._nbVertexes += 4;

        vertexes[0] = x;
        vertexes[1] = y;
        vertexes[2] = 0.0;
        vertexes[3] = BufferStats.backgroundColor;

        var x1 = x + w;
        var y1 = y + h;

        vertexes[4] = x;
        vertexes[5] = y1;
        vertexes[6] = 0.0;
        vertexes[7] = BufferStats.backgroundColor;

        vertexes[8] = x1;
        vertexes[9] = y1;
        vertexes[10] = 0.0;
        vertexes[11] = BufferStats.backgroundColor;

        vertexes[12] = x1;
        vertexes[13] = y;
        vertexes[14] = 0.0;
        vertexes[15] = BufferStats.backgroundColor;
    },
    generateCharacter: function(x, y, w, h, ux, ux1, color) {
        var vertexes = this._vertexes;
        var nbVertexes = this._nbVertexes;

        this._nbVertexes += 4;
        var i = nbVertexes * 4;

        vertexes[i++] = x;
        vertexes[i++] = y;
        vertexes[i++] = ux;
        vertexes[i++] = -(0.0 + color);

        var x1 = x + w;
        var y1 = y + h;

        vertexes[i++] = x;
        vertexes[i++] = y1;
        vertexes[i++] = ux;
        vertexes[i++] = -(1.0 + color);

        vertexes[i++] = x1;
        vertexes[i++] = y1;
        vertexes[i++] = ux1;
        vertexes[i++] = -(1.0 + color);

        vertexes[i++] = x1;
        vertexes[i++] = y;
        vertexes[i++] = ux1;
        vertexes[i++] = -(0.0 + color);
    },
    generateText: function(x, y, text, textGenerator, zColor) {
        var size = text.length;
        if (this._nbVertexes + size * 4 >= this._maxNbVertexes) {
            this.resize(this._maxNbVertexes * 2);
        }
        var characterSizeUV = textGenerator._characterSizeUV;
        var characterWidth = textGenerator._characterWidth;
        var characterHeight = textGenerator._characterHeight;
        for (var i = 0; i < size; i++) {
            var characterCode = text.charCodeAt(i);
            var uvx = textGenerator.getCharacterUV(characterCode);
            this.generateCharacter(
                x,
                y,
                characterWidth,
                characterHeight,
                uvx,
                uvx + characterSizeUV,
                zColor
            );

            x += characterWidth;
        }
        return size * characterWidth;
    },
    generateGraph: function(graph, height) {
        if (this._nbVertexes + Graph.maxGraphValue * 2 >= this._maxNbVertexes) {
            this.resize(this._maxNbVertexes * 2);
        }
        var vertexes = this._vertexes;
        var nbVertexes = this._nbVertexes;

        var graphValues = graph.getValues();
        var nbGraphValues = graphValues.length;
        var graphStartIndex = graph.getIndex();

        var x = graph.getX();
        var y = graph.getY();
        this._nbVertexes += nbGraphValues * 2;

        for (var i = 0; i < nbGraphValues; i++) {
            var graphIndex = (graphStartIndex + i) % nbGraphValues;
            var graphValue = graphValues[graphIndex];

            var bufferIndex = nbVertexes + i * 2;
            var vertexIndex = bufferIndex * 4;

            var value = graphValue;
            var color = BufferStats.greyColor;
            // check if the value is a warning or not
            if (value >= BufferStats.redColor) {
                color = BufferStats.redColor;
                value -= BufferStats.redColor;
            }

            if (value > 1.0) value = 1.0;
            value *= height;
            if (value < 1.0) value = 1.0;

            vertexes[vertexIndex] = x + i * 2;
            vertexes[vertexIndex + 1] = y;
            vertexes[vertexIndex + 2] = 0.0;
            vertexes[vertexIndex + 3] = color;

            vertexes[vertexIndex + 4] = x + i * 2;
            vertexes[vertexIndex + 5] = y + value;
            vertexes[vertexIndex + 6] = 0.0;
            vertexes[vertexIndex + 7] = color;
        }
    },
    resize: function(nbVertexes) {
        notify.log('resize buffer to ' + nbVertexes);
        this._maxNbVertexes = nbVertexes;
        var vertexes = new Float32Array(nbVertexes * 4);
        if (this._vertexes) vertexes.set(this._vertexes);
        this._vertexes = vertexes;

        // it's the max number of characters displayable
        var nbCharacters = Math.ceil(nbVertexes / 4);
        this._indexes = new Uint16Array(nbCharacters * 6);
        for (var i = 0, j = 0; i < nbCharacters; i++) {
            this._indexes[j++] = i * 4 + 0;
            this._indexes[j++] = i * 4 + 1;
            this._indexes[j++] = i * 4 + 3;
            this._indexes[j++] = i * 4 + 3;
            this._indexes[j++] = i * 4 + 1;
            this._indexes[j++] = i * 4 + 2;
        }

        if (this._geometry) {
            this._geometry.getAttributes().Vertex.setElements(this._vertexes);
            this._characterPrimitive.getIndices().setElements(this._indexes);
            return;
        }

        this._geometry = new Geometry();

        this._geometry.getAttributes().Vertex = new BufferArray(
            BufferArray.ARRAY_BUFFER,
            this._vertexes,
            4,
            true
        );
        var indexArray = new BufferArray(BufferArray.ELEMENT_ARRAY_BUFFER, this._indexes, 1);

        // for labels and values
        this._geometry.getAttributes().Vertex.setUsage(this._usageHint);

        var drawElement = new DrawElements(primitiveSet.TRIANGLES, indexArray);
        this._characterPrimitive = drawElement;
        this._geometry.getPrimitives().push(this._characterPrimitive);

        var drawArrays = new DrawArrays(primitiveSet.LINES, 0, 0);
        this._graphPrimitive = drawArrays;
        this._geometry.getPrimitives().push(this._graphPrimitive);
    },
    update: function() {
        var nbTotalCharacters = this._captionNbVertexes + this._valuesNbVertexes;
        this._characterPrimitive.setCount(nbTotalCharacters / 4 * 6);
        this._graphPrimitive.setCount(this._graphsNbVertexes);
        this._graphPrimitive.setFirst(nbTotalCharacters);

        this._geometry.getAttributes().Vertex.dirty();
    },
    resetCaptions: function() {
        this._nbVertexes = 0;
        this._captionNbVertexes = 0;
    },
    resetValues: function() {
        this._nbVertexes = this._captionNbVertexes;
        this._valuesNbVertexes = 0;
        this._graphsNbVertexes = 0;
    },
    captionsEnd: function() {
        this._captionNbVertexes = this._nbVertexes;
    },
    valuesEnd: function() {
        this._valuesNbVertexes = this._nbVertexes - this._captionNbVertexes;
    },
    graphsEnd: function() {
        this._graphsNbVertexes =
            this._nbVertexes - (this._valuesNbVertexes + this._captionNbVertexes);
    },
    getCharacterPrimitive: function() {
        return this._characterPrimitive;
    },
    getGraphPrimitive: function() {
        return this._graphPrimitive;
    },
    getNbVertexes: function() {
        return this._nbVertexes;
    }
});

export default BufferStats;
