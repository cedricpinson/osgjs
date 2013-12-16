/*global define */

define( [
    'osg/Utils'
], function ( MACROUTILS ) {

    /** -*- compile-command: 'jslint-cli stats.js' -*-
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

    Stats.Stats = function ( canvas, textCanvas ) {
        this.layers = [];
        this.last_update = undefined;
        this.canvas = canvas;
        this.text_canvas = textCanvas;
        this.numberUpdate = 0;
    };

    Stats.Stats.prototype = {
        addLayer: function ( color, maxVal, getter, texter ) {
            if ( color === undefined ) {
                color = 'rgb(255,255,255)';
            }
            this.layers.push( {
                previous: 0,
                color: color,
                getValue: getter,
                getText: texter,
                average: 0,
                max: maxVal
            } );
        },

        update: function () {

            var delta, i, l, layer, value, c, ctx, height, myImageData, t = MACROUTILS.performance.now();
            if ( this.last_update === undefined ) {
                this.last_update = t;
            }
            this.numberUpdate++;
            for ( i = 0, l = this.layers.length; i < l; i++ ) {
                layer = this.layers[ i ];
                value = layer.getValue( t );
                layer.average += value;
            }
            //i = 2.0 * 60.0 / 1000.0;
            i = 0.12; //4.0 * 60.0 / 1000.0;
            delta = ( t - this.last_update ) * i;
            if ( delta >= 1.0 ) {

                t -= ( delta - Math.floor( delta ) ) / i;
                delta = Math.floor( delta );

                c = this.canvas;
                ctx = c.getContext( '2d' );

                myImageData = ctx.getImageData( delta, 0, c.width - delta, c.height );
                ctx.putImageData( myImageData, 0, 0 );
                ctx.clearRect( c.width - delta, 0, delta, c.height );

                for ( i = 0, l = this.layers.length; i < l; i++ ) {
                    layer = this.layers[ i ];
                    value = layer.getValue( t );
                    value *= c.height / layer.max;
                    if ( value > c.height ) value = c.height;
                    ctx.lineWidth = 1.0;
                    ctx.strokeStyle = layer.color;
                    ctx.beginPath();
                    ctx.moveTo( c.width - delta, c.height - layer.previous );
                    ctx.lineTo( c.width, c.height - value );
                    ctx.stroke();
                    layer.previous = value;
                }
            }

            if ( this.numberUpdate % 60 === 0 ) {
                c = this.text_canvas;
                ctx = c.getContext( '2d' );
                ctx.font = '14px Sans';
                height = 17;
                delta = height;
                ctx.clearRect( 0, 0, c.width, c.height );
                for ( i = 0, l = this.layers.length; i < l; i++ ) {
                    layer = this.layers[ i ];
                    value = layer.getText( layer.average / this.numberUpdate );
                    layer.average = 0;
                    ctx.fillStyle = layer.color;
                    ctx.fillText( value, 0, delta );
                    delta += height;
                }
                this.numberUpdate = 0;
            }
            this.last_update = t;
        }
    };

    return Stats:
} );