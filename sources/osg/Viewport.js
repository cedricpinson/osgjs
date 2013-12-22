define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Matrix'
], function ( MACROUTILS, StateAttribute, Matrix ) {

    var Viewport = function ( x, y, w, h ) {
        StateAttribute.call( this );

        if ( x === undefined ) {
            x = 0;
        }
        if ( y === undefined ) {
            y = 0;
        }
        if ( w === undefined ) {
            w = 800;
        }
        if ( h === undefined ) {
            h = 600;
        }

        this._x = x;
        this._y = y;
        this._width = w;
        this._height = h;
        this._dirty = true;
    };

    Viewport.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {
        attributeType: 'Viewport',
        cloneType: function () {
            return new Viewport();
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType;
        },
        apply: function ( state ) {
            var gl = state.getGraphicContext();
            gl.viewport( this._x, this._y, this._width, this._height );
            this._dirty = false;
        },
        setViewport: function ( x, y, width, height ) {
            this._x = x;
            this._y = y;
            this._width = width;
            this._height = height;
            this.dirty();
        },
        x: function () {
            return this._x;
        },
        y: function () {
            return this._y;
        },
        width: function () {
            return this._width;
        },
        height: function () {
            return this._height;
        },
        computeWindowMatrix: function () {
            // res = Matrix offset * Matrix scale * Matrix translate
            var translate = Matrix.makeTranslate( 1.0, 1.0, 1.0 );
            var scale = Matrix.makeScale( 0.5 * this._width, 0.5 * this._height, 0.5 );
            var offset = Matrix.makeTranslate( this._x, this._y, 0.0 );
            //return Matrix.mult(Matrix.mult(translate, scale, translate), offset, offset);
            return Matrix.preMult( offset, Matrix.preMult( scale, translate ) );
        }
    } ), 'osg', 'Viewport' );

    return Viewport;
} );
