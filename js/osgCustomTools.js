/*
 * This is a personal parser function to get a node in a scene passing his name as parameter
 */

function getNodeFromName(nodeToParse, nodeName){
    if(nodeToParse.getName() !== undefined && nodeToParse.getName() == nodeName){
        //console.log("return found");
        return nodeToParse;
    } else {
        var children = nodeToParse.getChildren();
        //console.log("getChildren() : " + children);
        if(children.length > 0){
            for(var i = 0 ; i < children.length ; i++){
                //console.log("getNodeFromName iteration : " + i +"/" +children.length);
                var newNode = getNodeFromName(children[i], nodeName);
                if(newNode){
                    return newNode;
                }
            }
        }
    }
}



var RotatingUpdateCallback = function(sceneNode, speedRPM, axis, direction) {
    // flase direction for rotating while side B is up
    if(direction === undefined || direction == true){
        this.direction = 1;
    } else {
        this.direction = -1; 
    }
    this.matrix = new osg.MatrixTransform();
    children = sceneNode.getChildren();
    for(var counter = 0 ; counter < children.length ; counter++){
        this.matrix.addChild(children[counter]);
    }
    this.sceneNode = sceneNode;
    this.speed = speedRPM;
    this.lastAngle = 0;
    this.lastTime = 0;
    
    this.callbackHolder = null;
    this.axis = axis;
    
    this.endFunction = function(){return false;};
    this.newCallback = function(){};
};

RotatingUpdateCallback.prototype = {
    setEndFunction: function(endFunction, callbackHolder){
        this.endFunction = endFunction;
        this.callbackHolder = callbackHolder;
    },
    setSpeed: function(rpm){
        this.speed = rpm;
    }
    ,
    checkForEnd: function(){
        if(this.endFunction()){
            console.log("check end true");
            this.callbackHolder.setUpdateCallback(undefined);
            this.newCallback();
        }
    },
    setNewCallback: function(newCallback){
        this.newCallback = newCallback;
        
    }
    ,
    update: function(node, nv) {
        if(this.lastTime == 0){
            this.lastTime = nv.getFrameStamp().getSimulationTime();
        }
        
    
        // getting the current time
        var currentTime = nv.getFrameStamp().getSimulationTime();

        // convert rotation speed in rad per seconds
        var radPSec = this.speed * Math.PI / 30;
        
        // delta time
        var dt = currentTime-this.lastTime;
        
        // rotation angle for this update
        var angle = dt*radPSec;
        
        // total rotation
        var newAngle = this.lastAngle+angle;
        
        
        var yaw, pitch, roll;
        // define axis
        if(this.axis == 'yaw'){
            yaw = 1;
            pitch = 0;
            roll = 0;
        } else if (this.axis == 'pitch'){
            yaw = 0;
            pitch = 1;
            roll = 0;
        } else if (this.axis == 'roll'){
            yaw = 0;
            pitch = 0;
            roll = 1;
        } else {
            yaw = 0;
            pitch = 0;
            roll = 0;
        }
        
        
        // apply rotation
        this.matrix.setMatrix(osg.Matrix.makeRotate(this.direction*newAngle, roll, pitch, yaw, []));
    
    
        this.sceneNode.removeChildren();
        // set the rotated platine in the dof node
        this.sceneNode.addChild(this.matrix);
        //        this.platine.setMatrix(node.getMatrix());
        
        this.lastTime = currentTime;
        this.lastAngle = newAngle;
        
        this.checkForEnd();
        
        node.traverse(nv);
    }
};



var TranslateUpdateCallback = function(sceneNode, speed, axis, direction) {
    // flase direction for rotating while side B is up
    if(direction === undefined || direction == true){
        this.direction = 1;
    } else {
        this.direction = -1; 
    }
        this.matrix = new osg.MatrixTransform();
        children = sceneNode.getChildren();
        for(var counter = 0 ; counter < children.length ; counter++){
            this.matrix.addChild(children[counter]);
        }
    if(axis == undefined){
        this.axis = 'x';
    } else {
        this.axis = axis;
    }
    this.speed = speed;
    this.sceneNode = sceneNode;
    this.lastDepl = 0;
    this.lastTime = 0;
    this.endFunction = function(){return false;};
    this.newCallback = function(){};
    this.callbackHolder = null;
};

TranslateUpdateCallback.prototype = {
    setEndFunction: function(endFunction, callbackHolder){
        this.endFunction = endFunction;
        this.callbackHolder = callbackHolder;
    },
    checkForEnd: function(){
        if(this.endFunction()){
            console.log("check end true");
            this.callbackHolder.setUpdateCallback(undefined);
            this.newCallback();
        }
    },
    setNewCallback: function(newCallback, newNode){
        console.log("newNode " + newNode);
        this.newNode = newNode;
        this.newCallback = newCallback;
        
    }
    ,
    update: function(node, nv) {
        if(this.lastTime == 0){
            this.lastTime = nv.getFrameStamp().getSimulationTime();
        }
    
        // getting the current time
        var currentTime = nv.getFrameStamp().getSimulationTime();

        // delta time
        var dt = currentTime-this.lastTime;
        
        // rotation angle for this update
        var depl = dt*this.speed;
        
        // total rotation
        var newDepl = (this.lastDepl+depl)*this.direction;
        
        var x , y, z;
        // define translation
        if(this.axis == 'x'){
            x = newDepl;
            y = 0;
            z = 0;
        } else if (this.axis == 'y'){
            x = 0;
            y = newDepl;
            z = 0;
        } else if (this.axis == 'z'){
            x = 0;
            y = 0;
            z = newDepl;
        } else {
            x = 0;
            y = 0;
            z = 0;
        }
        
        // apply translation
        this.matrix.setMatrix(osg.Matrix.makeTranslate( x, y, z,[]));
        //this.matrix.setMatrix(osg.Matrix.makeRotate(this.direction*newX, 0, 0, 1, []));
    
        this.sceneNode.removeChildren();
        
        this.sceneNode.addChild(this.matrix);
        //        this.platine.setMatrix(node.getMatrix());
        
        this.lastTime = currentTime;
        this.lastDepl = newDepl*this.direction;
        console.log(this.lastDepl);
        
        this.checkForEnd();
        
        node.traverse(nv);
    }
};