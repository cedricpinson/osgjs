define( [
    'osg/Timer'

], function ( Timer ) {

    'use strict';

    var CanvasStats = function ( canvas, textCanvas ) {
        this.layers = [];
        this.lastUpdate = undefined;
        this.canvas = canvas;
        this.textCanvas = textCanvas;
        this.numberUpdate = 0;
    };

    CanvasStats.prototype = {

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


        updateGraph: function ( t ) {
            //4.0 * 60.0 / 1000.0;
            var constStep = 0.12;
            var delta = Timer.instance().deltaM( this.lastUpdate, t ) * constStep;
            if ( delta >= 1.0 ) {

                t -= ( delta - Math.floor( delta ) ) / constStep;
                delta = Math.floor( delta );

                var c = this.canvas;
                var ctx = c.getContext( '2d' );

                var myImageData = ctx.getImageData( delta, 0, c.width - delta, c.height );
                ctx.putImageData( myImageData, 0, 0 );
                ctx.clearRect( c.width - delta, 0, delta, c.height );

                for ( var i = 0, l = this.layers.length; i < l; i++ ) {
                    var layer = this.layers[ i ];
                    var value = layer.getValue( t );
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
        },


        updateText: function () {

            if ( this.numberUpdate % 60 === 0 ) {
                var c = this.textCanvas;
                var ctx = c.getContext( '2d' );
                ctx.font = '14px Sans';
                var height = 17;
                var delta = height;
                ctx.clearRect( 0, 0, c.width, c.height );
                for ( var i = 0, l = this.layers.length; i < l; i++ ) {
                    var layer = this.layers[ i ];
                    var value = layer.getText( layer.average / this.numberUpdate );
                    layer.average = 0;
                    ctx.fillStyle = layer.color;
                    ctx.fillText( value, 0, delta );
                    delta += height;
                }
                this.numberUpdate = 0;
            }
        },

        update: function () {

            var t = Timer.instance().tick();
            if ( this.lastUpdate === undefined ) {
                this.lastUpdate = t;
            }

            this.numberUpdate++;
            for ( var j = 0; j < this.layers.length; j++ ) {
                var layer = this.layers[ j ];
                var value = layer.getValue( t );
                layer.average += value;
            }

            if ( this.canvas )
                this.updateGraph( t );

            if ( this.textCanvas )
                this.updateText( t );

            this.lastUpdate = t;
        }
    };

    return CanvasStats;
} );
