/** -*- compile-command: "jslint-cli main.js" -*-
 *
 * Copyright (C) 2010 Cedric Pinson
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

var NbItems = 4;
var Deep = 3;

var QuadSizeX = 1;
var QuadSizeY = QuadSizeX*9/16.0;

var Item = undefined;
var Texture = undefined;
function getOrCreateItem() {
    if (Item === undefined) {
        var rq = osg.createTexturedQuad(-QuadSizeX/2.0, -QuadSizeY/2.0,0,
                                       QuadSizeX, 0 ,0,
                                       0, QuadSizeY,0);
        rq.getOrCreateStateSet().setTextureAttributeAndMode(0, Texture);
        Item = rq;
    }
    return Item;
}

function getRessource() {
    Texture = osg.Texture.createFromURL("textures/texture.png");
    
}

var NbTotalItems = 0;
var NbTotalNodes = 0;

function createScene() {
    Texture = osg.Texture.createFromURL("textures/texture.png");
    //var root = new osg.Node();
    var root = createItems(Deep);
    //root.addChild(items);

    osg.log("Total Items " + NbTotalItems);
    osg.log("Total Nodes " + NbTotalNodes);
    return root;
}


function createItems(deep)
{
    var scale = Math.pow(2,deep-1);

    var root = new osg.MatrixTransform();
    var nbx = NbItems;
    var nby = Math.floor(nbx * 9/16.0);
    if (deep === 0) {
        NbTotalItems += nbx*nby;
    }
    NbTotalNodes += nbx*nby;

    for (var i = 0, l = nbx; i < l; i++) {
        for (var j = 0, m = nby; j < m; j++) {
            var mt = new osg.MatrixTransform();
            var x,y;
            if (deep === 0 ) {
                x = (-nbx * 0.5 + 0.5 + i) * 1.1;
                y = (-nby * 0.5 + 0.5 + j) * 1.1;
                mt.setMatrix(osg.Matrix.makeTranslate(x,y,0));
                if (i % 2 === 0 ) {
                    mt.addChild(getOrCreateItem());
                } else {
                    mt.addChild(getOrCreateItem());
                }
            } else {
                var s = nbx*deep*scale*1.1;
                x = (-nbx * 0.5 + 0.5 + i) * (s);
                y = (-nby * 0.5 + 0.5 + j) * (s*9/16.0);
                //osg.log([x,y]);
                mt.setMatrix(osg.Matrix.makeTranslate(x,y,0));
                mt.addChild(createItems(deep - 1));
            }
            root.addChild(mt);
        }
    }
    return root;
}