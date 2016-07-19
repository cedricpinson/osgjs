path="$(dirname $(realpath $0) )"
build_dir="$(realpath ${path}/../builds/web)"

mkdir -p "${build_dir}"
rm -rf "${build_dir}/*"
git clone ../ --branch master --single-branch "${build_dir}/osg-clone"
cd "${build_dir}/osg-clone"

npm install
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


cd ${path}
cp CNAME "${build_dir}/"

npm install wintersmith wintersmith-nunjucks
node build-wintersmith.js "${build_dir}"
# node build-wintersmith.js build --chdir web -o "${build_dir}" --force
echo "you can test the website with the following commmand"
echo "grunt serve"
echo "open http://0.0.0.0:9000/builds/web/"
