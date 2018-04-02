'use strict';

import WebGLCaps from 'osg/WebGLCaps';
import DrawArrays from 'osg/DrawArrays';
import utils from 'osg/utils';
import notify from 'osg/notify';

/**
 * DrawArrays manage rendering of indexed primitives
 * @class DrawArrays
 */
var DrawArraysInstanced = function(mode, first, count, numInstances) {
    DrawArrays.call(this, mode, first, count);
    this._numInstances = numInstances;
    this._extension = undefined;
};

/** @lends DrawArrays.prototype */
utils.createPrototypeNode(
    DrawArraysInstanced,
    utils.objectInherit(DrawArrays.prototype, {
        draw: function() {
            if (this._count === 0) return;
            if (!this._extension) {
                this._extension = WebGLCaps.instance().getWebGLExtension('ANGLE_instanced_arrays');
                if (!this._extension) {
                    notify.error('Your browser does not support instanced arrays extension');
                    return;
                }
            }
            this._extension.drawArraysInstancedANGLE(
                this._mode,
                this._first,
                this._count,
                this._numInstances
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
    'DrawArraysInstanced'
);

export default DrawArraysInstanced;
