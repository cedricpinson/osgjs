'use strict';
var BoundingSphere = require( 'osg/BoundingSphere' );
var Matrix = require( 'osg/Matrix' );
var Notify = require( 'osg/Notify' );


// Base class for Camera / User manipulator
var Manipulator = function ( boundStrategy ) {
    this._boundStrategy = boundStrategy;
    if ( this._boundStrategy === undefined )
        this._boundStrategy = Manipulator.COMPUTE_HOME_USING_SPHERE;

    this._controllerList = {};
    this._inverseMatrix = Matrix.create();
    this._camera = undefined;
    this._node = undefined;
    this._frustum = {};
};

Manipulator.prototype = {
    setCamera: function ( c ) {
        this._camera = c;
    },
    getCamera: function () {
        return this._camera;
    },
    setNode: function ( node ) {
        this._node = node;
    },
    getHomeBound: function ( overrideStrat ) {
        var node = this._node;
        if ( !node )
            return;

        var type = overrideStrat !== undefined ? overrideStrat : this._boundStrategy;

        if ( type === true || type === false ) {
            Notify.warn( 'Manipulator.getHomeBound with boolean is deprecated, pass a type instead' );
            type = type ? Manipulator.COMPUTE_HOME_USING_BBOX : Manipulator.COMPUTE_HOME_USING_SPHERE;
        }

        if ( type & Manipulator.COMPUTE_HOME_USING_BBOX ) {
            var bs = new BoundingSphere();
            var bb = node.getBoundingBox();
            if ( bb.valid() )
                bs.expandByBoundingBox( bb );

            // minimum between sphere and box
            if ( type & Manipulator.COMPUTE_HOME_USING_SPHERE ) {
                var boundSphere = node.getBound();
                if ( boundSphere.radius() < bs.radius() )
                    return boundSphere;
            }

            return bs;
        }

        return node.getBound();
    },
    getHomeDistance: function ( bs ) {
        var frustum = this._frustum;
        var dist = bs.radius();
        if ( this._camera && Matrix.getFrustum( this._camera.getProjectionMatrix(), frustum ) ) {
            var vertical2 = Math.abs( frustum.right - frustum.left ) / frustum.zNear / 2;
            var horizontal2 = Math.abs( frustum.top - frustum.bottom ) / frustum.zNear / 2;
            dist /= Math.sin( Math.atan2( horizontal2 < vertical2 ? horizontal2 : vertical2, 1 ) );
        } else {
            dist *= 1.5;
        }
        return dist;
    },
    // eg: var currentTime = nv.getFrameStamp().getSimulationTime();
    update: function ( /*nv*/) {},

    getInverseMatrix: function () {
        return this._inverseMatrix;
    },

    getControllerList: function () {
        return this._controllerList;
    }
};

// flags
Manipulator.COMPUTE_HOME_USING_SPHERE = 1 << 0;
Manipulator.COMPUTE_HOME_USING_BBOX = 1 << 1;

module.exports = Manipulator;
