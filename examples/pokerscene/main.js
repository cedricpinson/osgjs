/** -*- compile-command: "jslint-cli main.js" -*-
 *
 * Copyright (C) 2011 Cedric Pinson
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
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */

function createScene() {
    var root = new osg.Node();
    // override texture constructor to set the wrap mode repeat for all texture
    var previousTextureDefault = osg.Texture.prototype.setDefaultParameters;
    osg.Texture.prototype.setDefaultParameters = function() {
        previousTextureDefault.call(this);
        this.setWrapS('REPEAT');
        this.setWrapT('REPEAT');
        this.setMagFilter('LINEAR');
        this.setMinFilter('LINEAR_MIPMAP_LINEAR');
    };

    Q.when(osgDB.parseSceneGraph(getPokerScene())).then(function (child) {
        root.addChild(child);
    });
    return root;
}
