/**
    An interface for object pools.
**/
exports = Class(function (supr) {
    this.init = function (opts) {
        // The parent view for all the pooled objects.
        var _parentView = opts.parent;

        // The all the objects with their status in this pool.
        var _boxedObjs = [];

        /** Public Functions */

        /**
            Spawns a new object from this pool. 
            If there is no available object currently, a new one will be created and added to the pool.
            @returns The spawned object.
        **/
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

        /**
            Despawns a given object managed by this pool.
            @param obj The object to despawn.
        **/
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

        /**
            Despawns all the objects managed by this pool.
        **/
        this.despawnAll = function() {
            for (var _i = 0; _i < _boxedObjs.length; ++_i) {
                _boxedObjs[_i].isActive = false;
                this.hideObj(_boxedObjs[_i].obj);
            }
        }

        /**
            Preloads a given amount of objects.
            @param amount The amount of objects to reload.
        **/
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