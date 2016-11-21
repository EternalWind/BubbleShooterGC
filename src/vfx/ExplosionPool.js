import src.vfx.Explosion as Explosion;
import src.helpers.ParticleImageProvider as ParticleImageProvider;
import src.helpers.Pool as Pool;

exports = Class(Pool, function (supr) {
    this.init = function (opts) {
        supr(this, 'init', [opts]);

        var _imgProvider = new ParticleImageProvider();

        /** Public Functions */

        this.createObj = function(parent) {
            return new Explosion({
                superview: parent,
                particleImgProvider: _imgProvider
            });
        };

        this.showObj = function(obj) {
            obj.show();
        };

        this.hideObj = function(obj) {
            obj.stop();
            obj.hide();
        };

        /** End of Public Functions **/ 
    };
});