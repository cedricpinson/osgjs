import pkg from 'json-loader!../package.json';

export default {
    name: pkg.name,
    version: pkg.version,
    author: pkg.author
};
