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
     *  Notes: The OSGjs Text has been implemented like OSG osgText::Text as much as possible. However there are some
     *  things that should be noted:
     *  - This Text is far more simple than OSG ones, it only supports basic functionality.
     *  - In contrast to OSG, Text inherits from MatrixTransform in osgjs.
     *  - Supported fonts are not the same in HTML than in OSG/C++.
     *  - Vertical layout is not supported right now.
     *  - BaseLine alignments are not supported, instead they are converted to supported ones if parsing a osgjs file.
     *  - Set the color in the range [ 0 - 1 ], as if you were working with OSG.
     *  - Texts are generated as a canvas 2D texture sticked in a quad. The size of the texture is the next power of two of the current size of the
     *    text so the bigger is your characterSize, the more memory it will consume.
     *  - The only supported CharacterSizeMode is OBJECT_COORDS, others should be addresed in the future.
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
        this._context.textAlign = 'center';
        this._textX = undefined;
        // This determines the baseline of the text, e.g. top, middle, bottom
        this._context.baseLine = 'middle';
        this._textY = undefined;
        // Size of the textured quad in meters.
        this._charactherSize = 1;
        // Font resolution
        this._fontSize = 32;
        this._geometry = undefined;
        this._autoRotateToScreen = false;
        this._position = Vec3.create();
        this._layout = Text.LEFT_TO_RIGHT;
        this._alignment = Text.CENTER_CENTER;
        // Lazy initialization
        this.drawText();
        this._dirty = false;
    };

    // Layout enum
    Text.LEFT_TO_RIGHT = 'ltr';
    Text.RIGHT_TO_LEFT = 'rtl';

    // Alignment enum
    Text.LEFT_TOP = 0;
    Text.LEFT_CENTER = 1;
    Text.LEFT_BOTTOM = 2;

    Text.CENTER_TOP = 3;
    Text.CENTER_CENTER = 4;
    Text.CENTER_BOTTOM = 5;

    Text.RIGHT_TOP = 6;
    Text.RIGHT_CENTER = 7;
    Text.RIGHT_BOTTOM = 8;

    /** @lends Text.prototype */
    Text.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( MatrixTransform.prototype, {

        drawText: function () {
            if ( this._geometry !== undefined ) {
                this.removeChild( this._geometry );
                // The text could be dynamic, so we need to remove GL objects
                this._geometry.releaseGLObjects();
            }
            this.setTextProperties();
            this._canvas.width = this._context.measureText( this._text ).width;
            this._canvas.height = this._fontSize * 2;
            // We need to set the text properties again, as the canvas size could change.
            this.setTextProperties();
            this._context.clearRect( 0, 0, this._canvas.width, this._canvas.height );
            this._context.fillText( this._text, this._textX, this._textY );
            //this._context.fillRect( 0, 0, this._canvas.width, this._canvas.height );
            // Right now we set the pivot point to center, to assure the bounding box is correct when rendering billboards.
            // TODO: Possibility to set different pivot point so we can have missing alignments.
            var aspectRatio = this._canvas.width / this._canvas.height;
            var quadWidth = this._charactherSize * aspectRatio;
            this._geometry = Shape.createTexturedQuadGeometry( -quadWidth / 2, -this._charactherSize / 2, 0, quadWidth, 0, 0, 0, this._charactherSize, 0 );
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
            // Convert color to html range
            this._fillStyle = 'rgba(' + Math.round( color[ 0 ] * 255 ) + ',' + Math.round( color[ 1 ] * 255 ) + ',' + Math.round( color[ 2 ] * 255 ) + ',' + color[ 3 ] + ')';
            this._context.fillStyle = this._fillStyle;
            // Canvas size does not change so we don't need to redo the quad.
            this._context.fillText( this._text, this._textX, this._textY );
        },

        getColor: function () {
            return this._color;
        },

        setCharacterSize: function ( size ) {
            this._charactherSize = size;
            this._dirty = true;
        },

        getCharacterSize: function () {
            return this._charactherSize;
        },

        setFontResolution: function ( resolution ) {
            this._fontSize = resolution;
            this._dirty = true;
        },

        getFontResolution: function () {
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
            this._setAlignmentValues( this._alignment );
            this._context.font = this._fontSize + 'px ' + this._font;
            this._context.direction = this._layout;
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
            this._dirty = true;
        },

        getAutoRotateToScreen: function () {
            return this._autoRotateToScreen;
        },

        setLayout: function ( layout ) {
            if ( typeof layout === 'string' ) {
                this._layout = Text[ layout ];
            } else {
                this._layout = layout;
            }
            this._dirty = true;
        },
        getLayout: function () {
            return this._layout;
        },
        setAlignment: function ( alignment ) {
            if ( typeof alignment === 'string' ) {
                this._alignment = Text[ alignment ];
            } else {
                this._alignment = alignment;
            }
            this._dirty = true;
        },
        getAlignment: function () {
            return this._alignment;
        },
        traverse: function ( visitor ) {
            if ( this._dirty ) {
                this.drawText();
                this._dirty = false;
            }
            MatrixTransform.prototype.traverse.call( this, visitor );
        },

        _setAlignmentValues: function ( alignment ) {
            // Convert the OSG Api to js API
            switch ( alignment ) {
            case Text.LEFT_TOP:
                this._context.textAlign = 'left';
                this._textX = 0;
                this._context.textBaseline = 'top';
                this._textY = 0;
                break;
            case Text.LEFT_CENTER:
                this._context.textAlign = 'left';
                this._textX = 0;
                this._context.textBaseline = 'middle';
                this._textY = this._canvas.height / 2;
                break;
            case Text.LEFT_BOTTOM:
                this._context.textAlign = 'left';
                this._textX = 0;
                this._context.textBaseline = 'bottom';
                this._textY = this._canvas.height;
                break;
            case Text.CENTER_TOP:
                this._context.textAlign = 'center';
                this._textX = this._canvas.width / 2;
                this._context.textBaseline = 'top';
                this._textY = 0;
                break;
            case Text.CENTER_CENTER:
                this._context.textAlign = 'center';
                this._textX = this._canvas.width / 2;
                this._context.textBaseline = 'middle';
                this._textY = this._canvas.height / 2;
                break;
            case Text.CENTER_BOTTOM:
                this._context.textAlign = 'center';
                this._textX = this._canvas.width / 2;
                this._context.textBaseline = 'bottom';
                this._textY = this._canvas.height;
                break;
            case Text.RIGHT_TOP:
                this._context.textAlign = 'right';
                this._textX = this._canvas.width;
                this._context.textBaseline = 'top';
                this._textY = 0;
                break;
            case Text.RIGHT_CENTER:
                this._context.textAlign = 'right';
                this._textX = this._canvas.width;
                this._context.textBaseline = 'middle';
                this._textY = this._canvas.height / 2;
                break;
            case Text.RIGHT_BOTTOM:
                this._context.textAlign = 'right';
                this._textX = this._canvas.width;
                this._context.textBaseline = 'bottom';
                this._textY = this._canvas.height;
                break;
            }
        },
        _nextPowerOfTwo: function ( v ) {
            v--;
            v |= v >> 1;
            v |= v >> 2;
            v |= v >> 4;
            v |= v >> 8;
            v |= v >> 16;
            v++;
            return v;
        }
    } ), 'osgText', 'Text' );

    return Text;
} );
