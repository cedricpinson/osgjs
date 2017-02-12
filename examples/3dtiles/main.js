( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var ExampleOSGJS = window.ExampleOSGJS;

    var modelURL = '../media/models/3DTiles/tileset.json.3dt';
    var databasePath = '../media/models/3DTiles/';

    var Example = function () {
        this._viewer = undefined;
        this._canvas = undefined;
        this._rootNode = new osg.Node();
    };
    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        run: function () {
            // The 3D canvas.
            this._canvas = document.getElementById( 'View' );
            // The viewer
            this._viewer = new osgViewer.Viewer( this._canvas, {
                'enableFrustumCulling': true
            } );
            this._viewer.init();
            this._viewer.setupManipulator();

            var tiledmodelPromise = osgDB.readNodeURL( modelURL, {
                databasePath: databasePath
            } );
            var self = this;
            tiledmodelPromise.then( function ( tiledmodel ) {
                var mt = new osg.MatrixTransform();
                osg.mat4.fromRotation( mt.getMatrix(), Math.PI / 2.0, osg.vec3.fromValues( 1, 0, 0 ) );
                mt.addChild( tiledmodel );
                self._rootNode.addChild( mt );
                self._viewer.getManipulator().computeHomePosition();
            } );

            this._viewer.setSceneData( this._rootNode );
            this._viewer.run();
        }
    } );

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );
} )();
