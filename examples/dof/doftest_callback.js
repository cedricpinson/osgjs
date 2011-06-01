$.noConflict();
var canvas, scene, viewer, dof, platine, rotation, multiSwitch, offSwitch, onSwitch;

var PlatineUpdateCallback = function(platine, dof) {
    this.platine = platine;
    this.dof = dof;
    this.lastX = 0;
    this.lastTime = 0;
    this.ii = 0;
};
PlatineUpdateCallback.prototype = {
    update: function(node, nv) {
        
        this.ii = this.ii + 0.1;
        // getting the current time
        var currentTime = nv.getFrameStamp().getSimulationTime();

        // rotation speed in rad per seconds
        var radPSec = 66 * Math.PI / 60;
        
        // delta time
        var dt = currentTime-this.lastTime;
        
        // rotation angle for this update
        var x = dt*radPSec;
        
        // total rotation
        var newX = this.lastX+x;
        
        console.log("Depl : " + x + " dt : " + dt + " newX : " + newX);
        
        this.platine.setMatrix(osg.Matrix.makeRotate(newX, 0, 0, 1, []));
        //this.platine.setMatrix(osg.Matrix.makeRotate(this.ii, 0, 0, 1, []));
    
        this.dof.removeChildren();
//    // set the rotated platine in the dof node
       this.dof.addChild(this.platine);
//        this.platine.setMatrix(node.getMatrix());
        
        
        

        
        this.lastTime = currentTime;
        this.lastX = newX;
        
        node.traverse(nv);
    }
};

jQuery("document").ready(function($) {
    console.log("doc ready");
    // getting the window size
    var size = getWindowSize();

    //getting the canvas element
    canvas = document.getElementById("3DView");

    //adjust canvas size to window
    canvas.width = size.w;
    canvas.height = size.h;
    
    // initializing the viewer
    viewer = new osgViewer.Viewer(canvas);
    viewer.init();
    

    // giving the path to model file
    file = "pickup_web.json";
    
    // ajax call to get the model
    $.ajax({
        url: file,  
        dataType: 'json',   
        async: true,  
        success: function(json){  
            
            if(json == null){
                console.log("get null trying to load " + file);
            } else {
                //if ajax call was successful
                console.log("loaded " + file);
                
                // creating the scene
                scene = createScene(json);

               
                
                
                
                
                // getting the DOF node
                dof = getNodeFromName(scene, "d1");
                
                // getting the multiswitch node
                multiSwitch = getNodeFromName(scene, "sw1");

                // getting the off switch
                offSwitch = getNodeFromName(scene,"p50_5");
                
                // getting the on switch
                onSwitch = getNodeFromName(scene,"p50_3");
                
                // set the scene to render
                viewer.setScene(scene);
                
                // set mouse manipulator
                viewer.setupManipulator();
                
                // run the scene
                viewer.run();
                
                console.log("try done");
                
                
            }
        }  
    });
    
    

        
    //set up keyboard listener
    $(document).keydown(function(event){
            
        if(event.keyCode == 65){
            if(rotation){
                //stop animation
                rotation = false;
                changeSwitch();
                scene.setUpdateCallback(undefined);
                
                
            } else {
                // init variables for rotation
                rot = 0;
                rotation = true;
                changeSwitch();
                
                scene.setUpdateCallback(new PlatineUpdateCallback(platine, dof));
                
                // launch rotation animation
                //rotate();
            }
            
        //scene.setMatrix(osg.Matrix.makeRotate(3.14, 1, 0, 0, []));
        }
            
    });
        

});

function changeSwitch(){
    if(!rotation){
        multiSwitch.removeChildren(onSwitch);
        multiSwitch.addChild(offSwitch);
    } else {
        multiSwitch.removeChildren(offSwitch);
        multiSwitch.addChild(onSwitch);
    }
    
}

//function rotate(){
//    
//    rot = rot+1;
//    console.log("a detect");
//    
//    
//   
//    // perform rotation on the platine
//    platine.setMatrix(osg.Matrix.makeRotate(rot/5, 0, 0, 1, []));
//    //remove the old platine from the dof node
//    dof.removeChildren();
//    // set the rotated platine in the dof node
//    dof.addChild(platine);
//    if(rotation){
//        window.requestAnimationFrame(rotate, canvas);
//    //var timeout = setTimeout("rotate()",1000/60);
//    }
//}




function createScene(json){
    // scene is a matrix to allow transforms
    scene = new osg.MatrixTransform();
    
    //parsing the json model
    var model = osgDB.parseSceneGraph(json);
    
    // adding the model to the scene
    scene.addChild(model);
    
    // create a new matrix transform
    platine = new osg.MatrixTransform();
                
    // getting the actual platine group from the scene
    var platineGroup = getNodeFromName(scene, "g5");
                
    // add platine geometry in the matrix transform
    platine.addChild(platineGroup);
                
    
    
    
    
    

    return scene;
}

   
function getWindowSize() {
    var myWidth = 0, myHeight = 0;
    
    if( typeof( window.innerWidth ) == 'number' ) {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return {
        'w': myWidth, 
        'h': myHeight
    };
}