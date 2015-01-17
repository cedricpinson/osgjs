define( [
    'osg/Notify',
    'osg/Object',
    'osg/Utils',
], function ( Notify, Object, MACROUTILS ) {
    'use strict';

    /**
     *  ShadowTechnique provides an implementation interface of shadow techniques.
     *  @class ShadowTechnique
     */
    var ShadowTechnique = function () {
        Object.call( this );

        this._enabled = true;
        this._shadowedScene = undefined;
        this._dirty = false;

    };

    /** @lends ShadowTechnique.prototype */
    ShadowTechnique.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        dirty: function () {
            this._dirty = true;
        },

        getShadowedScene: function () {
            return this._shadowedScene;
        },

        setEnable: function ( enabled ) {
            this._enabled = enabled;
        },

        getEnable: function () {
            return this._enabled;
        },

        setShadowedScene: function ( shadowedScene ) {
            this._shadowedScene = shadowedScene;
        },

        init: function () {
            // well shouldn't be called
            Notify.log( 'No ShadowTechnique activated: normal rendering activated' );
        },

        valid: function () {
            // make sure abstract class not used.
            return false;
        },

        // update the technic
        updateShadowTechnic: function ( /*nodeVisitor*/ ) {},

        cullShadowCasting: function ( /*cullVisitor*/ ) {},

        cleanSceneGraph: function () {
            // well shouldn't be called
            Notify.log( 'No ShadowTechnique activated: normal rendering activated' );
        }

    } ), 'osgShadow', 'ShadowTechnique' );


    MACROUTILS.setTypeID( ShadowTechnique );

    return ShadowTechnique;
} );
