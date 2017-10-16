import P from 'bluebird';
import osgWrapper from 'osgWrappers/serializers/osg';
import notify from 'osg/notify';
import Text from 'osgText/Text';

var osgTextWrapper = {};

osgTextWrapper.Text = function(input, node) {
    var jsonObj = input.getJSON();
    if (!jsonObj.Text) return P.reject();

    var promise = osgWrapper.Node(input, node);
    node.setColor(jsonObj.Color);
    node.setText(jsonObj.Text);
    node.setAutoRotateToScreen(jsonObj.AutoRotateToScreen);
    node.setPosition(jsonObj.Position);
    node.setCharacterSize(jsonObj.CharacterSize);

    if (jsonObj.Layout === 'VERTICAL') {
        notify.error('Vertical Alignment not supported');
        return P.reject();
    }
    var alignment = jsonObj.Alignment;
    if (jsonObj.Alignment.indexOf('BASE_LINE') > -1) {
        if (jsonObj.Alignment === 'LEFT_BASE_LINE') {
            alignment = Text.LEFT_CENTER;
        } else if (jsonObj.Alignment === 'CENTER_BASE_LINE') {
            alignment = Text.CENTER_CENTER;
        } else if (jsonObj.Alignment === 'RIGHT_BASE_LINE') {
            alignment = Text.RIGHT_CENTER;
        } else if (jsonObj.Alignment === 'LEFT_BOTTOM_BASE_LINE') {
            alignment = Text.LEFT_BOTTOM;
        } else if (jsonObj.Alignment === 'CENTER_BOTTOM_BASE_LINE') {
            alignment = Text.CENTER_BOTTOM;
        } else if (jsonObj.Alignment === 'RIGHT_BOTTOM_BASE_LINE') {
            alignment = Text.RIGHT_BOTTOM;
        }
        /*develblock:start*/
        notify.log('Base line alignments not supported, alignment converted');
        /*develblock:end*/
    }
    node.setAlignment(alignment);
    node.setLayout(jsonObj.Layout);

    return promise;
};

export default osgTextWrapper;
