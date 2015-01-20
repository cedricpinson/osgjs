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
        var viewer;

        // Here we create a special Node
        // that will hold the transformation.
        var group = new osg.MatrixTransform();
        group.setMatrix( osg.Matrix.makeTranslate( -5, 10, -5, osg.Matrix.create() ) );
        var size = 5;
        // that node will be the geometry
        var ground = osg.createTexturedBox( 0, 0, 0, size, size, size );
        //We add geomtry as child of the transform
        // and now it's transformed magically
        group.addChild( ground );
        group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );


        var mainNode = new osg.Node();
        var lightnew = new osg.Light();
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