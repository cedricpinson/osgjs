/** 
 * StateSet encapsulate StateAttribute
 * @class StateSet
 */
osg.StateSet = function () {
    osg.Object.call(this);
    this.id = osg.instance++;
    this.attributeMap = {};
    this.attributeMap.attributeKeys = [];

    this.textureAttributeMapList = [];
};

/** @lends osg.StateSet.prototype */
osg.StateSet.prototype = osg.objectInehrit(osg.Object.prototype, {
    getObjectPair: function(attribute, value) {
        return {object: attribute, value: value};
    },
    addUniform: function (uniform, mode) {
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        if (!this.uniforms) {
            this.uniforms = {};
            this.uniforms.uniformKeys = [];
        }
        var name = uniform.name;
        this.uniforms[name] = this.getObjectPair(uniform, mode);
        if (this.uniforms.uniformKeys.indexOf(name) === -1) {
            this.uniforms.uniformKeys.push(name);
        }
    },
    getUniform: function (uniform) {
        if (this.uniforms[uniform]) {
            return this.uniforms[uniform].object;
        }
        return undefined;
    },
    getUniformList: function () { return this.uniforms; },

    setTextureAttributeAndMode: function (unit, attribute, mode) {
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        this._setTextureAttribute(unit, this.getObjectPair(attribute, mode) );
    },
    getTextureAttribute: function(unit, attribute) {
        if (this.textureAttributeMapList[unit] === undefined || this.textureAttributeMapList[unit][attribute] === undefined) {
            return undefined;
        }
        return this.textureAttributeMapList[unit][attribute].object;
    },
    getAttribute: function(attributeType) { 
        if (this.attributeMap[attributeType] === undefined) {
            return undefined;
        }
        return this.attributeMap[attributeType].object;
    },
    setAttributeAndMode: function(attribute, mode) { 
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        this._setAttribute(this.getObjectPair(attribute, mode)); 
    },

    _getUniformMap: function () {
        return this.uniforms;
    },

    // for internal use, you should not call it directly
    _setTextureAttribute: function (unit, attributePair) {
        if (this.textureAttributeMapList[unit] === undefined) {
            this.textureAttributeMapList[unit] = {};
            this.textureAttributeMapList[unit].attributeKeys = [];
        }
        var name = attributePair.object.getTypeMember();
        this.textureAttributeMapList[unit][name] = attributePair;
        if (this.textureAttributeMapList[unit].attributeKeys.indexOf(name) === -1) {
            this.textureAttributeMapList[unit].attributeKeys.push(name);
        }
    },
    // for internal use, you should not call it directly
    _setAttribute: function (attributePair) {
        var name = attributePair.object.getTypeMember();
        this.attributeMap[name] = attributePair;
        if (this.attributeMap.attributeKeys.indexOf(name) === -1) {
            this.attributeMap.attributeKeys.push(name);
        }
    }
});
