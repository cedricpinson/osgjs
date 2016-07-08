'use strict';

var OSG = window.OSG;
OSG.globalify();
var osg = OSG.osg;
var osgDB = OSG.osgDB;
var osgViewer = OSG.osgViewer;
var P = window.P;

var main = function () {
    // from require to global var
    console.log( 'osg ready' );

    var rootModelNode = new osg.MatrixTransform();
    rootModelNode.setMatrix( osg.mat4.fromRotation( osg.mat4.create(), Math.PI / 2, [ 1, 0, 0 ] ) );

    function getModelJsonp( modelName, cbFocusCamera ) {
        var urlModel;
        switch ( modelName ) {
        case 'mickey':
            urlModel = 'http://osgjs.org/examples/pointcloud/' + modelName + '.osgjs';
            break;
        case 'pokerscene':
            urlModel = 'http://osgjs.org/examples/pokerscene/' + modelName + '.js';
            break;
        case 'ogre':
            urlModel = 'http://osgjs.org/examples/shadow/' + modelName + '.osgjs';
            break;
        }

        var loadModel = function ( url ) {
            console.log( 'loading ' + url );

            var s = document.createElement( 'script' );
            s.onload = function () {
                var NodeModel;
                switch ( modelName ) {
                case 'mickey':
                    NodeModel = window.getModel();
                    break;
                case 'pokerscene':
                    NodeModel = window.getPokerScene();
                    break;
                case 'ogre':
                    NodeModel = window.getOgre();
                    break;
                }

                var promise = osgDB.parseSceneGraph( NodeModel );
                P.resolve( promise ).then( function ( child ) {
                    rootModelNode.removeChildren();
                    rootModelNode.addChild( child );
                    cbFocusCamera();
                    console.log( 'success ' + url );
                } );

                document.body.removeChild( s );
            };

            s.onerror = function () {
                osg.log( 'error ' + url );
            };

            s.type = 'text/javascript';
            s.src = url;
            document.body.appendChild( s );
        };

        console.log( 'osgjs loading: ' + modelName );
        loadModel( urlModel );
        return rootModelNode;
    }

    function createScene( cbFocusCamera ) {
        var scene = new osg.Node();

        getModelJsonp( 'ogre', cbFocusCamera );

        scene.addChild( rootModelNode );

        //gui stuffs
        var modelsUI = document.getElementById( 'models' );

        modelsUI.onchange = function () {
            var modelName = this.options[ this.selectedIndex ].value;
            getModelJsonp( modelName, cbFocusCamera );
            cbFocusCamera();
        };

        return scene;
    }

    // The 3D canvas.
    var canvas = document.getElementById( '3DView' );
    var viewer;

    var cbFocusCamera = function () {
        viewer.getManipulator().computeHomePosition();
    };
    /*
      var mainNode = new osg.Node();
      lightnew = new osg.Light();
      mainNode.light = lightnew;
      mainNode.addChild(group);
    viewer.setLight(lightnew);
    */
    // The viewer
    viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.getCamera().setClearColor( [ 0.3, 0.3, 0.3, 0.3 ] );
    viewer.setSceneData( createScene( cbFocusCamera ) );
    viewer.setupManipulator();
    viewer.run();
};

window.addEventListener( 'load', main, true );
