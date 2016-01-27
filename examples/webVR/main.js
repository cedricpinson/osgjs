( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var osgGA = OSG.osgGA;
    var ExampleOSGJS = window.ExampleOSGJS;
    var Hammer = window.Hammer;
    var $ = window.$;

    var Example = function () {

        ExampleOSGJS.call( this );

        $( '#button-enter-fullscreen' ).click( function () {
            this.requestFullScreenVR();
        }.bind( this ) );

        $( '#button-exit-fullscreen' ).click( function () {
            this.exitFullScreenVR();
        }.bind( this ) );

    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        run: function () {

            ExampleOSGJS.prototype.run.call( this );

            if ( window.screenfull ) {
                document.addEventListener( window.screenfull.raw.fullscreenchange, function () {
                    console.log( 'toggle VR mode' );
                    this.toggleVR();
                }.bind( this ) );
            }

        },

        toggleVR: function () {

            var viewer = this._viewer;

            viewer.setPresentVR( !this._vrState );

            // Enable VR
            if ( !this._vrState ) {

                // Detach the model from scene and cache it
                this.getRootNode().removeChild( this._modelNode );

                // If no vrNode (first time vr is toggled), create one
                // The modelNode will be attached to it
                if ( !this._vrNode ) {
                    if ( navigator.getVRDisplays ) {

                        viewer.getEventProxy().WebVR.setEnable( true );
                        this._vrNode = osgUtil.WebVR.createScene( viewer, this._modelNode, viewer._eventProxy.WebVR.getHmd() );

                    } else {

                        viewer.getEventProxy().DeviceOrientation.setEnable( true );
                        this._vrNode = osgUtil.WebVRCustom.createScene( viewer, this._modelNode, {
                            isCardboard: true,
                            vResolution: this._canvas.height,
                            hResolution: this._canvas.width
                        } );

                    }
                }

                // Attach the vrNode to scene instead of the model
                this.getRootNode().addChild( this._vrNode );

                $( '#button-enter-fullscreen' ).hide();
                $( '#button-exit-fullscreen' ).show();
            } else {

                // Disable VR
                viewer._eventProxy.WebVR.setEnable( false );
                viewer._eventProxy.DeviceOrientation.setEnable( false );
                // Detach the vrNode and reattach the modelNode
                this.getRootNode().removeChild( this._vrNode );
                this.getRootNode().addChild( this._modelNode );

                $( '#button-enter-fullscreen' ).show();
                $( '#button-exit-fullscreen' ).hide();
            }

            this._vrState = !this._vrState;
        },

        requestFullScreenVR: function () {

            if ( !navigator.getVRDisplays && window.screenfull ) {
                window.screenfull.request( this._canvas );

            } else {
                // no fullscreen use the canvas or webvr
                this.toggleVR();
            }

            $( '#button-enter-fullscreen' ).hide();
            $( '#button-exit-fullscreen' ).show();
        },

        exitFullScreenVR: function () {

            if ( !navigator.getVRDisplays && window.screenfull ) {
                window.screenfull.exit();
            } else {
                this.toggleVR();
            }
        },

        initFullscreenEvent: function () {

            if ( window.screenfull && window.screenfull.enabled ) {
                document.addEventListener( window.screenfull.raw.fullscreenchange, function () {
                    console.log( 'Am I fullscreen? ' + ( window.screenfull.isFullscreen ? 'Yes' : 'No' ) );
                    this.toggleVR();
                } );
            }
        },

        createScene: function () {

            var root = new osg.MatrixTransform();
            this._modelNode = root;
            osg.Matrix.makeRotate( Math.PI, 0, 0, 1, root.getMatrix() );

            osgDB.readNodeURL( '../media/models/material-test/file.osgjs' ).then( function ( model ) {
                root.addChild( model );

                // setup manipulator
                // disable easing for VR
                var manipulator = this._viewer.getManipulator();

                manipulator.setDelay( 1.0 );
                // it's not really clear how the controllers are overriding (or not) the
                // delay property of the manipulators
                var ctrls = manipulator._controllerList;
                var ctrlNames = Object.keys( ctrls );
                for ( var i = 0, nbCtrlNames = ctrlNames.length; i < nbCtrlNames; ++i ) {
                    var ct = ctrls[ ctrlNames[ i ] ];
                    if ( ct._delay !== undefined )
                        ct._delay = 1.0;
                }

                manipulator.setNode( root );
                manipulator.computeHomePosition();

            }.bind( this ) );

            this.getRootNode().addChild( root );
            this._manipulator = new osgGA.FirstPersonManipulator();
            this._viewer.setManipulator( this._manipulator );

            this.initTouch();

        },

        touch: function ( e ) {
            // assume the first touch in the 1/4 of the top canvas is a google cardboard touch
            console.log( 'cardboard touch' );
            this._manipulator.getForwardInterpolator().setTarget( 1 );
        },

        unTouch: function ( e ) {
            console.log( 'cardboard unTouch' );
            this._manipulator.getForwardInterpolator().setTarget( 0 );
        },

        initTouch: function () {
            this._canvas.addEventListener( 'touchstart', this.touch.bind( this ), false );
            this._canvas.addEventListener( 'touchend', this.unTouch.bind( this ), false );
        }

    } );

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
        window.example = example;
    }, true );

} )();
