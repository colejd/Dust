(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Dust = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cellauto = require("./vendor/cellauto.js");

var CellAuto = _interopRequireWildcard(_cellauto);

var _worlds = require("./worlds.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dust = exports.Dust = function () {
    function Dust(container, initFinishedCallback) {
        var _this = this;

        _classCallCheck(this, Dust);

        this.container = container;

        var worldNames = Object.keys(_worlds.Worlds);
        this.worldOptions = {
            name: worldNames[worldNames.length * Math.random() << 0] // Random startup world
            //width: 128, // Can force a width/height here
            //height: 128


            // Create the app and put its canvas into `container`
        };this.app = new PIXI.Application({
            antialias: false,
            transparent: false,
            resolution: 1
        });
        this.container.appendChild(this.app.view);

        // Start the update loop
        this.app.ticker.add(function (delta) {
            _this.OnUpdate(delta);
        });

        this.framecounter = new FrameCounter(1, null);

        // Stop application and wait for setup to finish
        this.app.stop();

        // Load resources needed for the program to run
        PIXI.loader.add('fragShader', '../resources/dust.frag').load(function (loader, res) {
            // Loading has finished
            _this.loadedResources = res;
            _this.Setup();
            _this.app.start();
            initFinishedCallback();
        });
    }

    /**
     * Reusable method for setting up the simulation from `this.worldOptions`.
     * Also works as a reset function if you call this without changing
     * `this.worldOptions.name` beforehand.
     */


    _createClass(Dust, [{
        key: "Setup",
        value: function Setup() {

            // Create the world from the string
            this.world = _worlds.Worlds[this.worldOptions.name].call(this, this.worldOptions.width, this.worldOptions.height);
            this.framecounter.frameFrequency = this.world.recommendedFrameFrequency || 1;

            this.app.renderer.resize(this.world.width, this.world.height);

            // Remove canvas filtering through css
            this.app.renderer.view.style.cssText = " \n            image-rendering: optimizeSpeed; \n            image-rendering: -moz-crisp-edges; \n            image-rendering: -webkit-optimize-contrast; \n            image-rendering: optimize-contrast;\n            image-rendering: -o-crisp-edges; \n            image-rendering: pixelated; \n            -ms-interpolation-mode: nearest-neighbor; \n        ";
            this.app.renderer.view.style.border = "1px dashed green";
            this.app.renderer.view.style.width = "100%";
            this.app.renderer.view.style.height = "100%";
            this.app.renderer.backgroundColor = 0xffffff;

            // Create a sprite from a blank canvas
            this.textureCanvas = document.createElement('canvas');
            this.textureCanvas.width = this.world.width;
            this.textureCanvas.height = this.world.height;
            this.textureCtx = this.textureCanvas.getContext('2d'); // Used later to update texture

            this.baseTexture = new PIXI.BaseTexture.fromCanvas(this.textureCanvas);
            this.sprite = new PIXI.Sprite(new PIXI.Texture(this.baseTexture, new PIXI.Rectangle(0, 0, this.world.width, this.world.height)));

            // Center the sprite
            this.sprite.x = this.world.width / 2;
            this.sprite.y = this.world.height / 2;
            this.sprite.anchor.set(0.5);

            // Create the shader for the sprite
            this.filter = new PIXI.Filter(null, this.loadedResources.fragShader.data);
            this.sprite.filters = [this.filter];

            this.app.stage.removeChildren(); // Remove any attached children (for case where changing presets)
            this.app.stage.addChild(this.sprite);

            // Update the texture from the initial state of the world
            this.UpdateTexture();
        }

        /**
         * Called every frame. Continues indefinitely after being called once.
         */

    }, {
        key: "OnUpdate",
        value: function OnUpdate(delta) {
            var noskip = this.framecounter.IncrementFrame();
            if (noskip) {
                this.filter.uniforms.time += delta;
                this.world.step();
                this.UpdateTexture();
                this.app.render();
            }
        }

        /**
         * Updates the texture representing the world.
         * Writes cell colors to the texture canvas and updates `baseTexture` from it,
         * which makes Pixi update the sprite.
         */

    }, {
        key: "UpdateTexture",
        value: function UpdateTexture() {

            var index = 0;
            var ctx = this.textureCtx;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.textureCanvas.width, this.textureCanvas.height);
            var pix = ctx.createImageData(this.textureCanvas.width, this.textureCanvas.height);
            for (var y = 0; y < this.textureCanvas.height; y++) {
                for (var x = 0; x < this.textureCanvas.width; x++) {
                    // Swap buffers if used
                    //if(this.world.grid[y][x].newState != null)
                    //    this.world.grid[y][x].state = this.world.grid[y][x].newState;
                    var paletteIndex = this.world.grid[y][x].getColor();
                    try {
                        var colorRGBA = this.world.palette[paletteIndex];
                        pix.data[index++] = colorRGBA[0];
                        pix.data[index++] = colorRGBA[1];
                        pix.data[index++] = colorRGBA[2];
                        pix.data[index++] = colorRGBA[3];
                    } catch (ex) {
                        console.error(paletteIndex);
                        throw new Error(ex);
                    }
                }
            }
            ctx.putImageData(pix, 0, 0);

            // Tell Pixi to update the texture referenced by this ctx.
            this.baseTexture.update();
        }
    }]);

    return Dust;
}();

/**
 * Convenience class for restricting the refresh rate of the simulation.
 */


var FrameCounter = function () {
    function FrameCounter(frameFrequency) {
        var frameLimit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, FrameCounter);

        // The number of frames ingested
        this.frameCount = 0;

        // The number of frames allowed to run
        this.passedFrames = 0;

        // Frame will run every `frameFrequency` frames that pass
        this.frameFrequency = frameFrequency;

        // If set, class will stop allowing frames after `frameLimit` 
        // passedFrames have been allowed.
        this.frameLimit = frameLimit;
    }

    /**
     * Returns true once every `frameFrequency` times it is called.
     */


    _createClass(FrameCounter, [{
        key: "IncrementFrame",
        value: function IncrementFrame() {
            this.frameCount += 1;
            if (this.frameCount % this.frameFrequency == 0) {
                // If we've reached the frame limit
                if (this.frameLimit != null && this.passedFrames >= this.frameLimit) return false;

                this.frameCount = 0;
                this.passedFrames += 1;
                return true;
            }
            return false;
        }
    }]);

    return FrameCounter;
}();

},{"./vendor/cellauto.js":5,"./worlds.js":6}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GUI = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _worlds = require("./worlds.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GUI = exports.GUI = function () {
    function GUI() {
        _classCallCheck(this, GUI);
    }

    _createClass(GUI, null, [{
        key: "Init",


        /**
         * Creates and attaches a GUI to the page if DAT.GUI is included.
         */
        value: function Init(dust) {
            if (typeof dat === "undefined") {
                console.warn("No DAT.GUI instance found. Import on this page to use!");
                return;
            }

            var gui = new dat.GUI();

            gui.add(dust.framecounter, 'frameFrequency').min(1).max(30).step(1).listen();

            gui.add(dust.worldOptions, 'name', Object.getOwnPropertyNames(_worlds.Worlds)).onChange(function () {
                dust.Setup();
            }).name("Preset");

            gui.add(dust, "Setup").name("Reset");
        }
    }]);

    return GUI;
}();

},{"./worlds.js":6}],3:[function(require,module,exports){
"use strict";

var _webglDetect = require("./utils/webgl-detect.js");

var _dust = require("./dust.js");

var _gui = require("./gui.js");

var container = document.getElementById("dust-container");

if (!_webglDetect.Detector.HasWebGL()) {
    //exit("WebGL is not supported on this browser.");
    console.log("WebGL is not supported on this browser.");
    container.innerHTML = _webglDetect.Detector.GetErrorHTML();
    container.classList.add("no-webgl");
} else {
    var dust = new _dust.Dust(container, function () {
        // Dust is now fully loaded
        _gui.GUI.Init(dust);
    });
}

},{"./dust.js":1,"./gui.js":2,"./utils/webgl-detect.js":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Detector = function () {
    function Detector() {
        _classCallCheck(this, Detector);
    }

    _createClass(Detector, null, [{
        key: "HasWebGL",


        //http://stackoverflow.com/questions/11871077/proper-way-to-detect-webgl-support
        value: function HasWebGL() {
            if (!!window.WebGLRenderingContext) {
                var canvas = document.createElement("canvas"),
                    names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
                    context = false;

                for (var i = 0; i < 4; i++) {
                    try {
                        context = canvas.getContext(names[i]);
                        if (context && typeof context.getParameter == "function") {
                            // WebGL is enabled
                            return true;
                        }
                    } catch (e) {}
                }

                // WebGL is supported, but disabled
                return false;
            }
            // WebGL not supported
            return false;
        }
    }, {
        key: "GetErrorHTML",
        value: function GetErrorHTML() {
            var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            if (message == null) {
                message = "Your graphics card does not seem to support \n                        <a href=\"http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation\">WebGL</a>. <br>\n                        Find out how to get it <a href=\"http://get.webgl.org/\">here</a>.";
            }
            return "\n        <div class=\"no-webgl-support\">\n        <p style=\"text-align: center;\">" + message + "</p>\n        </div>\n        ";
        }
    }]);

    return Detector;
}();

exports.Detector = Detector;

},{}],5:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function CellAutoCell(locX, locY) {
	this.x = locX;
	this.y = locY;

	this.delays = [];
}

CellAutoCell.prototype.process = function (neighbors) {
	return;
};
CellAutoCell.prototype.countSurroundingCellsWithValue = function (neighbors, value) {
	var surrounding = 0;
	for (var i = 0; i < neighbors.length; i++) {
		if (neighbors[i] !== null && neighbors[i][value]) {
			surrounding++;
		}
	}
	return surrounding;
};
CellAutoCell.prototype.delay = function (numSteps, fn) {
	this.delays.push({ steps: numSteps, action: fn });
};

CellAutoCell.prototype.reset = function (neighbors) {
	return;
};

