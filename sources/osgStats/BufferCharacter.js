var MACROUTILS = require('osg/Utils');
var BufferArray = require('osg/BufferArray');
var Geometry = require('osg/Geometry');
var primitiveSet = require('osg/primitiveSet');
var DrawElements = require('osg/DrawElements');

var BufferCharacter = function(nbCharacters, usageHint) {
    this._usageHint = usageHint !== undefined ? usageHint : BufferArray.STATIC_DRAW;
    this._nbCharacters = 0;
    this.resize(nbCharacters);
};

MACROUTILS.createPrototypeObject(BufferCharacter, {
    getGeometry: function() {
        return this._geometry;
    },
    resize: function(nbCharacters) {
        this._maxCharacters = nbCharacters;
        var vertexes = new Float32Array(nbCharacters * 4 * 3);
        if (this._vertexes) vertexes.set(this._vertexes);
        this._vertexes = vertexes;

        var uvs = new Float32Array(nbCharacters * 4 * 2);
        if (this._uvs) uvs.set(this._uvs);
        this._uvs = uvs;

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
            this._geometry.getAttributes().TexCoord0.setElements(this._uvs);
            this._geometry.getAttributes().Vertex.setElements(this._vertexes);
            this._primitive.getIndices().setElements(this._indexes);
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
        var indexArray = new BufferArray(BufferArray.ELEMENT_ARRAY_BUFFER, this._indexes, 1);
        var drawElement = new DrawElements(primitiveSet.TRIANGLES, indexArray);
        this._geometry.getAttributes().TexCoord0.setUsage(this._usageHint);
        this._geometry.getAttributes().Vertex.setUsage(this._usageHint);

        this._primitive = drawElement;
        this._geometry.getPrimitives().push(this._primitive);
    },
    update: function() {
        this._primitive.setCount(this._nbCharacters * 6);
        this._geometry.getAttributes().Vertex.dirty();
        this._geometry.getAttributes().TexCoord0.dirty();
    },
    reset: function() {
        this._nbCharacters = 0;
    }
});

module.exports = BufferCharacter;
