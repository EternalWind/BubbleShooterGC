exports = Class(function (supr) {
    this.init = function (opts) {
        var _parentView = opts.parent;
        var _boxedObjs = [];

        /** Public Functions */

        this.spawn = function() {
            var _boxedObj = _boxedObjs.find(function(b) {
                return !b.isActive;
            });

            if (!_boxedObj) {
                _boxedObj = {
                    obj: this.createObj(_parentView),
                    isActive: false
                };
                this.hideObj(_boxedObj.obj);

                _boxedObjs.push(_boxedObj);
            }

            _boxedObj.isActive = true;
            this.showObj(_boxedObj.obj);

            return _boxedObj.obj;
        };

        this.despawn = function(obj) {
            var _boxedObj = _boxedObjs.find(function(b) {
                return b.obj == obj;
            });

            if (!_boxedObj) {
                console.log("Cannot find a boxed version for a given object! This should never happen.");
            } else {
                _boxedObj.isActive = false;
                this.hideObj(_boxedObj.obj);
            }
        }

        this.despawnAll = function() {
            for (var _i = 0; _i < _boxedObjs.length; ++_i) {
                _boxedObjs[_i].isActive = false;
                this.hideObj(_boxedObjs[_i].obj);
            }
        }

        this.preload = function (amount) {
            for (var _i = 0; _i < amount; ++_i) {
                var _boxedObj = {
                    obj: this.createObj(_parentView),
                    isActive: false
                };
                this.hideObj(_boxedObj.obj);

                _boxedObjs.push(_boxedObj);
            }
        }

        /** End of Public Functions **/
    };
});