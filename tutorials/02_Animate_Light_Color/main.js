// Wait for it
window.addEventListener("load",
function() { 
  // from require to global var
  OSG.globalify();
  // The 3D canvas.
  var canvas = document.getElementById("3DView");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var viewer;  

  // We create a box which will be lighted
    var group = new osg.MatrixTransform();
    group.setMatrix(osg.Matrix.makeTranslate(-5,10,-5));
    var size = 5;
    var ground = osg.createTexturedBox(0,0,0, size,size,size);
    group.addChild(ground);
    group.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
  
  // we create a Callback
  var LightUpdateCallback = function() {
  };
  LightUpdateCallback.prototype = {
    update: function(node, nv) {
       //every 5 seconds
        var currentTime = nv.getFrameStamp().getSimulationTime();
        currentTime = ((currentTime % 5) / 5);
      // light goes from black to red
         node.light.setDiffuse([currentTime, 0.0, 0.0, 0.0]);
        node.light.setDirty();
         node.traverse(nv);
    }
  };
// the light itself
    var mainNode = new osg.Node(); 
    lightnew = new osg.Light();
    mainNode.setUpdateCallback(new LightUpdateCallback());  
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


}
,true);
