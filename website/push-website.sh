path="$(dirname $(realpath $0) )"
build_dir="$(realpath ${path}/../builds/web)"

cd "${build_dir}"
rm -rf osg-clone

echo "OSGJS WEBSITE" >README
rm -rf .git
git init
git add README
git commit -m"ReadMe"
git branch gh-pages
git checkout gh-pages
git add -Av .
git commit -m"Update website"
git remote add origin git@github.com:cedricpinson/osgjs-website.git
git push -u origin gh-pages --force
