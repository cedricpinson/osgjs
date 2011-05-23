/** -*- compile-command: "jslint-cli osgDB.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
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
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

var osgDB = {};
//osgDB.readNode = osg.ParseSceneGraph;

osgDB.parseSceneGraph = function (node)
{
    var newnode;
    var children = node.children;
    if (node.primitives || node.attributes) {
        newnode = new osg.Geometry();
        jQuery.extend(newnode, node);
        node = newnode;

        var i;
        for ( i in node.primitives) {
            var mode = node.primitives[i].mode;
            if (node.primitives[i].indices) {
                var array = node.primitives[i].indices;
                array = osg.BufferArray.create(gl[array.type], array.elements, array.itemSize );
                if (!mode) {
                    mode = gl.TRIANGLES;
                } else {
                    mode = gl[mode];
                }
                node.primitives[i] = osg.DrawElements.create(mode, array);
            } else {
                mode = gl[mode];
                var first = node.primitives[i].first;
                var count = node.primitives[i].count;
                node.primitives[i] = new osg.DrawArrays(mode, first, count);
            }
        }

        jQuery.each(node.attributes, function( key, element) {
            var attributeArray = node.attributes[key];
            node.attributes[key] = osg.BufferArray.create(gl[attributeArray.type], attributeArray.elements, attributeArray.itemSize );
        });
    }

    if (node.stateset) {
        var newstateset = new osg.StateSet();
        if (node.stateset.textures) {
            var textures = node.stateset.textures;
            for (var t = 0, tl = textures.length; t < tl; t++) {
                if (!textures[t].file) {
                    osg.log("no texture on unit " + t + " skip it")
                    //osg.log(textures[t]);
                    continue;
                }
                var tex = new osg.Texture();
                jQuery.extend(tex, textures[t]);
                var img = new Image();
                img.src = textures[t].file;
                tex.setImage(img);
                
                //var tex = osg.Texture.create(textures[t].file);
                newstateset.setTextureAttributeAndMode(t, tex);
                newstateset.addUniform(osg.Uniform.createInt1(t,"Texture" + t));
            }
        }
        if (node.stateset.material) {
            var material = node.stateset.material;
            var newmaterial = new osg.Material();
            jQuery.extend(newmaterial, material);
            newstateset.setAttributeAndMode(newmaterial);
        }
        node.stateset = newstateset;
    }

    if (node.matrix) {
        newnode = new osg.MatrixTransform();
        jQuery.extend(newnode, node);
        newnode.setMatrix(osg.Matrix.copy(node.matrix));
        node = newnode;

    }

    if (node.projection) {
        newnode = new osg.Projection();
        jQuery.extend(newnode, node);
        newnode.setProjectionMatrix(osg.Matrix.copy(node.projection));
        node = newnode;
    }

    // default type
    if (node.objectType === undefined) {
        newnode = new osg.Node();
        jQuery.extend(newnode, node);
        node = newnode;
    }

    if (children) {
        // disable children, it will be processed in the end
        node.children = [];

        for (var child = 0, childLength = children.length; child < childLength; child++) {
            node.addChild(osgDB.parseSceneGraph(children[child]));
        }
    }

    return node;
};
