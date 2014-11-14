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
        this._firstTime = true;
    };

    Example.prototype = {
        initDatGUI: function () {
            var gui = new window.dat.GUI();
            gui.add( this,'dispose');
            gui.add( this,'create');
        },

        dispose : function () {
            if ( this._viewer === null ) return;
            console.log('dispose viewer');
            this._viewer.dispose();
            this._viewer = null;
            var id = '#View' +this._i;
            $( id ).remove();
            
            // var head = document.getElementsByTagName('head')[0];
            // head.removeChild(script);
            OSG = undefined;
            osg = undefined;
            osgDB = undefined;
            osgViewer = undefined;
            // // window.OSG = null;
            // window.OSG = null;
            // OSG = null;
            // osg.osgShader = null;
            // osg = null;
            // osgDB = null;
            // osgViewer = null;

            // window.osg = null;
            // window.osgUtil = null;
            // window.osgShader = null;
        },

        loadOSG: function (){
            var head= document.getElementsByTagName('head')[0];
            script= document.createElement('script');
            head.appendChild(script);
            script.type= 'text/javascript';
            script.src= '../../builds/active/OSG.js';
        },

        create : function () {
            this._i ++;

            this.loadOSG();
            
            var canvas = document.createElement('canvas');
            canvas.id = 'View'+ this._i;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            //document.body.appendChild(canv); // adds the canvas to the body element
            

            if (this._viewer !== null ) return;
            
            // var canv = $('<canvas/>',{'id':'this._i', style:'height:100%;width:100%', oncontextmenu:'return false;'});
            // //var vc = $('#ViewContainer').;
            $('#ViewContainer').append (canvas);
           // $('#View').append (canv );

            this.run( canvas );
        },
        // get the model
        getOrCreateModel: function () {

            //if ( !this._model ) {

                var size = 10;
                return osg.createTexturedQuadGeometry( -size / 2, 0, -size / 2,
                                                              size, 0, 0,
                                                              0, 0, size );
            //}

            //return this._model;
        },

        createScene: function () {

            var model1 = this.getOrCreateModel();
            return model1;
        },

        createScene2: function () {
            var size = 1;
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
            if ( this._firstTime )
            {
                this.initDatGUI();
                this._firstTime = false;
                scene = this.createScene();
            //    viewer.setSceneData( scene );
            }else {
                scene = this.createScene2();
            }
            
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
