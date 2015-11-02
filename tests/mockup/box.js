'use strict';

var getBoxScene = function () {
    return {
        'children': [ {
            'children': [ {
                'children': [ {
                    'attributes': {
                        'Normal': {
                            'elements': [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        },
                        'Vertex': {
                            'elements': [ -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        }
                    },
                    'name': '',
                    'primitives': [ {
                        'indices': {
                            'elements': [ 0, 1, 2, 2, 3, 0 ],
                            'itemSize': 1,
                            'type': 'ELEMENT_ARRAY_BUFFER'
                        },
                        'mode': 'TRIANGLES'
                    } ],
                    'stateset': {
                        'material': {
                            'ambient': [ 0, 0, 1, 1 ],
                            'diffuse': [ 0, 0, 1, 1 ],
                            'emission': [ 0, 0, 0, 1 ],
                            'name': 'Plane',
                            'shininess': 64,
                            'specular': [ 0, 0, 0, 0 ]
                        }
                    }
                } ],
                'name': 'Plane'
            }, {
                'children': [ {
                    'attributes': {
                        'Normal': {
                            'elements': [ 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        },
                        'Vertex': {
                            'elements': [ -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        }
                    },
                    'name': '',
                    'primitives': [ {
                        'indices': {
                            'elements': [ 0, 1, 2, 2, 3, 0 ],
                            'itemSize': 1,
                            'type': 'ELEMENT_ARRAY_BUFFER'
                        },
                        'mode': 'TRIANGLES'
                    } ],
                    'stateset': {
                        'material': {
                            'ambient': [ 0, 0, 1, 1 ],
                            'diffuse': [ 0, 0, 1, 1 ],
                            'emission': [ 0, 0, 0, 1 ],
                            'name': 'Plane',
                            'shininess': 64,
                            'specular': [ 0, 0, 0, 0 ]
                        }
                    }
                } ],
                'name': 'Plane_001'
            }, {
                'children': [ {
                    'attributes': {
                        'Normal': {
                            'elements': [ 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        },
                        'Vertex': {
                            'elements': [ -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        }
                    },
                    'name': '',
                    'primitives': [ {
                        'indices': {
                            'elements': [ 0, 1, 2, 2, 3, 0 ],
                            'itemSize': 1,
                            'type': 'ELEMENT_ARRAY_BUFFER'
                        },
                        'mode': 'TRIANGLES'
                    } ],
                    'stateset': {
                        'material': {
                            'ambient': [ 0, 1, 0, 1 ],
                            'diffuse': [ 0, 1, 0, 1 ],
                            'emission': [ 0, 0, 0, 1 ],
                            'name': 'Plane_002',
                            'shininess': 64,
                            'specular': [ 0, 0, 0, 0 ]
                        }
                    }
                } ],
                'name': 'Plane_002'
            }, {
                'children': [ {
                    'attributes': {
                        'Normal': {
                            'elements': [ 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        },
                        'Vertex': {
                            'elements': [ -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        }
                    },
                    'name': '',
                    'primitives': [ {
                        'indices': {
                            'elements': [ 0, 1, 2, 2, 3, 0 ],
                            'itemSize': 1,
                            'type': 'ELEMENT_ARRAY_BUFFER'
                        },
                        'mode': 'TRIANGLES'
                    } ],
                    'stateset': {
                        'material': {
                            'ambient': [ 0, 1, 0, 1 ],
                            'diffuse': [ 0, 1, 0, 1 ],
                            'emission': [ 0, 0, 0, 1 ],
                            'name': 'Plane_002',
                            'shininess': 64,
                            'specular': [ 0, 0, 0, 0 ]
                        }
                    }
                } ],
                'name': 'Plane_003'
            }, {
                'children': [ {
                    'attributes': {
                        'Normal': {
                            'elements': [ 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        },
                        'Vertex': {
                            'elements': [ 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        }
                    },
                    'name': '',
                    'primitives': [ {
                        'indices': {
                            'elements': [ 0, 1, 2, 2, 3, 0 ],
                            'itemSize': 1,
                            'type': 'ELEMENT_ARRAY_BUFFER'
                        },
                        'mode': 'TRIANGLES'
                    } ],
                    'stateset': {
                        'material': {
                            'ambient': [ 1, 0, 0, 1 ],
                            'diffuse': [ 1, 0, 0, 1 ],
                            'emission': [ 0, 0, 0, 1 ],
                            'name': 'Plane_004',
                            'shininess': 64,
                            'specular': [ 0, 0, 0, 0 ]
                        }
                    }
                } ],
                'name': 'Plane_004'
            }, {
                'children': [ {
                    'attributes': {
                        'Normal': {
                            'elements': [ -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        },
                        'Vertex': {
                            'elements': [ -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1 ],
                            'itemSize': 3,
                            'type': 'ARRAY_BUFFER'
                        }
                    },
                    'name': '',
                    'primitives': [ {
                        'indices': {
                            'elements': [ 0, 1, 2, 2, 3, 0 ],
                            'itemSize': 1,
                            'type': 'ELEMENT_ARRAY_BUFFER'
                        },
                        'mode': 'TRIANGLES'
                    } ],
                    'stateset': {
                        'material': {
                            'ambient': [ 1, 0, 0, 1 ],
                            'diffuse': [ 1, 0, 0, 1 ],
                            'emission': [ 0, 0, 0, 1 ],
                            'name': 'Plane_004',
                            'shininess': 64,
                            'specular': [ 0, 0, 0, 0 ]
                        }
                    }
                } ],
                'name': 'Plane_005'
            } ],
            'name': 'box.osg'
        } ]
    };
};

module.exports = getBoxScene;
