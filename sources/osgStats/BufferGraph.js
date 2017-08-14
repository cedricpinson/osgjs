var MACROUTILS = require('osg/Utils');
var BufferArray = require('osg/BufferArray');
var Geometry = require('osg/Geometry');
var primitiveSet = require('osg/primitiveSet');
var DrawArrays = require('osg/DrawArrays');

var BufferGraph = function(nbPoints) {
    this._usageHint = BufferArray.DYNAMIC_DRAW;
    this._nbPoints = 0;
    this.resize(nbPoints);
};

MACROUTILS.createPrototypeObject(BufferGraph, {
    getGeometry: function() {
        return this._geometry;
    },
    resize: function(nbPoints) {
        this._maxPoints = nbPoints;
        var vertexes = new Float32Array(nbPoints * 3 * 2);
        if (this._vertexes) vertexes.set(this._vertexes);
        this._vertexes = vertexes;

        var uvs = new Float32Array(nbPoints * 2 * 2);
        if (this._uvs) uvs.set(this._uvs);
        this._uvs = uvs;

        if (this._geometry) {
            this._geometry.getAttributes().TexCoord0.setElements(this._uvs);
            this._geometry.getAttributes().Vertex.setElements(this._vertexes);
            return;
        }

        this._geometry = new Geometry();

        this._geometry.getAttributes().Vertex = new BufferArray(
            BufferArray.ARRAY_BUFFER,
            this._vertexes,
            3,
            true
        );
        this._geometry.getAttributes().TexCoord0 = new BufferArray(
            BufferArray.ARRAY_BUFFER,
            this._uvs,
            2,
            true
        );
        var drawArray = new DrawArrays(primitiveSet.LINES, 0, 0);
        this._geometry.getAttributes().TexCoord0.setUsage(this._usageHint);
        this._geometry.getAttributes().Vertex.setUsage(this._usageHint);

        this._primitive = drawArray;
        this._geometry.getPrimitives().push(this._primitive);
    },
    update: function() {
        this._primitive.setCount(this._nbPoints * 2);
        this._geometry.getAttributes().Vertex.dirty();
        this._geometry.getAttributes().TexCoord0.dirty();
    },
    reset: function() {
        this._nbPoints = 0;
    }
});

module.exports = BufferGraph;
