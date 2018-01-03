import notify from 'osg/notify';
import Object from 'osg/Object';
import utils from 'osg/utils';

/**
 *  ShadowTechnique provides an implementation interface of shadow techniques.
 *  @class ShadowTechnique
 */
var ShadowTechnique = function() {
    Object.call(this);

    this._shadowedScene = undefined;
    this._dirty = false;
    this._continuousUpdate = true;
    // since dirtied, handy for static shadow map
    this._needRedraw = true;
};

/** @lends ShadowTechnique.prototype */
utils.createPrototypeObject(
    ShadowTechnique,
    utils.objectInherit(Object.prototype, {
        dirty: function() {
            this._dirty = true;
        },

        getShadowedScene: function() {
            return this._shadowedScene;
        },

        setContinuousUpdate: function(enabled) {
            this._continuousUpdate = enabled;
        },

        isContinuousUpdate: function() {
            return this._continuousUpdate;
        },

        needRedraw: function() {
            return this._needRedraw;
        },

        requestRedraw: function() {
            this._needRedraw = true;
        },

        setShadowedScene: function(shadowedScene) {
            this._shadowedScene = shadowedScene;
        },

        init: function() {
            // well shouldn't be called
            notify.log('No ShadowTechnique activated: normal rendering activated');
        },

        valid: function() {
            // make sure abstract class not used.
            return false;
        },

        // update the technic
        updateShadowTechnique: function(/*nodeVisitor*/) {},

        cullShadowCasting: function(/*cullVisitor*/) {},

        cleanSceneGraph: function() {
            // well shouldn't be called
            notify.log('No ShadowTechnique activated: normal rendering activated');
        }
    }),
    'osgShadow',
    'ShadowTechnique'
);

export default ShadowTechnique;
