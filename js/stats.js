/** -*- compile-command: "jslint-cli stats.js" -*-
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

var Stats = {};


Stats.Stats = function(canvas) {
    this.layers = [];
    this.last_update = undefined;
    this.canvas = canvas;
};

Stats.Stats.prototype = {
    addLayer: function(color, getter) {
        if (color === undefined) {
            color = "rgb(255,255,255)";
        }
        this.layers.push({ 
            previous: 0, 
            color: color,
            getValue: getter
        });
    },

    update: function() {
        
        var t = (new Date()).getTime();
        if (this.last_update === undefined) {
            this.last_update = t;
        }
        var delta = (t - this.last_update)* 2.0*60.0/1000.0;
        if (delta < 1.0) {
            return;
        }

        var translate = delta;
        var c = this.canvas;
        var width = c.width;
        var height = c.height;
        var ctx = c.getContext("2d");
        ctx.save();
        ctx.globalCompositeOperation="copy";
        ctx.mozImageSmoothingEnabled = false;
        ctx.translate(-delta,0);
        ctx.drawImage(c, 0, 0, width, height);
        ctx.restore();
        ctx.clearRect(width - delta, 0, delta, height);

        for (var i = 0, l = this.layers.length; i < l; i++) {
            var layer = this.layers[i];
            var c = this.canvas;
            var value = layer.getValue(t);
            var width = c.width;
            var height = c.height;

            ctx.lineWidth = 1.0;
            ctx.strokeStyle = layer.color;
            ctx.beginPath();
            ctx.moveTo(width - delta, height - layer.previous);
            ctx.lineTo(width, height - value);
            ctx.stroke();
            layer.previous = value;
        }
        this.last_update = t;
    },
};