class NodeEntity {
    constructor(app) {
        this._id = app.createEntity();
        this._parent = null;
        this._children = [];
        this._name = 'noname';
        this._components = {};
        this._app = app;
        this._idTransform = this._app.addComponent(this._id, this._app._transformComponent);
    }

    addComponent() {}
    removeComponent() {}
    getComponents() {}

    addChild(child) {
        if (this._children.indexOf(child) !== -1) return;
        this._children.push(child);
        this._app.notifyAddChild(this._idTransform, child._idTransform);
    }
    removeChild(child) {
        var index = this._children.indexOf(child);
        if (index === -1) return;
        this._children.splice(child, 1);
        this._app.notifyRemoveChild(this._idTransform, child._idTransform);
    }

    getParent() {}
    getChildren() {}

    setMask() {}
    getMask() {}

    findByName() {}

    // problem is that this method can be a shortcut to get/create Transform component
    // could be lazy component creation
    setMatrix(matrix) {
        this._transformComponent.setMatrix(this._idTransform, matrix);
        this._dirtyChildrenWorldTransform();
        let geometryId = this._app.getComponentResource(this._id, this._app._geometryComponent);
        if (geometryId !== undefined) {
            this._app._geometryComponent.dirtyBoundbingBox(geometryId);
        }
    }
    getMatrix() {
        return this._transformComponent.getMatrix(this._idTransform);
    }
}

export default NodeEntity;
