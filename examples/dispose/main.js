( function () {
    'use strict';

    var script = undefined;
    var OSG = undefined;
    var osg = undefined;
    var osgDB = undefined;
    var osgViewer = undefined;
    var $ = window.$;
    var Example = function () {

        this._i = 0;
        this._gui = undefined;
    };

    Example.prototype = {
        initDatGUI: function () {
            if (this._gui !== undefined) return;
            this._gui = new window.dat.GUI();
            this._gui.add( this,'disposeViewer');
            this._gui.add( this,'createViewer');
        },

        disposeViewer : function () {
            if ( this._viewer === null ) return;
            // Remove completely the canvas element.
            console.log('dispose viewer');
            this._viewer.dispose();
            this._viewer = null;
            var id = '#View' +this._i;
            $( id ).remove();
            OSG = undefined;
            osg = undefined;
            osgDB = undefined;
            osgViewer = undefined;
        },

        loadOSG: function (){
            var head= document.getElementsByTagName('head')[0];
            script= document.createElement('script');
            head.appendChild(script);
            script.type= 'text/javascript';
            script.src= '../../builds/active/OSG.js';
        },

        createViewer : function () {
            if (this._viewer !== null ) return;
            // Each view needs to have its own id
            this._i ++;
            
            this.loadOSG();
            var canvas = document.createElement('canvas');
            canvas.id = 'View'+ this._i;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            $('#ViewContainer').append (canvas);
           // $('#View').append (canv );

            this.run( canvas );
        },

        createScene: function () {
            var size = 10;
            return osg.createTexturedQuadGeometry( -size / 2, 0, -size / 2,
                                                              size, 0, 0,
                                                              0, 0, size );
        },

        run: function ( canvas ) {
            OSG = window.OSG;
            osg = OSG.osg;
            osgDB = OSG.osgDB;
            osgViewer = OSG.osgViewer;

            var viewer;
            viewer = new osgViewer.Viewer( canvas, this._osgOptions );
            this._viewer = viewer;
            viewer.init();
            var scene;
            this.initDatGUI();
            scene = this.createScene();
            viewer.setSceneData( scene );
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();
            viewer.run();
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.loadOSG();
        var canvas = $( '#View0' )[ 0 ];
        example.run( canvas );
    }, true );

} )();