CellAutoCell.prototype.getSurroundingCellsAverageValue = function (neighbors, value) {
	var summed = 0.0;
	for (var i = 0; i < neighbors.length; i++) {
		if (neighbors[i] !== null && (neighbors[i][value] || neighbors[i][value] === 0)) {
			summed += neighbors[i][value];
		}
	}
	return summed / neighbors.length; //cnt;
};
function CAWorld(options) {

	this.width = 24;
	this.height = 24;
	this.options = options;

	this.wrap = false;

	this.TOPLEFT = { index: 0, x: -1, y: -1 };
	this.TOP = { index: 1, x: 0, y: -1 };
	this.TOPRIGHT = { index: 2, x: 1, y: -1 };
	this.LEFT = { index: 3, x: -1, y: 0 };
	this.RIGHT = { index: 4, x: 1, y: 0 };
	this.BOTTOMLEFT = { index: 5, x: -1, y: 1 };
	this.BOTTOM = { index: 6, x: 0, y: 1 };
	this.BOTTOMRIGHT = { index: 7, x: 1, y: 1 };

	this.randomGenerator = Math.random;

	// square tiles by default, eight sides
	var neighborhood = [null, null, null, null, null, null, null, null];

	if (this.options.hexTiles) {
		// six sides
		neighborhood = [null, null, null, null, null, null];
	}
	this.step = function () {
		var y, x;
		for (y = 0; y < this.height; y++) {
			for (x = 0; x < this.width; x++) {
				this.grid[y][x].reset();
			}
		}

		// bottom up, left to right processing
		for (y = this.height - 1; y >= 0; y--) {
			for (x = this.width - 1; x >= 0; x--) {
				this.fillNeighbors(neighborhood, x, y);
				var cell = this.grid[y][x];
				cell.process(neighborhood);

				// perform any delays
				for (var i = 0; i < cell.delays.length; i++) {
					cell.delays[i].steps--;
					if (cell.delays[i].steps <= 0) {
						// perform action and remove delay
						cell.delays[i].action(cell);
						cell.delays.splice(i, 1);
						i--;
					}
				}
			}
		}
	};

	//var NEIGHBORLOCS = [{x:-1, y:-1}, {x:0, y:-1}, {x:1, y:-1}, {x:-1, y:0}, {x:1, y:0},{x:-1, y:1}, {x:0, y:1}, {x:1, y:1}];
	// square tiles by default
	var NEIGHBORLOCS = [{ diffX: function diffX() {
			return -1;
		}, diffY: function diffY() {
			return -1;
		} }, // top left
	{ diffX: function diffX() {
			return 0;
		}, diffY: function diffY() {
			return -1;
		} }, // top
	{ diffX: function diffX() {
			return 1;
		}, diffY: function diffY() {
			return -1;
		} }, // top right
	{ diffX: function diffX() {
			return -1;
		}, diffY: function diffY() {
			return 0;
		} }, // left
	{ diffX: function diffX() {
			return 1;
		}, diffY: function diffY() {
			return 0;
		} }, // right
	{ diffX: function diffX() {
			return -1;
		}, diffY: function diffY() {
			return 1;
		} }, // bottom left
	{ diffX: function diffX() {
			return 0;
		}, diffY: function diffY() {
			return 1;
		} }, // bottom
	{ diffX: function diffX() {
			return 1;
		}, diffY: function diffY() {
			return 1;
		} // bottom right
	}];
	if (this.options.hexTiles) {
		if (this.options.flatTopped) {
			// flat topped hex map,  function requires column to be passed
			NEIGHBORLOCS = [{ diffX: function diffX() {
					return -1;
				}, diffY: function diffY(x) {
					return x % 2 ? -1 : 0;
				} }, // top left
			{ diffX: function diffX() {
					return 0;
				}, diffY: function diffY() {
					return -1;
				} }, // top
			{ diffX: function diffX() {
					return 1;
				}, diffY: function diffY(x) {
					return x % 2 ? -1 : 0;
				} }, // top right
			{ diffX: function diffX() {
					return 1;
				}, diffY: function diffY(x) {
					return x % 2 ? 0 : 1;
				} }, // bottom right
			{ diffX: function diffX() {
					return 0;
				}, diffY: function diffY() {
					return 1;
				} }, // bottom
			{ diffX: function diffX() {
					return -1;
				}, diffY: function diffY(x) {
					return x % 2 ? 0 : 1;
				} // bottom left
			}];
		} else {
			// pointy topped hex map, function requires row to be passed
			NEIGHBORLOCS = [{ diffX: function diffX(x, y) {
					return y % 2 ? 0 : -1;
				}, diffY: function diffY() {
					return -1;
				} }, // top left
			{ diffX: function diffX(x, y) {
					return y % 2 ? 1 : 0;
				}, diffY: function diffY() {
					return -1;
				} }, // top right
			{ diffX: function diffX() {
					return -1;
				}, diffY: function diffY() {
					return 0;
				} }, // left
			{ diffX: function diffX() {
					return 1;
				}, diffY: function diffY() {
					return 0;
				} }, // right
			{ diffX: function diffX(x, y) {
					return y % 2 ? 0 : -1;
				}, diffY: function diffY() {
					return 1;
				} }, // bottom left
			{ diffX: function diffX(x, y) {
					return y % 2 ? 1 : 0;
				}, diffY: function diffY() {
					return 1;
				} // bottom right
			}];
		}
	}
	this.fillNeighbors = function (neighbors, x, y) {
		for (var i = 0; i < NEIGHBORLOCS.length; i++) {
			var neighborX = x + NEIGHBORLOCS[i].diffX(x, y);
			var neighborY = y + NEIGHBORLOCS[i].diffY(x, y);
			if (this.wrap) {
				// TODO: hex map support for wrapping
				neighborX = (neighborX + this.width) % this.width;
				neighborY = (neighborY + this.height) % this.height;
			}
			if (!this.wrap && (neighborX < 0 || neighborY < 0 || neighborX >= this.width || neighborY >= this.height)) {
				neighbors[i] = null;
			} else {
				neighbors[i] = this.grid[neighborY][neighborX];
			}
		}
	};

	this.initialize = function (arrayTypeDist) {

		// sort the cell types by distribution
		arrayTypeDist.sort(function (a, b) {
			return a.distribution > b.distribution ? 1 : -1;
		});

		var totalDist = 0;
		// add all distributions together
		for (var i = 0; i < arrayTypeDist.length; i++) {
			totalDist += arrayTypeDist[i].distribution;
			arrayTypeDist[i].distribution = totalDist;
		}

		this.grid = [];
		for (var y = 0; y < this.height; y++) {
			this.grid[y] = [];
			for (var x = 0; x < this.width; x++) {
				var random = this.randomGenerator() * 100;

				for (i = 0; i < arrayTypeDist.length; i++) {
					if (random <= arrayTypeDist[i].distribution) {
						this.grid[y][x] = new this.cellTypes[arrayTypeDist[i].name](x, y);
						break;
					}
				}
			}
		}
	};

	this.cellTypes = {};
	this.registerCellType = function (name, cellOptions, init) {
		this.cellTypes[name] = function (x, y) {
			CellAutoCell.call(this, x, y);

			if (init) {
				init.call(this, x, y);
			}

			if (cellOptions) {
				for (var key in cellOptions) {
					if (typeof cellOptions[key] !== 'function') {
						// properties get instance
						if (_typeof(cellOptions[key]) === 'object') {
							// objects must be cloned
							this[key] = JSON.parse(JSON.stringify(cellOptions[key]));
						} else {
							// primitive
							this[key] = cellOptions[key];
						}
					}
				}
			}
		};
		this.cellTypes[name].prototype = Object.create(CellAutoCell.prototype);
		this.cellTypes[name].prototype.constructor = this.cellTypes[name];
		this.cellTypes[name].prototype.cellType = name;

		if (cellOptions) {
			for (var key in cellOptions) {
				if (typeof cellOptions[key] === 'function') {
					// functions get prototype
					this.cellTypes[name].prototype[key] = cellOptions[key];
				}
			}
		}
	};

	// apply options
	if (options) {
		for (var key in options) {
			this[key] = options[key];
		}
	}
}

CAWorld.prototype.initializeFromGrid = function (values, initGrid) {

	this.grid = [];
	for (var y = 0; y < this.height; y++) {
		this.grid[y] = [];
		for (var x = 0; x < this.width; x++) {
			for (var i = 0; i < values.length; i++) {
				if (values[i].gridValue === initGrid[y][x]) {
					this.grid[y][x] = new this.cellTypes[values[i].name](x, y);
					break;
				}
			}
		}
	}
};

CAWorld.prototype.createGridFromValues = function (values, defaultValue) {
	var newGrid = [];

	for (var y = 0; y < this.height; y++) {
		newGrid[y] = [];
		for (var x = 0; x < this.width; x++) {
			newGrid[y][x] = defaultValue;
			var cell = this.grid[y][x];
			for (var i = 0; i < values.length; i++) {
				if (cell.cellType == values[i].cellType && cell[values[i].hasProperty]) {
					newGrid[y][x] = values[i].value;
				}
			}
		}
	}

	return newGrid;
};

