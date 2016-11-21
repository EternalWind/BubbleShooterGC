import math.geom.Point as Point;

import src.helpers.Point3D as Point3D;

exports = {
    axialToCube: axialToCube,
    cubeRound: cubeRound,
    screenToCube: screenToCube,
    cubeToGrid: cubeToGrid,
    screenToGrid: screenToGrid,
    gridToScreen: gridToScreen,
    reflect: reflect
};

function axialToCube(axial) {
    return new Point3D(axial.x, -axial.x - axial.y, axial.y);
}

function cubeRound(cube) {
    var _rx = Math.round(cube.x);
    var _ry = Math.round(cube.y);
    var _rz = Math.round(cube.z);

    var _xDiff = Math.abs(_rx - cube.x);
    var _yDiff = Math.abs(_ry - cube.y);
    var _zDiff = Math.abs(_rz - cube.z);

    if (_xDiff > _yDiff && _xDiff > _zDiff) {
        _rx = -_ry - _rz;
    } else if (_yDiff > _zDiff) {
        _ry = -_rx - _rz;
    } else {
        _rz = -_rx - _ry;
    }

    return new Point3D(_rx, _ry, _rz);
}

function screenToCube(screen, hexagonSize, hexagonWidth) {
    var _temp = new Point();

    _temp.x = screen.x;
    _temp.y = screen.y;

    var axial = new Point(
        (_temp.x * Math.sqrt(3) / 3 - _temp.y / 3) / hexagonSize,
        _temp.y * 2 / 3 / hexagonSize
    );

    return cubeRound(axialToCube(axial));
}

function cubeToGrid(cube) {
    return new Point(cube.x + (cube.z - (cube.z & 1)) / 2, cube.z);
}

function screenToGrid(screen, hexagonSize, hexagonWidth) {
    return cubeToGrid(screenToCube(screen, hexagonSize, hexagonWidth));
}

function gridToScreen(grid, hexagonSize, hexagonWidth) {
    var _x = hexagonSize * Math.sqrt(3) * (grid.x + 0.5 * (grid.y & 1));
    var _y = hexagonSize * 3 / 2 * grid.y;

    return new Point(_x, _y);
}

function reflect(dir, normal) {
    if (dir.x == 0 && dir.y == 0 || normal.x == 0 && normal.y == 0) return;

    var _dot = dir.dot(normal);

    return dir.minus(normal.multiply(_dot * 2));
}