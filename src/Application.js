import ui.TextView as TextView;
import ui.StackView as StackView;
import ui.View;

import device;

import src.scenes.TitleScene as TitleScene;
import src.scenes.GameScene as GameScene;

exports = Class(GC.Application, function () {

    this.initUI = function () {

        var appSettings = {
            width: 576,
            height: device.screen.height * 576 / device.screen.width
        };

        var scale = device.screen.width / 576;

        var _title = new TitleScene(appSettings);
        var _game = new GameScene(appSettings);

        this.view.style.backgroundColor = "#000000";

        var _rootView = new StackView({
            superview: this,
            x: 0,
            y: (device.height - appSettings.height * scale) / 2,
            width: appSettings.width,
            height: appSettings.height,
            clip: true,
            scale: scale
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
