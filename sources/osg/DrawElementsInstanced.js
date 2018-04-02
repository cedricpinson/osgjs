'use strict';

import WebGLCaps from 'osg/WebGLCaps';
import DrawElements from 'osg/DrawElements';
import utils from 'osg/utils';
import notify from 'osg/notify';

/**
 * DrawElementsInstanced manages rendering of instanced indexed primitives
 * @class DrawElementsInstanced
 */
var DrawElementsInstanced = function(mode, indices, numPrimitives) {
    DrawElements.call(this, mode, indices);
    this._numPrimitives = numPrimitives;
    this._extension = undefined;
};

/** @lends DrawElementsInstanced.prototype */
utils.createPrototypeNode(
    DrawElementsInstanced,
    utils.objectInherit(DrawElements.prototype, {
        drawElements: function() {
            if (!this._extension) {
                this._extension = WebGLCaps.instance().getWebGLExtension('ANGLE_instanced_arrays');
                if (!this._extension) {
                    notify.error('Your browser does not support instanced arrays extension');
                    return;
                }
            }
            this._extension.drawElementsInstancedANGLE(
                this._mode,
                this._count,
                this._uType,
                this._offset,
                this._numPrimitives
            );
        },

        setNumPrimitives: function(numPrimitives) {
            this._numPrimitives = numPrimitives;
        },

        getNumPrimitives: function() {
            return this._numPrimitives;
        }
    }),
    'osg',
    'DrawElementsInstanced'
);

export default DrawElementsInstanced;
