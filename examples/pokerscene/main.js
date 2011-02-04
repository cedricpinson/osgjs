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
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

function createScene() {

    // override texture constructor to set the wrap mode repeat for all texture
    osg.Texture.prototype.setDefaultParameters = function() {
        this.mag_filter = 'LINEAR';
        this.min_filter = 'LINEAR_MIPMAP_LINEAR';
        this.wrap_s = 'REPEAT';
        this.wrap_t = 'REPEAT';
        this.textureWidth = 0;
        this.textureHeight = 0;
        this.target = 'TEXTURE_2D';
    };

    o = osg.ParseSceneGraph(getPokerScene());
    return o;
}
