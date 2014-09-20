// Wait for it
window.addEventListener("load",
    function() {
        // from require to global var
        OSG.globalify();
        // The 3D canvas.
        var canvas = document.getElementById("3DView");
        var viewer;

        // Here we create a special Node
        // that will hold the transformation.
        var group = new osg.MatrixTransform();
        group.setMatrix(osg.Matrix.makeTranslate(-5, 10, -5));
        var size = 5;
        // that node will be the geometry
        var ground = osg.createTexturedBox(0, 0, 0, size, size, size);
        //We add geomtry as child of the transform
        // and now it's transformed magically
        group.addChild(ground);
        group.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));


        var mainNode = new osg.Node();
        lightnew = new osg.Light();
        mainNode.light = lightnew;
        mainNode.addChild(group);

        // The viewer
        viewer = new osgViewer.Viewer(canvas);
        viewer.init();
        viewer.setLight(lightnew);
        viewer.getCamera().setClearColor([0.3, 0.3, 0.3, 0.3]);
        viewer.setSceneData(mainNode);
        viewer.setupManipulator();
        viewer.run();


    }, true);
