/*
 * This is a personal parser function to get a node in a scene passing his name as parameter
 */

function getNodeFromName(nodeToParse, nodeName){
    console.log("getNodeFromName started");
    if(nodeToParse.getName() !== undefined && nodeToParse.getName() == nodeName){
        console.log("return found");
        return nodeToParse;
    } else {
        var children = nodeToParse.getChildren();
        console.log("getChildren() : " + children);
        if(children.length > 0){
            for(var i = 0 ; i < children.length ; i++){
                console.log("getNodeFromName iteration : " + i +"/" +children.length);
                var newNode = getNodeFromName(children[i], nodeName);
                if(newNode){
                    return newNode;
                }
            }
        }
    }
}