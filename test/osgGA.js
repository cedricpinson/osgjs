module("osgGA");
test("osgGA.OrbitManipulator", function() {
    var manipulator = new osgGA.OrbitManipulator();
    var matrix = manipulator.getInverseMatrix();
    ok(matrix !== undefined, "check getInverseMatrix method");
});

test("osgGA.FirstPersonManipulator", function() {
    var manipulator = new osgGA.FirstPersonManipulator();
    var matrix = manipulator.getInverseMatrix();
    ok(matrix !== undefined, "check getInverseMatrix method");
});


test("osgGA.OrbitManipulator check devices", function() {
    var manipulator = new osgGA.OrbitManipulator();
    var devices = manipulator.getInputDeviceSupported();
    ok(devices.Mouse !== undefined, "check mouse support");
    ok(devices.LeapMotion !== undefined, "check leapmotion support");
});
