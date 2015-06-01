var main = function() {
    // from require to global var
    OSG.globalify();
    console.log('osg ready');

    var rootModelNode = new osg.MatrixTransform();
    rootModelNode.setMatrix(osg.Matrix.makeRotate(Math.PI / 2, 1, 0, 0, []));

    function getModelJsonp(modelName, cbFocusCamera) {
        var url_model;
        switch (modelName) {
            case "mickey":
                url_model = 'http://osgjs.org/examples/pointcloud/' + modelName + '.osgjs';
                break;
            case "pokerscene":
                url_model = 'http://osgjs.org/examples/pokerscene/' + modelName + '.js';
                break;
            case "ogre":
                url_model = 'http://osgjs.org/examples/shadow/' + modelName + '.osgjs';
                break;
        }

        var loadModel = function(url) {
            console.log('loading ' + url);

            var s = document.createElement("script");
            s.onload = function() {
                var NodeModel;
                switch (modelName) {
                    case "mickey":
                        NodeModel = getModel();
                        break;
                    case "pokerscene":
                        NodeModel = getPokerScene();
                        break;
                    case "ogre":
                        NodeModel = getOgre();
                        break;
                }

                var promise = osgDB.parseSceneGraph(NodeModel);
                P.resolve(promise).then(function(child) {
                    rootModelNode.removeChildren();
                    rootModelNode.addChild(child);
                    cbFocusCamera();
                    console.log('success ' + url);
                });

                document.body.removeChild(s);
            };

            s.onerror = function(aEvt) {
                osg.log('error ' + url);
            };

            s.type = "text/javascript";
            s.src = url
            document.body.appendChild(s);
        }
        console.log('osgjs loading: ' + modelName);
        loadModel(url_model);
        return rootModelNode;
    }

    function createScene(cbFocusCamera) {
        var scene = new osg.Node();

        getModelJsonp('ogre', cbFocusCamera);

        scene.addChild(rootModelNode);

        //gui stuffs
        var models_ui = document.getElementById('models');

        models_ui.onchange = function(ev) {
            var modelName = this.options[this.selectedIndex].value;
            getModelJsonp(modelName, cbFocusCamera);
            cbFocusCamera();
        };

        return scene;
    }

    // The 3D canvas.
    var canvas = document.getElementById("3DView");
    var viewer;

    var cbFocusCamera = function() {
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
    viewer = new osgViewer.Viewer(canvas);
    viewer.init();
    viewer.getCamera().setClearColor([0.3, 0.3, 0.3, 0.3]);
    viewer.setSceneData(createScene(cbFocusCamera));
    viewer.setupManipulator();
    viewer.run();
}

window.addEventListener("load", main, true);
