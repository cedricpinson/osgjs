window.addEventListener("load",
                        function()
                        {

                            var objectInehrit = function(base, extras) {
                                function F(){}
                                F.prototype = base;
                                var obj = new F();
                                if(extras)  {objectMix(obj, extras, false); }
                                return obj;
                            };
                            var objectMix = function(obj, properties, test){
                                for (var key in properties) {
                                    if(!(test && obj[key])) { obj[key] = properties[key]; }
                                }
                                return obj;
                            };

                            var Key = function() {
                                Array.call(this);
                                this.time = 0.0;
                            };
                            Key.prototype = objectInehrit(Array.prototype, {
                                getTime: function() { return this.time; },
                                setTime: function(t) { this.time = t; }
                            });

                            var nbKeys = 1000;
                            var nbValue = 3;
                            var nbSamples = 10000000;

                            var keys0 = [];
                            //var keys1 = [];
                            var keys1 = new Array(1000*4);
                            //var keys1 = new Float32Array(1000*4);

                            (function() {
                                for (var i = 0, l = nbKeys; i < l; i++) {
                                    var k0 = new Key();
                                    k0.setTime(i*1.333333333333333333);
                                    for ( var j = 0, ll = nbValue; j < ll; j++) {
                                        k0[j] = j;
                                    }
                                    keys0.push(k0);
                                }
                            })();

                            (function() {
                                for (var i = 0, l = nbKeys; i < l; i++) {
                                    keys1[i*4] = i*1.333333333333333333;
                                    for (var j = 0, ll = nbValue; j < ll; j++) {
                                        keys1[i*4+(j+1)] = j;
                                    }
                                }
                            })();

                            var lerp = function(t, a0, a1, a2, b0, b1, b2, r) {
                                r[0] = a0 + (b0-a0)*t;
                                r[1] = a1 + (b1-a1)*t;
                                r[2] = a2 + (b2-a2)*t;
                                return r;
                            };

                            var cache0 = 0;
                            var getKeyIndexFromTime0 = function(keys, time, cache) {
                                // todo use a cache
                                var key_size = keys.length;
                                if (!key_size) {
                                    return -1;
                                }
                                var st = 0;
                                if (cache) {
                                    st = cache;
                                }
                                for (var i = st, l = key_size-1; i < l; i++) {
                                    var t0 = keys[i].time;
                                    var t1 = keys[i+1].time;

                                    if ( time >= t0 && time < t1 )
                                    {
                                        cache0 = i;
                                        return i;
                                    }
                                }
                                return -1;
                            };

                            var functor0 = function(keys, time, result) {
                                var keyEnd = keys[keys.length-1];
                                var endTime = keyEnd.time;
                                if (time >= endTime) {
                                    result[0] = keyEnd[0];
                                    result[1] = keyEnd[1];
                                    result[2] = keyEnd[2];
                                    return result;
                                } else {
                                    var keyStart = keys[0];
                                    var startTime = keyStart.time;
                                    
                                    if (time <= startTime) {
                                        result[0] = keyStart[0];
                                        result[1] = keyStart[1];
                                        result[2] = keyStart[2];
                                        return result;
                                    }
                                }

                                while (keys[cache0+1].time < time) {
                                    cache0++;
                                }
                                var i = cache0;
                                //var i = getKeyIndexFromTime0(keys, time, cache0);

                                var k0 = keys[i];
                                var k1 = keys[i+1];
                                var t0 = k0.time;
                                var t1 = k1.time;

                                var blend = (time - t0) / ( t1 -  t0);
                                result = lerp(blend, 
                                              k1[0], k1[1], k1[2],
                                              k0[0], k0[1], k0[2],
                                              result);
                                return result;
                            };

                            var cache1 = 0;
                            var getKeyIndexFromTime1 = function(keys, time, cache) {
                                // todo use a cache
                                var key_size = keys.length;
                                if (!key_size) {
                                    return -1;
                                }
                                var st = 0;
                                if (cache) {
                                    st = cache;
                                }
                                for (var i = st, l = key_size-4; i < l; i+=4) {
                                    var t0 = keys[i];
                                    var t1 = keys[i+4];

                                    if ( time >= t0 && time < t1 )
                                    {
                                        cache1 = i;
                                        return i;
                                    }
                                }
                                return -1;
                            };
                            var functor1 = function(keys, time, result) {

                                var keyEnd = keys.length-4;
                                var endTime = keyEnd[keyEnd];
                                if (time > (endTime-1e-4)) {
                                    result[0] = keys[keyEnd+1];
                                    result[1] = keys[keyEnd+2];
                                    result[2] = keys[keyEnd+3];
                                    return result;
                                }
                                if (time < keys[0]) {
                                    result[0] = keys[1];
                                    result[1] = keys[2];
                                    result[2] = keys[3];
                                    return result;
                                }

                                //var i = getKeyIndexFromTime1(keys, time, cache1);
                                while(keys[cache1+4] < time) {
                                    cache1 += 4;
                                }
                                var i = cache1;

                                var k0 = i;
                                var k1 = i+4;
                                var t0 = keys[k0];
                                var t1 = keys[k1];

                                var blend = (time - t0) / ( t1 -  t0);
                                result = lerp(blend, 
                                              keys[k1+1], keys[k1+2], keys[k1+3],
                                              keys[k0+1], keys[k0+2], keys[k0+3],
                                              result);
                                return result;
                            };

                            var ratio = nbKeys/nbSamples;
                            var time0;
                            var time1;
                            (function() {
                                var result = [2,1,0];
                                var t0 = (new Date()).getTime();
                                for (var i = 0, l = nbSamples; i < l; i++) {
                                    var t = i * ratio;
                                    functor0(keys0, t, result);
                                }
                                var t1 = (new Date()).getTime();
                                time0 = t1-t0;
                                document.getElementById("test0").innerHTML = time0;
                            })();

                            (function() {
                                var result = [2,1,0];
                                var t0 = (new Date()).getTime();
                                for (var i = 0, l = nbSamples; i < l; i++) {
                                    var t = i * ratio;
                                    functor1(keys1, t, result);
                                }
                                var t1 = (new Date()).getTime();
                                time1 = t1-t0;
                                document.getElementById("test1").innerHTML = time1;
                            })();

                            if (time0 > time1) {
                                r = (1.0-(time1/time0))*100.0;
                                content = "test0 is " + r + "% slower than test1";
                                content += "<br> test1 is " + r + "% faster than test0";
                                document.getElementById("ratio").innerHTML = content;
                            } else {
                                r = (1.0-(time0/time1))*100.0;
                                content = "test1 is " + r + "% slower than test0";
                                content += "<br> test0 is " + r + "% faster than test1";
                                document.getElementById("ratio").innerHTML = content;
                            }

                        }
                        ,true);
