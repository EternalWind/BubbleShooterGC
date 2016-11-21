import ui.ParticleEngine as ParticleEngine;

import src.vfx.Explosion as Explosion;
import src.helpers.ParticleImageProvider as ParticleImageProvider;
import src.helpers.Pool as Pool;

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

        this.createObj = function(parent) {
            return new Explosion({
                superview: parent,
                particleImgProvider: _imgProvider,
                particleEngine: _particleEngine
            });
        };

        this.showObj = function(obj) {
            obj.show();
        };

        this.hideObj = function(obj) {
            obj.stop();
            obj.hide();
        };

        this.reset = function() {
            _particleEngine.killAllParticles();
        };

        /** End of Public Functions **/ 
    };
});