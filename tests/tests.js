import 'OSG';
import osg from 'tests/osg/osgTests';
import osgAnimation from 'tests/osgAnimation/osgAnimationTests';
import osgDB from 'tests/osgDB/osgDBTests';
import osgGA from 'tests/osgGA/osgGATests';
import osgUtil from 'tests/osgUtil/osgUtilTests';
import osgViewer from 'tests/osgViewer/osgViewerTests';
import osgShader from 'tests/osgShader/osgShaderTests';
import osgShadow from 'tests/osgShadow/osgShadowTests';
import osgText from 'tests/osgText/osgTextTests';
import osgWrappers from 'tests/osgWrappers/osgWrappersTests';

suite('osgWrappers');
osgWrappers();

suite('osgText');
osgText();

suite('osgShadow');
osgShadow();

suite('osgShader');
osgShader();

suite('osgViewer');
osgViewer();

suite('osgUtil');
osgUtil();

suite('osgGA');
osgGA();

suite('osgDB');
osgDB();

suite('osg');
osg();

suite('osgAnimation');
osgAnimation();
