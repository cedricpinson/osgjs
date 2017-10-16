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
    // need to be computed
    this._enabled = true;
    // since dirtied, handy for static shadow map
    this._filledOnce = false;
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

        setEnabled: function(enabled) {
            this._enabled = enabled;
        },

        isEnabled: function() {
            return this._enabled;
        },

        isFilledOnce: function() {
            return this._filledOnce;
        },

        requestRedraw: function() {
            this._filledOnce = false;
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
