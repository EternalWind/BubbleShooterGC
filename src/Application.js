import ui.TextView as TextView;
import ui.StackView as StackView;
import ui.View;

import device;

import src.scenes.TitleScene as TitleScene;
import src.scenes.GameScene as GameScene;

exports = Class(GC.Application, function () {

    this.initUI = function () {
        this.engine.setMaxListeners(50);

        var _appSettings = {
            width: 576,
            height: 1024
        };

        var _appAspect = _appSettings.width / _appSettings.height;
        var _deviceNativeAspect = device.screen.width / device.screen.height;

        var _scale = _appAspect >= _deviceNativeAspect ? device.screen.width / _appSettings.width : device.screen.height / _appSettings.height;

        var _title = new TitleScene(_appSettings);
        var _game = new GameScene(_appSettings);

        this.view.style.backgroundColor = "#000000";

        var _rootView = new StackView({
            superview: this,
            x: (device.width - _appSettings.width * _scale) / 2,
            y: (device.height - _appSettings.height * _scale) / 2,
            width: _appSettings.width,
            height: _appSettings.height,
            clip: true,
            scale: _scale
        });

        _rootView.push(_title);

        _title.on("TitleScene:start", function() {
            _rootView.push(_game);
            _game.emit("Application:kickoff");
        });

        _game.on("GameScene:end", function() {
            _rootView.pop();
        });
    };

    this.launchUI = function () {

    };

});
