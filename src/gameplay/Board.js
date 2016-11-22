import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;
import math.geom.Line as Line;
import math.geom.Vec2D as Vec2D;
import util.ajax as ajax;
import animate;

import src.gameplay.Canon as Canon;
import src.gameplay.BubblePool as BubblePool;
import src.gameplay.Collision as Collision;
import src.gameplay.BubbleSlot as BubbleSlot;
import src.gameplay.BubbleType as BubbleType;
import src.helpers.MathExtends as MathExtends;
import src.helpers.PathHelpers as PathHelpers;
import src.vfx.ExplosionPool as ExplosionPool;

exports = Class(View, function (supr) {
    var NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW = [
            new Point(-1, 0), new Point(-1, -1), new Point(0, -1),
            new Point(1, 0), new Point(0, 1), new Point(-1, 1)
    ];
    var NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW = [
        new Point(-1, 0), new Point(0, -1), new Point(1, -1),
        new Point(1, 0), new Point(1, 1), new Point(0, 1)
    ];

    var LEFT = new Vec2D({ x: -1, y: 0 });
    var RIGHT = new Vec2D({ x: 1, y: 0 });

    var INITIAL_BUBBLE_DATA = [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, -1,
    -1, 2, 2, 2, 2, 2, 2, 2, -1,
    -1, 3, 3, 3, 3, 3, 3, -1, -1,
    -1, -1, 4, 4, 4, 4, 4, -1, -1,
    -1, -1, 5, 5, 5, 5, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    ];

    var BUBBLE_PUSHING_TIME = 50;
    var BUBBLE_PUSHING_DIST = 10;

    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        supr(this, 'init', [opts]);

        opts = merge(opts, {
            blockEvents: true
        });
        opts.superview = this;

        var _elementsRoot = new View(opts);

        var _bubbleSlotRows = opts.bubbleSlotRows;
        var _bubbleSlotsPerRow = opts.bubbleSlotsPerRow;
        
        var _bubbleSlotCount = _bubbleSlotsPerRow * _bubbleSlotRows;
        var _bubbleSlots = [];
        for (var _i = 0; _i < _bubbleSlotCount; ++_i) {
            _bubbleSlots.push(new BubbleSlot());
        }

        // The width should be just enough for [_bubbleSlotsPerRow] + 0.5 bubbles
        // because the existance of horizontal offsets introduced by hexagons.
        var _bubbleRadius = opts.width / (_bubbleSlotsPerRow * 2 + 1);
        var _bubbleChainThreshold = 3;
        var _currentBubbleGeneration = 0;

        // Hexagon grid math reference: http://www.redblobgames.com/grids/hexagons/
        var _hexagonSize = _bubbleRadius / Math.cos(30 * Math.PI / 180);
        var _hexagonHeight = _hexagonSize * 2;
        var _hexagonVerticalDistance = _hexagonHeight * 3 / 4;
        var _left = 0;
        var _right = _left + opts.width;
        var _top = 0;
        var _bottom = _top + (_bubbleSlotRows - 1) * _hexagonVerticalDistance + _hexagonSize * 2;

        // To make the bubble can be shot through 1-bubble-sized gaps
        // if the player is lucky/skillful enough!
        var _collideThresholdRatio = 0.95;

        var _explosionPool = new ExplosionPool({
            parent: _elementsRoot
        });

        _explosionPool.preload(30);

        var _bubblePool = new BubblePool({
            parent: _elementsRoot,
            bubbleRadius: _bubbleRadius,
            defaultBubbleType: BubbleType.ORANGE,
            explosionPool: _explosionPool
        });

        _bubblePool.preload(_bubbleSlotCount);

        var _bottomBar = new ImageView({
            superview: _elementsRoot,
            x: 0,
            y: _bottom,
            width: opts.width,
            height: 88,
            image: PathHelpers.getImgPath("bar"),
            zIndex: 0
        })

        var _canon = new Canon({
            superview: _elementsRoot,
            x: this.style.width / 2,
            y: this.style.height - _bubbleRadius * 5,
            hexagonSize: _hexagonSize,
            hexagonWidth: _bubbleRadius,
            slots: _bubbleSlots,
            pool: _bubblePool
        });

        var _winMark = new ImageView({
            superview: _elementsRoot,
            x: 0,
            y: this.style.height / 2,
            offsetY: -this.style.width / 4,
            image: PathHelpers.getImgPath("win"),
            width: this.style.width,
            height: this.style.width / 2,
            zIndex: 10
        });

        var _loseMark = new ImageView({
            superview: _elementsRoot,
            x: 0,
            y: this.style.height / 2,
            offsetY: -this.style.width / 4,
            image: PathHelpers.getImgPath("lose"),
            width: this.style.width,
            height: this.style.width / 2,
            zIndex: 10
        });

        var _hasWon = false;
        var _hasLost = false;

        var _remainingBubbleCount = 0;

        /** Public Functions **/

        this.reset = function() {
            _canon.reset();

            for (var _i = 0; _i < _bubbleSlots.length; ++_i) {
                _bubbleSlots[_i].reset();
            }

            _currentBubbleGeneration = 0;
            _bubblePool.despawnAll();

            _explosionPool.reset();
            _explosionPool.despawnAll();
            
            _winMark.hide();
            _loseMark.hide();
            _hasWon = false;
            _hasLost = false;
            _remainingBubbleCount = 0;

            _loadBubbles();
            _arrangeBubblesInSlots();

            // Loads two bubbles. One is for the current firing bubble and the other one is for the next firing bubble.
            _canon.reload(_generateBubble());
            _canon.reload(_generateBubble());
        };

        /** End of Public Functions **/

        /** Private Functions **/

        function _gridToIndex(grid) {
            return grid.x + grid.y * _bubbleSlotsPerRow;
        }

        function _calibratePosition(pos, _row) {
            if (pos.x < _right / 2 && (_row & 1) == 1) {
                pos.x -= _bubbleRadius;
            } else if (pos.x > _right / 2 && (_row & 1) == 0) {
                pos.x += _bubbleRadius;
            }

            return pos;
        }

        function _floodFill(_col, _row, shouldProcess, process) {
            if (_col < 0 || _col >= _bubbleSlotsPerRow || _row < 0 || _row >= _bubbleSlotRows
            || typeof shouldProcess != "function" || typeof process != "function") return;

            var _slotIndex = _gridToIndex(new Point(_col, _row));

            if (!shouldProcess(_bubbleSlots[_slotIndex])) return;
            process(_bubbleSlots[_slotIndex]);

            var _neighbourGridOffsets = ((_row & 1) == 1) ? 
                NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW : NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW;
            for (var _i = 0; _i < _neighbourGridOffsets.length; ++_i) {
                _floodFill(_col + _neighbourGridOffsets[_i].x, _row + _neighbourGridOffsets[_i].y, shouldProcess, process);
            }
        };

        function _loadBubbles() {
            for (var _i = 0; _i < INITIAL_BUBBLE_DATA.length && _i < _bubbleSlots.length; ++_i) {
                if (INITIAL_BUBBLE_DATA[_i] >= 0) {
                    _remainingBubbleCount++;
                    _bubbleSlots[_i].bubble = _generateBubble(INITIAL_BUBBLE_DATA[_i]);
                } else {
                    _bubbleSlots[_i].bubble = null;
                }
            }
        };

        function _arrangeBubblesInSlots() {
            for (var _row = 0; _row < _bubbleSlotRows; ++_row) {
                for (var _col = 0; _col < _bubbleSlotsPerRow; ++_col) {
                    var _grid = new Point(_col, _row);

                    var _slotIndex = _gridToIndex(_grid);
                    var _screen = MathExtends.gridToScreen(_grid, _hexagonSize);

                    if (_bubbleSlots[_slotIndex].bubble != null) {
                        _bubbleSlots[_slotIndex].bubble.setPosition(_screen);
                    }
                }
            }
        };

        function _generateBubble(type) {
            if (type == null || type == undefined) {
                type = Math.floor(Math.random() * BubbleType.MAX);
            }

            if (type < 0 || type >= BubbleType.MAX) {
                console.log("Invalid bubble type index is given!");
            }

            var _bubble = _bubblePool.spawn();
            _bubble.reset(type);

            return _bubble;
        }

        function _collisionTest(pos, dir) {
            var _grid = MathExtends.screenToGrid(pos, _hexagonSize);
            var _collision = null;

            var _neighbours = _getNeighboursFor(_grid);

            var potentialCollidersAndDistances = [];
            for (var _i = 0; _i < _neighbours.length; ++_i) {
                var _neighbourGrid = _neighbours[_i];
                var _neighbourScreen = MathExtends.gridToScreen(_neighbourGrid, _hexagonSize);
                var _distance = new Line(pos, _neighbourScreen).getLength();

                if (_distance < _bubbleRadius * 2 * _collideThresholdRatio) {
                    potentialCollidersAndDistances.push({
                        colliderGrid: _neighbourGrid,
                        _distance: _distance
                    });
                }
            }

            potentialCollidersAndDistances.sort(function(a, b) {
                return a._distance - b._distance;
            });

            for (var _i = 0; _i < potentialCollidersAndDistances.length; ++_i)
            {
                var _potentialColliderGrid = potentialCollidersAndDistances[_i].colliderGrid;
                var _isCollidingWithCeiling = _potentialColliderGrid.y < 0;
                var _isCollidingWithLeftWall = _potentialColliderGrid.x < 0 && dir.x < 0;
                var _isCollidingWithRightWall = _potentialColliderGrid.x >= _bubbleSlotsPerRow && dir.x > 0;
                var _isCollidingWithSideWalls = _isCollidingWithLeftWall || _isCollidingWithRightWall;

                if (_isCollidingWithSideWalls) {
                    // Colliding with a side wall.
                    _collision = new Collision();
                    _collision.isSticking = false;
                    _collision.grid = _grid;
                    _collision.collidingPointNormal = _isCollidingWithLeftWall ? LEFT : RIGHT;

                    break;
                } else if (_isCollidingWithCeiling || _isNonEmpty(_potentialColliderGrid)) {
                    // Colliding with the ceiling or another bubble.
                    _collision = new Collision();
                    _collision.isSticking = true;
                    _collision.grid = _grid;

                    break;
                }
            }

            return _collision;
        }

        function _collectChainedBubbleSlots(startingCol, startingRow, chainingBubbleType) {
            var _chainedBubbleSlots = [];

            _floodFill(startingCol, startingRow,
                function(slot) {
                    return slot.bubble && slot.bubble.getType() == chainingBubbleType && _chainedBubbleSlots.indexOf(slot) == -1;
                },
                function(slot) {
                    _chainedBubbleSlots.push(slot);
            });

            return _chainedBubbleSlots;
        }

        function _collectDroppingBubbleSlots(nextBubbleGeneration) {
            for (var _col = 0; _col < _bubbleSlotsPerRow; ++_col) {
                _floodFill(_col, 0,
                    function(slot) {
                        return slot.bubble && slot.bubbleGeneration != nextBubbleGeneration;
                    },
                    function(slot) {
                        slot.bubbleGeneration = nextBubbleGeneration;
                    }
                );
            }

            return _bubbleSlots.filter(function(slot) {
                return slot.bubble && slot.bubbleGeneration < nextBubbleGeneration;
            });
        }

        function _isValidGridLocation(grid) {
            return grid.x >= 0 && grid.x < _bubbleSlotsPerRow && grid.y >= 0 && grid.y < _bubbleSlotRows;
        }

        function _getNeighboursFor(grid) {
            var _neighbourGridOffsets = ((grid.y & 1) == 0) ?
                NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW : NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW;

            var _neighbourGirds = [];
            for (var _i = 0; _i < _neighbourGridOffsets.length; ++_i) {
                _neighbourGirds.push(new Point(grid.x + _neighbourGridOffsets[_i].x, grid.y + _neighbourGridOffsets[_i].y));
            }

            return _neighbourGirds;
        }

        function _isNonEmpty(grid) {
            if (_isValidGridLocation(grid)) {
                var _slotIndex = _gridToIndex(grid);
                return _bubbleSlots[_slotIndex].bubble;
            }

            return false;
        }

        function _getConnectedDoubledNonEmptyNeighboursFor(grid) {
            var _nonEmptyNeighbourGrids = _getNeighboursFor(grid).filter(_isNonEmpty);
            var _closestNeighbourCount = _nonEmptyNeighbourGrids.length;

            // Scan the neighbours of the closest six neighbours.
            for (var _i = 0; _i < _closestNeighbourCount; ++_i) {
                var _nonEmptySecondTierNeighbourGrids = _getNeighboursFor(_nonEmptyNeighbourGrids[_i]).filter(_isNonEmpty);

                // Add those non-empty second tier neighbours to the neighbour list if they have not been added already.
                for (var _j = 0; _j < _nonEmptySecondTierNeighbourGrids.length; ++_j) {
                    var _isAlreadyAdded = _nonEmptyNeighbourGrids.some(function(neighbourGrid) {
                        return neighbourGrid.x ==_nonEmptySecondTierNeighbourGrids[_j].x 
                        && neighbourGrid.y == _nonEmptySecondTierNeighbourGrids[_j].y;
                    });

                    if (!_isAlreadyAdded) {
                        _nonEmptyNeighbourGrids.push(_nonEmptySecondTierNeighbourGrids[_j]);
                    }
                }
            }

            return _nonEmptyNeighbourGrids;
        }

        function _pushBubbles(center) {
            var _grid = MathExtends.screenToGrid(center, _hexagonSize);
            var _neighbourGrids = _getConnectedDoubledNonEmptyNeighboursFor(_grid);

            for (var _i = 0; _i < _neighbourGrids.length; ++_i) {
                var _neighbourGrid = _neighbourGrids[_i];
                var _slotIndex = _gridToIndex(_neighbourGrid);

                var _neighbourScreen = MathExtends.gridToScreen(_neighbourGrid, _hexagonSize);
                var _pushingDir = new Vec2D({ x: _neighbourScreen.x - center.x, y: _neighbourScreen.y - center.y })
                    .getUnitVector();
                var _pushingDestOffset = _pushingDir.multiply(BUBBLE_PUSHING_DIST);
                var _pushingDest = new Point(_neighbourScreen.x + _pushingDestOffset.x, 
                    _neighbourScreen.y + _pushingDestOffset.y);

                _bubbleSlots[_slotIndex].bubble.moveTo(_pushingDest, BUBBLE_PUSHING_TIME, true, animate.easeOut);
                _bubbleSlots[_slotIndex].bubble.moveTo(_neighbourScreen, BUBBLE_PUSHING_TIME, false, animate.easeIn);
            }
        }

        function _playGame(input) {
            if (_canon.canShoot()) {
                var _canonPos = _canon.getPosition();
                var _dir = new Vec2D({ x: input.x - _canonPos.x, y: input.y - _canonPos.y }).getUnitVector();

                _canon.fire(_dir, _collisionTest, _calibratePosition).then(bind(this, function() {
                    var _shotBubble = _canon.getLastBubble();
                    var _grid = MathExtends.screenToGrid(_shotBubble.getPosition(), 
                    _hexagonSize);

                    _remainingBubbleCount++;

                    if (_grid.y < _bubbleSlotRows) {
                        var _chainedBubbles = [];
                        var _droppingBubbles = [];

                        var _slotIndex = _gridToIndex(_grid);

                        _bubbleSlots[_slotIndex].bubble = _shotBubble;
                        _bubbleSlots[_slotIndex].bubbleGeneration = _currentBubbleGeneration;

                        var _chainedBubbleSlots = _collectChainedBubbleSlots(_grid.x, _grid.y, _shotBubble.getType());
                        if (_chainedBubbleSlots.length >= _bubbleChainThreshold) {
                            for (var _i = 0; _i < _chainedBubbleSlots.length; ++_i) {
                                _chainedBubbles.push(_chainedBubbleSlots[_i].bubble);
                                _chainedBubbleSlots[_i].bubble = null;
                                _remainingBubbleCount--;
                            }

                            var _droppingBubbleSlots = _collectDroppingBubbleSlots(++_currentBubbleGeneration);
                            for (var _i = 0; _i < _droppingBubbleSlots.length; ++_i) {
                                _droppingBubbles.push(_droppingBubbleSlots[_i].bubble);
                                _droppingBubbleSlots[_i].bubble = null;
                                _remainingBubbleCount--;
                            }
                        } else {
                            _pushBubbles(_shotBubble.getPosition());
                        }

                        if (_remainingBubbleCount <= 0) {
                            _win();
                        }

                        for (var _i = 0; _i < _chainedBubbles.length; ++_i) {
                            var _chainedBubble = _chainedBubbles[_i];
                            _chainedBubble.explode();
                        }

                        for (var _i = 0; _i < _droppingBubbles.length; ++_i) {
                            var _droppingBubble = _droppingBubbles[_i];
                            _droppingBubble.drop(this.style.height + 50, 900);
                        }

                        _canon.reload(_generateBubble());
                    } else {
                        _lose();
                    }
                }));
            }
        }

        function _win() {
            _winMark.show();

            _hasWon = true;
        }

        function _lose() {
            _loseMark.show();

            _hasLost = true;
        }

        /** End of Private Functions **/

        this.on("InputSelect", bind(this, function(event, point) {
            if (_hasWon || _hasLost) {
                this.emit("Board:end");
            } else {
                bind(this, _playGame)(point);
            }
        }));
    };
});