;(function () {
	var CellAuto = {
		World: CAWorld,
		Cell: CellAutoCell
	};

	if (typeof define === 'function' && define.amd) {
		define('CellAuto', function () {
			return CellAuto;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = CellAuto;
	} else {
		window.CellAuto = CellAuto;
	}
})();

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Worlds = undefined;

var _cellauto = require('./vendor/cellauto.js');

var CellAuto = _interopRequireWildcard(_cellauto);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var Worlds = exports.Worlds = {

    /**
     * Conway's Game of Life.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Life: function Life() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [[68, 36, 52, 255], [255, 255, 255, 255]];

        world.registerCellType('living', {
            getColor: function getColor() {
                return this.alive ? 0 : 1;
            },
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');
                this.alive = surrounding === 3 || surrounding === 2 && this.alive;
            },
            reset: function reset() {
                this.wasAlive = this.alive;
            }
        }, function () {
            // Init
            this.alive = Math.random() > 0.5;
        });

        world.initialize([{ name: 'living', distribution: 100 }]);

        return world;
    },

    /**
     * CA that looks like lava.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Lava: function Lava() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        // thanks to TheLastBanana on TIGSource

        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        world.palette = [[34, 10, 21, 255], [68, 17, 26, 255], [123, 16, 16, 255], [190, 45, 16, 255], [244, 102, 20, 255], [254, 212, 97, 255]];

        var colors = [];
        var index = 0;
        for (; index < 18; ++index) {
            colors[index] = 1;
        }
        for (; index < 22; ++index) {
            colors[index] = 0;
        }
        for (; index < 25; ++index) {
            colors[index] = 1;
        }
        for (; index < 27; ++index) {
            colors[index] = 2;
        }
        for (; index < 29; ++index) {
            colors[index] = 3;
        }
        for (; index < 32; ++index) {
            colors[index] = 2;
        }
        for (; index < 35; ++index) {
            colors[index] = 0;
        }
        for (; index < 36; ++index) {
            colors[index] = 2;
        }
        for (; index < 38; ++index) {
            colors[index] = 4;
        }
        for (; index < 42; ++index) {
            colors[index] = 5;
        }
        for (; index < 44; ++index) {
            colors[index] = 4;
        }
        for (; index < 46; ++index) {
            colors[index] = 2;
        }
        for (; index < 56; ++index) {
            colors[index] = 1;
        }
        for (; index < 64; ++index) {
            colors[index] = 0;
        }

        world.registerCellType('lava', {
            getColor: function getColor() {
                var v = this.value + 0.5 + Math.sin(this.x / world.width * Math.PI) * 0.04 + Math.sin(this.y / world.height * Math.PI) * 0.04 - 0.05;
                v = Math.min(1.0, Math.max(0.0, v));

                return colors[Math.floor(colors.length * v)];
            },
            process: function process(neighbors) {
                if (this.droplet === true) {
                    for (var i = 0; i < neighbors.length; i++) {
                        if (neighbors[i] !== null && neighbors[i].value) {
                            neighbors[i].value = 0.5 * this.value;
                            neighbors[i].prev = 0.5 * this.prev;
                        }
                    }
                    this.droplet = false;
                    return true;
                }
                var avg = this.getSurroundingCellsAverageValue(neighbors, 'value');
                this.next = 0.998 * (2 * avg - this.prev);

                return true;
            },
            reset: function reset() {
                if (Math.random() > 0.99993) {
                    this.value = -0.25 + 0.3 * Math.random();
                    this.prev = this.value;
                    this.droplet = true;
                } else {
                    this.prev = this.value;
                    this.value = this.next;
                }
                this.value = Math.min(0.5, Math.max(-0.5, this.value));
                return true;
            }
        }, function () {
            //init
            this.value = 0.0;
            this.prev = this.value;
            this.next = this.value;
        });

        world.initialize([{ name: 'lava', distribution: 100 }]);

        return world;
    },

    /**
     * Generates a maze-like structure.
     * Based on rule B3/S1234 (Mazecetric).
     */
    Mazecetric: function Mazecetric() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var world = new CellAuto.World({
            width: width,
            height: height
        });
        world.recommendedFrameFrequency = 5;

        world.palette = [[68, 36, 52, 255], [255, 255, 255, 255]];

        var threshold = Math.random() * 5 / 10;

        world.registerCellType('living', {
            getColor: function getColor() {
                return this.alive ? 0 : 1;
            },
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');
                this.alive = surrounding === 3 || surrounding >= 1 && surrounding <= 4 && this.alive;
            },
            reset: function reset() {
                this.wasAlive = this.alive;
            }
        }, function () {
            // Init
            this.alive = Math.random() < threshold;
        });

        world.initialize([{ name: 'living', distribution: 100 }]);

        return world;
    },

    /**
     * Cyclic rainbow automata.
     * 
     * From https://sanojian.github.io/cellauto
     */
    CyclicRainbows: function CyclicRainbows() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.recommendedFrameFrequency = 1;

        world.palette = [[255, 0, 0, 1 * 255], [255, 96, 0, 1 * 255], [255, 191, 0, 1 * 255], [223, 255, 0, 1 * 255], [128, 255, 0, 1 * 255], [32, 255, 0, 1 * 255], [0, 255, 64, 1 * 255], [0, 255, 159, 1 * 255], [0, 255, 255, 1 * 255], [0, 159, 255, 1 * 255], [0, 64, 255, 1 * 255], [32, 0, 255, 1 * 255], [127, 0, 255, 1 * 255], [223, 0, 255, 1 * 255], [255, 0, 191, 1 * 255], [255, 0, 96, 1 * 255]];

        world.registerCellType('cyclic', {
            getColor: function getColor() {
                return this.state;
            },
            process: function process(neighbors) {
                var next = (this.state + Math.floor(Math.random() * 2)) % 16;

                var changing = false;
                for (var i = 0; i < neighbors.length; i++) {
                    if (neighbors[i] !== null) {
                        changing = changing || neighbors[i].state === next;
                    }
                }
                if (changing) this.state = next;
                return true;
            },
            reset: function reset() {
                this.state = this.newState;
            }
        }, function () {
            //init
            this.newState = Math.floor(Math.random() * 16);
        });

        world.initialize([{ name: 'cyclic', distribution: 100 }]);

        return world;
    },

    /**
     * Simulates caves and water movement.
     * 
     * From https://sanojian.github.io/cellauto
     */
    CavesWithWater: function CavesWithWater() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        // FIRST CREATE CAVES
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.registerCellType('wall', {
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
                this.open = this.wasOpen && surrounding >= 4 || surrounding >= 6;
            },
            reset: function reset() {
                this.wasOpen = this.open;
            }
        }, function () {
            //init
            this.open = Math.random() > 0.40;
        });

        world.initialize([{ name: 'wall', distribution: 100 }]);

        // generate our cave, 10 steps aught to do it
        for (var i = 0; i < 10; i++) {
            world.step();
        }

        var grid = world.createGridFromValues([{ cellType: 'wall', hasProperty: 'open', value: 0 }], 1);

        // NOW USE OUR CAVES TO CREATE A NEW WORLD CONTAINING WATER
        world = new CellAuto.World({
            width: width,
            height: height,
            clearRect: true
        });

        world.palette = [[89, 125, 206, 0 * 255], [89, 125, 206, 1 / 9 * 255], [89, 125, 206, 2 / 9 * 255], [89, 125, 206, 3 / 9 * 255], [89, 125, 206, 4 / 9 * 255], [89, 125, 206, 5 / 9 * 255], [89, 125, 206, 6 / 9 * 255], [89, 125, 206, 7 / 9 * 255], [89, 125, 206, 8 / 9 * 255], [89, 125, 206, 1 * 255], [109, 170, 44, 1 * 255], [68, 36, 52, 1 * 255]];

        world.registerCellType('water', {
            getColor: function getColor() {
                //return 0x597DCE44;
                return this.water;
            },
            process: function process(neighbors) {
                if (this.water === 0) {
                    // already empty
                    return;
                }
                // push my water out to my available neighbors

                // cell below me will take all it can
                if (neighbors[world.BOTTOM.index] !== null && this.water && neighbors[world.BOTTOM.index].water < 9) {
                    var amt = Math.min(this.water, 9 - neighbors[world.BOTTOM.index].water);
                    this.water -= amt;
                    neighbors[world.BOTTOM.index].water += amt;
                    return;
                }

                // bottom two corners take half of what I have
                for (var i = 5; i <= 7; i++) {
                    if (i != world.BOTTOM.index && neighbors[i] !== null && this.water && neighbors[i].water < 9) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 2));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (i = 3; i <= 4; i++) {
                    if (neighbors[i] !== null && neighbors[i].water < this.water) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 3));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
            }
        }, function () {
            //init
            this.water = Math.floor(Math.random() * 9);
        });

        world.registerCellType('rock', {
            isSolid: true,
            getColor: function getColor() {
                return this.lighted ? 10 : 11;
            },
            process: function process(neighbors) {
                this.lighted = neighbors[world.TOP.index] && !(neighbors[world.TOP.index].water === 9) && !neighbors[world.TOP.index].isSolid && neighbors[world.BOTTOM.index] && neighbors[world.BOTTOM.index].isSolid;
            }
        });

        // pass in our generated cave data
        world.initializeFromGrid([{ name: 'rock', gridValue: 1 }, { name: 'water', gridValue: 0 }], grid);

        return world;
    },

    Rain: function Rain() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        // FIRST CREATE CAVES
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.registerCellType('wall', {
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
                this.open = this.wasOpen && surrounding >= 4 || surrounding >= 6;
            },
            reset: function reset() {
                this.wasOpen = this.open;
            }
        }, function () {
            //init
            this.open = Math.random() > 0.40;
        });

        world.initialize([{ name: 'wall', distribution: 100 }]);

        // generate our cave, 10 steps aught to do it
        for (var i = 0; i < 10; i++) {
            world.step();
        }

        var grid = world.createGridFromValues([{ cellType: 'wall', hasProperty: 'open', value: 0 }], 1);

        // cut the top half of the caves off
        for (var y = 0; y < Math.floor(world.height / 2); y++) {
            for (var x = 0; x < world.width; x++) {
                grid[y][x] = 0;
            }
        }

        // NOW USE OUR CAVES TO CREATE A NEW WORLD CONTAINING WATER
        world = new CellAuto.World({
            width: width,
            height: height,
            clearRect: true
        });

        world.palette = [[89, 125, 206, 1], [89, 125, 206, 1 / 9 * 255], [89, 125, 206, 2 / 9 * 255], [89, 125, 206, 3 / 9 * 255], [89, 125, 206, 4 / 9 * 255], [89, 125, 206, 5 / 9 * 255], [89, 125, 206, 6 / 9 * 255], [89, 125, 206, 7 / 9 * 255], [89, 125, 206, 8 / 9 * 255], [89, 125, 206, 255], [109, 170, 44, 255], [68, 36, 52, 255]];

        world.registerCellType('air', {
            getColor: function getColor() {
                //return '89, 125, 206, ' + (this.water ? Math.max(0.3, this.water/9) : 0);
                return this.water;
            },
            process: function process(neighbors) {
                // rain on the top row
                if (neighbors[world.TOP.index] === null && Math.random() < 0.02) {
                    this.water = 5;
                } else if (this.water === 0) {
                    // already empty
                    return;
                }

                // push my water out to my available neighbors

                // cell below me will take all it can
                if (neighbors[world.BOTTOM.index] !== null && this.water && neighbors[world.BOTTOM.index].water < 9) {
                    var amt = Math.min(this.water, 9 - neighbors[world.BOTTOM.index].water);
                    this.water -= amt;
                    neighbors[world.BOTTOM.index].water += amt;
                    return;
                }

                // bottom two corners take half of what I have
                for (var i = 5; i <= 7; i++) {
                    if (i != world.BOTTOM.index && neighbors[i] !== null && this.water && neighbors[i].water < 9) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 2));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (i = 3; i <= 4; i++) {
                    if (neighbors[i] !== null && neighbors[i].water < this.water) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 3));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
            }
        }, function () {
            //init
            this.water = 0;
        });

        world.registerCellType('rock', {
            isSolid: true,
            getColor: function getColor() {
                return this.lighted ? 10 : 11;
            },
            process: function process(neighbors) {
                this.lighted = neighbors[world.TOP.index] && !(neighbors[world.TOP.index].water === 9) && !neighbors[world.TOP.index].isSolid && neighbors[world.BOTTOM.index] && neighbors[world.BOTTOM.index].isSolid;
            }
        });

        // pass in our generated cave data
        world.initializeFromGrid([{ name: 'rock', gridValue: 1 }, { name: 'air', gridValue: 0 }], grid);

        return world;
    },

    /**
     * Simulates splashing water.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Splashes: function Splashes() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [];
        var colors = [];
        for (var index = 0; index < 64; index++) {
            world.palette.push([89, 125, 206, index / 64 * 255]);
            colors[index] = 63 - index;
        }

        world.registerCellType('water', {
            getColor: function getColor() {
                var v = Math.max(2 * this.value + 0.02, 0) - 0.02 + 0.5;
                return colors[Math.floor(colors.length * v)];
            },
            process: function process(neighbors) {
                if (this.droplet == true) {
                    for (var i = 0; i < neighbors.length; i++) {
                        if (neighbors[i] !== null && neighbors[i].value) {
                            neighbors[i].value = 0.5 * this.value;
                            neighbors[i].prev = 0.5 * this.prev;
                        }
                    }
                    this.droplet = false;
                    return true;
                }
                var avg = this.getSurroundingCellsAverageValue(neighbors, 'value');
                this.next = 0.99 * (2 * avg - this.prev);
                return true;
            },
            reset: function reset() {
                if (Math.random() > 0.9999) {
                    this.value = -0.2 + 0.25 * Math.random();
                    this.prev = this.value;
                    this.droplet = true;
                } else {
                    this.prev = this.value;
                    this.value = this.next;
                }
                return true;
            }
        }, function () {
            //init
            this.water = true;
            this.value = 0.0;
            this.prev = this.value;
            this.next = this.value;
        });

        world.initialize([{ name: 'water', distribution: 100 }]);

        return world;
    },

    /**
     * Rule 52928 - the CA used for Wolfram Alpha's loading animations
     * 
     * Resources:
     * https://www.quora.com/What-is-Wolfram-Alphas-loading-screen-a-depiction-of
     * http://jsfiddle.net/hungrycamel/9UrzJ/
     */
    Wolfram: function Wolfram() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        world.recommendedFrameFrequency = 2;

        world.palette = [[255, 255, 255, 255], // Background color
        [255, 110, 0, 255], // dark orange
        [255, 130, 0, 255], //      |
        [255, 150, 0, 255], //      |
        [255, 170, 0, 255], //      V
        [255, 180, 0, 255] // light orange
        ];

        var choice = Math.random();

        var seedList = [[[0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 2, 1, 1, 1, 1, 0, 0, 0, 0], [1, 1, 3, 4, 2, 1, 1, 0, 0, 0], [0, 1, 1, 1, 4, 1, 1, 0, 0, 0], [0, 1, 2, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 0, 0, 2, 2, 0, 0], [0, 0, 2, 2, 0, 0, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 2, 1, 0], [0, 0, 0, 1, 1, 4, 1, 1, 1, 0], [0, 0, 0, 1, 1, 2, 4, 3, 1, 1], [0, 0, 0, 0, 1, 1, 1, 1, 2, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 0], [1, 1, 1, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 1, 1, 1], [0, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 0, 0], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [0, 1, 1, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 1, 0], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 1, 1, 1, 0], [0, 1, 1, 1, 0, 0, 0, 1], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 0, 1], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 1, 1, 1, 0], [1, 1, 1, 0, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1], [0, 1, 1, 1, 0, 0, 0, 0]], [[0, 0, 1, 1, 1, 1, 1, 1], [1, 0, 1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 0, 0]], [[0, 1, 0, 0, 0, 1, 1, 1], [1, 0, 1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 0, 0, 0, 1, 0]], [[0, 1, 1, 0, 1, 1, 1, 1], [0, 1, 0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0, 1, 0], [1, 1, 1, 1, 0, 1, 1, 0]], [[1, 1, 1, 0, 1, 1, 1, 0], [0, 1, 0, 0, 1, 1, 1, 0], [0, 1, 1, 1, 0, 0, 1, 0], [0, 1, 1, 1, 0, 1, 1, 1]], [[1, 1, 1, 0, 1, 1, 1, 1], [1, 1, 0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 0, 1], [1, 1, 0, 1, 1, 0, 0, 1], [1, 0, 0, 1, 1, 0, 1, 1], [1, 0, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 0, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 0, 1, 0, 0, 1], [1, 0, 0, 1, 0, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 0, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 0, 1], [1, 1, 1, 0, 0, 1, 0, 0], [0, 0, 1, 0, 0, 1, 1, 1], [1, 0, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 1, 1, 0], [0, 1, 1, 0, 0, 0, 0, 0], [0, 1, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 1, 0], [0, 1, 0, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 0, 1, 0], [0, 1, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 1, 0], [1, 1, 1, 0, 0, 1, 1, 0], [0, 1, 1, 0, 0, 1, 1, 1], [0, 1, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 0, 0], [1, 1, 0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0, 1, 1], [0, 0, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 1, 0, 0], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [0, 1, 1, 1, 1, 1, 0, 1], [1, 0, 1, 1, 1, 1, 1, 0], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 1, 0], [0, 1, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 1, 1, 1], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 1, 0, 0], [0, 0, 1, 0, 0, 1, 1, 1], [1, 1, 1, 0, 0, 1, 0, 0], [0, 0, 1, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 1]]];

        world.registerCellType('living', {
            getColor: function getColor() {
                return this.state;
            },
            process: function process(neighbors) {

                var neighborOnes = neighbors.filter(function (item) {
                    return item.state == 1;
                }).length;

                if (this.state == 0) {
                    if (neighborOnes == 3 || neighborOnes == 5 || neighborOnes == 7) this.newState = 1;
                } else if (this.state == 1) {
                    if (neighborOnes == 0 || neighborOnes == 1 || neighborOnes == 2 || neighborOnes == 6 || neighborOnes == 8) this.newState = 2;
                } else if (this.state == 2) {
                    this.newState = 3;
                } else if (this.state == 3) {
                    this.newState = 4;
                } else if (this.state == 4) {
                    this.newState = 0;
                }
            },
            reset: function reset() {
                this.state = this.newState;
            }
        }, function (x, y) {
            // Init 

            // 50% chance to use a seed
            if (choice < 0.5) {
                var seed;
                // 25% chance to use a random seed
                if (choice < 0.25) {
                    seed = seedList[Math.floor(Math.random() * seedList.length)];
                }
                // 25% chance to use the Wolfram seed
                else {
                        seed = seedList[0];
                    }

                var minX = Math.floor(width / 2) - Math.floor(seed[0].length / 2);
                var maxX = Math.floor(width / 2) + Math.floor(seed[0].length / 2);
                var minY = Math.floor(height / 2) - Math.floor(seed.length / 2);
                var maxY = Math.floor(height / 2) + Math.floor(seed.length / 2);

                this.state = 0;

                // If the cell is inside of the seed array (centered in the world), then use its value
                if (x >= minX && x < maxX && y >= minY && y < maxY) {
                    this.state = seed[y - minY][x - minX];
                }
            }
            // 50% chance to initialize with noise
            else {
                    this.state = Math.random() < 0.15 ? 1 : 0;
                }
            this.newState = this.state;
        });

        world.initialize([{ name: 'living', distribution: 100 }]);

        return world;
    },

    /**
     * Simulates a Belousov-Zhabotinsky reaction (approximately).
     * This one's still a little messed up, so consider it experimental.
     * 
     * Resources:
     * http://ccl.northwestern.edu/netlogo/models/B-ZReaction
     * http://www.fractaldesign.net/automataalgorithm.aspx
     */
    BelousovZhabotinsky: function BelousovZhabotinsky() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        // Override frame frequency for this setup
        world.recommendedFrameFrequency = 10;

        // Config variables
        var kernel = [// weights for neighbors. First index is for self weight
        0, 1, 1, 1, 1, 1, 1, 1, 1].reverse();
        var k1 = 5; // Lower gives higher tendency for a cell to be sickened by ill neighbors
        var k2 = 1; // Lower gives higher tendency for a cell to be sickened by infected neighbors
        var g = 5;
        var numStates = 255;

        world.palette = [];
        for (var i = 0; i < numStates; i++) {
            var gray = Math.floor(255 / numStates * i);
            world.palette.push([gray, gray, gray, 255]);
        }

        world.registerCellType('bz', {
            getColor: function getColor() {
                return this.state;
            },
            process: function process(neighbors) {
                var healthy = 0;
                var infected = 0;
                var ill = 0;
                var sumStates = this.state;

                for (var i = 0; i < neighbors.length + 1; i++) {
                    var neighbor;
                    if (i == 8) neighbor = this;else neighbor = neighbors[i];

                    //if(neighbor !== null && neighbor.state){
                    sumStates += neighbor.state * kernel[i];
                    if (kernel[i] > 0) {
                        if (neighbor.state == 0) healthy += 1;else if (neighbor.state < numStates - 1) infected += 1;else ill += 1;
                    }
                    //}
                }

                if (this.state == 0) {
                    this.newState = infected / k1 + ill / k2;
                } else if (this.state < numStates - 1) {
                    this.newState = sumStates / infected + ill + 1 + g;
                    //this.newState = (sumStates / 9) + g;
                } else {
                    this.newState = 0;
                }

                // Make sure to set state to newstate in a second pass
                this.newState = Math.max(0, Math.min(numStates - 1, Math.floor(this.newState)));
            },
            reset: function reset() {
                this.state = this.newState;
            }
        }, function () {
            // Init
            // Generate a random state
            this.state = Math.random() < 1.0 ? Math.floor(Math.random() * numStates) : 0;
            this.newState = this.state;
        });

        world.initialize([{ name: 'bz', distribution: 100 }]);

        return world;
    }

};

},{"./vendor/cellauto.js":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZHVzdC5qcyIsInNyYy9ndWkuanMiLCJzcmMvbWFpbi5qcyIsInNyYy91dGlscy93ZWJnbC1kZXRlY3QuanMiLCJzcmMvdmVuZG9yL2NlbGxhdXRvLmpzIiwic3JjL3dvcmxkcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztBQ0FBOztJQUFZLFE7O0FBQ1o7Ozs7OztJQUVhLEksV0FBQSxJO0FBQ1Qsa0JBQVksU0FBWixFQUF1QixvQkFBdkIsRUFBNkM7QUFBQTs7QUFBQTs7QUFDekMsYUFBSyxTQUFMLEdBQWlCLFNBQWpCOztBQUVBLFlBQUksYUFBYSxPQUFPLElBQVAsZ0JBQWpCO0FBQ0EsYUFBSyxZQUFMLEdBQW9CO0FBQ2hCLGtCQUFNLFdBQVcsV0FBVyxNQUFYLEdBQW9CLEtBQUssTUFBTCxFQUFwQixJQUFxQyxDQUFoRCxDQURVLENBQzBDO0FBQzFEO0FBQ0E7OztBQUdKO0FBTm9CLFNBQXBCLENBT0EsS0FBSyxHQUFMLEdBQVcsSUFBSSxLQUFLLFdBQVQsQ0FDUDtBQUNJLHVCQUFXLEtBRGY7QUFFSSx5QkFBYSxLQUZqQjtBQUdJLHdCQUFZO0FBSGhCLFNBRE8sQ0FBWDtBQU9BLGFBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsS0FBSyxHQUFMLENBQVMsSUFBcEM7O0FBRUE7QUFDQSxhQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEdBQWhCLENBQW9CLFVBQUMsS0FBRCxFQUFXO0FBQzNCLGtCQUFLLFFBQUwsQ0FBYyxLQUFkO0FBQ0gsU0FGRDs7QUFJQSxhQUFLLFlBQUwsR0FBb0IsSUFBSSxZQUFKLENBQWlCLENBQWpCLEVBQW9CLElBQXBCLENBQXBCOztBQUVBO0FBQ0EsYUFBSyxHQUFMLENBQVMsSUFBVDs7QUFFQTtBQUNBLGFBQUssTUFBTCxDQUNLLEdBREwsQ0FDUyxZQURULEVBQ3VCLHdCQUR2QixFQUVLLElBRkwsQ0FFVSxVQUFD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LEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUxKLEVBTUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQU5KLEVBT0ksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVBKLEVBUUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVJKLEVBU0ksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVRKLEVBVUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVZKLEVBV0ksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVhKLEVBWUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixD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SyxLQUFMLElBQWMsQ0FBakIsRUFBb0I7QUFDaEIseUJBQUssUUFBTCxHQUFpQixXQUFXLEVBQVosR0FBbUIsTUFBTSxFQUF6QztBQUNILGlCQUZELE1BRU8sSUFBSSxLQUFLLEtBQUwsR0FBYyxTQUFELEdBQWMsQ0FBL0IsRUFBa0M7QUFDckMseUJBQUssUUFBTCxHQUFpQixZQUFZLFFBQVosR0FBdUIsR0FBdkIsR0FBNkIsQ0FBOUIsR0FBbUMsQ0FBbkQ7QUFDQTtBQUNILGlCQUhNLE1BR0E7QUFDSCx5QkFBSyxRQUFMLEdBQWdCLENBQWhCO0FBQ0g7O0FBRUQ7QUFDQSxxQkFBSyxRQUFMLEdBQWdCLEtBQUssR0FBTCxDQUFTLENBQVQsRUFBWSxLQUFLLEdBQUwsQ0FBUyxZQUFZLENBQXJCLEVBQXdCLEtBQUssS0FBTCxDQUFXLEtBQUssUUFBaEIsQ0FBeEIsQ0FBWixDQUFoQjtBQUVILGFBckN3QjtBQXNDekIsbUJBQU8saUJBQVk7QUFDZixxQkFBSyxLQUFMLEdBQWEsS0FBSyxRQUFsQjtBQUNIO0FBeEN3QixTQUE3QixFQXlDRyxZQUFZO0FBQ1g7QUFDQTtBQUNBLGlCQUFLLEtBQUwsR0FBYSxLQUFLLE1BQUwsS0FBZ0IsR0FBaEIsR0FBc0IsS0FBSyxLQUFMLENBQVcsS0FBSyxNQUFMLEtBQWdCLFNBQTNCLENBQXRCLEdBQThELENBQTNFO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixLQUFLLEtBQXJCO0FBQ0gsU0E5Q0Q7O0FBZ0RBLGNBQU0sVUFBTixDQUFpQixDQUNiLEVBQUUsTUFBTSxJQUFSLEVBQWMsY0FBYyxHQUE1QixFQURhLENBQWpCOztBQUlBLGVBQU8sS0FBUDtBQUNIOztBQXJ3QmUsQ0FBYiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcbmltcG9ydCB7IFdvcmxkcyB9IGZyb20gXCIuL3dvcmxkcy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRHVzdCB7XG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBpbml0RmluaXNoZWRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcblxuICAgICAgICB2YXIgd29ybGROYW1lcyA9IE9iamVjdC5rZXlzKFdvcmxkcyk7XG4gICAgICAgIHRoaXMud29ybGRPcHRpb25zID0ge1xuICAgICAgICAgICAgbmFtZTogd29ybGROYW1lc1t3b3JsZE5hbWVzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkgPDwgMF0sIC8vIFJhbmRvbSBzdGFydHVwIHdvcmxkXG4gICAgICAgICAgICAvL3dpZHRoOiAxMjgsIC8vIENhbiBmb3JjZSBhIHdpZHRoL2hlaWdodCBoZXJlXG4gICAgICAgICAgICAvL2hlaWdodDogMTI4XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGFwcCBhbmQgcHV0IGl0cyBjYW52YXMgaW50byBgY29udGFpbmVyYFxuICAgICAgICB0aGlzLmFwcCA9IG5ldyBQSVhJLkFwcGxpY2F0aW9uKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGFudGlhbGlhczogZmFsc2UsIFxuICAgICAgICAgICAgICAgIHRyYW5zcGFyZW50OiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogMVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmFwcC52aWV3KTtcblxuICAgICAgICAvLyBTdGFydCB0aGUgdXBkYXRlIGxvb3BcbiAgICAgICAgdGhpcy5hcHAudGlja2VyLmFkZCgoZGVsdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuT25VcGRhdGUoZGVsdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZyYW1lY291bnRlciA9IG5ldyBGcmFtZUNvdW50ZXIoMSwgbnVsbCk7XG5cbiAgICAgICAgLy8gU3RvcCBhcHBsaWNhdGlvbiBhbmQgd2FpdCBmb3Igc2V0dXAgdG8gZmluaXNoXG4gICAgICAgIHRoaXMuYXBwLnN0b3AoKTtcblxuICAgICAgICAvLyBMb2FkIHJlc291cmNlcyBuZWVkZWQgZm9yIHRoZSBwcm9ncmFtIHRvIHJ1blxuICAgICAgICBQSVhJLmxvYWRlclxuICAgICAgICAgICAgLmFkZCgnZnJhZ1NoYWRlcicsICcuLi9yZXNvdXJjZXMvZHVzdC5mcmFnJylcbiAgICAgICAgICAgIC5sb2FkKChsb2FkZXIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIExvYWRpbmcgaGFzIGZpbmlzaGVkXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZWRSZXNvdXJjZXMgPSByZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5TZXR1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgaW5pdEZpbmlzaGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldXNhYmxlIG1ldGhvZCBmb3Igc2V0dGluZyB1cCB0aGUgc2ltdWxhdGlvbiBmcm9tIGB0aGlzLndvcmxkT3B0aW9uc2AuXG4gICAgICogQWxzbyB3b3JrcyBhcyBhIHJlc2V0IGZ1bmN0aW9uIGlmIHlvdSBjYWxsIHRoaXMgd2l0aG91dCBjaGFuZ2luZ1xuICAgICAqIGB0aGlzLndvcmxkT3B0aW9ucy5uYW1lYCBiZWZvcmVoYW5kLlxuICAgICAqL1xuICAgIFNldHVwKCkge1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgd29ybGQgZnJvbSB0aGUgc3RyaW5nXG4gICAgICAgIHRoaXMud29ybGQgPSBXb3JsZHNbdGhpcy53b3JsZE9wdGlvbnMubmFtZV0uY2FsbCh0aGlzLCB0aGlzLndvcmxkT3B0aW9ucy53aWR0aCwgdGhpcy53b3JsZE9wdGlvbnMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5mcmFtZWNvdW50ZXIuZnJhbWVGcmVxdWVuY3kgPSB0aGlzLndvcmxkLnJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3kgfHwgMTtcblxuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci5yZXNpemUodGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQpO1xuXG4gICAgICAgIC8vIFJlbW92ZSBjYW52YXMgZmlsdGVyaW5nIHRocm91Z2ggY3NzXG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnZpZXcuc3R5bGUuY3NzVGV4dCA9IGAgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IG9wdGltaXplU3BlZWQ7IFxuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiAtbW96LWNyaXNwLWVkZ2VzOyBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogLXdlYmtpdC1vcHRpbWl6ZS1jb250cmFzdDsgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IG9wdGltaXplLWNvbnRyYXN0O1xuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiAtby1jcmlzcC1lZGdlczsgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IHBpeGVsYXRlZDsgXG4gICAgICAgICAgICAtbXMtaW50ZXJwb2xhdGlvbi1tb2RlOiBuZWFyZXN0LW5laWdoYm9yOyBcbiAgICAgICAgYDtcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS5ib3JkZXIgPSBcIjFweCBkYXNoZWQgZ3JlZW5cIjtcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IgPSAweGZmZmZmZjtcblxuICAgICAgICAvLyBDcmVhdGUgYSBzcHJpdGUgZnJvbSBhIGJsYW5rIGNhbnZhc1xuICAgICAgICB0aGlzLnRleHR1cmVDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoID0gdGhpcy53b3JsZC53aWR0aDtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCA9IHRoaXMud29ybGQuaGVpZ2h0O1xuICAgICAgICB0aGlzLnRleHR1cmVDdHggPSB0aGlzLnRleHR1cmVDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsgLy8gVXNlZCBsYXRlciB0byB1cGRhdGUgdGV4dHVyZVxuXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmUgPSBuZXcgUElYSS5CYXNlVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMudGV4dHVyZUNhbnZhcyk7XG4gICAgICAgIHRoaXMuc3ByaXRlID0gbmV3IFBJWEkuU3ByaXRlKFxuICAgICAgICAgICAgbmV3IFBJWEkuVGV4dHVyZSh0aGlzLmJhc2VUZXh0dXJlLCBuZXcgUElYSS5SZWN0YW5nbGUoMCwgMCwgdGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQpKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENlbnRlciB0aGUgc3ByaXRlXG4gICAgICAgIHRoaXMuc3ByaXRlLnggPSB0aGlzLndvcmxkLndpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5zcHJpdGUueSA9IHRoaXMud29ybGQuaGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5zcHJpdGUuYW5jaG9yLnNldCgwLjUpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2hhZGVyIGZvciB0aGUgc3ByaXRlXG4gICAgICAgIHRoaXMuZmlsdGVyID0gbmV3IFBJWEkuRmlsdGVyKG51bGwsIHRoaXMubG9hZGVkUmVzb3VyY2VzLmZyYWdTaGFkZXIuZGF0YSk7XG4gICAgICAgIHRoaXMuc3ByaXRlLmZpbHRlcnMgPSBbdGhpcy5maWx0ZXJdO1xuXG4gICAgICAgIHRoaXMuYXBwLnN0YWdlLnJlbW92ZUNoaWxkcmVuKCk7IC8vIFJlbW92ZSBhbnkgYXR0YWNoZWQgY2hpbGRyZW4gKGZvciBjYXNlIHdoZXJlIGNoYW5naW5nIHByZXNldHMpXG4gICAgICAgIHRoaXMuYXBwLnN0YWdlLmFkZENoaWxkKHRoaXMuc3ByaXRlKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHRleHR1cmUgZnJvbSB0aGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgd29ybGRcbiAgICAgICAgdGhpcy5VcGRhdGVUZXh0dXJlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGV2ZXJ5IGZyYW1lLiBDb250aW51ZXMgaW5kZWZpbml0ZWx5IGFmdGVyIGJlaW5nIGNhbGxlZCBvbmNlLlxuICAgICAqL1xuICAgIE9uVXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHZhciBub3NraXAgPSB0aGlzLmZyYW1lY291bnRlci5JbmNyZW1lbnRGcmFtZSgpO1xuICAgICAgICBpZihub3NraXApIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyLnVuaWZvcm1zLnRpbWUgKz0gZGVsdGE7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnN0ZXAoKTtcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlVGV4dHVyZSgpO1xuICAgICAgICAgICAgdGhpcy5hcHAucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHRleHR1cmUgcmVwcmVzZW50aW5nIHRoZSB3b3JsZC5cbiAgICAgKiBXcml0ZXMgY2VsbCBjb2xvcnMgdG8gdGhlIHRleHR1cmUgY2FudmFzIGFuZCB1cGRhdGVzIGBiYXNlVGV4dHVyZWAgZnJvbSBpdCxcbiAgICAgKiB3aGljaCBtYWtlcyBQaXhpIHVwZGF0ZSB0aGUgc3ByaXRlLlxuICAgICAqL1xuICAgIFVwZGF0ZVRleHR1cmUoKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgaW5kZXggPSAwO1xuICAgICAgICB2YXIgY3R4ID0gdGhpcy50ZXh0dXJlQ3R4O1x0XHRcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aCwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIHZhciBwaXggPSBjdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aCwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCk7XHRcdFxuICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHRoaXMudGV4dHVyZUNhbnZhcy5oZWlnaHQ7IHkrKykge1x0XHRcdFxuICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB0aGlzLnRleHR1cmVDYW52YXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIC8vIFN3YXAgYnVmZmVycyBpZiB1c2VkXG4gICAgICAgICAgICAgICAgLy9pZih0aGlzLndvcmxkLmdyaWRbeV1beF0ubmV3U3RhdGUgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzLndvcmxkLmdyaWRbeV1beF0uc3RhdGUgPSB0aGlzLndvcmxkLmdyaWRbeV1beF0ubmV3U3RhdGU7XG4gICAgICAgICAgICAgICAgdmFyIHBhbGV0dGVJbmRleCA9IHRoaXMud29ybGQuZ3JpZFt5XVt4XS5nZXRDb2xvcigpO1xuICAgICAgICAgICAgICAgIHRyeSB7XHRcdFx0XHRcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbG9yUkdCQSA9IHRoaXMud29ybGQucGFsZXR0ZVtwYWxldHRlSW5kZXhdO1x0XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzBdO1x0XHRcdFx0XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzFdO1x0XHRcdFx0XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzJdO1x0XHRcdFx0XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzNdO1x0XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihwYWxldHRlSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXgpO1xuICAgICAgICAgICAgICAgIH1cdFxuICAgICAgICAgICAgfVx0XHRcbiAgICAgICAgfSBcdFx0XG4gICAgICAgIGN0eC5wdXRJbWFnZURhdGEocGl4LCAwLCAwKTtcblxuICAgICAgICAvLyBUZWxsIFBpeGkgdG8gdXBkYXRlIHRoZSB0ZXh0dXJlIHJlZmVyZW5jZWQgYnkgdGhpcyBjdHguXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmUudXBkYXRlKCk7XG5cbiAgICB9XG5cbn1cblxuLyoqXG4gKiBDb252ZW5pZW5jZSBjbGFzcyBmb3IgcmVzdHJpY3RpbmcgdGhlIHJlZnJlc2ggcmF0ZSBvZiB0aGUgc2ltdWxhdGlvbi5cbiAqL1xuY2xhc3MgRnJhbWVDb3VudGVyIHtcbiAgICBjb25zdHJ1Y3RvcihmcmFtZUZyZXF1ZW5jeSwgZnJhbWVMaW1pdCA9IG51bGwpIHtcbiAgICAgICAgLy8gVGhlIG51bWJlciBvZiBmcmFtZXMgaW5nZXN0ZWRcbiAgICAgICAgdGhpcy5mcmFtZUNvdW50ID0gMDtcblxuICAgICAgICAvLyBUaGUgbnVtYmVyIG9mIGZyYW1lcyBhbGxvd2VkIHRvIHJ1blxuICAgICAgICB0aGlzLnBhc3NlZEZyYW1lcyA9IDA7XG5cbiAgICAgICAgLy8gRnJhbWUgd2lsbCBydW4gZXZlcnkgYGZyYW1lRnJlcXVlbmN5YCBmcmFtZXMgdGhhdCBwYXNzXG4gICAgICAgIHRoaXMuZnJhbWVGcmVxdWVuY3kgPSBmcmFtZUZyZXF1ZW5jeTtcblxuICAgICAgICAvLyBJZiBzZXQsIGNsYXNzIHdpbGwgc3RvcCBhbGxvd2luZyBmcmFtZXMgYWZ0ZXIgYGZyYW1lTGltaXRgIFxuICAgICAgICAvLyBwYXNzZWRGcmFtZXMgaGF2ZSBiZWVuIGFsbG93ZWQuXG4gICAgICAgIHRoaXMuZnJhbWVMaW1pdCA9IGZyYW1lTGltaXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIG9uY2UgZXZlcnkgYGZyYW1lRnJlcXVlbmN5YCB0aW1lcyBpdCBpcyBjYWxsZWQuXG4gICAgICovXG4gICAgSW5jcmVtZW50RnJhbWUoKXtcbiAgICAgICAgdGhpcy5mcmFtZUNvdW50ICs9IDE7XG4gICAgICAgIGlmKHRoaXMuZnJhbWVDb3VudCAlIHRoaXMuZnJhbWVGcmVxdWVuY3kgPT0gMCkge1xuICAgICAgICAgICAgLy8gSWYgd2UndmUgcmVhY2hlZCB0aGUgZnJhbWUgbGltaXRcbiAgICAgICAgICAgIGlmKHRoaXMuZnJhbWVMaW1pdCAhPSBudWxsICYmIHRoaXMucGFzc2VkRnJhbWVzID49IHRoaXMuZnJhbWVMaW1pdClcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuZnJhbWVDb3VudCA9IDA7XG4gICAgICAgICAgICB0aGlzLnBhc3NlZEZyYW1lcyArPSAxO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBXb3JsZHMgfSBmcm9tIFwiLi93b3JsZHMuanNcIjtcblxuZXhwb3J0IGNsYXNzIEdVSSB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCBhdHRhY2hlcyBhIEdVSSB0byB0aGUgcGFnZSBpZiBEQVQuR1VJIGlzIGluY2x1ZGVkLlxuICAgICAqL1xuICAgIHN0YXRpYyBJbml0KGR1c3Qpe1xuICAgICAgICBpZih0eXBlb2YoZGF0KSA9PT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJObyBEQVQuR1VJIGluc3RhbmNlIGZvdW5kLiBJbXBvcnQgb24gdGhpcyBwYWdlIHRvIHVzZSFcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ3VpID0gbmV3IGRhdC5HVUkoKTtcblxuICAgICAgICBndWkuYWRkKGR1c3QuZnJhbWVjb3VudGVyLCAnZnJhbWVGcmVxdWVuY3knKS5taW4oMSkubWF4KDMwKS5zdGVwKDEpLmxpc3RlbigpO1xuXG4gICAgICAgIGd1aS5hZGQoZHVzdC53b3JsZE9wdGlvbnMsICduYW1lJywgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoV29ybGRzKSkub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICAgICAgZHVzdC5TZXR1cCgpO1xuICAgICAgICB9KS5uYW1lKFwiUHJlc2V0XCIpO1xuXG4gICAgICAgIGd1aS5hZGQoZHVzdCwgXCJTZXR1cFwiKS5uYW1lKFwiUmVzZXRcIik7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgRGV0ZWN0b3IgfSBmcm9tIFwiLi91dGlscy93ZWJnbC1kZXRlY3QuanNcIjtcbmltcG9ydCB7IER1c3QgfSBmcm9tIFwiLi9kdXN0LmpzXCI7XG5pbXBvcnQgeyBHVUkgfSBmcm9tIFwiLi9ndWkuanNcIjtcblxubGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZHVzdC1jb250YWluZXJcIik7XG5cbmlmICggIURldGVjdG9yLkhhc1dlYkdMKCkgKSB7XG4gICAgLy9leGl0KFwiV2ViR0wgaXMgbm90IHN1cHBvcnRlZCBvbiB0aGlzIGJyb3dzZXIuXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiV2ViR0wgaXMgbm90IHN1cHBvcnRlZCBvbiB0aGlzIGJyb3dzZXIuXCIpO1xuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBEZXRlY3Rvci5HZXRFcnJvckhUTUwoKTtcbiAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZChcIm5vLXdlYmdsXCIpO1xufVxuZWxzZSB7XG4gICAgbGV0IGR1c3QgPSBuZXcgRHVzdChjb250YWluZXIsICgpID0+IHtcbiAgICAgICAgLy8gRHVzdCBpcyBub3cgZnVsbHkgbG9hZGVkXG4gICAgICAgIEdVSS5Jbml0KGR1c3QpO1xuICAgIH0pO1xufSIsImNsYXNzIERldGVjdG9yIHtcblxuICAgIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMTg3MTA3Ny9wcm9wZXItd2F5LXRvLWRldGVjdC13ZWJnbC1zdXBwb3J0XG4gICAgc3RhdGljIEhhc1dlYkdMKCkge1xuICAgICAgICBpZiAoISF3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSBbXCJ3ZWJnbFwiLCBcImV4cGVyaW1lbnRhbC13ZWJnbFwiLCBcIm1vei13ZWJnbFwiLCBcIndlYmtpdC0zZFwiXSxcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8NDtpKyspIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQobmFtZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dCAmJiB0eXBlb2YgY29udGV4dC5nZXRQYXJhbWV0ZXIgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZWJHTCBpcyBlbmFibGVkXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge31cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2ViR0wgaXMgc3VwcG9ydGVkLCBidXQgZGlzYWJsZWRcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXZWJHTCBub3Qgc3VwcG9ydGVkXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgR2V0RXJyb3JIVE1MKG1lc3NhZ2UgPSBudWxsKXtcbiAgICAgICAgaWYobWVzc2FnZSA9PSBudWxsKXtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBgWW91ciBncmFwaGljcyBjYXJkIGRvZXMgbm90IHNlZW0gdG8gc3VwcG9ydCBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCJodHRwOi8va2hyb25vcy5vcmcvd2ViZ2wvd2lraS9HZXR0aW5nX2FfV2ViR0xfSW1wbGVtZW50YXRpb25cIj5XZWJHTDwvYT4uIDxicj5cbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbmQgb3V0IGhvdyB0byBnZXQgaXQgPGEgaHJlZj1cImh0dHA6Ly9nZXQud2ViZ2wub3JnL1wiPmhlcmU8L2E+LmA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vLXdlYmdsLXN1cHBvcnRcIj5cbiAgICAgICAgPHAgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCI+JHttZXNzYWdlfTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIGBcbiAgICB9XG5cbn1cblxuZXhwb3J0IHsgRGV0ZWN0b3IgfTsiLCJmdW5jdGlvbiBDZWxsQXV0b0NlbGwobG9jWCwgbG9jWSkge1xuXHR0aGlzLnggPSBsb2NYO1xuXHR0aGlzLnkgPSBsb2NZO1xuXG5cdHRoaXMuZGVsYXlzID0gW107XG59XG5cbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUucHJvY2VzcyA9IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuXHRyZXR1cm47XG59O1xuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5jb3VudFN1cnJvdW5kaW5nQ2VsbHNXaXRoVmFsdWUgPSBmdW5jdGlvbihuZWlnaGJvcnMsIHZhbHVlKSB7XG5cdHZhciBzdXJyb3VuZGluZyA9IDA7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiBuZWlnaGJvcnNbaV1bdmFsdWVdKSB7XG5cdFx0XHRzdXJyb3VuZGluZysrO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gc3Vycm91bmRpbmc7XG59O1xuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uKG51bVN0ZXBzLCBmbikge1xuXHR0aGlzLmRlbGF5cy5wdXNoKHsgc3RlcHM6IG51bVN0ZXBzLCBhY3Rpb246IGZuIH0pO1xufTtcblxuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuXHRyZXR1cm47XG59O1xuXG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmdldFN1cnJvdW5kaW5nQ2VsbHNBdmVyYWdlVmFsdWUgPSBmdW5jdGlvbihuZWlnaGJvcnMsIHZhbHVlKSB7XG5cdHZhciBzdW1tZWQgPSAwLjA7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiAobmVpZ2hib3JzW2ldW3ZhbHVlXSB8fCBuZWlnaGJvcnNbaV1bdmFsdWVdID09PSAwKSkge1xuXHRcdFx0c3VtbWVkICs9IG5laWdoYm9yc1tpXVt2YWx1ZV07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBzdW1tZWQgLyBuZWlnaGJvcnMubGVuZ3RoOy8vY250O1xufTtcbmZ1bmN0aW9uIENBV29ybGQob3B0aW9ucykge1xuXG5cdHRoaXMud2lkdGggPSAyNDtcblx0dGhpcy5oZWlnaHQgPSAyNDtcblx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuXHR0aGlzLndyYXAgPSBmYWxzZTtcblxuXHR0aGlzLlRPUExFRlQgICAgICAgID0geyBpbmRleDogMCwgeDogLTEsIHk6IC0xIH07XG5cdHRoaXMuVE9QICAgICAgICAgICAgPSB7IGluZGV4OiAxLCB4OiAgMCwgeTogLTEgfTtcblx0dGhpcy5UT1BSSUdIVCAgICAgICA9IHsgaW5kZXg6IDIsIHg6ICAxLCB5OiAtMSB9O1xuXHR0aGlzLkxFRlQgICAgICAgICAgID0geyBpbmRleDogMywgeDogLTEsIHk6ICAwIH07XG5cdHRoaXMuUklHSFQgICAgICAgICAgPSB7IGluZGV4OiA0LCB4OiAgMSwgeTogIDAgfTtcblx0dGhpcy5CT1RUT01MRUZUICAgICA9IHsgaW5kZXg6IDUsIHg6IC0xLCB5OiAgMSB9O1xuXHR0aGlzLkJPVFRPTSAgICAgICAgID0geyBpbmRleDogNiwgeDogIDAsIHk6ICAxIH07XG5cdHRoaXMuQk9UVE9NUklHSFQgICAgPSB7IGluZGV4OiA3LCB4OiAgMSwgeTogIDEgfTtcblx0XG5cdHRoaXMucmFuZG9tR2VuZXJhdG9yID0gTWF0aC5yYW5kb207XG5cblx0Ly8gc3F1YXJlIHRpbGVzIGJ5IGRlZmF1bHQsIGVpZ2h0IHNpZGVzXG5cdHZhciBuZWlnaGJvcmhvb2QgPSBbbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbF07XG5cblx0aWYgKHRoaXMub3B0aW9ucy5oZXhUaWxlcykge1xuXHRcdC8vIHNpeCBzaWRlc1xuXHRcdG5laWdoYm9yaG9vZCA9IFtudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcblx0fVxuXHR0aGlzLnN0ZXAgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgeSwgeDtcblx0XHRmb3IgKHk9MDsgeTx0aGlzLmhlaWdodDsgeSsrKSB7XG5cdFx0XHRmb3IgKHg9MDsgeDx0aGlzLndpZHRoOyB4KyspIHtcblx0XHRcdFx0dGhpcy5ncmlkW3ldW3hdLnJlc2V0KCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gYm90dG9tIHVwLCBsZWZ0IHRvIHJpZ2h0IHByb2Nlc3Npbmdcblx0XHRmb3IgKHk9dGhpcy5oZWlnaHQtMTsgeT49MDsgeS0tKSB7XG5cdFx0XHRmb3IgKHg9dGhpcy53aWR0aC0xOyB4Pj0wOyB4LS0pIHtcblx0XHRcdFx0dGhpcy5maWxsTmVpZ2hib3JzKG5laWdoYm9yaG9vZCwgeCwgeSk7XG5cdFx0XHRcdHZhciBjZWxsID0gdGhpcy5ncmlkW3ldW3hdO1xuXHRcdFx0XHRjZWxsLnByb2Nlc3MobmVpZ2hib3Job29kKTtcblxuXHRcdFx0XHQvLyBwZXJmb3JtIGFueSBkZWxheXNcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPGNlbGwuZGVsYXlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0Y2VsbC5kZWxheXNbaV0uc3RlcHMtLTtcblx0XHRcdFx0XHRpZiAoY2VsbC5kZWxheXNbaV0uc3RlcHMgPD0gMCkge1xuXHRcdFx0XHRcdFx0Ly8gcGVyZm9ybSBhY3Rpb24gYW5kIHJlbW92ZSBkZWxheVxuXHRcdFx0XHRcdFx0Y2VsbC5kZWxheXNbaV0uYWN0aW9uKGNlbGwpO1xuXHRcdFx0XHRcdFx0Y2VsbC5kZWxheXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0aS0tO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHQvL3ZhciBORUlHSEJPUkxPQ1MgPSBbe3g6LTEsIHk6LTF9LCB7eDowLCB5Oi0xfSwge3g6MSwgeTotMX0sIHt4Oi0xLCB5OjB9LCB7eDoxLCB5OjB9LHt4Oi0xLCB5OjF9LCB7eDowLCB5OjF9LCB7eDoxLCB5OjF9XTtcblx0Ly8gc3F1YXJlIHRpbGVzIGJ5IGRlZmF1bHRcblx0dmFyIE5FSUdIQk9STE9DUyA9IFtcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3Bcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgcmlnaHRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfX0sICAvLyBsZWZ0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfX0sICAvLyByaWdodFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSwgIC8vIGJvdHRvbSBsZWZ0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b21cblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSAgLy8gYm90dG9tIHJpZ2h0XG5cdF07XG5cdGlmICh0aGlzLm9wdGlvbnMuaGV4VGlsZXMpIHtcblx0XHRpZiAodGhpcy5vcHRpb25zLmZsYXRUb3BwZWQpIHtcblx0XHRcdC8vIGZsYXQgdG9wcGVkIGhleCBtYXAsICBmdW5jdGlvbiByZXF1aXJlcyBjb2x1bW4gdG8gYmUgcGFzc2VkXG5cdFx0XHRORUlHSEJPUkxPQ1MgPSBbXG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oeCkgeyByZXR1cm4geCUyID8gLTEgOiAwOyB9fSwgIC8vIHRvcCBsZWZ0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oeCkgeyByZXR1cm4geCUyID8gLTEgOiAwOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oeCkgeyByZXR1cm4geCUyID8gMCA6IDE7IH19LCAgLy8gYm90dG9tIHJpZ2h0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19LCAgLy8gYm90dG9tXG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oeCkgeyByZXR1cm4geCUyID8gMCA6IDE7IH19ICAvLyBib3R0b20gbGVmdFxuXHRcdFx0XTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBwb2ludHkgdG9wcGVkIGhleCBtYXAsIGZ1bmN0aW9uIHJlcXVpcmVzIHJvdyB0byBiZSBwYXNzZWRcblx0XHRcdE5FSUdIQk9STE9DUyA9IFtcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKHgsIHkpIHsgcmV0dXJuIHklMiA/IDAgOiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wIGxlZnRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKHgsIHkpIHsgcmV0dXJuIHklMiA/IDEgOiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH19LCAgLy8gbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIHJpZ2h0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbih4LCB5KSB7IHJldHVybiB5JTIgPyAwIDogLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19LCAgLy8gYm90dG9tIGxlZnRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKHgsIHkpIHsgcmV0dXJuIHklMiA/IDEgOiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSAgLy8gYm90dG9tIHJpZ2h0XG5cdFx0XHRdO1xuXHRcdH1cblxuXHR9XG5cdHRoaXMuZmlsbE5laWdoYm9ycyA9IGZ1bmN0aW9uKG5laWdoYm9ycywgeCwgeSkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxORUlHSEJPUkxPQ1MubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuZWlnaGJvclggPSB4ICsgTkVJR0hCT1JMT0NTW2ldLmRpZmZYKHgsIHkpO1xuXHRcdFx0dmFyIG5laWdoYm9yWSA9IHkgKyBORUlHSEJPUkxPQ1NbaV0uZGlmZlkoeCwgeSk7XG5cdFx0XHRpZiAodGhpcy53cmFwKSB7XG5cdFx0XHRcdC8vIFRPRE86IGhleCBtYXAgc3VwcG9ydCBmb3Igd3JhcHBpbmdcblx0XHRcdFx0bmVpZ2hib3JYID0gKG5laWdoYm9yWCArIHRoaXMud2lkdGgpICUgdGhpcy53aWR0aDtcblx0XHRcdFx0bmVpZ2hib3JZID0gKG5laWdoYm9yWSArIHRoaXMuaGVpZ2h0KSAlIHRoaXMuaGVpZ2h0O1xuXHRcdFx0fVxuXHRcdFx0aWYgKCF0aGlzLndyYXAgJiYgKG5laWdoYm9yWCA8IDAgfHwgbmVpZ2hib3JZIDwgMCB8fCBuZWlnaGJvclggPj0gdGhpcy53aWR0aCB8fCBuZWlnaGJvclkgPj0gdGhpcy5oZWlnaHQpKSB7XG5cdFx0XHRcdG5laWdoYm9yc1tpXSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bmVpZ2hib3JzW2ldID0gdGhpcy5ncmlkW25laWdoYm9yWV1bbmVpZ2hib3JYXTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0dGhpcy5pbml0aWFsaXplID0gZnVuY3Rpb24oYXJyYXlUeXBlRGlzdCkge1xuXG5cdFx0Ly8gc29ydCB0aGUgY2VsbCB0eXBlcyBieSBkaXN0cmlidXRpb25cblx0XHRhcnJheVR5cGVEaXN0LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHRcdFx0cmV0dXJuIGEuZGlzdHJpYnV0aW9uID4gYi5kaXN0cmlidXRpb24gPyAxIDogLTE7XG5cdFx0fSk7XG5cblx0XHR2YXIgdG90YWxEaXN0ID0gMDtcblx0XHQvLyBhZGQgYWxsIGRpc3RyaWJ1dGlvbnMgdG9nZXRoZXJcblx0XHRmb3IgKHZhciBpPTA7IGk8YXJyYXlUeXBlRGlzdC5sZW5ndGg7IGkrKykge1xuXHRcdFx0dG90YWxEaXN0ICs9IGFycmF5VHlwZURpc3RbaV0uZGlzdHJpYnV0aW9uO1xuXHRcdFx0YXJyYXlUeXBlRGlzdFtpXS5kaXN0cmlidXRpb24gPSB0b3RhbERpc3Q7XG5cdFx0fVxuXG5cdFx0dGhpcy5ncmlkID0gW107XG5cdFx0Zm9yICh2YXIgeT0wOyB5PHRoaXMuaGVpZ2h0OyB5KyspIHtcblx0XHRcdHRoaXMuZ3JpZFt5XSA9IFtdO1xuXHRcdFx0Zm9yICh2YXIgeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0XHR2YXIgcmFuZG9tID0gdGhpcy5yYW5kb21HZW5lcmF0b3IoKSAqIDEwMDtcblxuXHRcdFx0XHRmb3IgKGk9MDsgaTxhcnJheVR5cGVEaXN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aWYgKHJhbmRvbSA8PSBhcnJheVR5cGVEaXN0W2ldLmRpc3RyaWJ1dGlvbikge1xuXHRcdFx0XHRcdFx0dGhpcy5ncmlkW3ldW3hdID0gbmV3IHRoaXMuY2VsbFR5cGVzW2FycmF5VHlwZURpc3RbaV0ubmFtZV0oeCwgeSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0dGhpcy5jZWxsVHlwZXMgPSB7fTtcblx0dGhpcy5yZWdpc3RlckNlbGxUeXBlID0gZnVuY3Rpb24obmFtZSwgY2VsbE9wdGlvbnMsIGluaXQpIHtcblx0XHR0aGlzLmNlbGxUeXBlc1tuYW1lXSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0XHRcdENlbGxBdXRvQ2VsbC5jYWxsKHRoaXMsIHgsIHkpO1xuXG5cdFx0XHRpZiAoaW5pdCkge1xuXHRcdFx0XHRpbml0LmNhbGwodGhpcywgeCwgeSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjZWxsT3B0aW9ucykge1xuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gY2VsbE9wdGlvbnMpIHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNlbGxPcHRpb25zW2tleV0gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdC8vIHByb3BlcnRpZXMgZ2V0IGluc3RhbmNlXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNlbGxPcHRpb25zW2tleV0gPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdFx0XHRcdC8vIG9iamVjdHMgbXVzdCBiZSBjbG9uZWRcblx0XHRcdFx0XHRcdFx0dGhpc1trZXldID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjZWxsT3B0aW9uc1trZXldKSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0Ly8gcHJpbWl0aXZlXG5cdFx0XHRcdFx0XHRcdHRoaXNba2V5XSA9IGNlbGxPcHRpb25zW2tleV07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR0aGlzLmNlbGxUeXBlc1tuYW1lXS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENlbGxBdXRvQ2VsbC5wcm90b3R5cGUpO1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IHRoaXMuY2VsbFR5cGVzW25hbWVdO1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdLnByb3RvdHlwZS5jZWxsVHlwZSA9IG5hbWU7XG5cblx0XHRpZiAoY2VsbE9wdGlvbnMpIHtcblx0XHRcdGZvciAodmFyIGtleSBpbiBjZWxsT3B0aW9ucykge1xuXHRcdFx0XHRpZiAodHlwZW9mIGNlbGxPcHRpb25zW2tleV0gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHQvLyBmdW5jdGlvbnMgZ2V0IHByb3RvdHlwZVxuXHRcdFx0XHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdLnByb3RvdHlwZVtrZXldID0gY2VsbE9wdGlvbnNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHQvLyBhcHBseSBvcHRpb25zXG5cdGlmIChvcHRpb25zKSB7XG5cdFx0Zm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcblx0XHRcdHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcblx0XHR9XG5cdH1cblxufVxuXG5DQVdvcmxkLnByb3RvdHlwZS5pbml0aWFsaXplRnJvbUdyaWQgID0gZnVuY3Rpb24odmFsdWVzLCBpbml0R3JpZCkge1xuXG5cdHRoaXMuZ3JpZCA9IFtdO1xuXHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdHRoaXMuZ3JpZFt5XSA9IFtdO1xuXHRcdGZvciAodmFyIHg9MDsgeDx0aGlzLndpZHRoOyB4KyspIHtcblx0XHRcdGZvciAodmFyIGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHZhbHVlc1tpXS5ncmlkVmFsdWUgPT09IGluaXRHcmlkW3ldW3hdKSB7XG5cdFx0XHRcdFx0dGhpcy5ncmlkW3ldW3hdID0gbmV3IHRoaXMuY2VsbFR5cGVzW3ZhbHVlc1tpXS5uYW1lXSh4LCB5KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG59O1xuXG5DQVdvcmxkLnByb3RvdHlwZS5jcmVhdGVHcmlkRnJvbVZhbHVlcyA9IGZ1bmN0aW9uKHZhbHVlcywgZGVmYXVsdFZhbHVlKSB7XG5cdHZhciBuZXdHcmlkID0gW107XG5cblx0Zm9yICh2YXIgeT0wOyB5PHRoaXMuaGVpZ2h0OyB5KyspIHtcblx0XHRuZXdHcmlkW3ldID0gW107XG5cdFx0Zm9yICh2YXIgeCA9IDA7IHggPCB0aGlzLndpZHRoOyB4KyspIHtcblx0XHRcdG5ld0dyaWRbeV1beF0gPSBkZWZhdWx0VmFsdWU7XG5cdFx0XHR2YXIgY2VsbCA9IHRoaXMuZ3JpZFt5XVt4XTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKGNlbGwuY2VsbFR5cGUgPT0gdmFsdWVzW2ldLmNlbGxUeXBlICYmIGNlbGxbdmFsdWVzW2ldLmhhc1Byb3BlcnR5XSkge1xuXHRcdFx0XHRcdG5ld0dyaWRbeV1beF0gPSB2YWx1ZXNbaV0udmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbmV3R3JpZDtcbn07XG5cbjsoZnVuY3Rpb24oKSB7XG4gIHZhciBDZWxsQXV0byA9IHtcbiAgICBXb3JsZDogQ0FXb3JsZCxcbiAgICBDZWxsOiBDZWxsQXV0b0NlbGxcbiAgfTtcblxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCdDZWxsQXV0bycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBDZWxsQXV0bztcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gQ2VsbEF1dG87XG4gIH0gZWxzZSB7XG4gICAgd2luZG93LkNlbGxBdXRvID0gQ2VsbEF1dG87XG4gIH1cbn0pKCk7IiwiaW1wb3J0ICogYXMgQ2VsbEF1dG8gZnJvbSBcIi4vdmVuZG9yL2NlbGxhdXRvLmpzXCI7XG5cbmV4cG9ydCB2YXIgV29ybGRzID0ge1xuXG4gICAgLyoqXG4gICAgICogQ29ud2F5J3MgR2FtZSBvZiBMaWZlLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBMaWZlOiBmdW5jdGlvbih3aWR0aCA9IDk2LCBoZWlnaHQgPSA5Nikge1xuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdsaXZpbmcnLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFsaXZlID8gMCA6IDE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHZhciBzdXJyb3VuZGluZyA9IHRoaXMuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlKG5laWdoYm9ycywgJ3dhc0FsaXZlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IHN1cnJvdW5kaW5nID09PSAzIHx8IHN1cnJvdW5kaW5nID09PSAyICYmIHRoaXMuYWxpdmU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc0FsaXZlID0gdGhpcy5hbGl2ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gSW5pdFxuICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IE1hdGgucmFuZG9tKCkgPiAwLjU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENBIHRoYXQgbG9va3MgbGlrZSBsYXZhLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBMYXZhOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyB0aGFua3MgdG8gVGhlTGFzdEJhbmFuYSBvbiBUSUdTb3VyY2VcblxuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbMzQsMTAsMjEsMjU1XSwgWzY4LDE3LDI2LDI1NV0sIFsxMjMsMTYsMTYsMjU1XSxcbiAgICAgICAgICAgIFsxOTAsNDUsMTYsMjU1XSwgWzI0NCwxMDIsMjAsMjU1XSwgWzI1NCwyMTIsOTcsMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgMTg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjc7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjk7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDM7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDU7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNTY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNjQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdsYXZhJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHRoaXMudmFsdWUgKyAwLjVcbiAgICAgICAgICAgICAgICAgICAgKyBNYXRoLnNpbih0aGlzLnggLyB3b3JsZC53aWR0aCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICArIE1hdGguc2luKHRoaXMueSAvIHdvcmxkLmhlaWdodCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICAtIDAuMDU7XG4gICAgICAgICAgICAgICAgdiA9IE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMC4wLCB2KSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzW01hdGguZmxvb3IoY29sb3JzLmxlbmd0aCAqIHYpXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5kcm9wbGV0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS52YWx1ZSA9IDAuNSAqdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ucHJldiA9IDAuNSAqdGhpcy5wcmV2O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGF2ZyA9IHRoaXMuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZShuZWlnaGJvcnMsICd2YWx1ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IDAuOTk4ICogKDIgKiBhdmcgLSB0aGlzLnByZXYpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC45OTk5Mykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gLTAuMjUgKyAwLjMqTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBNYXRoLm1pbigwLjUsIE1hdGgubWF4KC0wLjUsIHRoaXMudmFsdWUpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIHRoaXMubmV4dCA9IHRoaXMudmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnbGF2YScsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIG1hemUtbGlrZSBzdHJ1Y3R1cmUuXG4gICAgICogQmFzZWQgb24gcnVsZSBCMy9TMTIzNCAoTWF6ZWNldHJpYykuXG4gICAgICovXG4gICAgTWF6ZWNldHJpYzogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gNTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICBbMjU1LCAyNTUsIDI1NSwgMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHZhciB0aHJlc2hvbGQgPSAoTWF0aC5yYW5kb20oKSAqIDUpIC8gMTA7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hbGl2ZSA/IDAgOiAxO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3Vycm91bmRpbmcgPSB0aGlzLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZShuZWlnaGJvcnMsICd3YXNBbGl2ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWxpdmUgPSBzdXJyb3VuZGluZyA9PT0gMyB8fCAoc3Vycm91bmRpbmcgPj0gMSAmJiBzdXJyb3VuZGluZyA8PSA0ICYmIHRoaXMuYWxpdmUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNBbGl2ZSA9IHRoaXMuYWxpdmU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIEluaXRcbiAgICAgICAgICAgIHRoaXMuYWxpdmUgPSBNYXRoLnJhbmRvbSgpIDwgdGhyZXNob2xkO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2xpdmluZycsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDeWNsaWMgcmFpbmJvdyBhdXRvbWF0YS5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgQ3ljbGljUmFpbmJvd3M6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3kgPSAxO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbMjU1LDAsMCwxICogMjU1XSwgWzI1NSw5NiwwLDEgKiAyNTVdLCBbMjU1LDE5MSwwLDEgKiAyNTVdLCBbMjIzLDI1NSwwLDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEyOCwyNTUsMCwxICogMjU1XSwgWzMyLDI1NSwwLDEgKiAyNTVdLCBbMCwyNTUsNjQsMSAqIDI1NV0sIFswLDI1NSwxNTksMSAqIDI1NV0sXG4gICAgICAgICAgICBbMCwyNTUsMjU1LDEgKiAyNTVdLCBbMCwxNTksMjU1LDEgKiAyNTVdLCBbMCw2NCwyNTUsMSAqIDI1NV0sIFszMiwwLDI1NSwxICogMjU1XSxcbiAgICAgICAgICAgIFsxMjcsMCwyNTUsMSAqIDI1NV0sIFsyMjMsMCwyNTUsMSAqIDI1NV0sIFsyNTUsMCwxOTEsMSAqIDI1NV0sIFsyNTUsMCw5NiwxICogMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2N5Y2xpYycsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gKHRoaXMuc3RhdGUgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMikpICUgMTY7XG5cbiAgICAgICAgICAgICAgICB2YXIgY2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2luZyA9IGNoYW5naW5nIHx8IG5laWdoYm9yc1tpXS5zdGF0ZSA9PT0gbmV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2hhbmdpbmcpIHRoaXMuc3RhdGUgPSBuZXh0O1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMubmV3U3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICdjeWNsaWMnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIGNhdmVzIGFuZCB3YXRlciBtb3ZlbWVudC5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgQ2F2ZXNXaXRoV2F0ZXI6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgLy8gRklSU1QgQ1JFQVRFIENBVkVTXG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YWxsJywge1xuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHZhciBzdXJyb3VuZGluZyA9IHRoaXMuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlKG5laWdoYm9ycywgJ3dhc09wZW4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4gPSAodGhpcy53YXNPcGVuICYmIHN1cnJvdW5kaW5nID49IDQpIHx8IHN1cnJvdW5kaW5nID49IDY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc09wZW4gPSB0aGlzLm9wZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5vcGVuID0gTWF0aC5yYW5kb20oKSA+IDAuNDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2FsbCcsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgb3VyIGNhdmUsIDEwIHN0ZXBzIGF1Z2h0IHRvIGRvIGl0XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTwxMDsgaSsrKSB7XG4gICAgICAgICAgICB3b3JsZC5zdGVwKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ3JpZCA9IHdvcmxkLmNyZWF0ZUdyaWRGcm9tVmFsdWVzKFtcbiAgICAgICAgICAgIHsgY2VsbFR5cGU6ICd3YWxsJywgaGFzUHJvcGVydHk6ICdvcGVuJywgdmFsdWU6IDAgfVxuICAgICAgICBdLCAxKTtcblxuICAgICAgICAvLyBOT1cgVVNFIE9VUiBDQVZFUyBUTyBDUkVBVEUgQSBORVcgV09STEQgQ09OVEFJTklORyBXQVRFUlxuICAgICAgICB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGNsZWFyUmVjdDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMCAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDMvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA0LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDYvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA3LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgOC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEwOSwgMTcwLCA0NCwgMSAqIDI1NV0sXG4gICAgICAgICAgICBbNjgsIDM2LCA1MiwgMSAqIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YXRlcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL3JldHVybiAweDU5N0RDRTQ0O1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndhdGVyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLndhdGVyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBwdXNoIG15IHdhdGVyIG91dCB0byBteSBhdmFpbGFibGUgbmVpZ2hib3JzXG5cbiAgICAgICAgICAgICAgICAvLyBjZWxsIGJlbG93IG1lIHdpbGwgdGFrZSBhbGwgaXQgY2FuXG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCA5IC0gbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBib3R0b20gdHdvIGNvcm5lcnMgdGFrZSBoYWxmIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT01OyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkhPXdvcmxkLkJPVFRPTS5pbmRleCAmJiBuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8yKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzaWRlcyB0YWtlIGEgdGhpcmQgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGk9MzsgaTw9NDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgdGhpcy53YXRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogOSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3JvY2snLCB7XG4gICAgICAgICAgICBpc1NvbGlkOiB0cnVlLFxuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpZ2h0ZWQgPyAxMCA6IDExO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHRoaXMubGlnaHRlZCA9IG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdICYmICEobmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0ud2F0ZXIgPT09IDkpICYmICFuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS5pc1NvbGlkXG4gICAgICAgICAgICAgICAgICAgICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLmlzU29saWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHBhc3MgaW4gb3VyIGdlbmVyYXRlZCBjYXZlIGRhdGFcbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZUZyb21HcmlkKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3JvY2snLCBncmlkVmFsdWU6IDEgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhdGVyJywgZ3JpZFZhbHVlOiAwIH1cbiAgICAgICAgXSwgZ3JpZCk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICBSYWluOiBmdW5jdGlvbih3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIC8vIEZJUlNUIENSRUFURSBDQVZFU1xuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnd2FsbCcsIHtcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3Vycm91bmRpbmcgPSB0aGlzLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZShuZWlnaGJvcnMsICd3YXNPcGVuJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuID0gKHRoaXMud2FzT3BlbiAmJiBzdXJyb3VuZGluZyA+PSA0KSB8fCBzdXJyb3VuZGluZyA+PSA2O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNPcGVuID0gdGhpcy5vcGVuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMub3BlbiA9IE1hdGgucmFuZG9tKCkgPiAwLjQwO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhbGwnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIG91ciBjYXZlLCAxMCBzdGVwcyBhdWdodCB0byBkbyBpdFxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8MTA7IGkrKykge1xuICAgICAgICAgICAgd29ybGQuc3RlcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdyaWQgPSB3b3JsZC5jcmVhdGVHcmlkRnJvbVZhbHVlcyhbXG4gICAgICAgICAgICB7IGNlbGxUeXBlOiAnd2FsbCcsIGhhc1Byb3BlcnR5OiAnb3BlbicsIHZhbHVlOiAwIH1cbiAgICAgICAgXSwgMSk7XG5cbiAgICAgICAgLy8gY3V0IHRoZSB0b3AgaGFsZiBvZiB0aGUgY2F2ZXMgb2ZmXG4gICAgICAgIGZvciAodmFyIHk9MDsgeTxNYXRoLmZsb29yKHdvcmxkLmhlaWdodC8yKTsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciB4PTA7IHg8d29ybGQud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGdyaWRbeV1beF0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTk9XIFVTRSBPVVIgQ0FWRVMgVE8gQ1JFQVRFIEEgTkVXIFdPUkxEIENPTlRBSU5JTkcgV0FURVJcbiAgICAgICAgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBjbGVhclJlY3Q6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDFdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDIvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAzLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDUvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA2LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNy85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDgvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAyNTVdLFxuICAgICAgICAgICAgWzEwOSwgMTcwLCA0NCwgMjU1XSxcbiAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnYWlyJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuICc4OSwgMTI1LCAyMDYsICcgKyAodGhpcy53YXRlciA/IE1hdGgubWF4KDAuMywgdGhpcy53YXRlci85KSA6IDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndhdGVyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIC8vIHJhaW4gb24gdGhlIHRvcCByb3dcbiAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0gPT09IG51bGwgJiYgTWF0aC5yYW5kb20oKSA8IDAuMDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlciA9IDU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMud2F0ZXIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBlbXB0eVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcHVzaCBteSB3YXRlciBvdXQgdG8gbXkgYXZhaWxhYmxlIG5laWdoYm9yc1xuXG4gICAgICAgICAgICAgICAgLy8gY2VsbCBiZWxvdyBtZSB3aWxsIHRha2UgYWxsIGl0IGNhblxuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XSAhPT0gbnVsbCAmJiB0aGlzLndhdGVyICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgOSAtIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gYm90dG9tIHR3byBjb3JuZXJzIHRha2UgaGFsZiBvZiB3aGF0IEkgaGF2ZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGk9NTsgaTw9NzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpIT13b3JsZC5CT1RUT00uaW5kZXggJiYgbmVpZ2hib3JzW2ldICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gc2lkZXMgdGFrZSBhIHRoaXJkIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yIChpPTM7IGk8PTQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS53YXRlciA8IHRoaXMud2F0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy53YXRlciA9IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3JvY2snLCB7XG4gICAgICAgICAgICBpc1NvbGlkOiB0cnVlLFxuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpZ2h0ZWQgPyAxMCA6IDExO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHRoaXMubGlnaHRlZCA9IG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdICYmICEobmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0ud2F0ZXIgPT09IDkpICYmICFuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS5pc1NvbGlkXG4gICAgICAgICAgICAgICAgICAgICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLmlzU29saWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHBhc3MgaW4gb3VyIGdlbmVyYXRlZCBjYXZlIGRhdGFcbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZUZyb21HcmlkKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3JvY2snLCBncmlkVmFsdWU6IDEgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2FpcicsIGdyaWRWYWx1ZTogMCB9XG4gICAgICAgIF0sIGdyaWQpO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIHNwbGFzaGluZyB3YXRlci5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgU3BsYXNoZXM6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXTtcbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpbmRleD0wOyBpbmRleDw2NDsgaW5kZXgrKykge1xuICAgICAgICAgICAgd29ybGQucGFsZXR0ZS5wdXNoKFs4OSwgMTI1LCAyMDYsIChpbmRleC82NCkgKiAyNTVdKTtcbiAgICAgICAgICAgIGNvbG9yc1tpbmRleF0gPSA2MyAtIGluZGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnd2F0ZXInLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKE1hdGgubWF4KDIgKiB0aGlzLnZhbHVlICsgMC4wMiwgMCkgLSAwLjAyKSArIDAuNTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzW01hdGguZmxvb3IoY29sb3JzLmxlbmd0aCAqIHYpXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5kcm9wbGV0ID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnZhbHVlID0gMC41ICp0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS5wcmV2ID0gMC41ICp0aGlzLnByZXY7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYXZnID0gdGhpcy5nZXRTdXJyb3VuZGluZ0NlbGxzQXZlcmFnZVZhbHVlKG5laWdoYm9ycywgJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0ID0gMC45OSAqICgyICogYXZnIC0gdGhpcy5wcmV2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmKE1hdGgucmFuZG9tKCkgPiAwLjk5OTkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IC0wLjIgKyAwLjI1Kk1hdGgucmFuZG9tKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5uZXh0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5uZXh0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICd3YXRlcicsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdWxlIDUyOTI4IC0gdGhlIENBIHVzZWQgZm9yIFdvbGZyYW0gQWxwaGEncyBsb2FkaW5nIGFuaW1hdGlvbnNcbiAgICAgKiBcbiAgICAgKiBSZXNvdXJjZXM6XG4gICAgICogaHR0cHM6Ly93d3cucXVvcmEuY29tL1doYXQtaXMtV29sZnJhbS1BbHBoYXMtbG9hZGluZy1zY3JlZW4tYS1kZXBpY3Rpb24tb2ZcbiAgICAgKiBodHRwOi8vanNmaWRkbGUubmV0L2h1bmdyeWNhbWVsLzlVcnpKL1xuICAgICAqL1xuICAgIFdvbGZyYW06IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHdyYXA6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSA9IDI7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdLCAvLyBCYWNrZ3JvdW5kIGNvbG9yXG4gICAgICAgICAgICBbMjU1LCAxMTAsIDAgICwgMjU1XSwgLy8gZGFyayBvcmFuZ2VcbiAgICAgICAgICAgIFsyNTUsIDEzMCwgMCAgLCAyNTVdLCAvLyAgICAgIHxcbiAgICAgICAgICAgIFsyNTUsIDE1MCwgMCAgLCAyNTVdLCAvLyAgICAgIHxcbiAgICAgICAgICAgIFsyNTUsIDE3MCwgMCAgLCAyNTVdLCAvLyAgICAgIFZcbiAgICAgICAgICAgIFsyNTUsIDE4MCwgMCAgLCAyNTVdICAvLyBsaWdodCBvcmFuZ2VcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgY2hvaWNlID0gTWF0aC5yYW5kb20oKTtcblxuICAgICAgICB2YXIgc2VlZExpc3QgPSBbXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMiwgMSwgMSwgMSwgMSwgMCwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFsxLCAxLCAzLCA0LCAyLCAxLCAxLCAwLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDEsIDEsIDEsIDQsIDEsIDEsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMSwgMiwgMCwgMSwgMSwgMSwgMSwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAxLCAxLCAxLCAwLCAwLCAyLCAyLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDIsIDIsIDAsIDAsIDEsIDEsIDEsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMSwgMSwgMSwgMSwgMCwgMiwgMSwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAxLCAxLCA0LCAxLCAxLCAxLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDEsIDIsIDQsIDMsIDEsIDFdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMCwgMSwgMSwgMSwgMSwgMiwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwXVxuICAgICAgICAgICAgXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMCwgMCwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAxLCAwLCAwXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAwLCAwLCAwLCAxXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFsxLCAxLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMSwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDEsIDAsIDAsIDAsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMSwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDEsIDEsIDAsIDAsIDAsIDEsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMSwgMCwgMCwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAwLCAxLCAwXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDAsIDEsIDEsIDEsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDAsIDEsIDEsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMCwgMCwgMV0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMCwgMSwgMCwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAwLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMCwgMCwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMCwgMCwgMV0sIFsxLCAwLCAwLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMV0sIFsxLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMCwgMCwgMSwgMCwgMF0sIFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzEsIDAsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMCwgMCwgMCwgMCwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAwLCAwLCAwLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMCwgMSwgMF0sIFswLCAxLCAwLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMCwgMSwgMSwgMSwgMCwgMCwgMF0sIFswLCAwLCAwLCAxLCAxLCAxLCAwLCAwXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMV0sIFsxLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMCwgMSwgMCwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAwLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMCwgMCwgMSwgMCwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAwLCAxLCAwLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDEsIDEsIDFdXVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2xpdmluZycsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuXG4gICAgICAgICAgICAgICAgdmFyIG5laWdoYm9yT25lcyA9IG5laWdoYm9ycy5maWx0ZXIoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnN0YXRlID09IDE7XG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zdGF0ZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yT25lcyA9PSAzIHx8IG5laWdoYm9yT25lcyA9PSA1IHx8IG5laWdoYm9yT25lcyA9PSA3KSBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yT25lcyA9PSAwIHx8IG5laWdoYm9yT25lcyA9PSAxIHx8IG5laWdoYm9yT25lcyA9PSAyIHx8IG5laWdoYm9yT25lcyA9PSA2IHx8IG5laWdoYm9yT25lcyA9PSA4KVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMubmV3U3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAvLyBJbml0IFxuXG4gICAgICAgICAgICAvLyA1MCUgY2hhbmNlIHRvIHVzZSBhIHNlZWRcbiAgICAgICAgICAgIGlmKGNob2ljZSA8IDAuNSl7XG4gICAgICAgICAgICAgICAgdmFyIHNlZWQ7XG4gICAgICAgICAgICAgICAgLy8gMjUlIGNoYW5jZSB0byB1c2UgYSByYW5kb20gc2VlZFxuICAgICAgICAgICAgICAgIGlmKGNob2ljZSA8IDAuMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VlZCA9IHNlZWRMaXN0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlZWRMaXN0Lmxlbmd0aCldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAyNSUgY2hhbmNlIHRvIHVzZSB0aGUgV29sZnJhbSBzZWVkXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlZWQgPSBzZWVkTGlzdFswXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbWluWCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKSAtIE1hdGguZmxvb3Ioc2VlZFswXS5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICB2YXIgbWF4WCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKSArIE1hdGguZmxvb3Ioc2VlZFswXS5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICB2YXIgbWluWSA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gMikgLSBNYXRoLmZsb29yKHNlZWQubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIG1heFkgPSBNYXRoLmZsb29yKGhlaWdodCAvIDIpICsgTWF0aC5mbG9vcihzZWVkLmxlbmd0aCAvIDIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY2VsbCBpcyBpbnNpZGUgb2YgdGhlIHNlZWQgYXJyYXkgKGNlbnRlcmVkIGluIHRoZSB3b3JsZCksIHRoZW4gdXNlIGl0cyB2YWx1ZVxuICAgICAgICAgICAgICAgIGlmICh4ID49IG1pblggJiYgeCA8IG1heFggJiYgeSA+PSBtaW5ZICYmIHkgPCBtYXhZKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBzZWVkW3kgLSBtaW5ZXVt4IC0gbWluWF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gaW5pdGlhbGl6ZSB3aXRoIG5vaXNlXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gTWF0aC5yYW5kb20oKSA8IDAuMTUgPyAxIDogMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfSxcbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZXMgYSBCZWxvdXNvdi1aaGFib3RpbnNreSByZWFjdGlvbiAoYXBwcm94aW1hdGVseSkuXG4gICAgICogVGhpcyBvbmUncyBzdGlsbCBhIGxpdHRsZSBtZXNzZWQgdXAsIHNvIGNvbnNpZGVyIGl0IGV4cGVyaW1lbnRhbC5cbiAgICAgKiBcbiAgICAgKiBSZXNvdXJjZXM6XG4gICAgICogaHR0cDovL2NjbC5ub3J0aHdlc3Rlcm4uZWR1L25ldGxvZ28vbW9kZWxzL0ItWlJlYWN0aW9uXG4gICAgICogaHR0cDovL3d3dy5mcmFjdGFsZGVzaWduLm5ldC9hdXRvbWF0YWFsZ29yaXRobS5hc3B4XG4gICAgICovXG4gICAgQmVsb3Vzb3ZaaGFib3RpbnNreTogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE92ZXJyaWRlIGZyYW1lIGZyZXF1ZW5jeSBmb3IgdGhpcyBzZXR1cFxuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gMTA7XG5cbiAgICAgICAgLy8gQ29uZmlnIHZhcmlhYmxlc1xuICAgICAgICB2YXIga2VybmVsID0gWyAvLyB3ZWlnaHRzIGZvciBuZWlnaGJvcnMuIEZpcnN0IGluZGV4IGlzIGZvciBzZWxmIHdlaWdodFxuICAgICAgICAgMCwgMSwgMSwgMSxcbiAgICAgICAgICAgIDEsICAgIDEsXG4gICAgICAgICAgICAxLCAxLCAxXG4gICAgICAgIF0ucmV2ZXJzZSgpO1xuICAgICAgICB2YXIgazEgPSA1OyAvLyBMb3dlciBnaXZlcyBoaWdoZXIgdGVuZGVuY3kgZm9yIGEgY2VsbCB0byBiZSBzaWNrZW5lZCBieSBpbGwgbmVpZ2hib3JzXG4gICAgICAgIHZhciBrMiA9IDE7IC8vIExvd2VyIGdpdmVzIGhpZ2hlciB0ZW5kZW5jeSBmb3IgYSBjZWxsIHRvIGJlIHNpY2tlbmVkIGJ5IGluZmVjdGVkIG5laWdoYm9yc1xuICAgICAgICB2YXIgZyA9IDU7XG4gICAgICAgIHZhciBudW1TdGF0ZXMgPSAyNTU7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVN0YXRlczsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZ3JheSA9IE1hdGguZmxvb3IoKDI1NSAvIG51bVN0YXRlcykgKiBpKTtcbiAgICAgICAgICAgIHdvcmxkLnBhbGV0dGUucHVzaChbZ3JheSwgZ3JheSwgZ3JheSwgMjU1XSk7XG4gICAgICAgIH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdieicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHZhciBoZWFsdGh5ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgaW5mZWN0ZWQgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBpbGwgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBzdW1TdGF0ZXMgPSB0aGlzLnN0YXRlO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoICsgMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT0gOCkgbmVpZ2hib3IgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9pZihuZWlnaGJvciAhPT0gbnVsbCAmJiBuZWlnaGJvci5zdGF0ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1TdGF0ZXMgKz0gbmVpZ2hib3Iuc3RhdGUgKiBrZXJuZWxbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihrZXJuZWxbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3Iuc3RhdGUgPT0gMCkgaGVhbHRoeSArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYobmVpZ2hib3Iuc3RhdGUgPCAobnVtU3RhdGVzIC0gMSkpIGluZmVjdGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpbGwgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zdGF0ZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAoaW5mZWN0ZWQgLyBrMSkgKyAoaWxsIC8gazIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA8IChudW1TdGF0ZXMpIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gKHN1bVN0YXRlcyAvIGluZmVjdGVkICsgaWxsICsgMSkgKyBnO1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMubmV3U3RhdGUgPSAoc3VtU3RhdGVzIC8gOSkgKyBnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0byBzZXQgc3RhdGUgdG8gbmV3c3RhdGUgaW4gYSBzZWNvbmQgcGFzc1xuICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihudW1TdGF0ZXMgLSAxLCBNYXRoLmZsb29yKHRoaXMubmV3U3RhdGUpKSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB0aGlzLm5ld1N0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJbml0XG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSBzdGF0ZVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGgucmFuZG9tKCkgPCAxLjAgPyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBudW1TdGF0ZXMpIDogMDtcbiAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2J6JywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfVxuXG59Il19
