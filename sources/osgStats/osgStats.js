import Stats from 'osgStats/Stats';
import BufferStats from 'osgStats/BufferStats';
import Graph from 'osgStats/Graph';
import TextGenerator from 'osgStats/TextGenerator';
import Counter from 'osgStats/Counter';
import defaultStats from 'osgStats/defaultStats';
import browserStats from 'osgStats/browserStats';
import glStats from 'osgStats/glStats';

var osgStats = {
    Stats: Stats,
    BufferStats: BufferStats,
    Graph: Graph,
    TextGenerator: TextGenerator,
    Counter: Counter,
    defaultStats: defaultStats,
    browserStats: browserStats,
    glStats: glStats
};

export default osgStats;
