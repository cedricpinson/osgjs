import Shape from 'osg/shape';
import Timer from 'osg/Timer';
import reportStats from 'benchmarks/reportStats';

export default function() {
    test('ComputeBound', function() {
        // 250 * 250 * 6 = 375k vertices (draw arrays...)
        var geom = Shape.createTexturedSphere(1.0, 250, 250);
        var timed = Timer.instance().tick();

        console.profile();
        console.time('time');

        var nCount = 5;
        for (var n = 0; n < nCount; n++) {
            geom.dirtyBound();
            geom.getBound();
        }

        console.timeEnd('time');
        console.profileEnd();

        timed = Timer.instance().tick() - timed;

        reportStats(timed, 'ComputeBound');
    });
}
