define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osg/Vec3',
    'osgAnimation/Target'
], function ( MACROUTILS, Object, Matrix, Vec3, Target ) {

    'use strict';

    var StackedScale = function ( name, scale ) {
        Object.call( this );
        this._target = Target.createVec3Target( scale || Vec3.one );
        if ( name ) this.setName( name );
    };


    StackedScale.prototype = MACROUTILS.objectInherit( Object.prototype, {

        init: function ( scale ) {
            this.setScale( scale );
            Vec3.copy( scale, this._target.defaultValue );
        },

        setScale: function ( scale ) {
            Vec3.copy( scale, this._target.value );
        },

        getTarget: function () {
            return this._target;
        },

        resetToDefaultValue: function () {
            this.setScale( this._target.defaultValue );
        },

        // must be optimized
        applyToMatrix: function ( m ) {
            var scale = this._target.value;
            Matrix.preMult( m, Matrix.makeScale( scale[ 0 ], scale[ 1 ], scale[ 2 ], Matrix.create() ) );
        }
    } );

    return StackedScale;
} );
