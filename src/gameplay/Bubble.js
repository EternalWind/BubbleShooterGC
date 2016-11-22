import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;
import animate;

/**
    A class to represent the bubble.
**/
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

        /**
            Resets the bubble to a given bubble type.
            @param type The bubble type.
        **/
        this.reset = function(type) {
            _type = type;
            this.setImage(_imgProvider.getImageFor(type));

            _animator.clear();
        };

        /**
            Gets the bubble type of this bubble.
            @returns The type of this bubble.
        **/
        this.getType = function() {
            return _type;
        }

        /**
            Sets the position of this bubble.
            @param pos The new position.
        **/
        this.setPosition = function(pos) {
            this.style.x = pos.x;
            this.style.y = pos.y;
        };

        /**
            Gets the position of this bubble.
            @returns The position of this bubble.
        **/
        this.getPosition = function() {
            return new Point(this.style.x, this.style.y);
        }

        /**
            Moves this bubble to a given location over a given period of time with a given movement type.
            @param target The destination.
            @param time The interval to move this bubble.
            @param shouldInterrupt Whether this movement should interrupt any movements which are still in action or should be scheduled afterwards.
            @param movementType The type of movement.
            @returns A handle to the movement animation which can be used to wait for it to complete.
        **/
        this.moveTo = function(target, time, shouldInterrupt, movementType) {
            if (!movementType) {
                movementType = animate.linear;
            }

            if (shouldInterrupt)
                return _animator.now({ x: target.x, y: target.y }, time, movementType);
            else
                return _animator.then({ x: target.x, y: target.y }, time, movementType);
        };

        /**
            Makes this bubble explodes.
            @returns A handle to the explosion animation.
        **/
        this.explode = function() {
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

        /**
            Makes this bubble drops.
            @param to The height to which this bubble drops.
            @param speed The dropping speed.
            @returns A handle to the dropping animation.
        **/
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