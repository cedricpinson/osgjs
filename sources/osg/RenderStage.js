define( [
    'osg/Utils',

    'osg/Camera',
    'osg/FrameBufferObject',
    'osg/Notify',
    'osg/RenderBin',

], function ( MACROUTILS, Camera, FrameBufferObject, Notify, RenderBin ) {

    'use strict';

    /**
     * From OpenSceneGraph http://www.openscenegraph.org
     * RenderStage base class. Used for encapsulate a complete stage in
     * rendering - setting up of viewport, the projection and model
     * matrices and rendering the RenderBin's enclosed with this RenderStage.
     * RenderStage also has a dependency list of other RenderStages, each
     * of which must be called before the rendering of this stage.  These
     * 'pre' rendering stages are used for advanced rendering techniques
     * like multistage pixel shading or impostors.
     */
    var RenderStage = function () {
        RenderBin.call( this );
        this.positionedAttribute = [];
        this.clearDepth = 1.0;
        this.clearColor = [ 0.0, 0.0, 0.0, 1.0 ];
        /*jshint bitwise: false */
        this.clearMask = Camera.COLOR_BUFFER_BIT | Camera.DEPTH_BUFFER_BIT;
        /*jshint bitwise: true */
        this.camera = undefined;
        this.viewport = undefined;
        this.preRenderList = [];
        this.postRenderList = [];
        this._renderStage = this;
    };

    RenderStage.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( RenderBin.prototype, {
        reset: function () {
            RenderBin.prototype.reset.call( this );
            this.preRenderList.length = 0;
            this.postRenderList.length = 0;
        },
        setClearDepth: function ( depth ) {
            this.clearDepth = depth;
        },
        getClearDepth: function () {
            return this.clearDepth;
        },
        setClearColor: function ( color ) {
            this.clearColor = color;
        },
        getClearColor: function () {
            return this.clearColor;
        },
        setClearMask: function ( mask ) {
            this.clearMask = mask;
        },
        getClearMask: function () {
            return this.clearMask;
        },
        setViewport: function ( vp ) {
            this.viewport = vp;
        },
        getViewport: function () {
            return this.viewport;
        },
        setCamera: function ( camera ) {
            this.camera = camera;
        },
        addPreRenderStage: function ( rs, order ) {
            for ( var i = 0, l = this.preRenderList.length; i < l; i++ ) {
                var render = this.preRenderList[ i ];
                if ( order < render.order ) {
                    break;
                }
            }
            if ( i < this.preRenderList.length ) {
                this.preRenderList = this.preRenderList.splice( i, 0, {
                    'order': order,
                    'renderStage': rs
                } );
            } else {
                this.preRenderList.push( {
                    'order': order,
                    'renderStage': rs
                } );
            }
        },
        addPostRenderStage: function ( rs, order ) {
            for ( var i = 0, l = this.postRenderList.length; i < l; i++ ) {
                var render = this.postRenderList[ i ];
                if ( order < render.order ) {
                    break;
                }
            }
            if ( i < this.postRenderList.length ) {
                this.postRenderList = this.postRenderList.splice( i, 0, {
                    'order': order,
                    'renderStage': rs
                } );
            } else {
                this.postRenderList.push( {
                    'order': order,
                    'renderStage': rs
                } );
            }
        },

        drawPreRenderStages: function ( state, previousRenderLeaf ) {
            var previousLeaf = previousRenderLeaf;
            for ( var i = 0, l = this.preRenderList.length; i < l; ++i ) {
                var sg = this.preRenderList[ i ].renderStage;
                previousLeaf = sg.draw( state, previousLeaf );
            }
            return previousLeaf;
        },

        draw: function ( state, previousRenderLeaf ) {
            var previousLeaf = this.drawPreRenderStages( state, previousRenderLeaf );
            previousLeaf = this.drawImplementation( state, previousLeaf );

            previousLeaf = this.drawPostRenderStages( state, previousLeaf );
            return previousLeaf;
        },

        sort: function () {
            for ( var i = 0, l = this.preRenderList.length; i < l; ++i ) {
                this.preRenderList[ i ].renderStage.sort();
            }

            RenderBin.prototype.sort.call( this );

            for ( var j = 0, k = this.postRenderList.length; j < k; ++j ) {
                this.postRenderList[ j ].renderStage.sort();
            }
        },

        drawPostRenderStages: function ( state, previousRenderLeaf ) {
            var previousLeaf = previousRenderLeaf;
            for ( var i = 0, l = this.postRenderList.length; i < l; ++i ) {
                var sg = this.postRenderList[ i ].renderStage;
                previousLeaf = sg.draw( state, previousLeaf );
            }
            return previousLeaf;
        },

        applyCamera: function ( state ) {
            var gl = state.getGraphicContext();
            if ( this.camera === undefined ) {
                gl.bindFramebuffer( gl.FRAMEBUFFER, null );
                return;
            }
            var viewport = this.camera.getViewport();
            var fbo = this.camera.frameBufferObject;

            if ( !fbo ) {
                fbo = new FrameBufferObject();
                this.camera.frameBufferObject = fbo;
            }

            if ( fbo.isDirty() ) {

                var attachments = this.camera.getAttachments();
                // we should use a map in camera to avoid to regenerate the keys
                // each time. But because we dont have a lot of camera I guess
                // it does not change a lot
                var keys = Object.keys( attachments );

                if ( keys.length ) {

                    for ( var i = 0, l = keys.length; i < l; i++ ) {
                        var key = keys[ i ];
                        var a = attachments[ key ];

                        var attach = {};
                        attach.attachment = a.attachment;

                        if ( a.texture === undefined ) { //renderbuffer

                            attach.format = a.format;
                            attach.width = viewport.width();
                            attach.height = viewport.height();

                        } else if ( a.texture !== undefined ) {

                            attach.texture = a.texture;
                            attach.textureTarget = a.textureTarget;

                            if ( a.format ) {
                                attach.format = a.format;
                            }
                        }

                        fbo.setAttachment( attach );
                    }
                }
            }
            fbo.apply( state );
        },

        drawImplementation: function ( state, previousRenderLeaf ) {
            var gl = state.getGraphicContext();

            this.applyCamera( state );

            if ( this.viewport === undefined ) {
                Notify.log( 'RenderStage does not have a valid viewport' );
            }

            state.applyAttribute( this.viewport );

            /*jshint bitwise: false */
            if ( this.clearMask & gl.COLOR_BUFFER_BIT ) {
                gl.clearColor( this.clearColor[ 0 ], this.clearColor[ 1 ], this.clearColor[ 2 ], this.clearColor[ 3 ] );
            }
            if ( this.clearMask & gl.DEPTH_BUFFER_BIT ) {
                gl.depthMask( true );
                gl.clearDepth( this.clearDepth );
            }
            /*jshint bitwise: true */

            gl.clear( this.clearMask );

            if ( this.positionedAttribute ) {
                this.applyPositionedAttribute( state, this.positionedAttribute );
            }

            var previousLeaf = RenderBin.prototype.drawImplementation.call( this, state, previousRenderLeaf );

            return previousLeaf;
        }
    } ), 'osg', 'RenderStage' );

    return RenderStage;

} );
