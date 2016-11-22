import src.vfx.ParticleEngine as ParticleEngine;
import src.vfx.Explosion as Explosion;
import src.helpers.ParticleImageProvider as ParticleImageProvider;
import src.helpers.Pool as Pool;

/**
    A pool for managing explosion effects' life cycles and recycling them.
**/
exports = Class(Pool, function (supr) {
    this.init = function (opts) {
        supr(this, 'init', [opts]);

        var _imgProvider = new ParticleImageProvider();
        var _particleEngine = new ParticleEngine({
            parent: opts.parent,
            centerAnchor: true,
            zIndex: 5
        });

        /** Public Functions */

        /**
            @see Pool.createObj
        **/
        this.createObj = function(parent) {
            return new Explosion({
                superview: parent,
                particleImgProvider: _imgProvider,
                particleEngine: _particleEngine
            });
        };

        /**
            @see Pool.showObj
        **/
        this.showObj = function(obj) {
            obj.show();
        };

        /**
            @see Pool.hideObj
        **/
        this.hideObj = function(obj) {
            obj.stop();
            obj.hide();
        };

        /**
            Resets all the explosion effects managed by this pool.
        **/
        this.reset = function() {
            _particleEngine.killAllParticles();
        };

        /** End of Public Functions **/ 
    };
});