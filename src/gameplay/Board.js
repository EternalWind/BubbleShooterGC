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

/**
    A class to represent the game board providing gameplay calculations involving the information related to the whole game world.
**/
exports = Class(View, function (supr) {
    // Neighbour odd-r coordinate offsets for rows with even indices. E.q. row 0, row 2...
    var NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW = [
            new Point(-1, 0), new Point(-1, -1), new Point(0, -1),
            new Point(1, 0), new Point(0, 1), new Point(-1, 1)
    ];

    // Neighbour odd-r coordinate offsets for rows with ood indices. E.q. row 1, row 3...
    var NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW = [
        new Point(-1, 0), new Point(0, -1), new Point(1, -1),
        new Point(1, 0), new Point(1, 1), new Point(0, 1)
    ];

    // The left-pointing unit vector.
    var LEFT = new Vec2D({ x: -1, y: 0 });

    // The right-pointing unit vector.
    var RIGHT = new Vec2D({ x: 1, y: 0 });

    // The initial bubble data for the board.
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

    // The interval for which a bubble push animates.
    var BUBBLE_PUSHING_TIME = 50;

    // The distance that a bubble will be pushed along.
    var BUBBLE_PUSHING_DIST = 10;

    // How many times should the fireworks effect be looped.
    var FIREWORKS_LOOP = 20;

    // The maximum interval between two fireworks loops.
    var FIREWORKS_MAX_INTERVAL = 1000;

    // The maximum concurrent amount of fireworks in each loop.
    var FIREWORKS_MAX_CONCURRENT_COUNT = 4;

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

        // The root view for all the gameplay elements on the board.
        var _elementsRoot = new View(opts);

        // The amount of rows of bubble slots this board contains.
        var _bubbleSlotRows = opts.bubbleSlotRows;

        // The amount of bubble slots in each row.
        var _bubbleSlotsPerRow = opts.bubbleSlotsPerRow;
        
        // The total number of bubble slots on this board.
        var _bubbleSlotCount = _bubbleSlotsPerRow * _bubbleSlotRows;

        // The bubble slot array.
        var _bubbleSlots = [];
        

        // The radius of a bubble which is also the width of a hexagon cell.
        // The width should be just enough for [_bubbleSlotsPerRow] + 0.5 bubbles
        // because the existance of horizontal offsets introduced by hexagons.
        var _bubbleRadius = opts.width / (_bubbleSlotsPerRow * 2 + 1);

        // The threshold for a normal bubble chain to be considered happening.
        var _bubbleChainThreshold = 3;

        // The current bubble generation used for finding out which bubbles to drop.
        var _currentBubbleGeneration = 0;

        // The size of a hexagon cell.
        var _hexagonSize = _bubbleRadius / Math.cos(30 * Math.PI / 180);

        // The height of a hexagon cell.
        var _hexagonHeight = _hexagonSize * 2;

        // The vertical distance between two adjcant hexagon cells.
        var _hexagonVerticalDistance = _hexagonHeight * 3 / 4;

        // The left boarder of the board.
        var _left = 0;

        // The right boarder of the board.
        var _right = _left + opts.width;

        // The ceiling of the board.
        var _top = 0;

        // The bottom line of the board.
        var _bottom = _top + (_bubbleSlotRows - 1) * _hexagonVerticalDistance + _hexagonSize * 2;

        // The threshold ratio for finding out neighbour slots/cells the bubble being shot is colliding with.
        // This is to make the bubble can be shot through one-bubble-sized gaps
        // if the player is lucky/skillful enough!
        var _collideThresholdRatio = 0.95;

        // A pool for explosion effects.
        var _explosionPool = new ExplosionPool({
            parent: _elementsRoot
        });

        // A pool for bubbles.
        var _bubblePool = new BubblePool({
            parent: _elementsRoot,
            bubbleRadius: _bubbleRadius,
            defaultBubbleType: BubbleType.ORANGE,
            explosionPool: _explosionPool
        });

        // The bottom bar object.
        var _bottomBar = new ImageView({
            superview: _elementsRoot,
            x: 0,
            y: _bottom,
            width: opts.width,
            height: 88,
            image: PathHelpers.getImgPath("bar"),
            zIndex: 0
        })

        // The canon object.
        var _canon = new Canon({
            superview: _elementsRoot,
            x: this.style.width / 2,
            y: this.style.height - _bubbleRadius * 5,
            hexagonSize: _hexagonSize,
            hexagonWidth: _bubbleRadius,
            slots: _bubbleSlots,
            pool: _bubblePool
        });

        // The win mark which will be shown upon winning the game.
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

        var _winMarkAnimator = new animate(_winMark);

        // The lose mark which will be shown upon losing the game.
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

        var _loseMarkAnimator = new animate(_loseMark);

        // The ready mark which will be shown at the begining of the game.
        var _readyMark = new ImageView({
            superview: _elementsRoot,
            x: 0,
            y: this.style.height / 2,
            offsetY: -this.style.width / 4,
            image: PathHelpers.getImgPath("ready"),
            width: this.style.width,
            height: this.style.width / 2,
            zIndex: 10,
            scale: 0,
            centerAnchor: true
        });

        var _readyMarkAnimator = new animate(_readyMark);

        // The go mark which will be shown right after the ready mark disappears.
        var _goMark = new ImageView({
            superview: _elementsRoot,
            x: 0,
            y: this.style.height / 2,
            offsetY: -this.style.width / 4,
            image: PathHelpers.getImgPath("go"),
            width: this.style.width,
            height: this.style.width / 2,
            zIndex: 10
        });

        var _fireworksAnimator = new animate(this);

        // A flag indicating whether the player is ready or not.
        var _isReady = false;

        // A flag indicating whether the player has won or not.
        var _hasWon = false;

        // A flag indicating whether the player has lost or not.
        var _hasLost = false;

        // The remaining amount of bubbles on the board.
        var _remainingBubbleCount = 0;

        /** Public Functions **/

        /**
            Resets the board to its initial state.
        **/
        this.reset = function() {
            _canon.reset();

            for (var _i = 0; _i < _bubbleSlots.length; ++_i) {
                _bubbleSlots[_i].reset();
            }

            _currentBubbleGeneration = 0;
            _bubblePool.despawnAll();

            _winMarkAnimator.clear();
            _loseMarkAnimator.clear();
            _fireworksAnimator.clear();

            _explosionPool.reset();
            _explosionPool.despawnAll();

            _winMark.hide();
            _loseMark.hide();
            _hasWon = false;
            _hasLost = false;
            _isReady = false;
            _remainingBubbleCount = 0;

            _loadBubbles();
            _arrangeBubblesInSlots();

            // Loads two bubbles. One is for the current firing bubble and the other one is for the next firing bubble.
            _canon.reload(_generateBubble());
            _canon.reload(_generateBubble());

            _readyMarkAnimator.clear();

            _goMark.hide();
            _readyMark.show();
            _readyMark.updateOpts({ scale: 0 });

            _readyMarkAnimator.wait(1000).then({ scale: 1.3 }, 700, animate.easeIn)
                .then({ scale: 1 }, 70, animate.linear).wait(700)
            .then(function() {
                _readyMark.hide();
                _goMark.show();
            }).wait(1000).then(function() {
                _goMark.hide();
                _isReady = true;
            });
        };

        /** End of Public Functions **/

        /** Private Functions **/

        /**
            Converts an odd-r offset coordinate to a bubble slot index.
            @param grid The odd-r offset coordinate.
            @returns The converted bubble slot index.
        **/
        function _gridToIndex(grid) {
            return grid.x + grid.y * _bubbleSlotsPerRow;
        }

        /**
            Calibrates a given position so that position on each edge of the board's two sides can visually be touching the actual edge of the screen.
            This method should only be used for edge positions.
            @param pos The position in screen coordiante.
            @param row The row index for the given position.
            @returns The calibrated position in screen coordinate.
        **/
        function _calibratePosition(pos, row) {
            if (pos.x < _right / 2 && (row & 1) == 1) {
                pos.x -= _bubbleRadius;
            } else if (pos.x > _right / 2 && (row & 1) == 0) {
                pos.x += _bubbleRadius;
            }

            return pos;
        }

        /**
            An implementation of the flood fill algorithm used to find out connected bubbles of the same type and bubbles that are not connected to the ceiling.
            @param col The column index to start search from.
            @param row The row index to start search from.
            @param shouldProcess A function to decide whether a given bubble slot should be process or not.
            @param process A function to do the actual processing to a matched bubble slot.
        **/
        function _floodFill(col, row, shouldProcess, process) {
            if (col < 0 || col >= _bubbleSlotsPerRow || row < 0 || row >= _bubbleSlotRows
            || typeof shouldProcess != "function" || typeof process != "function") return;

            var _slotIndex = _gridToIndex(new Point(col, row));

            if (!shouldProcess(_bubbleSlots[_slotIndex])) return;
            process(_bubbleSlots[_slotIndex]);

            var _neighbourGridOffsets = ((row & 1) == 1) ? 
                NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW : NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW;
            for (var _i = 0; _i < _neighbourGridOffsets.length; ++_i) {
                _floodFill(col + _neighbourGridOffsets[_i].x, row + _neighbourGridOffsets[_i].y, shouldProcess, process);
            }
        };

        /**
            Loads the initial bubble data.
        **/
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

        /**
            Positions the loaded bubbles.
        **/
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

        /**
            Generates a bubble of a given type.
            @param type The bubble type.
            @returns The generated bubble.
        **/
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

        /**
            Tests if a bubble at a given position with a given moving direction is colliding with other bubbles or a wall.
            @param pos The position of the bubbld being tested.
            @param dir The moving direction of the bubble being tested.
            @returns The collision test result.
        **/
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

        /**
            Collects a list of bubble slots whose bubbles are considered involved in a bubble chain.
            @param startingCol The starting column index to search for a bubble chain.
            @param startingRow The starting row index to search for a bubble chain.
            @param chainingBubbleType The bubble type of the chain.
            @returns A list of chained bubble slots.
        **/
        function _collectChainedBubbleSlots(startingCol, startingRow, chainingBubbleType) {
            var _chainedBubbleSlots = [];

            switch (chainingBubbleType) {
                case BubbleType.BOMB:
                    _chainedBubbleSlots = _collectChainedBubbleSlotsBomb(startingCol, startingRow);
                    break;

                case BubbleType.STONE:
                    _chainedBubbleSlots = _collectChainedBubbleSlotsStone();
                    break;

                default:
                    _chainedBubbleSlots = _collectChainedBubbleSlotsNormal(startingCol, startingRow, chainingBubbleType);
                    break;
            }

            return _chainedBubbleSlots;
        }

        /**
            Collects a bubble chain for the stone bubbles.
            @returns A list of chained bubble slots.
        **/
        function _collectChainedBubbleSlotsStone() {
            // Stone bubbles trigger nothing.
            return [];
        }

        /**
            Collects a bubble chain for the bomb bubbles.
            @param startingCol The starting column index to search for a bubble chain.
            @param startingRow The starting row index to search for a bubble chain.
            @returns A list of chained bubble slots.
        **/
        function _collectChainedBubbleSlotsBomb(startingCol, startingRow) {
            var _startingGrid = new Point(startingCol, startingRow);
            var _scaningGrids = _getNeighboursFor(_startingGrid);
            _scaningGrids.push(_startingGrid);

            var _chainedBubbleSlots = [];

            for (var _i = 0; _i < _scaningGrids.length; ++_i) {
                if (_isNonEmpty(_scaningGrids[_i])) {
                    var _slotIndex = _gridToIndex(_scaningGrids[_i]);
                    _chainedBubbleSlots.push(_bubbleSlots[_slotIndex]);
                }
            }

            return _chainedBubbleSlots;
        }

        /**
            Collects a bubble chain for the normal bubbles.
            @param startingCol The starting column index to search for a bubble chain.
            @param startingRow The starting row index to search for a bubble chain.
            @param chainingBubbleType The bubble type of the chain.
            @returns A list of chained bubble slots.
        **/
        function _collectChainedBubbleSlotsNormal(startingCol, startingRow, chainingBubbleType) {
            var _chainedBubbleSlots = [];

            _floodFill(startingCol, startingRow,
                function(slot) {
                    return slot.bubble && slot.bubble.getType() == chainingBubbleType && _chainedBubbleSlots.indexOf(slot) == -1;
                },
                function(slot) {
                    _chainedBubbleSlots.push(slot);
                });

            // For normal bubbles, only the total connect bubble count passes a given threshold can be considered chained.
            if (_chainedBubbleSlots.length < _bubbleChainThreshold) {
                _chainedBubbleSlots = [];
            }

            return _chainedBubbleSlots;
        }

        /**
            Collects a list of bubble slots whose bubbles are no longer connected to the ceiling so that they will be dropped.
            @param nextBubbleGeneration The next bubble generation.
            @returns A list of bubble slots whose bubbles should be dropped.
        **/
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

        /**
            Whether a given r-odd coordinate is within the board or not.
            @param grid The r-odd coordinate.
            @returns Whether it is within the board or not.
        **/
        function _isValidGridLocation(grid) {
            return grid.x >= 0 && grid.x < _bubbleSlotsPerRow && grid.y >= 0 && grid.y < _bubbleSlotRows;
        }

        /**
            Gets all the neighbour r-odd coordinates of a given location in r-odd coordinate.
            @param grid The given r-odd coordinate.
            @returns The neighbour r-odd coordinates.
        **/
        function _getNeighboursFor(grid) {
            var _neighbourGridOffsets = ((grid.y & 1) == 0) ?
                NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW : NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW;

            var _neighbourGirds = [];
            for (var _i = 0; _i < _neighbourGridOffsets.length; ++_i) {
                _neighbourGirds.push(new Point(grid.x + _neighbourGridOffsets[_i].x, grid.y + _neighbourGridOffsets[_i].y));
            }

            return _neighbourGirds;
        }

        /**
            Whether the slot at a given r-odd coordinate is empty or not.
            @param The given r-odd coordinate.
            @returns Whether the slot is empty or not.
        **/
        function _isNonEmpty(grid) {
            if (_isValidGridLocation(grid)) {
                var _slotIndex = _gridToIndex(grid);
                return _bubbleSlots[_slotIndex].bubble;
            }

            return false;
        }

        /**
            Gets two tiers of neighbour r-odd coordinates which are connected to the starting point and the slots in which are not empty.
            @param grid The starting point in r-odd coordinate.
            @returns A list of neighbours.
        **/
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

        /**
            Performs bubble pushes for all the bubbles centered at a given position in screen coordinate except for the one located right at the center.
            @param center The center position in screen coordinate.
        **/
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

        /**
            Fires the canon.
            @param input The point in screen coordinate where the touch input happened.
        **/
        function _fireCanon(input) {
            if (_canon.canShoot()) {
                var _canonPos = _canon.getPosition();
                var _dir = new Vec2D({ x: input.x - _canonPos.x, y: input.y - _canonPos.y }).getUnitVector();

                _canon.fire(_dir, _collisionTest, _calibratePosition).then(bind(this, function() {
                    var _shotBubble = _canon.getCurrentBubble();
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
                        if (_chainedBubbleSlots.length > 0) {
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

        /**
            Displays some awesome fireworks!
        **/
        function _showFireworks() {
            for (var _i = 0; _i < FIREWORKS_LOOP; ++_i) {
                _fireworksAnimator.then(function() {
                    var _count = FIREWORKS_MAX_CONCURRENT_COUNT * Math.random();

                    for (var _j = 0; _j < _count; ++_j) {
                        var _pos = new Point(opts.width * Math.random(), opts.height * Math.random());
                        var _firework = _explosionPool.spawn();
                        _firework.setPosition(_pos);
                        _firework.reset(Math.floor(Math.random() * BubbleType.MAX));
                        _firework.play();
                    }
                }).wait(FIREWORKS_MAX_INTERVAL * Math.random());
            }
        }

        /**
            Marks the player has won the game.
        **/
        function _win() {
            _winMark.show();
            _winMark.updateOpts({ opacity: 0 });
            _winMarkAnimator.now({ opacity: 1 }, 2000);

            _showFireworks();

            _hasWon = true;
        }

        /**
            Marks the player has lost the game.
        **/
        function _lose() {
            _loseMark.show();
            _loseMark.updateOpts({ opacity: 0 });
            _loseMarkAnimator.now({ opacity: 1 }, 2000);

            _hasLost = true;
        }

        /** End of Private Functions **/

        for (var _i = 0; _i < _bubbleSlotCount; ++_i) {
            _bubbleSlots.push(new BubbleSlot());
        }

        _explosionPool.preload(30);
        _bubblePool.preload(_bubbleSlotCount);

        this.on("InputSelect", bind(this, function(event, point) {
            if (_hasWon || _hasLost) {
                this.emit("Board:end");
            } else if (_isReady) {
                bind(this, _fireCanon)(point);
            }
        }));
    };
});