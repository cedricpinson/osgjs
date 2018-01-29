(function() {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgGA = OSG.osgGA;
    var cadManipulator;
    var orbitManipulator;

    var createScene = function(viewer) {
        var root = new osg.Node();
        osgDB.readNodeURL('../media/models/material-test/file.osgjs').then(function(node) {
            root.addChild(node);
            var gizmo = new osgUtil.NodeGizmo(viewer);
            gizmo._autoInsertMT = true;
            root.addChild(gizmo);
            cadManipulator = new osgGA.CADManipulator({ inputManager: viewer.getInputManager() });
            cadManipulator.setEnable(false);
            orbitManipulator = viewer.getManipulator();
            orbitManipulator.computeHomePosition();

            viewer
                .getInputManager()
                .group('scene.example.gizmo.switchmanipulator')
                .addMappings(
                    {
                        switch: 'keyup enter'
                    },
                    function() {
                        var manip = viewer.getManipulator();
                        if (manip === orbitManipulator) {
                            viewer.setupManipulator(cadManipulator);
                            cadManipulator.computeHomePosition();
                        } else {
                            viewer.setupManipulator(orbitManipulator);
                        }
                    }
                );
        });
        return root;
    };

    var onLoad = function() {
        var canvas = document.getElementById('View');

        var viewer = new osgViewer.Viewer(canvas);
        viewer.init();
        viewer.setSceneData(createScene(viewer));
        viewer.setupManipulator();
        viewer.run();
    };

    window.addEventListener('load', onLoad, true);
})();
