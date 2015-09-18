( function () {
    'use strict';

    // globals
    var P = window.P;
    var $ = window.$;

    // various osg shortcuts
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgShader = OSG.osgShader;
    var osgUtil = OSG.osgUtil;
    var osgDB = OSG.osgDB;
    var osgGA = OSG.osgGA;



    // inherits for the ExampleOSGJS prototype
    var Example = function () {
        // can be overriden with url parm ?&scale=1
        this._config = {
            scale: 0.1
        };
    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {


        initDatGUI: function () {

            // config to let data gui change the scale
            this._gui = new window.dat.GUI();
            // use of scale from config default value or url parm ?&scale=1
            var controller = this._gui.add( this._config, 'scale', 0.1, 2.0 );
            var self = this;
            controller.onChange( function ( value ) {
                // change the matrix
                osg.Matrix.makeScale( value, value, value, self._model.getMatrix() );
                self._model.dirtyBound();
            } );

        }


    } );


    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );

} )();
