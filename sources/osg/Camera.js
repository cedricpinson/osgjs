define( [
    'osg/Utils',
    'osg/Transform',
    'osg/CullSettings',
    'osg/Matrix',
    'osg/TransformEnums'
], function ( MACROUTILS, Transform, CullSettings, Matrix, TransformEnums ) {

    /**
     * Camera - is a subclass of Transform which represents encapsulates the settings of a Camera.
     * @class Camera
     * @inherits Transform CullSettings
     */
    var Camera = function () {
        Transform.call( this );
        CullSettings.call( this );

        this.viewport = undefined;
        this._graphicContext = undefined;
        this.setClearColor( [ 0, 0, 0, 1.0 ] );
        this.setClearDepth( 1.0 );

        /*jshint bitwise: false */
        this.setClearMask( Camera.COLOR_BUFFER_BIT | Camera.DEPTH_BUFFER_BIT );
        /*jshint bitwise: true */

        this.tmpMatrix = Matrix.create();
        this.modelMatrix = Matrix.makeIdentity( [] );
        this.setViewMatrix( Matrix.create() );
        this.setProjectionMatrix( Matrix.create() );
        this.renderOrder = Camera.NESTED_RENDER;
        this.renderOrderNum = 0;
    };

    Camera.PRE_RENDER = 0;
    Camera.NESTED_RENDER = 1;
    Camera.POST_RENDER = 2;

    Camera.COLOR_BUFFER_BIT = 0x00004000;
    Camera.DEPTH_BUFFER_BIT = 0x00000100;
    Camera.STENCIL_BUFFER_BIT = 0x00000400;

    /** @lends Camera.prototype */
    Camera.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit(
        CullSettings.prototype,
        MACROUTILS.objectInehrit( Transform.prototype, {

            setGraphicContext: function ( gc ) {
                this._graphicContext = gc;
            },
            getGraphicContext: function () {
                return this._graphicContext;
            },
            setClearDepth: function ( depth ) {
                this.clearDepth = depth;
            },
            getClearDepth: function () {
                return this.clearDepth;
            },

            setClearMask: function ( mask ) {
                this.clearMask = mask;
            },
            getClearMask: function () {
                return this.clearMask;
            },

            setClearColor: function ( color ) {
                this.clearColor = color;
            },
            getClearColor: function () {
                return this.clearColor;
            },

            setViewport: function ( vp ) {
                this.viewport = vp;
                this.getOrCreateStateSet().setAttributeAndMode( vp );
            },
            getViewport: function () {
                return this.viewport;
            },


            setViewMatrix: function ( matrix ) {
                this.modelviewMatrix = matrix;
                this.viewMatrix = matrix;
                Matrix.inverse( matrix, this.modelMatrix );
            },
            getViewMatrix: function () {
                return this.viewMatrix;
            },
            getModelMatrix: function () {
                return this.modelMatrix;
            },
            setModelMatrix: function ( matrix ) {
                this.modelMatrix = matrix;
            },
            updateMatrices: function () {
                this.modelviewMatrix = this.viewMatrix;
                Matrix.inverse( this.viewMatrix, this.modelMatrix );
            },

            setProjectionMatrix: function ( matrix ) {
                this.projectionMatrix = matrix;
            },

            /** Set to an orthographic projection. See OpenGL glOrtho for documentation further details.*/
            setProjectionMatrixAsOrtho: function ( left, right,
                bottom, top,
                zNear, zFar ) {
                Matrix.makeOrtho( left, right, bottom, top, zNear, zFar, this.getProjectionMatrix() );
            },

            getProjectionMatrix: function () {
                return this.projectionMatrix;
            },
            getRenderOrder: function () {
                return this.renderOrder;
            },
            setRenderOrder: function ( order, orderNum ) {
                this.renderOrder = order;
                this.renderOrderNum = orderNum;
            },

            attachTexture: function ( bufferComponent, texture, level ) {
                if ( this.frameBufferObject ) {
                    this.frameBufferObject.dirty();
                }
                if ( level === undefined ) {
                    level = 0;
                }
                if ( this.attachments === undefined ) {
                    this.attachments = {};
                }
                this.attachments[ bufferComponent ] = {
                    'texture': texture,
                    'level': level
                };
            },

            attachRenderBuffer: function ( bufferComponent, internalFormat ) {
                if ( this.frameBufferObject ) {
                    this.frameBufferObject.dirty();
                }
                if ( this.attachments === undefined ) {
                    this.attachments = {};
                }
                this.attachments[ bufferComponent ] = {
                    'format': internalFormat
                };
            },

            computeLocalToWorldMatrix: function ( matrix ) {
                if ( this.referenceFrame === Transform.RELATIVE_RF ) {
                    Matrix.preMult( matrix, this.modelMatrix );
                } else { // absolute
                    matrix = this.modelMatrix;
                }
                return true;
            },

            computeWorldToLocalMatrix: function ( matrix ) {
                var inverse = this.tmpMatrix;
                Matrix.inverse( this.modelMatrix, inverse );
                if ( this.referenceFrame === Transform.RELATIVE_RF ) {
                    Matrix.postMult( inverse, matrix );
                } else {
                    matrix = inverse;
                }
                return true;
            }


        } ) ), 'osg', 'Camera' );

    MACROUTILS.setTypeID( Camera );

    return Camera;
} );
