import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;
import animate;

exports = Class(ImageView, function (supr) {
    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            centerAnchor: true,
            width: opts.radius * 2,
            height: opts.radius * 2,
            zIndex: 1
        });

        supr(this, 'init', [opts]);

        var _animator = animate(this);
        var _type = null;
        var _imgProvider = opts.imgProvider;
        var _bubblePool = opts.bubblePool;
        var _explosionPool = opts.explosionPool;

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/

        this.reset = function(type) {
            _type = type;
            this.setImage(_imgProvider.getImageFor(type));

            _animator.clear();
        };

        this.getType = function() {
            return _type;
        }

        this.setPosition = function(pos) {
            this.style.x = pos.x;
            this.style.y = pos.y;
        };

        this.getPosition = function() {
            return new Point(this.style.x, this.style.y);
        }

        this.moveTo = function(target, time, shouldInterrupt, movementType) {
            if (!movementType) {
                movementType = animate.linear;
            }

            if (shouldInterrupt)
                return _animator.now({ x: target.x, y: target.y }, time, movementType);
            else
                return _animator.then({ x: target.x, y: target.y }, time, movementType);
        };

        this.explode = function(vfx) {
            return _animator.now({ scale: 1.5 }, 250, animate.easeOutCubic)
            .then({ scale: 0 }, 350, animate.easeInCubic).then(bind(this, function() {
                _bubblePool.despawn(this);

                var _explosion = _explosionPool.spawn();
                _explosion.reset(this.getType());
                _explosion.setPosition(this.getPosition());

                _explosion.play(function() {
                    _explosionPool.despawn(_explosion);
                });
            }));
        };

        this.drop = function(to, speed) {
            if (speed == 0) return _animator;

            var _time = Math.abs(this.style.y - to) / speed * 1000;
            return _animator.now({ y: to }, _time, animate.easeIn).then(bind(this, function() {
                _bubblePool.despawn(this);
            }));
        };

        /** End of Public Functions **/

        this.reset(opts.type);
    };
});