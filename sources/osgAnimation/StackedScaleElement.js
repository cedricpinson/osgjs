define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osg/Vec3'
], function ( MACROUTILS, Object, Matrix, Vec3 ) {

    'use strict';

    /**
     *  StackedScale
     */
    var StackedScale = function ( name, scale ) {
        Object.call( this );

        var value = Vec3.create();
        if ( scale ) Vec3.copy( scale, value );

        this._target = {
            value: value
        };
        if ( name ) this.setName( name );
    };


    StackedScale.prototype = MACROUTILS.objectInherit( Object.prototype, {

        setScale: function ( scale ) {
            Vec3.copy( scale, this._target.value );
        },

        setTarget: function ( target ) {
            this._target = target;
        },

        getTarget: function () {
            return this._target;
        },

        applyToMatrix: function ( m ) {
            var scale = this._target.value;
            Matrix.preMult( m, Matrix.makeScale( scale[ 0 ], scale[ 1 ], scale[ 2 ], Matrix.create() ) );
        }
    } );

    return StackedScale;
} );
