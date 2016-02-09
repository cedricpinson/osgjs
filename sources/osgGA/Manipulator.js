'use strict';
var BoundingSphere = require( 'osg/BoundingSphere' );
var Matrix = require( 'osg/Matrix' );


// Base class for Camera / User manipulator
// flags is a bitfield use to enable options
var Manipulator = function ( flags ) {
    this._flags = flags;
    if ( this._flags === undefined )
        this._flags = Manipulator.DEFAULT_SETTINGS;

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
    getHomeBound: function ( useBoundingBox ) {
        var node = this._node;
        if ( !node )
            return;

        if ( useBoundingBox || this._flags & Manipulator.COMPUTE_HOME_USING_BBOX ) {
            var bs = new BoundingSphere();
            var bb = node.getBoundingBox();
            if ( bb.valid() )
                bs.expandByBoundingBox( bb );
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

Manipulator.COMPUTE_HOME_USING_BBOX = 0x02;
Manipulator.DEFAULT_SETTINGS = 0;

module.exports = Manipulator;
