import ui.View as View;
import ui.ImageView as ImageView;
import ui.Engine as Engine;
import math.geom.Vec2D as Vec2D;
import animate;

/**
    A class to control the explosion effect.
**/
exports = Class(View, function(supr) {
    // Time to live for a particle.
    var TTL = 8000;

    // The rotation angle to change at every tick for a particle.
    var DELTA_ROTATION = Math.PI / 18;

    // The radius of a particle.
    var SIZE = 25;

    // The moving speed of a particle.
    var SPEED = 12;

    this.init = function(opts) {
        opts.zIndex = 5;
        supr(this, 'init', [opts]);

        var _particleEngine = opts.particleEngine;

        var _isEnabled = false;
        var _particleImgProvider = opts.particleImgProvider;
        var _animator = animate(this);

        /** Private Functions **/
        
        /**
            Emits serveral particles at current position.
        **/
        function _emitParticles() {
            // obtain 10 particle objects from particle engine
            var _data = _particleEngine.obtainParticleArray(10);

            // iterate through particle objects
            for (var _i = 0; _i < 10; _i++) {
                // take particle object i
                var _pObj = _data[_i];
                var _angle = _i / 10 * 2 * Math.PI;
                var _dir = new Vec2D({ x: Math.cos(_angle), y: -Math.sin(_angle) }).getUnitVector();
                var _velocity = _dir.multiply(SPEED);

                _pObj.image = _particleImgProvider.getImageFor(_type);
                _pObj.x = this.style.x;
                _pObj.y = this.style.y;
                _pObj.dr = DELTA_ROTATION * 1000 / TTL;
                _pObj.dx = _velocity.x;
                _pObj.dy = _velocity.y;
                _pObj.width = SIZE * 2;
                _pObj.height = SIZE * 2;
                _pObj.dscale = 0.1;
                _pObj.ttl = TTL;
            }

            _particleEngine.emitParticles(_data);
        }

        /** End of Private Functions **/

        /** Public Functions **/

        /**
            Stops the explosion effect.
        **/
        this.stop = function() {
            _isEnabled = false;
            this.hide();
        };

        /**
            Plays the explosion effect.
            @param onFinish A callback that gets called when the explosion effect is done playing.
        **/
        this.play = function(onFinish) {
            bind(this, _emitParticles)();
            _isEnabled = true;
            this.show();

            _animator.wait(TTL).then(function() {
                stop();

                if (typeof onFinish == "function") {
                    onFinish();
                }
            })
        };

        /**
            Resets the explosion effect with a given type.
            @param type The type of explosions which is being reset to.
        **/
        this.reset = function(type) {
            stop();
            _type = type;
        };

        /**
            Sets the position of the explosion effect.
            @param pos The new position.
        **/
        this.setPosition = function(pos) {
            this.style.x = pos.x;
            this.style.y = pos.y;
        };

        /** End of Public Functions **/

        Engine.get().on('Tick', bind(this, function(dt) {
            if (_isEnabled) {
                _particleEngine.runTick(dt);
            }
        }));
    };
});