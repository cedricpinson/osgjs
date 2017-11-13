set -x
path="$(dirname $(realpath $0) )"
build_dir="$(realpath ${path}/../builds/web)"

mkdir -p "${build_dir}"
rm -rf "${build_dir}/*"
git clone ../ --branch master --single-branch "${build_dir}/osg-clone"
cd "${build_dir}/osg-clone"

# tell gh-pages to do ignores vendors or node_modules
touch "${build_dir}/.nojekyll"

npm install
grunt sync

mkdir -p "${build_dir}/node_modules/mocha"
cp node_modules/mocha/mocha.* "${build_dir}/node_modules/mocha"

mkdir -p "${build_dir}/node_modules/hammerjs/"
cp node_modules/hammerjs/hammer.min.js "${build_dir}/node_modules/hammerjs/hammer.min.js"

mkdir -p "${build_dir}/node_modules/bluebird/js/browser/"
cp node_modules/bluebird/js/browser/bluebird.min.js "${build_dir}/node_modules/bluebird/js/browser/bluebird.min.js"

mkdir -p "${build_dir}/node_modules/jquery/dist/"
cp node_modules/jquery/dist/jquery.min.js "${build_dir}/node_modules/jquery/dist/jquery.min.js"

mkdir -p "${build_dir}/node_modules/dat.gui/build/"
cp node_modules/dat.gui/build/dat.gui.min.js "${build_dir}/node_modules/dat.gui/build/dat.gui.min.js"

mkdir -p "${build_dir}/node_modules/hammerjs/"
cp node_modules/hammerjs/hammer.min.js "${build_dir}/node_modules/hammerjs/hammer.min.js"

mkdir -p "${build_dir}/node_modules/zlibjs/bin/"
cp node_modules/zlibjs/bin/gunzip.min.js "${build_dir}/node_modules/zlibjs/bin/gunzip.min.js"

mkdir -p "${build_dir}/node_modules/d3/build/"
cp node_modules/d3/build/d3.min.js "${build_dir}/node_modules/d3/build/d3.min.js"

mkdir -p "${build_dir}/node_modules/dagre/dist/"
cp node_modules/dagre/dist/dagre.min.js "${build_dir}/node_modules/dagre/dist/dagre.min.js"

grunt build docs

build_dist="${build_dir}/osg-clone/builds"
build_docs="${build_dir}/osg-clone/docs"
rsync -avh \
      "${build_dist}" \
      "${build_docs}" \
      "${build_dir}/osg-clone/examples" \
      "${build_dir}/osg-clone/tests" \
      "${build_dir}/osg-clone/benchmarks" \
      "${build_dir}/"



npm install wintersmith wintersmith-nunjucks
cd website
cp CNAME "${build_dir}"
node build-wintersmith.js "${build_dir}"
# node build-wintersmith.js build --chdir web -o "${build_dir}" --force
echo "you can test the website with the following commmand"
echo "grunt serve"
echo "open http://0.0.0.0:9000/builds/web/"
