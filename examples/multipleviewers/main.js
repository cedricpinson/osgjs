( function () {
    'use strict';

    var $ = window.$;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgViewer = OSG.osgViewer;
    var Example = function () {
        this._viewer1 = undefined;
        this._viewer2 = undefined;
    };

    Example.prototype = {

        createScene1: function () {
            var node = new osg.MatrixTransform();
            var request = osgDB.readNodeURL( '../media/models/raceship.osgjs' );
            request.then( function ( model ) {

                node.addChild( model );
                this._viewer1.getManipulator().computeHomePosition();
            }.bind( this ) );
            return node;
        },
        createScene2: function () {
            var node = new osg.MatrixTransform();
            osg.Matrix.makeRotate( -Math.PI, 0, 0, 1, node.getMatrix() );

            var request = osgDB.readNodeURL( '../media/models/material-test/file.osgjs' );
            request.then( function ( model ) {
                model.getOrCreateStateSet().setTextureAttributeAndModes( 0, osg.Texture.createFromURL( '../media/textures/seamless/grunge1.jpg' ) );
                node.addChild( model );
                this._viewer2.getManipulator().computeHomePosition();
            }.bind( this ) );
            return node;

        },
        run: function ( canvas1, canvas2 ) {
            this._viewer1 = new osgViewer.Viewer( canvas1 );
            this._viewer2 = new osgViewer.Viewer( canvas2 );
            this._viewer1.init();
            this._viewer2.init();
            var scene1 = this.createScene1();
            var scene2 = this.createScene2();
            this._viewer1.setSceneData( scene1 );
            this._viewer1.setupManipulator();
            this._viewer1.getManipulator().computeHomePosition();
            this._viewer1.run();
            this._viewer2.setSceneData( scene2 );
            this._viewer2.setupManipulator();
            this._viewer2.getManipulator().computeHomePosition();
            this._viewer2.run();
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas1 = $( '#View1' )[ 0 ];
        var canvas2 = $( '#View2' )[ 0 ];
        example.run( canvas1, canvas2 );
    }, true );

} )();
