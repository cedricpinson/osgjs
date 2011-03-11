/** -*- compile-command: "jslint-cli stats.js" -*-
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