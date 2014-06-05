command -v wintersmith >/dev/null 2>&1 || { echo >&2 "Please install Wintersmith:"; echo "npm install -g wintersmith wintersmith-nunjucks"; exit 1; }
wintersmith build --chdir web -o ../ --force
