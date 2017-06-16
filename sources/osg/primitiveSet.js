'use strict';
var primitiveSet = {};
primitiveSet.POINTS = 0x0000;
primitiveSet.LINES = 0x0001;
primitiveSet.LINE_LOOP = 0x0002;
primitiveSet.LINE_STRIP = 0x0003;
primitiveSet.TRIANGLES = 0x0004;
primitiveSet.TRIANGLE_STRIP = 0x0005;
primitiveSet.TRIANGLE_FAN = 0x0006;

module.exports = primitiveSet;
