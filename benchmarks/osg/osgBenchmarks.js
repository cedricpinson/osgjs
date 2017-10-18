import MainPerformance from 'benchmarks/osg/mainPerformance';
import Geometry from 'benchmarks/osg/Geometry';
import Visitor from 'benchmarks/osg/Visitor';

export default function() {
    suite('MainPerformance');
    MainPerformance();

    suite('Visitor');
    Visitor();

    suite('Geometry');
    Geometry();
}
