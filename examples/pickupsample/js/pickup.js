$.noConflict();
var canvas, viewer, manipulatorOn, disk, sideAup, cover, pickupModel, pickup, inside, turn, camera, playing, audio, speedRadPCs, arm, armNode, mouseDown, yDepl;
var pi = Math.PI;
var xDown, lastX;
var clientX, clientY, dx, dy, pushHit, onCell;

jQuery("document").ready(function() {
    console.log("doc ready");
    
    initCanvas();
    setupNavMenu();
    pickupModel = getMk2();
    
    
    //setTimeout("initViewer()", 5000);
    //initViewer();
    
});
    
function setupNavMenu(){
    var action;
    jQuery("a").click(function(){
        action = jQuery(this).attr('href').substr(1);
        switch(action){
            case 'diskInOut':
                moveInOutDisk();
                break;
            case 'showPickup':
                showPickup();
                break;
            case 'startStop':
                startStop();
                break;
            case 'changeFace':
                changeFace();
                break;     
        }
    });
    
}
function showPickup(){
    
        createPickup();
    
}

function startStop(){
    if(!inside && pickup !== undefined){
        if(!playing){
            viewer.setupManipulator(undefined, true);
            viewer.getManipulator().computeHomePosition();
            viewer.getManipulator().update(0, 1);
            setupMouseListener();
            
            var platineUpdateCallback = new RotatingUpdateCallback(getNodeFromName(camera, "platine"), 33, "yaw");
                        
            //                        platineUpdateCallback.setEndFunction(function(){
            //                            if(this.lastX > 100){
            //                                return true;
            //                            }
            //                            return false;
            //                        }, pickup);
                        
            pickup.setUpdateCallback(platineUpdateCallback);
                    
            var diskUpdateCallback;
                    
            // si le disque est posé coté A ou B changer le sens de rotation
            if(sideAup){
                diskUpdateCallback = new RotatingUpdateCallback(getNodeFromName(disk, "db"), 33, "yaw");
            } else {
                diskUpdateCallback = new RotatingUpdateCallback(getNodeFromName(disk, "db"), 33, "yaw", false);
            }
                        
            disk.setUpdateCallback(diskUpdateCallback);
                    
            playing = true;
        } else {
                        
            pickup.setUpdateCallback(undefined);
            disk.setUpdateCallback(undefined);
            
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();
                    
            playing = false;
        }
    
//        if(manipulatorOn){
//            
//        } else {
//            
//        }
        manipulatorOn = !manipulatorOn;
    }
}

function changeFace(){
    if(!inside && !playing && pickup !== undefined){
        turn = 0;
        yDepl = 13;
        moveUpDisk();
        sideAup = !sideAup;
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
        var x2 = clientX - jQuery("canvas").width()/2;
        var y2 = clientY - jQuery("canvas").height()/2;
        
        
        console.log("X2 : " + x2 + " y2 : " + y2);
        
        this.dx = this.dy = 0;
        cellule = getNodeFromName(armNode, "g31");
        var objX = cellule.boundingSphere._center[0];
        var objY = cellule.boundingSphere._center[1];
        var objR = cellule.boundingSphere._radius;
        if ((x2-objX)*(x2-objX)+(y2-objY)*(y2-objY) <= (objR*objR) && playing){
            console.log("collision");
            onCell = true;
            moveArmUp();
        } else {
            console.log("no collision");
        }
        
        
    //var hit = getIntersection();
    //pushHit = hit;
    //        lastX = xDown;
    //        console.log("click");
        
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

function getIntersection(){
    
    var hits = viewer.view.computeIntersections(clientX, clientY, 1);
        
    console.log("hits " + hits.length);
        
    var l = hits.length;
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
    while (l2-- >= 0) {
        if (hit[l2].itemToIntersect !== undefined) {
            name = hit[l2].name;
            //itemSelected = hit[l2].children[0].getUpdateCallback();
            itemSelected = hit[l2];
            break;
        }
    }
    return {
        'itemName': name, 
        'item': itemSelected
    };
    
}

function moveArmUp(){
    console.log("moveArmUp");
    var currentPosition = arm.getMatrix();
    
    var copy = osg.Matrix.copy(currentPosition, copy);
    var translation = osg.Matrix.makeTranslate(206.815448,98.028395,22.310888,[]);
    var rotation = osg.Matrix.makeRotate(0.1, 1, 0, 0);
    var backtranslation = osg.Matrix.inverse(translation, backtranslation);
    
    osg.Matrix.postMult(backtranslation, copy);
    osg.Matrix.postMult(rotation, copy);
    osg.Matrix.postMult(translation, copy);
    
    arm.setMatrix(copy);

    armNode.removeChildren();
    armNode.addChild(arm);
}

function moveArmDown(){
    console.log("moveArmDown");
    var currentPosition = arm.getMatrix();
    
    var copy = osg.Matrix.copy(currentPosition, copy);
    var translation = osg.Matrix.makeTranslate(206.815448,98.028395,22.310888,[]);
    var rotation = osg.Matrix.makeRotate(-0.1, 1, 0, 0);
    var backtranslation = osg.Matrix.inverse(translation, backtranslation);
    
    osg.Matrix.postMult(backtranslation, copy);
    osg.Matrix.postMult(rotation, copy);
    osg.Matrix.postMult(translation, copy);
    
    arm.setMatrix(copy);

    armNode.removeChildren();
    armNode.addChild(arm);
}


function moveArm(deltax){
    
    console.log("moveArm : " + deltax);
    
    var currentPosition = arm.getMatrix();
    
    var copy = osg.Matrix.copy(currentPosition, copy);
    var translation = osg.Matrix.makeTranslate(206.815448,98.028395,22.310888,[]);
    var rotation = osg.Matrix.makeRotate(deltax/500, 0, 0, 1);
    var backtranslation = osg.Matrix.inverse(translation, backtranslation);
    
    osg.Matrix.postMult(backtranslation, copy);
    osg.Matrix.postMult(rotation, copy);
    osg.Matrix.postMult(translation, copy);
    
    arm.setMatrix(copy);

    armNode.removeChildren();
    armNode.addChild(arm);
}


function createScene(){
    var root = new osg.Camera();
    root.setComputeNearFar(false);
    
    
    camera = root;
    createPickup();
    return root;
}

function createPickup(){
    console.log("create pikup");
    var root = new osg.MatrixTransform();
    
    var models = new osg.Node();
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
    armNode = getNodeFromName(model, "bras");
    
    armNode.setNodeMask(~0);
    armNode.itemToIntersect = true;
    
    children = armNode.getChildren();
    for(var i = 0 ; i < children.length ; i++){
        arm.addChild(children[i]);
    }
//    arm.addChild(node);
//    node.addChild(armGroup);
//    arm.addChild(node);
    

}

function getMk2(){
    jQuery.ajax({
        url: "model/Technics_sl1200/TECHNICS_SL1200_triangles.osgjs",  
        dataType: 'json',   
        async: false,  
        success: function(json){  
            if(json == null){
                console.log("get null trying to load " + file);
                return undefined;
            } else {
                console.log("success");
                var parsedScene;
                parsedScene = osgDB.parseSceneGraph(json);
                console.log("parsedScene : " + parsedScene);
                pickupModel = parsedScene;
                initViewer();
                return pickupModel;
            }
        }  
    });
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

