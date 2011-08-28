/** -*- compile-command: "jslint-cli Interpolator.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
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
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */


/** 
 *  Interpolator provide interpolation function to sampler
 */
osgAnimation.Vec3LerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value[0] = keyEnd[0];
        result.value[1] = keyEnd[1];
        result.value[2] = keyEnd[2];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value[0] = keyStart[0];
            result.value[1] = keyStart[1];
            result.value[2] = keyStart[2];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    var y1=keys[i1][1];
    var z1=keys[i1][2];
    
    var t2=keys[i2].t;
    var x2=keys[i2][0];
    var y2=keys[i2][1];
    var z2=keys[i2][2];
    
    var r = (t-t1)/(t2-t1);

    result.value[0] = x1+(x2-x1)*r;
    result.value[1] = y1+(y2-y1)*r;
    result.value[2] = z1+(z2-z1)*r;
    result.key = i1;
};


osgAnimation.QuatLerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value[0] = keyEnd[0];
        result.value[1] = keyEnd[1];
        result.value[2] = keyEnd[2];
        result.value[3] = keyEnd[3];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value[0] = keyStart[0];
            result.value[1] = keyStart[1];
            result.value[2] = keyStart[2];
            result.value[3] = keyStart[3];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    var y1=keys[i1][1];
    var z1=keys[i1][2];
    var w1=keys[i1][3];
    
    var t2=keys[i2].t;
    var x2=keys[i2][0];
    var y2=keys[i2][1];
    var z2=keys[i2][2];
    var w2=keys[i2][3];
    
    var r = (t-t1)/(t2-t1);

    result.value[0] = x1+(x2-x1)*r;
    result.value[1] = y1+(y2-y1)*r;
    result.value[2] = z1+(z2-z1)*r;
    result.value[3] = w1+(w2-w1)*r;
    result.key = i1;
};

osgAnimation.QuatSlerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value[0] = keyEnd[0];
        result.value[1] = keyEnd[1];
        result.value[2] = keyEnd[2];
        result.value[3] = keyEnd[3];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value[0] = keyStart[0];
            result.value[1] = keyStart[1];
            result.value[2] = keyStart[2];
            result.value[3] = keyStart[3];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var t2=keys[i2].t;
    var r = (t-t1)/(t2-t1);

    osg.Quat.slerp(r, keys[i1], keys[i2], result.value);
    result.key = i1;
};


/** 
 *  Interpolator provide interpolation function to sampler
 */
osgAnimation.FloatLerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value = keyEnd[0];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value = keyStart[0];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    
    var t2=keys[i2].t;
    var x2=keys[i2][0];
    
    var r = (t-t1)/(t2-t1);
    result.value = x1+(x2-x1)*r;
    result.key = i1;
};


/** 
 *  Interpolator provide interpolation function to sampler
 */
osgAnimation.FloatStepInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value = keyEnd[0];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value = keyStart[0];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    result.value = x1;
    result.key = i1;
};
