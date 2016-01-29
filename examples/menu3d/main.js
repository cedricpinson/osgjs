( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgGA = OSG.osgGA;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var Hammer = window.Hammer;
    var $ = window.$;
    var ExampleOSGJS = window.ExampleOSGJS;

    var items = [ {
        img: 'https://d35krx4ujqgbcr.cloudfront.net/urls/2bf733b0b4794f73a894a656b065b982/thumbnails/bf1796af633a47808ed0f1346d766f20/640.jpeg',
        uid: 'bf733b0b4794f73a894a656b065b982'
    }, {
        img: 'https://d35krx4ujqgbcr.cloudfront.net/urls/1d87504923ef44b9947b425395796ac6/thumbnails/4c7f1ce3391e4f7ca49c9e18d939b2cc/640.jpeg',
        uid: '1d87504923ef44b9947b425395796ac6'
    }, {
        img: 'https://d35krx4ujqgbcr.cloudfront.net/urls/c3effcd7efc8450995384cb9d6518575/thumbnails/6f9876a567c7408dbb3ecedf6c2e8ff0/640.jpeg',
        uid: 'c3effcd7efc8450995384cb9d6518575'
    }, {
        img: 'https://d35krx4ujqgbcr.cloudfront.net/urls/e7c7c7c5e8f74f54a0a35f54c6d6c1f2/thumbnails/381d64afc71e40e6b0f42e6c89593211/640.jpeg',
        uid: 'e7c7c7c5e8f74f54a0a35f54c6d6c1f2'
    }, {
        img: 'https://d35krx4ujqgbcr.cloudfront.net/urls/4ed168c8d59a4d1687ae743bd3fbdfee/thumbnails/0055d3318c774d49b5dbaebf1f7fc205/640.jpeg',
        uid: '4ed168c8d59a4d1687ae743bd3fbdfee'
    }, {
        img: 'https://d35krx4ujqgbcr.cloudfront.net/urls/992ad54c89a343d09fc9d977347fd3c3/thumbnails/e2f513bb5d674f4a9720bd0a28dff2b6/640.jpeg',
        uid: '992ad54c89a343d09fc9d977347fd3c3'
    } ];


    var optionsURL = {};
    ( function ( options ) {
        var vars = [],
            hash;
        var indexOptions = window.location.href.indexOf( '?' );
        if ( indexOptions < 0 ) return;

        var hashes = window.location.href.slice( indexOptions + 1 ).split( '&' );
        for ( var i = 0; i < hashes.length; i++ ) {
            hash = hashes[ i ].split( '=' );
            var element = hash[ 0 ];
            vars.push( element );
            var result = hash[ 1 ];
            if ( result === undefined ) {
                result = '1';
            }
            options[ element ] = result;
        }
    } )( optionsURL );

    var getFirstItemFromIntersectionList = function ( hits ) {

        if ( !hits.length ) return undefined;

        for ( var i = 0, l = hits.length; i < l; i++ ) {
            var np = hits[ i ].nodepath;
            var node = np[ np.length - 1 ];
            if ( node && node.item ) {
                // console.log( hits[i] );
                return hits[ i ];
            }
        }
        return undefined;
    };

    var Example = function () {

        ExampleOSGJS.call( this );

        this._materialHover = new osg.Material();
        this._materialHover.setDiffuse( [ 1, 1, 1, 1 ] );
        this._materialBlur = new osg.Material();

        this._items = [];

    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {


        initHammer: function () {
            // use hammer to control detect double tap on mobile
            var hc = new Hammer.Manager( this._canvas );
            hc.add( new Hammer.Tap( {
                event: 'tap',
                pointers: 1,
                taps: 1,
                time: 250, // def : 250.  Maximum press time in ms.
                interval: 450, // def : 300. Maximum time in ms between multiple taps.
                threshold: 5, // def : 2. While doing a tap some small movement is allowed.
                posThreshold: 50 // def : 30. The maximum position difference between multiple taps.
            } ) );

            hc.on( 'tap', this.pick.bind( this ) );
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

        createCamera: function ( texture ) {
            var size = 1.0;
            var defaultCursorSize = 0.1;
            var camera = new osg.Camera();
            camera.setReferenceFrame( osg.Transform.RELATIVE_RF );
            // camera.setProjectionMatrix( this._viewer.getCamera().getProjectionMatrix() );

            camera.setCullCallback( {
                cull: function ( node, nv ) {
                    osg.Matrix.makeIdentity( nv.getCurrentModelViewMatrix() );
                    // node.setProjectionMatrix( self._viewer.getCamera().getProjectionMatrix() );
                    return true;
                }
            } );

            var mt = new osg.MatrixTransform();
            // osg.Matrix.makeTranslate( 0, 0, 0, mt.getMatrix() );
            camera.addChild( mt );

            var geometry = osg.createTexturedQuadGeometry( -size / 2, -size / 2, 0, size, 0, 0, 0, size, 0 );
            // geometry = osg.createTexturedBoxGeometry( -size/2, -size/2, -size/2, size, size, size );
            // geometry = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );

            geometry.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geometry.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
            // geometry.setBound( new osg.BoundingBox() );

            var scale = new osg.MatrixTransform();

            scale.addUpdateCallback( {
                update: function ( node ) {
                    var scaleCursor = window.cursorSize || defaultCursorSize;
                    osg.Matrix.makeScale( scaleCursor, scaleCursor, scaleCursor, node.getMatrix() );
                    node.dirtyBound();
                    return true;
                }
            } );

            mt.addChild( scale );
            scale.addChild( geometry );

            // var axisMT = new osg.MatrixTransform();
            // axisMT.addChild( osg.createAxisGeometry( 10 ) );
            // mt.addChild( axisMT );
            // window.axisMT = axisMT;

            scale.addChild( geometry );

            geometry.setName( 'Cursor' );

            var UpdateCallback = function () {

                this.update = function ( node ) {
                    osg.Matrix.makeTranslate( 0, 0, -window.translateZ, node.getMatrix() );
                    node.dirtyBound();

                    return true;

                };
            };

            // mt.setCullCallback( new CullCallback() );
            mt.addUpdateCallback( new UpdateCallback() );
            return camera;
        },

        onHover: function ( node ) {
            node.getOrCreateStateSet().setAttributeAndModes( this._materialHover );
        },

        onBlur: function () {
            for ( var i = 0; i < this._items.length; i++ ) {
                this._items[ i ].getOrCreateStateSet().setAttributeAndModes( this._materialBlur );
            }
        },

        // debug scene to show camera in world space
        createCameraGrid: function () {
            var node = new osg.Node();
            node.addChild( osg.createGridGeometry( -10, -10, 0, 20, 0, 0, 0, 20, 0, 10, 10 ) );
            node.addChild( osg.createAxisGeometry( 2 ) );

            var mt = new osg.MatrixTransform();
            var camera = osg.createAxisGeometry( 2 );
            mt.addChild( camera );
            var tg = new osg.MatrixTransform();
            tg.addChild( osg.createTexturedSphere( 0.5 ) );

            var sphere = new osg.MatrixTransform();
            sphere.addChild( osg.createTexturedBox() );
            osg.Matrix.makeTranslate( 0, 5, 5, sphere.getMatrix() );

            node.addChild( tg );
            node.addChild( mt );
            node.addChild( sphere );

            var fps = new FPS();
            fps.setCamera( new osg.Camera() );
            fps.setNode( sphere );
            fps.init();
            fps.setTarget( [ 0, 0, 0 ] );

            mt.addUpdateCallback( {
                update: function () {

                    fps.update();

                    var target = [];
                    fps.getTarget( target );
                    window.camTarget = target;
                    window.camPos = fps.getEyePosition( [] );
                    osg.Matrix.makeTranslate( target[ 0 ], target[ 1 ], target[ 2 ], tg.getMatrix() );
                    osg.Matrix.inverse( fps.getInverseMatrix(), node.getMatrix() );


                    return true;
                }
            } );

            return node;
        },


        // Transform canvas coordinate into webgl coordinate
        canvasCoordToGL: function ( canvasX, canvasY, out ) {
            var canvas = this._canvas;
            var coord = out || [ 0.0, 0.0 ];
            coord[ 0 ] = canvasX * ( canvas.width / canvas.clientWidth );
            coord[ 1 ] = ( canvas.clientHeight - canvasY ) * ( canvas.height / canvas.clientHeight );
            return coord;
        },

        pick: function ( he ) {

            var canvasX = ( he.center.x - $( he.target ).offset().left );
            var canvasY = ( he.center.y - $( he.target ).offset().top );

            var coord = [ 0.0, 0.0 ];
            this.canvasCoordToGL( canvasX, canvasY, coord );

            var hits = this._viewer.computeIntersections( coord[ 0 ], coord[ 1 ] );

            this.onBlur();
            var hit = getFirstItemFromIntersectionList( hits );
            if ( hit ) {
                var node = hit.nodepath[ hit.nodepath.length - 1 ];
                this.onHover( node );
                window.location.hash = node.item.uid;
            }
        },

        hoverPicking: function ( hits ) {

            this.onBlur();
            var hit = getFirstItemFromIntersectionList( hits );
            if ( hit ) {
                var node = hit.nodepath[ hit.nodepath.length - 1 ];
                this.onHover( node );
                return hit;
            }
            return undefined;
        },

        createTexturedQuad: function ( x, y, size, item ) {
            var img = item.img;
            console.log( x + size / 2 );
            var sizey = size / ( 640 / 436 );
            var mt = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( x, 0, y, mt.getMatrix() );

            var geometry = osg.createTexturedQuadGeometry( -size / 2, 0, -sizey / 2, size, 0, 0, 0, 0, sizey );
            if ( img ) {
                osgDB.readImageURL( img, {
                    imageCrossOrigin: true,
                    imageLoadingUsePromise: true
                } ).then( function ( im ) {
                    var texture = osg.Texture.createFromImage( im );
                    geometry.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
                } );
            }

            geometry.getOrCreateStateSet().setAttributeAndModes( new osg.Material() );

            mt.addChild( geometry );
            this._items.push( geometry );
            geometry.item = item;
            return mt;
        },

        enableVR: function ( scene ) {

            var viewer = this._viewer;
            var nodeVR;

            if ( navigator.getVRDevices || navigator.mozGetVRDevices ) {

                viewer.getEventProxy().WebVR.setEnable( true );
                nodeVR = osgUtil.WebVR.createScene( viewer, scene, viewer.getEventProxy().WebVR.getHmd() );

            } else {

                viewer.getEventProxy().DeviceOrientation.setEnable( true );
                nodeVR = osgUtil.WebVRCustom.createScene( viewer, scene, {
                    isCardboard: true,
                    vResolution: this._canvas.height,
                    hResolution: this._canvas.width
                } );
            }

            return nodeVR;
        },


        createScene: function () {

            // the root node
            var scene = new osg.Node();
            scene.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 0 ) );

            var size = 1;
            var sizey = 436 / 640;

            var marge = 0.2;

            var row = 2;

            var nb = items.length / row;
            var startIndex = -( nb / 2 * size + ( nb - 1 ) / 2 * marge );

            var index = 0;
            var i, l;
            for ( var j = 0; j < row; j++ ) {
                for ( i = 0, l = nb; i < l; i++ ) {
                    scene.addChild( this.createTexturedQuad( startIndex + i * ( size + marge ), j * ( sizey + marge * sizey ), size, items[ index ] ) );
                    index++;
                }
            }
            scene.addChild( this.createCamera() );
            // scene.addChild( this.createCameraGrid() );

            var manipulator = new osgGA.FirstPersonManipulator();
            this._manipulator = manipulator;

            var sceneVR = scene;

            if ( optionsURL.webvr ) {

                sceneVR = this.enableVR( scene );
                // setup manipulator
                // disable easing for VR

                manipulator.setDelay( 1.0 );
                // it's not really clear how the controllers are overriding (or not) the
                // delay property of the manipulators
                var ctrls = manipulator._controllerList;
                var ctrlNames = Object.keys( ctrls );
                var nbCtrlNames;
                for ( i = 0, nbCtrlNames = ctrlNames.length; i < nbCtrlNames; ++i ) {
                    var ct = ctrls[ ctrlNames[ i ] ];
                    if ( ct._delay !== undefined )
                        ct._delay = 1.0;
                }

                this._canvas.addEventListener( 'touchstart', this.touch.bind( this ), false );
                this._canvas.addEventListener( 'touchend', this.unTouch.bind( this ), false );

            } else {
                this.initHammer();
            }

            this.getRootNode().addChild( sceneVR );

            manipulator.setNode( scene );
            this._viewer.setManipulator( manipulator );
            scene.setName( 'Scene' );
            var self = this;
            var UpdateCallbackHover = function () {

                var iv = new osgUtil.IntersectionVisitor();
                var lsi = new osgUtil.LineSegmentIntersector();
                iv.setIntersector( lsi );

                this.update = function ( node ) {
                    if ( window.disableRay ) return true;
                    var camera = self._viewer.getCamera();
                    var cameraInverse = osg.Matrix.create();
                    osg.Matrix.inverse( camera.getViewMatrix(), cameraInverse );

                    var eye = [],
                        center = [],
                        up = [];
                    lsi.reset();
                    iv.reset();
                    osg.Matrix.getLookAt( camera.getViewMatrix(), eye, center, up );

                    var dir = osg.Vec3.sub( center, eye, osg.Vec3.create() );
                    osg.Vec3.mult( dir, 1000.0, dir );

                    var start = osg.Vec3.create();
                    var end = osg.Vec3.create();
                    osg.Matrix.transformVec3( cameraInverse, osg.Vec3.zero, start );
                    osg.Matrix.transformVec3( cameraInverse, [ 0, 0, -1000 ], end );
                    lsi.set( eye, dir );
                    lsi.set( start, end );

                    node.accept( iv );

                    var hit = self.hoverPicking( lsi.getIntersections() );
                    if ( hit ) {
                        var tmp = osg.Vec3.create();
                        osg.Vec3.sub( end, start, tmp );
                        osg.Vec3.mult( tmp, hit.ratio, tmp );
                        window.translateZ = Math.min( Math.max( osg.Vec3.length( tmp ), 1.0 ), 4.0 );
                    }

                    return true;
                };
            };
            scene.addUpdateCallback( new UpdateCallbackHover() );
        }


    } );

    window.addEventListener( 'load', function () {

        // convenient to debug on mobile
        window.print = function ( str ) {
            $( '#orientation' )[ 0 ].innerHTML = str;
        };

        var example = new Example();
        example.run();
        window.example = example;

        window.cameraPos = function () {
            example._items.forEach( function ( i ) {
                i.dirtyBound();
            } );

            var v = example._viewer;
            // v.getManipulator().computeHomePosition( true );
            var t = [];
            v.getManipulator().getTarget( t );
            console.log( t );
            v.getManipulator().getEyePosition( t );
            console.log( t );

        };
    }, true );

} )();
