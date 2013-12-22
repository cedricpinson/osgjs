define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osgAnimation/Vec3Target',
    'osg/Vec3'
], function ( MACROUTILS, Object, Matrix, Vec3Target, Vec3 ) {


    /**
     *  StackedTranslate
     *  @class StackedTranslate
     */
    var StackedTranslate = function ( name, translate ) {
        Object.call( this );
        if ( !translate ) {
            translate = [ 0, 0, 0 ];
        }
        this._translate = translate;
        this._target = undefined;
        this.setName( name );
    };

    /** @lends StackedTranslate.prototype */
    StackedTranslate.prototype = MACROUTILS.objectInehrit( Object.prototype, {
        setTranslate: function ( translate ) {
            Vec3.copy( translate, this._translate );
        },
        setTarget: function ( target ) {
            this._target = target;
        },
        getTarget: function () {
            return this._target;
        },
        update: function () {
            if ( this._target !== undefined ) {
                Vec3.copy( this._target.getValue(), this._translate );
            }
        },
        getOrCreateTarget: function () {
            if ( !this._target ) {
                this._target = new Vec3Target( this._translate );
            }
            return this._target;
        },
        applyToMatrix: function ( m ) {
            Matrix.preMultTranslate( m, this._translate );
        }
    } );

    return StackedTranslate;
} );
