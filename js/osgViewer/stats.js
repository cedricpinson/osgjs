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

Stats.Stats = function(canvas, textCanvas) {
    this.layers = [];
    this.last_update = undefined;
    this.canvas = canvas;
    this.text_canvas = textCanvas;
    this.numberUpdate = 0;
};

Stats.Stats.prototype = {
    addLayer: function(color, maxVal, getter, texter) {
        if(color === undefined) {
            color = "rgb(255,255,255)";
        }
        this.layers.push({
            previous: 0,
            color: color,
            getValue: getter,
            getText: texter,
            average : 0,
            max : maxVal
        });
    },

    update: function() {

        var t = performance.now();
        if(this.last_update === undefined) {
            this.last_update = t;
        }
        var delta = (t - this.last_update) * 2.0 * 60.0 / 1000.0;
        if(delta < 1.0) {
            return;
        }

        var report = delta - Math.floor(delta);
        t -= report / (2.0 * 60.0 / 1000.0);
        delta = Math.floor(delta);

        var translate = delta;
        var c = this.canvas;
        var width = c.width;
        var height = c.height;
        var ctx = c.getContext("2d");

        var myImageData = ctx.getImageData(delta, 0, width - delta, height);
        ctx.putImageData(myImageData, 0, 0);
        ctx.clearRect(width - delta, 0, delta, height);
 
        var i, layer, value;
        for(i = 0, l = this.layers.length; i < l; i++) {
            layer = this.layers[i];
            value = layer.getValue(t);
            layer.average += value;
            value *= c.height / layer.max;
            if (value > c.height )
                value = c.height;
            width = c.width;
            height = c.height;
            ctx.lineWidth = 1.0;
            ctx.strokeStyle = layer.color;
            ctx.beginPath();
            ctx.moveTo(width - delta, height - layer.previous);
            ctx.lineTo(width, height - value);
            ctx.stroke();
            layer.previous = value;
        }

        c = this.text_canvas;
        ctx = c.getContext("2d");
        ctx.font = "14px Sans";
        height = 17;
        translate = height;
        this.numberUpdate++;
        if(this.numberUpdate % 60.0){
            ctx.clearRect(0, 0, c.width, c.height);
            for(i = 0, l = this.layers.length; i < l; i++) {
                layer = this.layers[i];
                value = layer.getText(layer.average / this.numberUpdate);
                layer.average = 0;
                ctx.fillStyle = layer.color;
                ctx.fillText(value, 0, translate);
                translate += height;
            }
            this.numberUpdate = 0;
        }
        this.last_update = t;
    }
};