$.noConflict();
var canvas, viewer, manipulatorOn, disk, sideAup, cover, pickupModel, pickup, inside, turn, camera, playing, audio, speedRadPCs, arm, armNode, mouseDown, yDepl;
var pi = Math.PI;
var xDown, lastX;
var clientX, clientY, dx, dy, pushHit, onCell;

jQuery("document").ready(function() {
    console.log("doc ready");
    
    initCanvas();
    
   
    
    //setTimeout("initViewer()", 5000);
    initViewer();
    //startStop();
});
    


function startStop(){
    if(pickup !== undefined){
        if(!playing){
            viewer.setupManipulator(undefined, true);
            viewer.getManipulator().computeHomePosition();
            viewer.getManipulator().update(0, 1);
            setupMouseListener();
            
            var platineUpdateCallback = new RotatingUpdateCallback(platine, 33, "yaw");
                        
            //                        platineUpdateCallback.setEndFunction(function(){
            //                            if(this.lastX > 100){
            //                                return true;
            //                            }
            //                            return false;
            //                        }, pickup);
                        
            pickup.setUpdateCallback(platineUpdateCallback);
                    
           
                    
            playing = true;
        } else {
                        
            pickup.setUpdateCallback(undefined);
           
            
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();
                    
            playing = false;
        }
    
        manipulatorOn = !manipulatorOn;
    }
}

function setupMouseListener(){
    console.log("setup mouse");
    jQuery("canvas").mouseup(function(event){
        if(onCell && playing && mouseDown){
            moveArmDown();
        }
        onCell = false;
        mouseDown = false;
        
    })
    jQuery("canvas").mousedown(function(event){
        mouseDown = true;
        lastX = event.clientX;
        var pos = viewer.getManipulator().convertEventToCanvas(event);
        clientX = pos[0];
        clientY = pos[1];
        console.log("X : " + clientX + " Y : " + clientY);
        
        if(getIntersection(cellule)){
            console.log("cell detect");
        };
        

        
    });
    jQuery("canvas").mousemove(function(event){
        if(mouseDown && onCell && playing){
            
            var clientX = event.clientX;
            var deltaX = lastX-clientX;
            //var xGap = xDown-clientX;
            
            //if(xGap < 150 && xGap > -150){
            //            moveArm(deltax);
            //}
            moveArm(deltaX);
            lastX = event.clientX;
        }
    });
    
}

function getIntersection(itemToIntersect){
    
    var hits = viewer.view.computeIntersections(clientX, clientY, 1);
        
    console.log("hits " + hits);
    
    if (l === 0 ) {
        return undefined;
    }
    hits.sort(function(a,b) {
        return a.ratio - b.ratio;
    });

    // use the first hit
    var hit = hits[0].nodepath;
    var l2 = hit.length;
    var itemSelected;
    var name;
    console.log(l2);
    while (l2-- >= 0) {
        if (hit[l2] !== undefined){
            
            if(hit[l2].name !== undefined) {
            
                name = hit[l2].name;
                //itemSelected = hit[l2].children[0].getUpdateCallback();
                itemSelected = hit[l2];
                console.log("success name " + name + " l2: " + l2);
                if(name == itemToIntersect.name){
                    return true;
                }
                
            }
        }
    }
    return false;
    
}


function createScene(){
    var root = new osg.Camera();

    root.setComputeNearFar(false);
    root = new osg.Node();
    
    camera = root;
    createPickup();
    createDisc();
    return root;
}

function createDisc(){
    
    var root = new osg.MatrixTransform();
    var model = osgDB.parseSceneGraph(getDisqueRouge());
    
    var models = new osg.Node();
    models.addChild(model);
    var scene = new osg.Node();
    scene.addChild(models);
    
    root.addChild(scene);

    camera.addChild(root);
    
    return root;
    
    
}

function createPickup(){
    console.log("create pikup");
    var root = new osg.MatrixTransform();
    
    var models = new osg.Node();
    
    pickupModel = osgDB.parseSceneGraph(getSl1200());
    
    console.log("pickupModel : " + pickupModel);
    models.addChild(pickupModel);
    
    var node = new osg.Node();
    node.addChild(models);
    
    root.addChild(node);
    
    root.setMatrix(osg.Matrix.makeTranslate(0, 0, -13, []))
    
    

    camera.addChild(root);
    
    pickup = root;    
    
    arm = new osg.MatrixTransform();
    //    node = new osg.Node();
    armNode = getNodeFromName(pickupModel, "bras");
    platine = getNodeFromName(camera, "platine");
    cellule = getNodeFromName(armNode, "g31");
    
    children = armNode.getChildren();
    for(var i = 0 ; i < children.length ; i++){
        arm.addChild(children[i]);
    }
//    arm.addChild(node);
//    node.addChild(armGroup);
//    arm.addChild(node);
    

}

function initViewer(){
    viewer = new osgViewer.Viewer(canvas, {
        antialias : true, 
        alpha: false,
        stats: 1
    });
    
    
    viewer.init();
    
    viewer.setupManipulator();
    manipulatorOn = true;
    
    var scene = createScene();
    
    viewer.view.setClearColor([0.3, 0.3, 0.3, 1.0]);
    viewer.setScene(scene);
    viewer.getManipulator().computeHomePosition();
    
    viewer.run();
}

function initCanvas(){
    var size = getWindowSize();

    canvas = document.getElementById("3DView");

    canvas.width = size.w;
    canvas.height = size.h;
   
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

