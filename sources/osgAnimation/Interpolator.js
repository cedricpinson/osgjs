define( [
    'osg/Quat',
    'osg/Vec3'
], function ( Quat, Vec3 ) {


    'use strict';

    /**
     *  Interpolator provide interpolation function to sampler
     */
    var Vec3LerpInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value[ 0 ] = keyEnd[ 0 ];
            result.value[ 1 ] = keyEnd[ 1 ];
            result.value[ 2 ] = keyEnd[ 2 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value[ 0 ] = keyStart[ 0 ];
                result.value[ 1 ] = keyStart[ 1 ];
                result.value[ 2 ] = keyStart[ 2 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];
        var y1 = keys[ i1 ][ 1 ];
        var z1 = keys[ i1 ][ 2 ];

        var t2 = keys[ i2 ].t;
        var x2 = keys[ i2 ][ 0 ];
        var y2 = keys[ i2 ][ 1 ];
        var z2 = keys[ i2 ][ 2 ];

        var r = ( t - t1 ) / ( t2 - t1 );

        result.value[ 0 ] = x1 + ( x2 - x1 ) * r;
        result.value[ 1 ] = y1 + ( y2 - y1 ) * r;
        result.value[ 2 ] = z1 + ( z2 - z1 ) * r;
        result.key = i1;
    };

    var QuatLerpInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value[ 0 ] = keyEnd[ 0 ];
            result.value[ 1 ] = keyEnd[ 1 ];
            result.value[ 2 ] = keyEnd[ 2 ];
            result.value[ 3 ] = keyEnd[ 3 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value[ 0 ] = keyStart[ 0 ];
                result.value[ 1 ] = keyStart[ 1 ];
                result.value[ 2 ] = keyStart[ 2 ];
                result.value[ 3 ] = keyStart[ 3 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];
        var y1 = keys[ i1 ][ 1 ];
        var z1 = keys[ i1 ][ 2 ];
        var w1 = keys[ i1 ][ 3 ];

        var t2 = keys[ i2 ].t;
        var x2 = keys[ i2 ][ 0 ];
        var y2 = keys[ i2 ][ 1 ];
        var z2 = keys[ i2 ][ 2 ];
        var w2 = keys[ i2 ][ 3 ];

        var r = ( t - t1 ) / ( t2 - t1 );

        result.value[ 0 ] = x1 + ( x2 - x1 ) * r;
        result.value[ 1 ] = y1 + ( y2 - y1 ) * r;
        result.value[ 2 ] = z1 + ( z2 - z1 ) * r;
        result.value[ 3 ] = w1 + ( w2 - w1 ) * r;
        result.key = i1;
    };

    var QuatSlerpInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value[ 0 ] = keyEnd[ 0 ];
            result.value[ 1 ] = keyEnd[ 1 ];
            result.value[ 2 ] = keyEnd[ 2 ];
            result.value[ 3 ] = keyEnd[ 3 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value[ 0 ] = keyStart[ 0 ];
                result.value[ 1 ] = keyStart[ 1 ];
                result.value[ 2 ] = keyStart[ 2 ];
                result.value[ 3 ] = keyStart[ 3 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var t2 = keys[ i2 ].t;
        var r = ( t - t1 ) / ( t2 - t1 );

        Quat.slerp( r, keys[ i1 ], keys[ i2 ], result.value );
        result.key = i1;
    };

    /**
     *  Interpolator provide interpolation function to sampler
     */
    var FloatLerpInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value = keyEnd[ 0 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value = keyStart[ 0 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];

        var t2 = keys[ i2 ].t;
        var x2 = keys[ i2 ][ 0 ];

        var r = ( t - t1 ) / ( t2 - t1 );
        result.value = x1 + ( x2 - x1 ) * r;
        result.key = i1;
    };

    /**
     *  Interpolator provide interpolation function to sampler
     */
    var FloatStepInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value = keyEnd[ 0 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value = keyStart[ 0 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        //var i2 = i1 + 1;

        //var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];
        result.value = x1;
        result.key = i1;
    };

    var FloatCubicBezierInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;

        if ( t >= endTime ) {
            result.key = 0;
            result.value = keyEnd[ 0 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value = keyStart[ 0 ];
                return;
            }
        }

        var i = result.key; /*0*/
        while ( keys[ i + 1 ].t < t ) {
            i++;
        }

        var tt = ( t - keys[ i ].t ) / ( keys[ i + 1 ].t - keys[ i ].t );
        var oneMinusT = 1.0 - tt;
        var oneMinusT2 = oneMinusT * oneMinusT;
        var oneMinusT3 = oneMinusT2 * oneMinusT;
        var t2 = tt * tt;

        var v0 = keys[ i ][ 0 ] * oneMinusT3;
        var v1 = keys[ i ][ 1 ] * ( 3.0 * tt * oneMinusT2 );
        var v2 = keys[ i ][ 2 ] * ( 3.0 * t2 * oneMinusT );
        var v3 = keys[ i + 1 ][ 0 ] * ( t2 * tt );

        result.key = i;
        result.value = v0 + v1 + v2 + v3;
    };

    var Vec3CubicBezierInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;

        if ( t >= endTime ) {
            result.key = 0;
            result.value[ 0 ] = keyEnd[ 0 ][ 0 ];
            result.value[ 1 ] = keyEnd[ 0 ][ 1 ];
            result.value[ 2 ] = keyEnd[ 0 ][ 2 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value[ 0 ] = keyStart[ 0 ][ 0 ];
                result.value[ 1 ] = keyStart[ 0 ][ 1 ];
                result.value[ 2 ] = keyStart[ 0 ][ 2 ];
                return;
            }
        }

        var i = result.key; /*0*/
        while ( keys[ i + 1 ].t < t ) {
            i++;
        }

        var tt = ( t - keys[ i ].t ) / ( keys[ i + 1 ].t - keys[ i ].t );
        var oneMinusT = 1.0 - tt;
        var oneMinusT2 = oneMinusT * oneMinusT;
        var oneMinusT3 = oneMinusT2 * oneMinusT;
        var t2 = tt * tt;

        var v0 = Vec3.create(),
            v1 = Vec3.create(),
            v2 = Vec3.create(),
            v3 = Vec3.create();

        Vec3.mult( keys[ i ][ 0 ], oneMinusT3, v0 );
        Vec3.mult( keys[ i ][ 1 ], ( 3.0 * tt * oneMinusT2 ), v1 );
        Vec3.mult( keys[ i ][ 2 ], ( 3.0 * t2 * oneMinusT ), v2 );
        Vec3.mult( keys[ i + 1 ][ 0 ], ( t2 * tt ), v3 );

        result.key = i;
        result.value[ 0 ] = v0[ 0 ] + v1[ 0 ] + v2[ 0 ] + v3[ 0 ];
        result.value[ 1 ] = v0[ 1 ] + v1[ 1 ] + v2[ 1 ] + v3[ 1 ];
        result.value[ 2 ] = v0[ 2 ] + v1[ 2 ] + v2[ 2 ] + v3[ 2 ];
    };

    /* void getValue(const TemplateKeyframeContainer<KEY>& keyframes, double time, TYPE& result) const
       {

           if (time >= keyframes.back().getTime())
           {
               result = keyframes.back().getValue().getPosition();
               return;
           }
           else if (time <= keyframes.front().getTime())
           {
               result = keyframes.front().getValue().getPosition();
               return;
           }

           int i = this->getKeyIndexFromTime(keyframes,time);

           float t = (time - keyframes[i].getTime()) / ( keyframes[i+1].getTime() -  keyframes[i].getTime());
           float one_minus_t = 1.0-t;
           float one_minus_t2 = one_minus_t * one_minus_t;
           float one_minus_t3 = one_minus_t2 * one_minus_t;
           float t2 = t * t;

           TYPE v0 = keyframes[i].getValue().getPosition() * one_minus_t3;
           TYPE v1 = keyframes[i].getValue().getControlPointIn() * (3.0 * t * one_minus_t2);
           TYPE v2 = keyframes[i].getValue().getControlPointOut() * (3.0 * t2 * one_minus_t);
           TYPE v3 = keyframes[i+1].getValue().getPosition() * (t2 * t);

           result = v0 + v1 + v2 + v3;
       }*/

    return {
        Vec3LerpInterpolator: Vec3LerpInterpolator,
        QuatLerpInterpolator: QuatLerpInterpolator,
        QuatSlerpInterpolator: QuatSlerpInterpolator,
        FloatLerpInterpolator: FloatLerpInterpolator,
        FloatStepInterpolator: FloatStepInterpolator,
        FloatCubicBezierInterpolator: FloatCubicBezierInterpolator,
        Vec3CubicBezierInterpolator: Vec3CubicBezierInterpolator
    };
} );
