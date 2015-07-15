/**
 * @author Jordi Torres
 */
define( [
    'osg/Utils',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/Shape',
    'osg/Texture',
    'osg/StateAttribute',
    'osg/BillboardAttribute',
    'osg/BlendFunc'
], function ( MACROUTILS, Vec3, Vec4, Matrix, MatrixTransform, Shape, Texture, StateAttribute, BillboardAttribute, BlendFunc ) {

    'use strict';

    /**
     *  @class Text: Text 2D using a Canvas2D as a texture for a textured quad.
     */
    var Text = function ( text ) {
        MatrixTransform.call( this );
        // create a canvas element
        this._canvas = document.createElement( 'canvas' );
        this._context = this._canvas.getContext( '2d' );

        this._text = '';
        if ( text !== undefined ) this._text = text;
        this._font = 'monospace';
        // Vec4 value to load/return
        this._color = [ 0, 0, 0, 1 ];
        // This determines the text color, it can take a hex value or rgba value (e.g. rgba(255,0,0,0.5))
        this._fillStyle = 'rgba( 0, 0, 0, 1 )';
        // This determines the alignment of text, e.g. left, center, right
        this._textAlign = 'center';
        // This determines the baseline of the text, e.g. top, middle, bottom
        this._textBaseLine = 'middle';
        this._fontSize = 20;
        this._geometry = undefined;
        this._autoRotateToScreen = false;
        this._position = Vec3.create();
        // Lazy initialization
        this._dirty = false;
        this.init();
    };

    /** @lends BlendColor.prototype */
    Text.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( MatrixTransform.prototype, {

        init: function () {
            if ( this._geometry !== undefined ) {
                this.removeChild( this._geometry );
                // The text could be dynamic, so we need to remove GL objects
                this._geometry.releaseGLObjects();
            }
            this.setTextProperties();
            this._canvas.width = this._nextPowerOfTwo( this._context.measureText( this._text ).width );
            this._canvas.height = this._nextPowerOfTwo( this._fontSize );
            // We need to set the text properties again, as the canvas size could change.
            this.setTextProperties();
            this._context.clearRect( 0, 0, this._canvas.width, this._canvas.height );
            this._context.fillText( this._text, this._canvas.width / 2, this._canvas.height / 2 );
            // Right now we set the pivot point to center, to assure the bounding box is correct when rendering billboards.
            // TODO: Possibility to set different pivot point.
            this._geometry = Shape.createTexturedQuadGeometry( -this._canvas.width / 2, -this._canvas.height / 2, 0, this._canvas.width, 0, 0, 0, this._canvas.height, 0 );
            // create a texture to attach the canvas2D
            var texture = new Texture();
            texture.setTextureSize( this._canvas.width, this._canvas.height );
            texture.setMinFilter( 'LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            texture.setImage( this._canvas );
            // Transparency stuff
            var stateset = this._geometry.getOrCreateStateSet();
            stateset.setTextureAttributeAndModes( 0, texture );
            stateset.setRenderingHint( 'TRANSPARENT_BIN' );
            stateset.setAttributeAndModes( new BlendFunc( BlendFunc.ONE, BlendFunc.ONE_MINUS_SRC_ALPHA ) );
            this.addChild( this._geometry );
            this.dirtyBound();
        },

        setText: function ( text ) {
            this._text = text;
            // Canvas size could change so we need to make it dirty.
            this._dirty = true;
        },

        getText: function () {
            return this._text;
        },

        setFont: function ( font ) {
            this._font = font;
            this._dirty = true;
        },

        setColor: function ( color ) {
            this._color = color;
            this._fillStyle = 'rgba(' + color[ 0 ] * 255 + ',' + color[ 1 ] * 255 + ',' + color[ 2 ] * 255 + ',' + color[ 3 ] + ')';
            this._context.fillStyle = this._fillStyle;
            this._context.fillText( this._text, this._canvas.width / 2, this._canvas.height / 2 );
        },

        getColor: function () {
            return this._color;
        },

        setCharacterSize: function ( size ) {
            this._fontSize = size;
            this._dirty = true;
        },

        getCharacterSize: function () {
            return this._fontSize;
        },

        setPosition: function ( position ) {
            this._position = position;
            Matrix.makeTranslate( position[ 0 ], position[ 1 ], position[ 2 ], this.getMatrix() );
        },

        getPosition: function () {
            return this._position;
        },
        setTextProperties: function () {
            this._context.fillStyle = this._fillStyle;
            this._context.textAlign = this._textAlign;
            this._context.textBaseline = this._textBaseLine;
            this._context.font = this._fontSize + 'px ' + this._font;
        },

        setAutoRotateToScreen: function ( value ) {
            this._autoRotateToScreen = value;
            if ( !this._billboardAttribute ) {
                this._billboardAttribute = new BillboardAttribute();
            }
            var stateset = this.getOrCreateStateSet();
            if ( value ) {
                // Temporary hack because StateAttribute.ON does not work right now
                this._billboardAttribute.setEnabled( true );
                stateset.setAttributeAndModes( this._billboardAttribute, StateAttribute.ON );
            } else {
                // Temporary hack because StateAttribute.OFF does not work right now
                this._billboardAttribute.setEnabled( false );
                stateset.setAttributeAndModes( this._billboardAttribute, StateAttribute.OFF );
            }
        },

        getAutoRotateToScreen: function () {
            return this._autoRotateToScreen;
        },

        traverse: function ( visitor ) {
            if ( this._dirty ) {
                this.init();
                this._dirty = false;
            }
            MatrixTransform.prototype.traverse.call( this, visitor );
        },

        _nextPowerOfTwo: function ( value, pow ) {
            pow = pow || 1;
            while ( pow < value ) {
                pow *= 2;
            }
            return pow;
        }
    } ), 'osgText', 'Text' );

    return Text;
} );
