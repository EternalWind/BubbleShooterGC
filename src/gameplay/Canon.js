import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;
import math.geom.Vec2D as Vec2D;
import math.geom.Line as Line;

import src.gameplay.Collision as Collision;
import src.helpers.MathExtends as MathExtends;
import src.helpers.PathHelpers as PathHelpers;

/**
    A class to represent the canon which is used to shoot the bubble, calculate its path and make it moves.
**/
exports = Class(ImageView, function (supr) {
    this.init = function (opts) {
        var _size = 128;
        var _fireSpeed = 2000;

        opts = merge(opts, {
            x: 0,
            y: 0,
            width: _size,
            height: _size,
            image: PathHelpers.getImgPath("canon_base"),
            centerAnchor: true
        });

        opts.x -= _size / 2;
        opts.y -= _size / 2;

        supr(this, 'init', [opts]);

        // The current bubble to be shot.
        var _currentBubble = null;

        // The next bubble to be shot.
        var _nextBubble = null;

        // Whether the canon can fire now or not.
        var _canShoot = false;

        // The size of a hexagon cell.
        var _hexagonSize = opts.hexagonSize;

        // The width of a hexagon cell.
        var _hexagonWidth = opts.hexagonWidth;

        // The holder object for the next bubble to be shot.
        var _nextBubbleHolder = new ImageView({
            superview: this,
            centerAnchor: true,
            width: _size,
            height: _size,
            image: PathHelpers.getImgPath("canon_base"),
            x: _size * 0.8,
            y: _size * 0.5
        });

        // The barrel object of the canon.
        var _barrel = new ImageView({
            superview: opts.superview,
            width: _size,
            height: _size,
            x: opts.x,
            y: opts.y,
            zIndex: 2,
            image: PathHelpers.getImgPath("canon_barrel"),
            offsetX: 0,
            offsetY: -_size / 2,
            anchorX: _size / 2,
            anchorY: _size
        });

        /** Private Functions **/
        
        /**
            A bubble version of ray marching to pre-calculate the bubble's shooting path.
            @param start The starting position in screen coordinate.
            @param dir The direction to march.
            @param step The step size of the marching.
            @param collisionTest A function to test whether a collision has happened or not.
            @returns The collision result.
        **/
        function _bubbleMarching(start, dir, step, collisionTest) {
            if (typeof collisionTest != "function") return;
            if (dir.x == 0 && dir.y == 0) return;

            var _current = new Point(start.x, start.y);
            var _offset = dir.multiply(step);

            while (true) {
                _current.x += _offset.x;
                _current.y += _offset.y;

                if (_current.getMagnitude() > 2000) {
                    console.log("Possible dead-loop in bubble march!");
                    break;
                }

                var _collision = collisionTest(_current, dir);
                if (_collision) {
                    return _collision;
                }
            }
        };

        /**
            Gets the absolute position in screen coordinate of the holder for the next bubble.
            @returns The absolute position of the holder.
        **/
        function _getNextBubbleHolderAbsPosition() {
            return new Point(this.style.x + _nextBubbleHolder.style.x,
                this.style.y + _nextBubbleHolder.style.y);
        }

        /** End of Private Functions **/

        /** Public Functions **/

        /**
            Gets the position of the canon in screen coordinate.
            @returns The position of the canon.
        **/
        this.getPosition = function() {
            return new Point(this.style.x + _size / 2, this.style.y + _size / 2);
        };

        /**
            Resets the canon to its initial state.
        **/
        this.reset = function() {
            _currentBubble = null;
            _nextBubble = null;
            _canShoot = false;
        }

        /**
            Whether the canon can fire right now or not.
            @returns Whether the canon can fire or not.
        **/
        this.canShoot = function() {
            return _canShoot;
        }

        /**
            Fires the canon.
            @param dir The firing direction.
            @param collisionTest A function to check for collision.
            @param calibratePos A function to calibrate the position for edge locations.
            @returns The handle to the fired bubble's movement.
        **/
        this.fire = function(dir, collisionTest, calibratePos) {
            if (typeof collisionTest != "function" || typeof calibratePos != "function") return;

            var _firingAngle = dir.getAngle() + Math.PI / 2;
            _barrel.updateOpts({
                r: _firingAngle
            });

            _canShoot = false;

            var _waypoints = [];
            var _currentWaypoint = new Point(_currentBubble.style.x, _currentBubble.style.y);
            
            var _collision = _bubbleMarching(_currentWaypoint, dir, _hexagonWidth / 2, collisionTest);
            var _screenPos = MathExtends.gridToScreen(_collision.grid,
                _hexagonSize);

            if (!_collision.isSticking) {
                _screenPos = calibratePos(_screenPos, _collision.grid.y);
            }
            _waypoints.push(_screenPos);

            var _nextWaypoint = _waypoints[_waypoints.length - 1];

            while (!_collision.isSticking) {
                var _calibratedInDir = new Vec2D({ x: _nextWaypoint.x - _currentWaypoint.x, y: _nextWaypoint.y - _currentWaypoint.y }).getUnitVector();

                dir = MathExtends.reflect(_calibratedInDir,
                _collision.collidingPointNormal);

                _collision = _bubbleMarching(_nextWaypoint, dir, _hexagonWidth / 2, collisionTest);
                _currentWaypoint = _nextWaypoint;

                _screenPos = MathExtends.gridToScreen(_collision.grid, _hexagonSize);
                if (!_collision.isSticking) {
                    _screenPos = calibratePos(_screenPos, _collision.grid.y);
                }

                _waypoints.push(_screenPos);

                _nextWaypoint = _waypoints[_waypoints.length - 1];

                if (_waypoints.length > 10) {
                    console.log("Possible dead-loop in fire.");
                    break;
                }
            }

            var _lastWaypoint = _currentBubble.getPosition();
            var _bubbleMovement = null;
            for (var _i = 0; _i < _waypoints.length; ++_i) {
                var _target = _waypoints[_i];
                var _time = new Line(_lastWaypoint, _target).getLength() / _fireSpeed * 1000;

                _bubbleMovement = _currentBubble.moveTo(_target, _time, _i == 0);

                _lastWaypoint = _target;
            }

            return _bubbleMovement;
        }

        /**
            Reloads the canon with a bubble. This will make the next bubble the current and the new bubble the next.
            @bubble The bubble to load.
        **/
        this.reload = function(bubble) {
            _currentBubble = _nextBubble;

            if (_currentBubble != null)
                _currentBubble.setPosition(new Point(this.style.x + Math.abs(this.style.width - _currentBubble.style.width) / 2,
                this.style.y + Math.abs(this.style.height - _currentBubble.style.height) / 2));

            _nextBubble = bubble;

            if (_nextBubble != null) {
                var _holderPos = bind(this, _getNextBubbleHolderAbsPosition)();

                _nextBubble.setPosition(new Point(_holderPos.x + Math.abs(_nextBubbleHolder.style.width - _nextBubble.style.width) / 2,
                _holderPos.y + Math.abs(_nextBubbleHolder.style.height - _nextBubble.style.height) / 2));
            }

            _canShoot = _currentBubble != null;
        }

        /**
            Gets the current active bubble.
            @returns The current bubble.
        **/
        this.getCurrentBubble = function() {
            return _currentBubble;
        }

        /** End of Public Functions **/
    };
});