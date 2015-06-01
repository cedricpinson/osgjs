( function () {
    'use strict';

    var viewer;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgGA = OSG.osgGA;
    var osgViewer = OSG.osgViewer;

    // contructor that will generate random camera around a target
    var CameraSwitcher = function ( nb, center, range ) {
        this._camera = [];
        if ( nb !== undefined &&
            center !== undefined &&
            range !== undefined ) {
            this.createRandomCamera( nb, center, range );
        }
    };
    CameraSwitcher.prototype = {
        createRandomCamera: function ( nb, center, range ) {
            var camera = [];
            for ( var x = 0; x < nb; x++ ) {
                var vec = [ ( Math.random() - 0.5 ) * range[ 0 ], ( Math.random() - 0.5 ) * range[ 1 ], ( Math.random() - 0.5 ) * range[ 2 ] ];
                var position = osg.Vec3.add( center, vec, [] );
                camera.push( {
                    'position': position,
                    'target': osg.Vec3.copy( center, [] ),
                    'duration': 4.0
                } );
            }
            this._camera = camera;
            return camera;
        },

        update: function ( nv ) {

            var t = nv.getFrameStamp().getSimulationTime();
            if ( this._lastUpdate === undefined ) {
                this._lastUpdate = t;
            }

            if ( this._currentCamera === undefined ) {
                this._currentCamera = 0;
            }

            var delta = t - this._lastUpdate;
            // current camera index
            var camera = this._currentCamera;
            // current camera duration
            var duration = this._camera[ camera ].duration;

            // need to change camera ?
            if ( delta > duration ) {
                // set the next current camera
                this._currentCamera = ( this._currentCamera + 1 ) % this._camera.length;

                // fix delta to new camera
                delta = delta - duration;
                duration = this._camera[ this._currentCamera ].duration;
                this._lastUpdate = t;
            }

            // compute lerp position and target
            var srcPosition = this._camera[ this._currentCamera ].position;
            var dstPosition = this._camera[ ( this._currentCamera + 1 ) % this._camera.length ].position;

            var srcTarget = this._camera[ this._currentCamera ].target;
            var dstTarget = this._camera[ ( this._currentCamera + 1 ) % this._camera.length ].target;
            var frac = delta / duration;
            var currentPosition = osg.Vec3.lerp( frac, srcPosition, dstPosition, [] );
            var currentTarget = osg.Vec3.lerp( frac, srcTarget, dstTarget, [] );

            this._currentPosition = currentPosition;
            this._currentTarget = currentTarget;
        },

        getCurrentPosition: function () {
            return this._currentPosition;
        },
        getCurrentTarget: function () {
            return this._currentTarget;
        }

    };




    var main = function () {


        function createScene() {
            var group = new osg.Node();

            var size = 50;
            var ground = osg.createTexturedBox( 0, 0, 0, size, size, size );

            group.addChild( ground );
            group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

            return group;
        }



        var canvas = document.getElementById( 'View' );

        var manipulator = new osgGA.OrbitManipulator();
        manipulator._cameraSwitcher = new CameraSwitcher( 10, [ 0, 0, 0 ], [ 2000, 20, 2000 ] );
        manipulator.update = function ( nv ) {
            this._cameraSwitcher.update( nv );

            osg.Matrix.makeLookAt(
                this._cameraSwitcher.getCurrentPosition(), // eye
                this._cameraSwitcher.getCurrentTarget(), // center
                [ 0, 1, 0 ], // up
                this._inverseMatrix
            );
        };

        viewer = new osgViewer.Viewer( canvas, {
            antialias: true,
            alpha: true
        } );
        viewer.init();
        viewer.setupManipulator( manipulator );
        var rotate = new osg.MatrixTransform();
        rotate.addChild( createScene() );
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        viewer.setSceneData( rotate );
        viewer.getManipulator().computeHomePosition();

        viewer.run();

    };

    window.addEventListener( 'load', main, true );

} )();
