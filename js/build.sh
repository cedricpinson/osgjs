r.js -o baseUrl=. name=almond include=OSG  insertRequire=OSG out=main-built.js preserveLicenseComments=false
echo "var OSG = require('OSG');" >> main-built.js