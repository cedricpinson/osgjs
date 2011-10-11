/** -*- compile-command: "jslint-cli osg.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */

osgDB.ObjectWrapper.serializers.osg = {};

osgDB.ObjectWrapper.serializers.osg.Object = function(jsonObj, obj) {
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return false;
    }
    
    if (jsonObj.Name) {
        obj.setName(jsonObj.Name);
    }
    return true;
};

osgDB.ObjectWrapper.serializers.osg.Node = function(jsonObj, node) {
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, node);

    if (jsonObj.UpdateCallbacks) {
        for (var i = 0, l = jsonObj.UpdateCallbacks.length; i < l; i++) {
            var cb = osgDB.ObjectWrapper.readObject(jsonObj.UpdateCallbacks[i]);
            if (cb) {
                node.addUpdateCallback(cb);
            }
        }
    }

    if (jsonObj.StateSet) {
        node.setStateSet(osgDB.ObjectWrapper.readObject(jsonObj.StateSet));
    }
    
    if (jsonObj.Children) {
        for (var i = 0, l = jsonObj.Children.length; i < l; i++) {
            node.addChild(osgDB.ObjectWrapper.readObject(jsonObj.Children[i]));
        }
    }
};

osgDB.ObjectWrapper.serializers.osg.StateSet = function(jsonObj, stateSet) {
    var check = function(o) {
        return true;
    };

    if (!check(jsonObj)) {
        return;
    }
    
    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, stateSet);

    if (jsonObj.AttributeList) {
        for (var i = 0, l = jsonObj.AttributeList.length; i < l; i++) {
            var attr = osgDB.ObjectWrapper.readObject(jsonObj.AttributeList[i]);
            stateSet.setAttributeAndMode(attr);
        }
    }

    if (jsonObj.TextureAttributeList) {
        var textures = jsonObj.TextureAttributeList;
        for (var t = 0, lt = textures.length; t < lt; t++) {
            var textureAttributes = textures[t];
            for (var a = 0, al = textureAttributes.length; a < al; a++) {
                var tattr = osgDB.ObjectWrapper.readObject(textureAttributes[a]);
                if (tattr)
                    stateSet.setTextureAttributeAndMode(t, tattr);
            }
        }
    }

};

osgDB.ObjectWrapper.serializers.osg.Material = function(jsonObj, material) {
    var check = function(o) {
        if (o.Diffuse && o.Emission && o.Specular && o.Shininess) {
            return true;
        }
        return false;
    };

    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, material);

    material.setAmbient(jsonObj.Ambient);
    material.setDiffuse(jsonObj.Diffuse);
    material.setEmission(jsonObj.Emission);
    material.setSpecular(jsonObj.Specular);
    material.setShininess(jsonObj.Shininess);
};


osgDB.ObjectWrapper.serializers.osg.BlendFunc = function(jsonObj, blend) {
    var check = function(o) {
        if (o.SourceRGB && o.SourceAlpha && o.DestinationRGB && o.DestinationAlpha) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, blend);

    blend.setSourceRGB(jsonObj.SourceRGB);
    blend.setSourceAlpha(jsonObj.SourceAlpha);
    blend.setDestinationRGB(jsonObj.DestinationRGB);
    blend.setDestinationAlpha(jsonObj.DestinationAlpha);
};

osgDB.ObjectWrapper.serializers.osg.Image = function(jsonObj, image) {
    image.src = jsonObj.File;
};

osgDB.ObjectWrapper.serializers.osg.Texture = function(jsonObj, texture) {
    var check = function(o) {
//        if (o.MagFilter && o.MinFilter && o.WrapT && o.WrapS) {
            return true;
//        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, texture);

    if (jsonObj.MinFilter) {
        texture.setMinFilter(jsonObj.MinFilter);
    }
    if (jsonObj.MagFilter) {
        texture.setMagFilter(jsonObj.MagFilter);
    }

    if (jsonObj.WrapT) {
        texture.setWrapT(jsonObj.WrapT);
    }
    if (jsonObj.WrapS) {
        texture.setWrapS(jsonObj.WrapS);
    }

    if (jsonObj.File) {
        var img = new Image();
        osgDB.ObjectWrapper.serializers.osg.Image(jsonObj, img);
        texture.setImage(img);
    }
};


osgDB.ObjectWrapper.serializers.osg.Projection = function(jsonObj, node) {
    var check = function(o) {
        if (o.Matrix) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Node(jsonObj, node);

    if (jsonObj.Matrix) {
        node.setMatrix(jsonObj.Matrix);
    }

};


osgDB.ObjectWrapper.serializers.osg.MatrixTransform = function(jsonObj, node) {
    var check = function(o) {
        if (o.Matrix) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Node(jsonObj, node);

    if (jsonObj.Matrix) {
        node.setMatrix(jsonObj.Matrix);
    }
};


osgDB.ObjectWrapper.serializers.osg.Geometry = function(jsonObj, node) {
    var check = function(o) {
        if (o.PrimitiveSetList && o.VertexAttributeList) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Node(jsonObj, node);
    for (var i = 0, l = jsonObj.PrimitiveSetList.length; i < l; i++) {
        var entry = jsonObj.PrimitiveSetList[i];
        
        var drawElementPrimitive = entry.DrawElementUShort || entry.DrawElementUByte || entry.DrawElementUInt || undefined;
        if ( drawElementPrimitive ) {
            var jsonArray = drawElementPrimitive.Indices;
            var mode = drawElementPrimitive.Mode;
            var array = new osg.BufferArray(osg.BufferArray[jsonArray.Type], 
                                            jsonArray.Elements, 
                                            jsonArray.ItemSize );
            if (!mode) {
                mode = osg.PrimitiveSet.TRIANGLES;
            } else {
                mode = osg.PrimitiveSet[mode];
            }
            var drawElements = new osg.DrawElements(mode, array);
            node.getPrimitiveSetList().push(drawElements);
        }

        var drawArrayPrimitive = entry.DrawArray || undefined;
        if (drawArrayPrimitive) {
            var mode = drawArrayPrimitive.Mode || drawArrayPrimitive.mode;
            var first = drawArrayPrimitive.First || drawArrayPrimitive.first;
            var count = drawArrayPrimitive.Count || drawArrayPrimitive.count;
            var drawArray = new osg.DrawArrays(osg.PrimitiveSet[mode], first, count);
            node.getPrimitives().push(drawArray);
        }
    }
    for (var key in jsonObj.VertexAttributeList) {
        if (jsonObj.VertexAttributeList.hasOwnProperty(key)) {
            var attributeArray = jsonObj.VertexAttributeList[key];
            node.getVertexAttributeList()[key] = new osg.BufferArray(osg.BufferArray[attributeArray.Type], attributeArray.Elements, attributeArray.ItemSize );
        }
    }
};