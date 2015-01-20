// Wait for it

window.addEventListener( 'load',
    function () {
        // from require to global var
        var OSG = window.OSG;
        OSG.globalify();
        var osg = window.osg;
        var osgViewer = window.osgViewer;
        // The 3D canvas.
        var canvas = document.getElementById( '3DView' );
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var viewer;

        // We create a box which will be lighted
        var group = new osg.MatrixTransform();
        group.setMatrix( osg.Matrix.makeTranslate( -5, 10, -5, osg.Matrix.create() ) );
        var size = 5;
        var ground = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
        group.addChild( ground );
        group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

        // we create a Callback
        var LightUpdateCallback = function () {};
        LightUpdateCallback.prototype = {
            update: function ( node, nv ) {
                //every 5 seconds
                var currentTime = nv.getFrameStamp().getSimulationTime();
                currentTime = ( ( currentTime % 5 ) / 5 );
                // light goes from black to red
                node.light.setDiffuse( [ currentTime, 0.0, 0.0, 0.0 ] );
                node.light.setDirty();
                node.traverse( nv );
            }
        };
        // the light itself
        var mainNode = new osg.Node();
        var lightnew = new osg.Light();
        mainNode.setUpdateCallback( new LightUpdateCallback() );
        mainNode.light = lightnew;
        mainNode.addChild( group );

        // The viewer
        viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );
        viewer.setLight( lightnew );
        viewer.getCamera().setClearColor( [ 0.3, 0.3, 0.3, 0.3 ] );
        viewer.setSceneData( mainNode );
        viewer.setupManipulator();
        viewer.run();


    }, true );