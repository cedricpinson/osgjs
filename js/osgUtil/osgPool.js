/** -*- compile-command: "jslint-cli osgUtil.js" -*-
 * Authors:
 *  Tuan.kuranes <tuan.kuranes@gmail.com> Jerome Etienne <Jerome.etienne@gmail.com>
 *  TODO: Add stats & reports for developper per application  finer calibration (max, min, average)
 *  TODO: Debug Mode: check if not putting object twice, etc.
 */
var OsgObjectMemoryPool = function(pooledObjectClassName) {
        return {
            _mempool: [],
            reset: function() {
                this._mempool = [];
                return this;
            },
            put: function(obj) {
                this._mempool.push(obj);
            },
            get: function() {
                if(this._mempool.length > 0) return this._mempool.pop();
                this.grow();
                return this.get();
            },
            grow: function(sizeAdd) {
                if(sizeAdd === undefined) sizeAdd = this._mempool.length * 2;
                var i = this._mempool.length;
                while(i++ < sizeAdd) this._mempool.push(new pooledObjectClassName());
                return this;
            }
        };
    };

