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
            //height: 128,


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
            try {
                this.world = _worlds.Worlds[this.worldOptions.name].call(this, this.worldOptions.width, this.worldOptions.height);
            } catch (err) {
                throw "World with the name " + this.worldOptions.name + " does not exist!";
            }
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
                    var paletteIndex = this.world.grid[y][x].getColor();
                    var colorRGBA = this.world.palette[paletteIndex];
                    if (colorRGBA != null) {
                        pix.data[index++] = colorRGBA[0];
                        pix.data[index++] = colorRGBA[1];
                        pix.data[index++] = colorRGBA[2];
                        pix.data[index++] = colorRGBA[3];
                    } else {
                        throw "Palette index out of bounds: " + paletteIndex;
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
     * Chooses a random elementary automata from a list.
     */
    RandomRule: function RandomRule() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var rules = [18, 22, 26, 54, 60, 90, 94, 110, 126, 150];
        var options = {
            width: width,
            height: height,
            rule: rules[rules.length * Math.random() << 0], // Random rule from list
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            wrap: true
        };
        return Elementary(options);
    },

    /**
     * Conway's Game of Life
     * B3/S23
     */
    Life: function Life() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var options = {
            width: width,
            height: height,
            B: [3],
            S: [2, 3],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 2
        };
        return LifeLike(options);
    },

    /**
     * Generates a maze-like structure.
     * Based on rule B3/S1234 (Mazecetric).
     */
    Mazecetric: function Mazecetric() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var options = {
            width: width,
            height: height,
            B: [3],
            S: [1, 2, 3, 4],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 5
        };
        return LifeLike(options, function (x, y) {
            // Distribution function
            return Math.random() < 0.1;
        });
    },

    /**
     * B35678/S5678
     */
    Diamoeba: function Diamoeba() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var options = {
            width: width,
            height: height,
            B: [3, 5, 6, 7, 8],
            S: [5, 6, 7, 8],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 3
        };
        return LifeLike(options, function (x, y) {
            // Distribution function
            return Math.random() < 0.2;
        });
    },

    /**
     * B4678/S35678
     */
    Anneal: function Anneal() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var options = {
            width: width,
            height: height,
            B: [4, 6, 7, 8],
            S: [3, 5, 6, 7, 8],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 3
        };
        return LifeLike(options, function (x, y) {
            // Distribution function
            return Math.random() < 0.3;
        });
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
            }
        }, function () {
            //init
            this.state = Math.floor(Math.random() * 16);
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
                for (var _i = 5; _i <= 7; _i++) {
                    if (_i != world.BOTTOM.index && neighbors[_i] !== null && this.water && neighbors[_i].water < 9) {
                        var _amt = Math.min(this.water, Math.ceil((9 - neighbors[_i].water) / 2));
                        this.water -= _amt;
                        neighbors[_i].water += _amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (var _i2 = 3; _i2 <= 4; _i2++) {
                    if (neighbors[_i2] !== null && neighbors[_i2].water < this.water) {
                        var _amt2 = Math.min(this.water, Math.ceil((9 - neighbors[_i2].water) / 3));
                        this.water -= _amt2;
                        neighbors[_i2].water += _amt2;
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
                for (var _i3 = 5; _i3 <= 7; _i3++) {
                    if (_i3 != world.BOTTOM.index && neighbors[_i3] !== null && this.water && neighbors[_i3].water < 9) {
                        var _amt3 = Math.min(this.water, Math.ceil((9 - neighbors[_i3].water) / 2));
                        this.water -= _amt3;
                        neighbors[_i3].water += _amt3;
                        return;
                    }
                }
                // sides take a third of what I have
                for (var _i4 = 3; _i4 <= 4; _i4++) {
                    if (neighbors[_i4] !== null && neighbors[_i4].water < this.water) {
                        var _amt4 = Math.min(this.water, Math.ceil((9 - neighbors[_i4].water) / 3));
                        this.water -= _amt4;
                        neighbors[_i4].water += _amt4;
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
                var seed = void 0;
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

        // Config letiables
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

                for (var _i5 = 0; _i5 < neighbors.length + 1; _i5++) {
                    var neighbor = void 0;
                    if (_i5 == 8) neighbor = this;else neighbor = neighbors[_i5];

                    //if(neighbor !== null && neighbor.state){
                    sumStates += neighbor.state * kernel[_i5];
                    if (kernel[_i5] > 0) {
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

    /**
     * Simulates a 1D automata.
     * Expects a property `rule` in `options`, which is the integer rule of the CA.
     * 
     * Not totally correct yet!
     * 
     */
};function Elementary(options) {
    var world = new CellAuto.World(options);

    var rule = (options.rule >>> 0).toString(2);
    while (rule.length < 8) {
        rule = "0" + rule;
    }

    console.log(options.rule);

    function processRule(leftAlive, centerAlive, rightAlive) {
        var index = 0;
        if (rightAlive) index += 1;
        if (centerAlive) index += 2;
        if (leftAlive) index += 4;
        return rule[rule.length - 1 - index];
    }

    function testRule() {
        var lastIndex = rule.length - 1;
        for (var i = 0; i < 8; i++) {
            // Convert i to binary and use it to feed processRule
            var bin = (lastIndex - i >>> 0).toString(2);
            while (bin.length < 3) {
                bin = "0" + bin;
            }var ruleOut = processRule(bin[0] == "1", bin[1] == "1", bin[2] == "1");

            console.assert(ruleOut == rule[i], bin + " " + rule[i] + " " + (ruleOut == rule[i]).toString());
        }
    }
    //testRule();

    world.registerCellType('living', {
        getColor: function getColor() {
            return this.alive ? 0 : 1;
        },
        process: function process(neighbors) {
            function getWasAlive(neighbor) {
                if (neighbor != null) return neighbor.wasAlive;
                return false;
            }

            // If the cell isn't active yet, determine its state based on its upper neighbors
            if (!this.wasAlive) {
                this.alive = processRule(getWasAlive(neighbors[0]), getWasAlive(neighbors[1]), getWasAlive(neighbors[2])) == "1";
            }
        },
        reset: function reset() {
            this.wasAlive = this.alive;
        }
    }, function (x, y) {
        // Init
        this.alive = x == Math.floor(options.width / 2) && y == 1;
        //this.alive = Math.random() < 0.01;
        //this.wasAlive = this.alive;
    });

    world.initialize([{ name: 'living', distribution: 100 }]);

    return world;
}

/**
 * Simulates a Life-like automata. Uses B/S notation.
 * See https://en.wikipedia.org/wiki/Life-like_cellular_automaton
 * 
 * Expects two additional properties in `options`:
 * `B`: An array of ints representing the B component of the rule
 * `S`: An array of ints representing the S component of the rule
 */
function LifeLike(options, distributionFunc) {
    var world = new CellAuto.World(options);

    world.registerCellType('living', {
        getColor: function getColor() {
            return this.alive ? 0 : 1;
        },
        process: function process(neighbors) {
            var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');
            this.alive = options.B.includes(surrounding) || options.S.includes(surrounding) && this.alive;
        },
        reset: function reset() {
            this.wasAlive = this.alive;
        }
    }, function (x, y) {
        // Init
        if (distributionFunc) this.alive = distributionFunc(x, y);else this.alive = Math.random() < 0.5;
    });

    world.initialize([{ name: 'living', distribution: 100 }]);

    return world;
}

},{"./vendor/cellauto.js":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZHVzdC5qcyIsInNyYy9ndWkuanMiLCJzcmMvbWFpbi5qcyIsInNyYy91dGlscy93ZWJnbC1kZXRlY3QuanMiLCJzcmMvdmVuZG9yL2NlbGxhdXRvLmpzIiwic3JjL3dvcmxkcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztBQ0FBOztJQUFZLFE7O0FBQ1o7Ozs7OztJQUVhLEksV0FBQSxJO0FBQ1Qsa0JBQVksU0FBWixFQUF1QixvQkFBdkIsRUFBNkM7QUFBQTs7QUFBQTs7QUFDekMsYUFBSyxTQUFMLEdBQWlCLFNBQWpCOztBQUVBLFlBQUksYUFBYSxPQUFPLElBQVAsZ0JBQWpCO0FBQ0EsYUFBSyxZQUFMLEdBQW9CO0FBQ2hCLGtCQUFNLFdBQVcsV0FBVyxNQUFYLEdBQW9CLEtBQUssTUFBTCxFQUFwQixJQUFxQyxDQUFoRCxDQURVLENBQzBDO0FBQzFEO0FBQ0E7OztBQUdKO0FBTm9CLFNBQXBCLENBT0EsS0FBSyxHQUFMLEdBQVcsSUFBSSxLQUFLLFdBQVQsQ0FDUDtBQUNJLHVCQUFXLEtBRGY7QUFFSSx5QkFBYSxLQUZqQjtBQUdJLHdCQUFZO0FBSGhCLFNBRE8sQ0FBWDtBQU9BLGFBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsS0FBSyxHQUFMLENBQVMsSUFBcEM7O0FBRUE7QUFDQSxhQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEdBQWhCLENBQW9CLFVBQUMsS0FBRCxFQUFXO0FBQzNCLGtCQUFLLFFBQUwsQ0FBYyxLQUFkO0FBQ0gsU0FGRDs7QUFJQSxhQUFLLFlBQUwsR0FBb0IsSUFBSSxZQUFKLENBQWlCLENBQWpCLEVBQW9CLElBQXBCLENBQXBCOztBQUVBO0FBQ0EsYUFBSyxHQUFMLENBQVMsSUFBVDs7QUFFQTtBQUNBLGFBQUssTUFBTCxDQUNLLEdBREwsQ0FDUyxZQURULEVBQ3VCLHdCQUR2QixFQUVLLElBRkwsQ0FFVSxVQUFD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LFVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0I7QUFDZjtBQUNBLFlBQUcsZ0JBQUgsRUFDSSxLQUFLLEtBQUwsR0FBYSxpQkFBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBYixDQURKLEtBR0ksS0FBSyxLQUFMLEdBQWEsS0FBSyxNQUFMLEtBQWdCLEdBQTdCO0FBQ1AsS0FqQkQ7O0FBbUJBLFVBQU0sVUFBTixDQUFpQixDQUNiLEVBQUUsTUFBTSxRQUFSLEVBQWtCLGNBQWMsR0FBaEMsRUFEYSxDQUFqQjs7QUFJQSxXQUFPLEtBQVA7QUFDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcbmltcG9ydCB7IFdvcmxkcyB9IGZyb20gXCIuL3dvcmxkcy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRHVzdCB7XG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBpbml0RmluaXNoZWRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcblxuICAgICAgICBsZXQgd29ybGROYW1lcyA9IE9iamVjdC5rZXlzKFdvcmxkcyk7XG4gICAgICAgIHRoaXMud29ybGRPcHRpb25zID0ge1xuICAgICAgICAgICAgbmFtZTogd29ybGROYW1lc1t3b3JsZE5hbWVzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkgPDwgMF0sIC8vIFJhbmRvbSBzdGFydHVwIHdvcmxkXG4gICAgICAgICAgICAvL3dpZHRoOiAxMjgsIC8vIENhbiBmb3JjZSBhIHdpZHRoL2hlaWdodCBoZXJlXG4gICAgICAgICAgICAvL2hlaWdodDogMTI4LFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBhcHAgYW5kIHB1dCBpdHMgY2FudmFzIGludG8gYGNvbnRhaW5lcmBcbiAgICAgICAgdGhpcy5hcHAgPSBuZXcgUElYSS5BcHBsaWNhdGlvbihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhbnRpYWxpYXM6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICB0cmFuc3BhcmVudDogZmFsc2UsIFxuICAgICAgICAgICAgICAgIHJlc29sdXRpb246IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5hcHAudmlldyk7XG5cbiAgICAgICAgLy8gU3RhcnQgdGhlIHVwZGF0ZSBsb29wXG4gICAgICAgIHRoaXMuYXBwLnRpY2tlci5hZGQoKGRlbHRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLk9uVXBkYXRlKGRlbHRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mcmFtZWNvdW50ZXIgPSBuZXcgRnJhbWVDb3VudGVyKDEsIG51bGwpO1xuXG4gICAgICAgIC8vIFN0b3AgYXBwbGljYXRpb24gYW5kIHdhaXQgZm9yIHNldHVwIHRvIGZpbmlzaFxuICAgICAgICB0aGlzLmFwcC5zdG9wKCk7XG5cbiAgICAgICAgLy8gTG9hZCByZXNvdXJjZXMgbmVlZGVkIGZvciB0aGUgcHJvZ3JhbSB0byBydW5cbiAgICAgICAgUElYSS5sb2FkZXJcbiAgICAgICAgICAgIC5hZGQoJ2ZyYWdTaGFkZXInLCAnLi4vcmVzb3VyY2VzL2R1c3QuZnJhZycpXG4gICAgICAgICAgICAubG9hZCgobG9hZGVyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBMb2FkaW5nIGhhcyBmaW5pc2hlZFxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkUmVzb3VyY2VzID0gcmVzO1xuICAgICAgICAgICAgICAgIHRoaXMuU2V0dXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zdGFydCgpO1xuICAgICAgICAgICAgICAgIGluaXRGaW5pc2hlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXVzYWJsZSBtZXRob2QgZm9yIHNldHRpbmcgdXAgdGhlIHNpbXVsYXRpb24gZnJvbSBgdGhpcy53b3JsZE9wdGlvbnNgLlxuICAgICAqIEFsc28gd29ya3MgYXMgYSByZXNldCBmdW5jdGlvbiBpZiB5b3UgY2FsbCB0aGlzIHdpdGhvdXQgY2hhbmdpbmdcbiAgICAgKiBgdGhpcy53b3JsZE9wdGlvbnMubmFtZWAgYmVmb3JlaGFuZC5cbiAgICAgKi9cbiAgICBTZXR1cCgpIHtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHdvcmxkIGZyb20gdGhlIHN0cmluZ1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53b3JsZCA9IFdvcmxkc1t0aGlzLndvcmxkT3B0aW9ucy5uYW1lXS5jYWxsKHRoaXMsIHRoaXMud29ybGRPcHRpb25zLndpZHRoLCB0aGlzLndvcmxkT3B0aW9ucy5oZWlnaHQpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHRocm93IFwiV29ybGQgd2l0aCB0aGUgbmFtZSBcIiArIHRoaXMud29ybGRPcHRpb25zLm5hbWUgKyBcIiBkb2VzIG5vdCBleGlzdCFcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZyYW1lY291bnRlci5mcmFtZUZyZXF1ZW5jeSA9IHRoaXMud29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSB8fCAxO1xuXG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnJlc2l6ZSh0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGNhbnZhcyBmaWx0ZXJpbmcgdGhyb3VnaCBjc3NcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS5jc3NUZXh0ID0gYCBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogb3B0aW1pemVTcGVlZDsgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IC1tb3otY3Jpc3AtZWRnZXM7IFxuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiAtd2Via2l0LW9wdGltaXplLWNvbnRyYXN0OyBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogb3B0aW1pemUtY29udHJhc3Q7XG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IC1vLWNyaXNwLWVkZ2VzOyBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogcGl4ZWxhdGVkOyBcbiAgICAgICAgICAgIC1tcy1pbnRlcnBvbGF0aW9uLW1vZGU6IG5lYXJlc3QtbmVpZ2hib3I7IFxuICAgICAgICBgO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLmJvcmRlciA9IFwiMXB4IGRhc2hlZCBncmVlblwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnZpZXcuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLmJhY2tncm91bmRDb2xvciA9IDB4ZmZmZmZmO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIHNwcml0ZSBmcm9tIGEgYmxhbmsgY2FudmFzXG4gICAgICAgIHRoaXMudGV4dHVyZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLnRleHR1cmVDYW52YXMud2lkdGggPSB0aGlzLndvcmxkLndpZHRoO1xuICAgICAgICB0aGlzLnRleHR1cmVDYW52YXMuaGVpZ2h0ID0gdGhpcy53b3JsZC5oZWlnaHQ7XG4gICAgICAgIHRoaXMudGV4dHVyZUN0eCA9IHRoaXMudGV4dHVyZUNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOyAvLyBVc2VkIGxhdGVyIHRvIHVwZGF0ZSB0ZXh0dXJlXG5cbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZSA9IG5ldyBQSVhJLkJhc2VUZXh0dXJlLmZyb21DYW52YXModGhpcy50ZXh0dXJlQ2FudmFzKTtcbiAgICAgICAgdGhpcy5zcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUoXG4gICAgICAgICAgICBuZXcgUElYSS5UZXh0dXJlKHRoaXMuYmFzZVRleHR1cmUsIG5ldyBQSVhJLlJlY3RhbmdsZSgwLCAwLCB0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCkpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQ2VudGVyIHRoZSBzcHJpdGVcbiAgICAgICAgdGhpcy5zcHJpdGUueCA9IHRoaXMud29ybGQud2lkdGggLyAyO1xuICAgICAgICB0aGlzLnNwcml0ZS55ID0gdGhpcy53b3JsZC5oZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLnNwcml0ZS5hbmNob3Iuc2V0KDAuNSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzaGFkZXIgZm9yIHRoZSBzcHJpdGVcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBuZXcgUElYSS5GaWx0ZXIobnVsbCwgdGhpcy5sb2FkZWRSZXNvdXJjZXMuZnJhZ1NoYWRlci5kYXRhKTtcbiAgICAgICAgdGhpcy5zcHJpdGUuZmlsdGVycyA9IFt0aGlzLmZpbHRlcl07XG5cbiAgICAgICAgdGhpcy5hcHAuc3RhZ2UucmVtb3ZlQ2hpbGRyZW4oKTsgLy8gUmVtb3ZlIGFueSBhdHRhY2hlZCBjaGlsZHJlbiAoZm9yIGNhc2Ugd2hlcmUgY2hhbmdpbmcgcHJlc2V0cylcbiAgICAgICAgdGhpcy5hcHAuc3RhZ2UuYWRkQ2hpbGQodGhpcy5zcHJpdGUpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgdGV4dHVyZSBmcm9tIHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSB3b3JsZFxuICAgICAgICB0aGlzLlVwZGF0ZVRleHR1cmUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgZXZlcnkgZnJhbWUuIENvbnRpbnVlcyBpbmRlZmluaXRlbHkgYWZ0ZXIgYmVpbmcgY2FsbGVkIG9uY2UuXG4gICAgICovXG4gICAgT25VcGRhdGUoZGVsdGEpIHtcbiAgICAgICAgbGV0IG5vc2tpcCA9IHRoaXMuZnJhbWVjb3VudGVyLkluY3JlbWVudEZyYW1lKCk7XG4gICAgICAgIGlmKG5vc2tpcCkge1xuICAgICAgICAgICAgdGhpcy5maWx0ZXIudW5pZm9ybXMudGltZSArPSBkZWx0YTtcbiAgICAgICAgICAgIHRoaXMud29ybGQuc3RlcCgpO1xuICAgICAgICAgICAgdGhpcy5VcGRhdGVUZXh0dXJlKCk7XG4gICAgICAgICAgICB0aGlzLmFwcC5yZW5kZXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgdGV4dHVyZSByZXByZXNlbnRpbmcgdGhlIHdvcmxkLlxuICAgICAqIFdyaXRlcyBjZWxsIGNvbG9ycyB0byB0aGUgdGV4dHVyZSBjYW52YXMgYW5kIHVwZGF0ZXMgYGJhc2VUZXh0dXJlYCBmcm9tIGl0LFxuICAgICAqIHdoaWNoIG1ha2VzIFBpeGkgdXBkYXRlIHRoZSBzcHJpdGUuXG4gICAgICovXG4gICAgVXBkYXRlVGV4dHVyZSgpIHtcbiAgICAgICAgXG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGxldCBjdHggPSB0aGlzLnRleHR1cmVDdHg7XHRcdFxuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xuICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgdGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoLCB0aGlzLnRleHR1cmVDYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgbGV0IHBpeCA9IGN0eC5jcmVhdGVJbWFnZURhdGEodGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoLCB0aGlzLnRleHR1cmVDYW52YXMuaGVpZ2h0KTtcdFx0XG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodDsgeSsrKSB7XHRcdFx0XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhbGV0dGVJbmRleCA9IHRoaXMud29ybGQuZ3JpZFt5XVt4XS5nZXRDb2xvcigpO1xuICAgICAgICAgICAgICAgIGxldCBjb2xvclJHQkEgPSB0aGlzLndvcmxkLnBhbGV0dGVbcGFsZXR0ZUluZGV4XTtcbiAgICAgICAgICAgICAgICBpZihjb2xvclJHQkEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVswXTtcdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVsxXTtcdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVsyXTtcdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVszXTtcdFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiUGFsZXR0ZSBpbmRleCBvdXQgb2YgYm91bmRzOiBcIiArIHBhbGV0dGVJbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XHRcdFxuICAgICAgICB9IFx0XHRcbiAgICAgICAgY3R4LnB1dEltYWdlRGF0YShwaXgsIDAsIDApO1xuXG4gICAgICAgIC8vIFRlbGwgUGl4aSB0byB1cGRhdGUgdGhlIHRleHR1cmUgcmVmZXJlbmNlZCBieSB0aGlzIGN0eC5cbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZS51cGRhdGUoKTtcblxuICAgIH1cblxufVxuXG4vKipcbiAqIENvbnZlbmllbmNlIGNsYXNzIGZvciByZXN0cmljdGluZyB0aGUgcmVmcmVzaCByYXRlIG9mIHRoZSBzaW11bGF0aW9uLlxuICovXG5jbGFzcyBGcmFtZUNvdW50ZXIge1xuICAgIGNvbnN0cnVjdG9yKGZyYW1lRnJlcXVlbmN5LCBmcmFtZUxpbWl0ID0gbnVsbCkge1xuICAgICAgICAvLyBUaGUgbnVtYmVyIG9mIGZyYW1lcyBpbmdlc3RlZFxuICAgICAgICB0aGlzLmZyYW1lQ291bnQgPSAwO1xuXG4gICAgICAgIC8vIFRoZSBudW1iZXIgb2YgZnJhbWVzIGFsbG93ZWQgdG8gcnVuXG4gICAgICAgIHRoaXMucGFzc2VkRnJhbWVzID0gMDtcblxuICAgICAgICAvLyBGcmFtZSB3aWxsIHJ1biBldmVyeSBgZnJhbWVGcmVxdWVuY3lgIGZyYW1lcyB0aGF0IHBhc3NcbiAgICAgICAgdGhpcy5mcmFtZUZyZXF1ZW5jeSA9IGZyYW1lRnJlcXVlbmN5O1xuXG4gICAgICAgIC8vIElmIHNldCwgY2xhc3Mgd2lsbCBzdG9wIGFsbG93aW5nIGZyYW1lcyBhZnRlciBgZnJhbWVMaW1pdGAgXG4gICAgICAgIC8vIHBhc3NlZEZyYW1lcyBoYXZlIGJlZW4gYWxsb3dlZC5cbiAgICAgICAgdGhpcy5mcmFtZUxpbWl0ID0gZnJhbWVMaW1pdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgb25jZSBldmVyeSBgZnJhbWVGcmVxdWVuY3lgIHRpbWVzIGl0IGlzIGNhbGxlZC5cbiAgICAgKi9cbiAgICBJbmNyZW1lbnRGcmFtZSgpe1xuICAgICAgICB0aGlzLmZyYW1lQ291bnQgKz0gMTtcbiAgICAgICAgaWYodGhpcy5mcmFtZUNvdW50ICUgdGhpcy5mcmFtZUZyZXF1ZW5jeSA9PSAwKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSd2ZSByZWFjaGVkIHRoZSBmcmFtZSBsaW1pdFxuICAgICAgICAgICAgaWYodGhpcy5mcmFtZUxpbWl0ICE9IG51bGwgJiYgdGhpcy5wYXNzZWRGcmFtZXMgPj0gdGhpcy5mcmFtZUxpbWl0KVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMucGFzc2VkRnJhbWVzICs9IDE7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufSIsImltcG9ydCB7IFdvcmxkcyB9IGZyb20gXCIuL3dvcmxkcy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgR1VJIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIGF0dGFjaGVzIGEgR1VJIHRvIHRoZSBwYWdlIGlmIERBVC5HVUkgaXMgaW5jbHVkZWQuXG4gICAgICovXG4gICAgc3RhdGljIEluaXQoZHVzdCl7XG4gICAgICAgIGlmKHR5cGVvZihkYXQpID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIERBVC5HVUkgaW5zdGFuY2UgZm91bmQuIEltcG9ydCBvbiB0aGlzIHBhZ2UgdG8gdXNlIVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBndWkgPSBuZXcgZGF0LkdVSSgpO1xuXG4gICAgICAgIGd1aS5hZGQoZHVzdC5mcmFtZWNvdW50ZXIsICdmcmFtZUZyZXF1ZW5jeScpLm1pbigxKS5tYXgoMzApLnN0ZXAoMSkubGlzdGVuKCk7XG5cbiAgICAgICAgZ3VpLmFkZChkdXN0LndvcmxkT3B0aW9ucywgJ25hbWUnLCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhXb3JsZHMpKS5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICBkdXN0LlNldHVwKCk7XG4gICAgICAgIH0pLm5hbWUoXCJQcmVzZXRcIik7XG5cbiAgICAgICAgZ3VpLmFkZChkdXN0LCBcIlNldHVwXCIpLm5hbWUoXCJSZXNldFwiKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBEZXRlY3RvciB9IGZyb20gXCIuL3V0aWxzL3dlYmdsLWRldGVjdC5qc1wiO1xuaW1wb3J0IHsgRHVzdCB9IGZyb20gXCIuL2R1c3QuanNcIjtcbmltcG9ydCB7IEdVSSB9IGZyb20gXCIuL2d1aS5qc1wiO1xuXG5sZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkdXN0LWNvbnRhaW5lclwiKTtcblxuaWYgKCAhRGV0ZWN0b3IuSGFzV2ViR0woKSApIHtcbiAgICAvL2V4aXQoXCJXZWJHTCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XG4gICAgY29uc29sZS5sb2coXCJXZWJHTCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IERldGVjdG9yLkdldEVycm9ySFRNTCgpO1xuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwibm8td2ViZ2xcIik7XG59XG5lbHNlIHtcbiAgICBsZXQgZHVzdCA9IG5ldyBEdXN0KGNvbnRhaW5lciwgKCkgPT4ge1xuICAgICAgICAvLyBEdXN0IGlzIG5vdyBmdWxseSBsb2FkZWRcbiAgICAgICAgR1VJLkluaXQoZHVzdCk7XG4gICAgfSk7XG59IiwiY2xhc3MgRGV0ZWN0b3Ige1xuXG4gICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExODcxMDc3L3Byb3Blci13YXktdG8tZGV0ZWN0LXdlYmdsLXN1cHBvcnRcbiAgICBzdGF0aWMgSGFzV2ViR0woKSB7XG4gICAgICAgIGlmICghIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLFxuICAgICAgICAgICAgICAgICAgICBuYW1lcyA9IFtcIndlYmdsXCIsIFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIFwibW96LXdlYmdsXCIsIFwid2Via2l0LTNkXCJdLFxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTw0O2krKykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChuYW1lc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0LmdldFBhcmFtZXRlciA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlYkdMIGlzIGVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZWJHTCBpcyBzdXBwb3J0ZWQsIGJ1dCBkaXNhYmxlZFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdlYkdMIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBHZXRFcnJvckhUTUwobWVzc2FnZSA9IG51bGwpe1xuICAgICAgICBpZihtZXNzYWdlID09IG51bGwpe1xuICAgICAgICAgICAgbWVzc2FnZSA9IGBZb3VyIGdyYXBoaWNzIGNhcmQgZG9lcyBub3Qgc2VlbSB0byBzdXBwb3J0IFxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHA6Ly9raHJvbm9zLm9yZy93ZWJnbC93aWtpL0dldHRpbmdfYV9XZWJHTF9JbXBsZW1lbnRhdGlvblwiPldlYkdMPC9hPi4gPGJyPlxuICAgICAgICAgICAgICAgICAgICAgICAgRmluZCBvdXQgaG93IHRvIGdldCBpdCA8YSBocmVmPVwiaHR0cDovL2dldC53ZWJnbC5vcmcvXCI+aGVyZTwvYT4uYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwibm8td2ViZ2wtc3VwcG9ydFwiPlxuICAgICAgICA8cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4ke21lc3NhZ2V9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgYFxuICAgIH1cblxufVxuXG5leHBvcnQgeyBEZXRlY3RvciB9OyIsImZ1bmN0aW9uIENlbGxBdXRvQ2VsbChsb2NYLCBsb2NZKSB7XG5cdHRoaXMueCA9IGxvY1g7XG5cdHRoaXMueSA9IGxvY1k7XG5cblx0dGhpcy5kZWxheXMgPSBbXTtcbn1cblxuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1cnJvdW5kaW5nID0gMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXVt2YWx1ZV0pIHtcblx0XHRcdHN1cnJvdW5kaW5nKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBzdXJyb3VuZGluZztcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24obnVtU3RlcHMsIGZuKSB7XG5cdHRoaXMuZGVsYXlzLnB1c2goeyBzdGVwczogbnVtU3RlcHMsIGFjdGlvbjogZm4gfSk7XG59O1xuXG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5cbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1bW1lZCA9IDAuMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIChuZWlnaGJvcnNbaV1bdmFsdWVdIHx8IG5laWdoYm9yc1tpXVt2YWx1ZV0gPT09IDApKSB7XG5cdFx0XHRzdW1tZWQgKz0gbmVpZ2hib3JzW2ldW3ZhbHVlXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHN1bW1lZCAvIG5laWdoYm9ycy5sZW5ndGg7Ly9jbnQ7XG59O1xuZnVuY3Rpb24gQ0FXb3JsZChvcHRpb25zKSB7XG5cblx0dGhpcy53aWR0aCA9IDI0O1xuXHR0aGlzLmhlaWdodCA9IDI0O1xuXHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG5cdHRoaXMud3JhcCA9IGZhbHNlO1xuXG5cdHRoaXMuVE9QTEVGVCAgICAgICAgPSB7IGluZGV4OiAwLCB4OiAtMSwgeTogLTEgfTtcblx0dGhpcy5UT1AgICAgICAgICAgICA9IHsgaW5kZXg6IDEsIHg6ICAwLCB5OiAtMSB9O1xuXHR0aGlzLlRPUFJJR0hUICAgICAgID0geyBpbmRleDogMiwgeDogIDEsIHk6IC0xIH07XG5cdHRoaXMuTEVGVCAgICAgICAgICAgPSB7IGluZGV4OiAzLCB4OiAtMSwgeTogIDAgfTtcblx0dGhpcy5SSUdIVCAgICAgICAgICA9IHsgaW5kZXg6IDQsIHg6ICAxLCB5OiAgMCB9O1xuXHR0aGlzLkJPVFRPTUxFRlQgICAgID0geyBpbmRleDogNSwgeDogLTEsIHk6ICAxIH07XG5cdHRoaXMuQk9UVE9NICAgICAgICAgPSB7IGluZGV4OiA2LCB4OiAgMCwgeTogIDEgfTtcblx0dGhpcy5CT1RUT01SSUdIVCAgICA9IHsgaW5kZXg6IDcsIHg6ICAxLCB5OiAgMSB9O1xuXHRcblx0dGhpcy5yYW5kb21HZW5lcmF0b3IgPSBNYXRoLnJhbmRvbTtcblxuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdCwgZWlnaHQgc2lkZXNcblx0dmFyIG5laWdoYm9yaG9vZCA9IFtudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcblxuXHRpZiAodGhpcy5vcHRpb25zLmhleFRpbGVzKSB7XG5cdFx0Ly8gc2l4IHNpZGVzXG5cdFx0bmVpZ2hib3Job29kID0gW251bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGxdO1xuXHR9XG5cdHRoaXMuc3RlcCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB5LCB4O1xuXHRcdGZvciAoeT0wOyB5PHRoaXMuaGVpZ2h0OyB5KyspIHtcblx0XHRcdGZvciAoeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0XHR0aGlzLmdyaWRbeV1beF0ucmVzZXQoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBib3R0b20gdXAsIGxlZnQgdG8gcmlnaHQgcHJvY2Vzc2luZ1xuXHRcdGZvciAoeT10aGlzLmhlaWdodC0xOyB5Pj0wOyB5LS0pIHtcblx0XHRcdGZvciAoeD10aGlzLndpZHRoLTE7IHg+PTA7IHgtLSkge1xuXHRcdFx0XHR0aGlzLmZpbGxOZWlnaGJvcnMobmVpZ2hib3Job29kLCB4LCB5KTtcblx0XHRcdFx0dmFyIGNlbGwgPSB0aGlzLmdyaWRbeV1beF07XG5cdFx0XHRcdGNlbGwucHJvY2VzcyhuZWlnaGJvcmhvb2QpO1xuXG5cdFx0XHRcdC8vIHBlcmZvcm0gYW55IGRlbGF5c1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8Y2VsbC5kZWxheXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5zdGVwcy0tO1xuXHRcdFx0XHRcdGlmIChjZWxsLmRlbGF5c1tpXS5zdGVwcyA8PSAwKSB7XG5cdFx0XHRcdFx0XHQvLyBwZXJmb3JtIGFjdGlvbiBhbmQgcmVtb3ZlIGRlbGF5XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5hY3Rpb24oY2VsbCk7XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5cy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRpLS07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vdmFyIE5FSUdIQk9STE9DUyA9IFt7eDotMSwgeTotMX0sIHt4OjAsIHk6LTF9LCB7eDoxLCB5Oi0xfSwge3g6LTEsIHk6MH0sIHt4OjEsIHk6MH0se3g6LTEsIHk6MX0sIHt4OjAsIHk6MX0sIHt4OjEsIHk6MX1dO1xuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdFxuXHR2YXIgTkVJR0hCT1JMT0NTID0gW1xuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIHJpZ2h0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19LCAgLy8gYm90dG9tIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSwgIC8vIGJvdHRvbVxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XTtcblx0aWYgKHRoaXMub3B0aW9ucy5oZXhUaWxlcykge1xuXHRcdGlmICh0aGlzLm9wdGlvbnMuZmxhdFRvcHBlZCkge1xuXHRcdFx0Ly8gZmxhdCB0b3BwZWQgaGV4IG1hcCwgIGZ1bmN0aW9uIHJlcXVpcmVzIGNvbHVtbiB0byBiZSBwYXNzZWRcblx0XHRcdE5FSUdIQk9STE9DUyA9IFtcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIGxlZnRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wXG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIHJpZ2h0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0sICAvLyBib3R0b20gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b21cblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0gIC8vIGJvdHRvbSBsZWZ0XG5cdFx0XHRdO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIHBvaW50eSB0b3BwZWQgaGV4IG1hcCwgZnVuY3Rpb24gcmVxdWlyZXMgcm93IHRvIGJlIHBhc3NlZFxuXHRcdFx0TkVJR0hCT1JMT0NTID0gW1xuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMCA6IC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfX0sICAvLyBsZWZ0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH19LCAgLy8gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKHgsIHkpIHsgcmV0dXJuIHklMiA/IDAgOiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b20gbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XHRcdF07XG5cdFx0fVxuXG5cdH1cblx0dGhpcy5maWxsTmVpZ2hib3JzID0gZnVuY3Rpb24obmVpZ2hib3JzLCB4LCB5KSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPE5FSUdIQk9STE9DUy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5laWdoYm9yWCA9IHggKyBORUlHSEJPUkxPQ1NbaV0uZGlmZlgoeCwgeSk7XG5cdFx0XHR2YXIgbmVpZ2hib3JZID0geSArIE5FSUdIQk9STE9DU1tpXS5kaWZmWSh4LCB5KTtcblx0XHRcdGlmICh0aGlzLndyYXApIHtcblx0XHRcdFx0Ly8gVE9ETzogaGV4IG1hcCBzdXBwb3J0IGZvciB3cmFwcGluZ1xuXHRcdFx0XHRuZWlnaGJvclggPSAobmVpZ2hib3JYICsgdGhpcy53aWR0aCkgJSB0aGlzLndpZHRoO1xuXHRcdFx0XHRuZWlnaGJvclkgPSAobmVpZ2hib3JZICsgdGhpcy5oZWlnaHQpICUgdGhpcy5oZWlnaHQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXRoaXMud3JhcCAmJiAobmVpZ2hib3JYIDwgMCB8fCBuZWlnaGJvclkgPCAwIHx8IG5laWdoYm9yWCA+PSB0aGlzLndpZHRoIHx8IG5laWdoYm9yWSA+PSB0aGlzLmhlaWdodCkpIHtcblx0XHRcdFx0bmVpZ2hib3JzW2ldID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRuZWlnaGJvcnNbaV0gPSB0aGlzLmdyaWRbbmVpZ2hib3JZXVtuZWlnaGJvclhdO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmluaXRpYWxpemUgPSBmdW5jdGlvbihhcnJheVR5cGVEaXN0KSB7XG5cblx0XHQvLyBzb3J0IHRoZSBjZWxsIHR5cGVzIGJ5IGRpc3RyaWJ1dGlvblxuXHRcdGFycmF5VHlwZURpc3Quc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdFx0XHRyZXR1cm4gYS5kaXN0cmlidXRpb24gPiBiLmRpc3RyaWJ1dGlvbiA/IDEgOiAtMTtcblx0XHR9KTtcblxuXHRcdHZhciB0b3RhbERpc3QgPSAwO1xuXHRcdC8vIGFkZCBhbGwgZGlzdHJpYnV0aW9ucyB0b2dldGhlclxuXHRcdGZvciAodmFyIGk9MDsgaTxhcnJheVR5cGVEaXN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0b3RhbERpc3QgKz0gYXJyYXlUeXBlRGlzdFtpXS5kaXN0cmlidXRpb247XG5cdFx0XHRhcnJheVR5cGVEaXN0W2ldLmRpc3RyaWJ1dGlvbiA9IHRvdGFsRGlzdDtcblx0XHR9XG5cblx0XHR0aGlzLmdyaWQgPSBbXTtcblx0XHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0XHRmb3IgKHZhciB4PTA7IHg8dGhpcy53aWR0aDsgeCsrKSB7XG5cdFx0XHRcdHZhciByYW5kb20gPSB0aGlzLnJhbmRvbUdlbmVyYXRvcigpICogMTAwO1xuXG5cdFx0XHRcdGZvciAoaT0wOyBpPGFycmF5VHlwZURpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRpZiAocmFuZG9tIDw9IGFycmF5VHlwZURpc3RbaV0uZGlzdHJpYnV0aW9uKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbYXJyYXlUeXBlRGlzdFtpXS5uYW1lXSh4LCB5KTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNlbGxUeXBlcyA9IHt9O1xuXHR0aGlzLnJlZ2lzdGVyQ2VsbFR5cGUgPSBmdW5jdGlvbihuYW1lLCBjZWxsT3B0aW9ucywgaW5pdCkge1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdFx0Q2VsbEF1dG9DZWxsLmNhbGwodGhpcywgeCwgeSk7XG5cblx0XHRcdGlmIChpbml0KSB7XG5cdFx0XHRcdGluaXQuY2FsbCh0aGlzLCB4LCB5KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBjZWxsT3B0aW9ucykge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0Ly8gcHJvcGVydGllcyBnZXQgaW5zdGFuY2Vcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdFx0Ly8gb2JqZWN0cyBtdXN0IGJlIGNsb25lZFxuXHRcdFx0XHRcdFx0XHR0aGlzW2tleV0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNlbGxPcHRpb25zW2tleV0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyBwcmltaXRpdmVcblx0XHRcdFx0XHRcdFx0dGhpc1trZXldID0gY2VsbE9wdGlvbnNba2V5XTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2VsbEF1dG9DZWxsLnByb3RvdHlwZSk7XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gdGhpcy5jZWxsVHlwZXNbbmFtZV07XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNlbGxUeXBlID0gbmFtZTtcblxuXHRcdGlmIChjZWxsT3B0aW9ucykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdC8vIGZ1bmN0aW9ucyBnZXQgcHJvdG90eXBlXG5cdFx0XHRcdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlW2tleV0gPSBjZWxsT3B0aW9uc1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vIGFwcGx5IG9wdGlvbnNcblx0aWYgKG9wdGlvbnMpIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuXHRcdFx0dGhpc1trZXldID0gb3B0aW9uc1trZXldO1xuXHRcdH1cblx0fVxuXG59XG5cbkNBV29ybGQucHJvdG90eXBlLmluaXRpYWxpemVGcm9tR3JpZCAgPSBmdW5jdGlvbih2YWx1ZXMsIGluaXRHcmlkKSB7XG5cblx0dGhpcy5ncmlkID0gW107XG5cdGZvciAodmFyIHk9MDsgeTx0aGlzLmhlaWdodDsgeSsrKSB7XG5cdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0Zm9yICh2YXIgeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodmFsdWVzW2ldLmdyaWRWYWx1ZSA9PT0gaW5pdEdyaWRbeV1beF0pIHtcblx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbdmFsdWVzW2ldLm5hbWVdKHgsIHkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cbn07XG5cbkNBV29ybGQucHJvdG90eXBlLmNyZWF0ZUdyaWRGcm9tVmFsdWVzID0gZnVuY3Rpb24odmFsdWVzLCBkZWZhdWx0VmFsdWUpIHtcblx0dmFyIG5ld0dyaWQgPSBbXTtcblxuXHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdG5ld0dyaWRbeV0gPSBbXTtcblx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0bmV3R3JpZFt5XVt4XSA9IGRlZmF1bHRWYWx1ZTtcblx0XHRcdHZhciBjZWxsID0gdGhpcy5ncmlkW3ldW3hdO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoY2VsbC5jZWxsVHlwZSA9PSB2YWx1ZXNbaV0uY2VsbFR5cGUgJiYgY2VsbFt2YWx1ZXNbaV0uaGFzUHJvcGVydHldKSB7XG5cdFx0XHRcdFx0bmV3R3JpZFt5XVt4XSA9IHZhbHVlc1tpXS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBuZXdHcmlkO1xufTtcblxuOyhmdW5jdGlvbigpIHtcbiAgdmFyIENlbGxBdXRvID0ge1xuICAgIFdvcmxkOiBDQVdvcmxkLFxuICAgIENlbGw6IENlbGxBdXRvQ2VsbFxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ0NlbGxBdXRvJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIENlbGxBdXRvO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDZWxsQXV0bztcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuQ2VsbEF1dG8gPSBDZWxsQXV0bztcbiAgfVxufSkoKTsiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcblxuZXhwb3J0IGxldCBXb3JsZHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaG9vc2VzIGEgcmFuZG9tIGVsZW1lbnRhcnkgYXV0b21hdGEgZnJvbSBhIGxpc3QuXG4gICAgICovXG4gICAgUmFuZG9tUnVsZTogZnVuY3Rpb24gKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgbGV0IHJ1bGVzID0gW1xuICAgICAgICAgICAgMTgsIDIyLCAyNiwgNTQsIDYwLCA5MCwgOTQsIDExMCwgMTI2LCAxNTBcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHJ1bGU6IHJ1bGVzW3J1bGVzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkgPDwgMF0sIC8vIFJhbmRvbSBydWxlIGZyb20gbGlzdFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFbGVtZW50YXJ5KG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb253YXkncyBHYW1lIG9mIExpZmVcbiAgICAgKiBCMy9TMjNcbiAgICAgKi9cbiAgICBMaWZlOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgQjogWzNdLFxuICAgICAgICAgICAgUzogWzIsIDNdLFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeTogMixcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTGlmZUxpa2Uob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIG1hemUtbGlrZSBzdHJ1Y3R1cmUuXG4gICAgICogQmFzZWQgb24gcnVsZSBCMy9TMTIzNCAoTWF6ZWNldHJpYykuXG4gICAgICovXG4gICAgTWF6ZWNldHJpYzogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIEI6IFszXSxcbiAgICAgICAgICAgIFM6IFsxLCAyLCAzLCA0XSxcbiAgICAgICAgICAgIHBhbGV0dGU6IFtcbiAgICAgICAgICAgICAgICBbNjgsIDM2LCA1MiwgMjU1XSxcbiAgICAgICAgICAgICAgICBbMjU1LCAyNTUsIDI1NSwgMjU1XVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3k6IDUsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExpZmVMaWtlKG9wdGlvbnMsICh4LCB5KSA9PiB7XG4gICAgICAgICAgICAvLyBEaXN0cmlidXRpb24gZnVuY3Rpb25cbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDwgMC4xO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQjM1Njc4L1M1Njc4XG4gICAgICovXG4gICAgRGlhbW9lYmE6IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBCOiBbMywgNSwgNiwgNywgOF0sXG4gICAgICAgICAgICBTOiBbNSwgNiwgNywgOF0sXG4gICAgICAgICAgICBwYWxldHRlOiBbXG4gICAgICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5OiAzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExpZmVMaWtlKG9wdGlvbnMsICh4LCB5KSA9PiB7XG4gICAgICAgICAgICAvLyBEaXN0cmlidXRpb24gZnVuY3Rpb25cbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDwgMC4yO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQjQ2NzgvUzM1Njc4XG4gICAgICovXG4gICAgQW5uZWFsOiBmdW5jdGlvbih3aWR0aCA9IDk2LCBoZWlnaHQgPSA5Nikge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgQjogWzQsIDYsIDcsIDhdLFxuICAgICAgICAgICAgUzogWzMsIDUsIDYsIDcsIDhdLFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeTogM1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMaWZlTGlrZShvcHRpb25zLCAoeCwgeSkgPT4ge1xuICAgICAgICAgICAgLy8gRGlzdHJpYnV0aW9uIGZ1bmN0aW9uXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8IDAuMztcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENBIHRoYXQgbG9va3MgbGlrZSBsYXZhLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBMYXZhOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyB0aGFua3MgdG8gVGhlTGFzdEJhbmFuYSBvbiBUSUdTb3VyY2VcblxuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbMzQsMTAsMjEsMjU1XSwgWzY4LDE3LDI2LDI1NV0sIFsxMjMsMTYsMTYsMjU1XSxcbiAgICAgICAgICAgIFsxOTAsNDUsMTYsMjU1XSwgWzI0NCwxMDIsMjAsMjU1XSwgWzI1NCwyMTIsOTcsMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIGxldCBjb2xvcnMgPSBbXTtcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgMTg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjc7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjk7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDM7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDU7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNTY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNjQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdsYXZhJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBsZXQgdiA9IHRoaXMudmFsdWUgKyAwLjVcbiAgICAgICAgICAgICAgICAgICAgKyBNYXRoLnNpbih0aGlzLnggLyB3b3JsZC53aWR0aCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICArIE1hdGguc2luKHRoaXMueSAvIHdvcmxkLmhlaWdodCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICAtIDAuMDU7XG4gICAgICAgICAgICAgICAgdiA9IE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMC4wLCB2KSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzW01hdGguZmxvb3IoY29sb3JzLmxlbmd0aCAqIHYpXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5kcm9wbGV0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS52YWx1ZSA9IDAuNSAqdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ucHJldiA9IDAuNSAqdGhpcy5wcmV2O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGF2ZyA9IHRoaXMuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZShuZWlnaGJvcnMsICd2YWx1ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IDAuOTk4ICogKDIgKiBhdmcgLSB0aGlzLnByZXYpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC45OTk5Mykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gLTAuMjUgKyAwLjMqTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBNYXRoLm1pbigwLjUsIE1hdGgubWF4KC0wLjUsIHRoaXMudmFsdWUpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIHRoaXMubmV4dCA9IHRoaXMudmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnbGF2YScsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN5Y2xpYyByYWluYm93IGF1dG9tYXRhLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBDeWNsaWNSYWluYm93czogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSA9IDE7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFsyNTUsMCwwLDEgKiAyNTVdLCBbMjU1LDk2LDAsMSAqIDI1NV0sIFsyNTUsMTkxLDAsMSAqIDI1NV0sIFsyMjMsMjU1LDAsMSAqIDI1NV0sXG4gICAgICAgICAgICBbMTI4LDI1NSwwLDEgKiAyNTVdLCBbMzIsMjU1LDAsMSAqIDI1NV0sIFswLDI1NSw2NCwxICogMjU1XSwgWzAsMjU1LDE1OSwxICogMjU1XSxcbiAgICAgICAgICAgIFswLDI1NSwyNTUsMSAqIDI1NV0sIFswLDE1OSwyNTUsMSAqIDI1NV0sIFswLDY0LDI1NSwxICogMjU1XSwgWzMyLDAsMjU1LDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEyNywwLDI1NSwxICogMjU1XSwgWzIyMywwLDI1NSwxICogMjU1XSwgWzI1NSwwLDE5MSwxICogMjU1XSwgWzI1NSwwLDk2LDEgKiAyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnY3ljbGljJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSAodGhpcy5zdGF0ZSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoyKSkgJSAxNjtcblxuICAgICAgICAgICAgICAgIGxldCBjaGFuZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5naW5nID0gY2hhbmdpbmcgfHwgbmVpZ2hib3JzW2ldLnN0YXRlID09PSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjaGFuZ2luZykgdGhpcy5zdGF0ZSA9IG5leHQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICdjeWNsaWMnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIGNhdmVzIGFuZCB3YXRlciBtb3ZlbWVudC5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgQ2F2ZXNXaXRoV2F0ZXI6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgLy8gRklSU1QgQ1JFQVRFIENBVkVTXG4gICAgICAgIGxldCB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YWxsJywge1xuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGxldCBzdXJyb3VuZGluZyA9IHRoaXMuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlKG5laWdoYm9ycywgJ3dhc09wZW4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4gPSAodGhpcy53YXNPcGVuICYmIHN1cnJvdW5kaW5nID49IDQpIHx8IHN1cnJvdW5kaW5nID49IDY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc09wZW4gPSB0aGlzLm9wZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5vcGVuID0gTWF0aC5yYW5kb20oKSA+IDAuNDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2FsbCcsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgb3VyIGNhdmUsIDEwIHN0ZXBzIGF1Z2h0IHRvIGRvIGl0XG4gICAgICAgIGZvciAobGV0IGk9MDsgaTwxMDsgaSsrKSB7XG4gICAgICAgICAgICB3b3JsZC5zdGVwKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZ3JpZCA9IHdvcmxkLmNyZWF0ZUdyaWRGcm9tVmFsdWVzKFtcbiAgICAgICAgICAgIHsgY2VsbFR5cGU6ICd3YWxsJywgaGFzUHJvcGVydHk6ICdvcGVuJywgdmFsdWU6IDAgfVxuICAgICAgICBdLCAxKTtcblxuICAgICAgICAvLyBOT1cgVVNFIE9VUiBDQVZFUyBUTyBDUkVBVEUgQSBORVcgV09STEQgQ09OVEFJTklORyBXQVRFUlxuICAgICAgICB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGNsZWFyUmVjdDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMCAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDMvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA0LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDYvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA3LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgOC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEwOSwgMTcwLCA0NCwgMSAqIDI1NV0sXG4gICAgICAgICAgICBbNjgsIDM2LCA1MiwgMSAqIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YXRlcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL3JldHVybiAweDU5N0RDRTQ0O1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndhdGVyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLndhdGVyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBwdXNoIG15IHdhdGVyIG91dCB0byBteSBhdmFpbGFibGUgbmVpZ2hib3JzXG5cbiAgICAgICAgICAgICAgICAvLyBjZWxsIGJlbG93IG1lIHdpbGwgdGFrZSBhbGwgaXQgY2FuXG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCA5IC0gbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBib3R0b20gdHdvIGNvcm5lcnMgdGFrZSBoYWxmIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaT01OyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkhPXdvcmxkLkJPVFRPTS5pbmRleCAmJiBuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8yKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzaWRlcyB0YWtlIGEgdGhpcmQgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTM7IGk8PTQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS53YXRlciA8IHRoaXMud2F0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy53YXRlciA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDkpO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdyb2NrJywge1xuICAgICAgICAgICAgaXNTb2xpZDogdHJ1ZSxcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saWdodGVkID8gMTAgOiAxMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpZ2h0ZWQgPSBuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XSAmJiAhKG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdLndhdGVyID09PSA5KSAmJiAhbmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0uaXNTb2xpZFxuICAgICAgICAgICAgICAgICAgICAmJiBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XSAmJiBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS5pc1NvbGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBwYXNzIGluIG91ciBnZW5lcmF0ZWQgY2F2ZSBkYXRhXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemVGcm9tR3JpZChbXG4gICAgICAgICAgICB7IG5hbWU6ICdyb2NrJywgZ3JpZFZhbHVlOiAxIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICd3YXRlcicsIGdyaWRWYWx1ZTogMCB9XG4gICAgICAgIF0sIGdyaWQpO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgUmFpbjogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyBGSVJTVCBDUkVBVEUgQ0FWRVNcbiAgICAgICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3dhbGwnLCB7XG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1cnJvdW5kaW5nID0gdGhpcy5jb3VudFN1cnJvdW5kaW5nQ2VsbHNXaXRoVmFsdWUobmVpZ2hib3JzLCAnd2FzT3BlbicpO1xuICAgICAgICAgICAgICAgIHRoaXMub3BlbiA9ICh0aGlzLndhc09wZW4gJiYgc3Vycm91bmRpbmcgPj0gNCkgfHwgc3Vycm91bmRpbmcgPj0gNjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FzT3BlbiA9IHRoaXMub3BlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLm9wZW4gPSBNYXRoLnJhbmRvbSgpID4gMC40MDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICd3YWxsJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAvLyBnZW5lcmF0ZSBvdXIgY2F2ZSwgMTAgc3RlcHMgYXVnaHQgdG8gZG8gaXRcbiAgICAgICAgZm9yIChsZXQgaT0wOyBpPDEwOyBpKyspIHtcbiAgICAgICAgICAgIHdvcmxkLnN0ZXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBncmlkID0gd29ybGQuY3JlYXRlR3JpZEZyb21WYWx1ZXMoW1xuICAgICAgICAgICAgeyBjZWxsVHlwZTogJ3dhbGwnLCBoYXNQcm9wZXJ0eTogJ29wZW4nLCB2YWx1ZTogMCB9XG4gICAgICAgIF0sIDEpO1xuXG4gICAgICAgIC8vIGN1dCB0aGUgdG9wIGhhbGYgb2YgdGhlIGNhdmVzIG9mZlxuICAgICAgICBmb3IgKGxldCB5PTA7IHk8TWF0aC5mbG9vcih3b3JsZC5oZWlnaHQvMik7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeD0wOyB4PHdvcmxkLndpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBncmlkW3ldW3hdID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5PVyBVU0UgT1VSIENBVkVTIFRPIENSRUFURSBBIE5FVyBXT1JMRCBDT05UQUlOSU5HIFdBVEVSXG4gICAgICAgIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgY2xlYXJSZWN0OiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxXSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDEvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAyLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMy85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDQvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA1LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDcvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA4LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMjU1XSxcbiAgICAgICAgICAgIFsxMDksIDE3MCwgNDQsIDI1NV0sXG4gICAgICAgICAgICBbNjgsIDM2LCA1MiwgMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2FpcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL3JldHVybiAnODksIDEyNSwgMjA2LCAnICsgKHRoaXMud2F0ZXIgPyBNYXRoLm1heCgwLjMsIHRoaXMud2F0ZXIvOSkgOiAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53YXRlcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICAvLyByYWluIG9uIHRoZSB0b3Agcm93XG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdID09PSBudWxsICYmIE1hdGgucmFuZG9tKCkgPCAwLjAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXIgPSA1O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLndhdGVyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHB1c2ggbXkgd2F0ZXIgb3V0IHRvIG15IGF2YWlsYWJsZSBuZWlnaGJvcnNcblxuICAgICAgICAgICAgICAgIC8vIGNlbGwgYmVsb3cgbWUgd2lsbCB0YWtlIGFsbCBpdCBjYW5cbiAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIDkgLSBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGJvdHRvbSB0d28gY29ybmVycyB0YWtlIGhhbGYgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTU7IGk8PTc7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSE9d29ybGQuQk9UVE9NLmluZGV4ICYmIG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiB0aGlzLndhdGVyICYmIG5laWdoYm9yc1tpXS53YXRlciA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNpZGVzIHRha2UgYSB0aGlyZCBvZiB3aGF0IEkgaGF2ZVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGk9MzsgaTw9NDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgdGhpcy53YXRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgncm9jaycsIHtcbiAgICAgICAgICAgIGlzU29saWQ6IHRydWUsXG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlnaHRlZCA/IDEwIDogMTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saWdodGVkID0gbmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0gJiYgIShuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS53YXRlciA9PT0gOSkgJiYgIW5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdLmlzU29saWRcbiAgICAgICAgICAgICAgICAgICAgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0uaXNTb2xpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcGFzcyBpbiBvdXIgZ2VuZXJhdGVkIGNhdmUgZGF0YVxuICAgICAgICB3b3JsZC5pbml0aWFsaXplRnJvbUdyaWQoW1xuICAgICAgICAgICAgeyBuYW1lOiAncm9jaycsIGdyaWRWYWx1ZTogMSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnYWlyJywgZ3JpZFZhbHVlOiAwIH1cbiAgICAgICAgXSwgZ3JpZCk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZXMgc3BsYXNoaW5nIHdhdGVyLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBTcGxhc2hlczogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtdO1xuICAgICAgICBsZXQgY29sb3JzID0gW107XG4gICAgICAgIGZvciAobGV0IGluZGV4PTA7IGluZGV4PDY0OyBpbmRleCsrKSB7XG4gICAgICAgICAgICB3b3JsZC5wYWxldHRlLnB1c2goWzg5LCAxMjUsIDIwNiwgKGluZGV4LzY0KSAqIDI1NV0pO1xuICAgICAgICAgICAgY29sb3JzW2luZGV4XSA9IDYzIC0gaW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YXRlcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbGV0IHYgPSAoTWF0aC5tYXgoMiAqIHRoaXMudmFsdWUgKyAwLjAyLCAwKSAtIDAuMDIpICsgMC41O1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvcnNbTWF0aC5mbG9vcihjb2xvcnMubGVuZ3RoICogdildO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmRyb3BsZXQgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiBuZWlnaGJvcnNbaV0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0udmFsdWUgPSAwLjUgKnRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnByZXYgPSAwLjUgKnRoaXMucHJldjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3BsZXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBhdmcgPSB0aGlzLmdldFN1cnJvdW5kaW5nQ2VsbHNBdmVyYWdlVmFsdWUobmVpZ2hib3JzLCAndmFsdWUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQgPSAwLjk5ICogKDIgKiBhdmcgLSB0aGlzLnByZXYpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYoTWF0aC5yYW5kb20oKSA+IDAuOTk5OSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gLTAuMiArIDAuMjUqTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMud2F0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB0aGlzLm5leHQgPSB0aGlzLnZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhdGVyJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1bGUgNTI5MjggLSB0aGUgQ0EgdXNlZCBmb3IgV29sZnJhbSBBbHBoYSdzIGxvYWRpbmcgYW5pbWF0aW9uc1xuICAgICAqIFxuICAgICAqIFJlc291cmNlczpcbiAgICAgKiBodHRwczovL3d3dy5xdW9yYS5jb20vV2hhdC1pcy1Xb2xmcmFtLUFscGhhcy1sb2FkaW5nLXNjcmVlbi1hLWRlcGljdGlvbi1vZlxuICAgICAqIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvaHVuZ3J5Y2FtZWwvOVVyekovXG4gICAgICovXG4gICAgV29sZnJhbTogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gMjtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV0sIC8vIEJhY2tncm91bmQgY29sb3JcbiAgICAgICAgICAgIFsyNTUsIDExMCwgMCAgLCAyNTVdLCAvLyBkYXJrIG9yYW5nZVxuICAgICAgICAgICAgWzI1NSwgMTMwLCAwICAsIDI1NV0sIC8vICAgICAgfFxuICAgICAgICAgICAgWzI1NSwgMTUwLCAwICAsIDI1NV0sIC8vICAgICAgfFxuICAgICAgICAgICAgWzI1NSwgMTcwLCAwICAsIDI1NV0sIC8vICAgICAgVlxuICAgICAgICAgICAgWzI1NSwgMTgwLCAwICAsIDI1NV0gIC8vIGxpZ2h0IG9yYW5nZVxuICAgICAgICBdO1xuXG4gICAgICAgIGxldCBjaG9pY2UgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgICAgIGxldCBzZWVkTGlzdCA9IFtcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAyLCAxLCAxLCAxLCAxLCAwLCAwLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzEsIDEsIDMsIDQsIDIsIDEsIDEsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMSwgMSwgMSwgNCwgMSwgMSwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAxLCAyLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDEsIDEsIDEsIDAsIDAsIDIsIDIsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMiwgMiwgMCwgMCwgMSwgMSwgMSwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAyLCAxLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDEsIDQsIDEsIDEsIDEsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMSwgMSwgMiwgNCwgMywgMSwgMV0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAwLCAxLCAxLCAxLCAxLCAyLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDBdXG4gICAgICAgICAgICBdLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFswLCAwLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDAsIDBdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFswLCAxLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFsxLCAwLCAwLCAwLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMSwgMSwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDEsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMSwgMCwgMCwgMCwgMSwgMSwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDEsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMCwgMCwgMCwgMSwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFswLCAxLCAwLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMSwgMSwgMSwgMCwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMCwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzEsIDAsIDAsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFswLCAwLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDAsIDEsIDAsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDAsIDAsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAwLCAwLCAxXSwgWzEsIDAsIDAsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMCwgMV0sIFsxLCAxLCAxLCAwLCAwLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDAsIDAsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFswLCAwLCAwLCAwLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDAsIDAsIDAsIDBdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFsxLCAxLCAxLCAwLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMCwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMCwgMF0sIFsxLCAxLCAwLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMCwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFswLCAwLCAxLCAxLCAxLCAwLCAwLCAwXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDAsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFswLCAxLCAxLCAxLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDAsIDEsIDAsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMSwgMF0sIFswLCAwLCAxLCAwLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDAsIDEsIDAsIDBdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMSwgMV1dXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgbmVpZ2hib3JPbmVzID0gbmVpZ2hib3JzLmZpbHRlcihmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uc3RhdGUgPT0gMTtcbiAgICAgICAgICAgICAgICB9KS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLnN0YXRlID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3JPbmVzID09IDMgfHwgbmVpZ2hib3JPbmVzID09IDUgfHwgbmVpZ2hib3JPbmVzID09IDcpIFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3JPbmVzID09IDAgfHwgbmVpZ2hib3JPbmVzID09IDEgfHwgbmVpZ2hib3JPbmVzID09IDIgfHwgbmVpZ2hib3JPbmVzID09IDYgfHwgbmVpZ2hib3JPbmVzID09IDgpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5uZXdTdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIC8vIEluaXQgXG5cbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gdXNlIGEgc2VlZFxuICAgICAgICAgICAgaWYoY2hvaWNlIDwgMC41KXtcbiAgICAgICAgICAgICAgICBsZXQgc2VlZDtcbiAgICAgICAgICAgICAgICAvLyAyNSUgY2hhbmNlIHRvIHVzZSBhIHJhbmRvbSBzZWVkXG4gICAgICAgICAgICAgICAgaWYoY2hvaWNlIDwgMC4yNSkge1xuICAgICAgICAgICAgICAgICAgICBzZWVkID0gc2VlZExpc3RbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2VlZExpc3QubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIDI1JSBjaGFuY2UgdG8gdXNlIHRoZSBXb2xmcmFtIHNlZWRcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VlZCA9IHNlZWRMaXN0WzBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBtaW5YID0gTWF0aC5mbG9vcih3aWR0aCAvIDIpIC0gTWF0aC5mbG9vcihzZWVkWzBdLmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgICAgIGxldCBtYXhYID0gTWF0aC5mbG9vcih3aWR0aCAvIDIpICsgTWF0aC5mbG9vcihzZWVkWzBdLmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgICAgIGxldCBtaW5ZID0gTWF0aC5mbG9vcihoZWlnaHQgLyAyKSAtIE1hdGguZmxvb3Ioc2VlZC5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICBsZXQgbWF4WSA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gMikgKyBNYXRoLmZsb29yKHNlZWQubGVuZ3RoIC8gMik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjZWxsIGlzIGluc2lkZSBvZiB0aGUgc2VlZCBhcnJheSAoY2VudGVyZWQgaW4gdGhlIHdvcmxkKSwgdGhlbiB1c2UgaXRzIHZhbHVlXG4gICAgICAgICAgICAgICAgaWYgKHggPj0gbWluWCAmJiB4IDwgbWF4WCAmJiB5ID49IG1pblkgJiYgeSA8IG1heFkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHNlZWRbeSAtIG1pblldW3ggLSBtaW5YXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBpbml0aWFsaXplIHdpdGggbm9pc2VcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBNYXRoLnJhbmRvbSgpIDwgMC4xNSA/IDEgOiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICB7IG5hbWU6ICdsaXZpbmcnLCBkaXN0cmlidXRpb246IDEwMCB9LFxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNpbXVsYXRlcyBhIEJlbG91c292LVpoYWJvdGluc2t5IHJlYWN0aW9uIChhcHByb3hpbWF0ZWx5KS5cbiAgICAgKiBUaGlzIG9uZSdzIHN0aWxsIGEgbGl0dGxlIG1lc3NlZCB1cCwgc28gY29uc2lkZXIgaXQgZXhwZXJpbWVudGFsLlxuICAgICAqIFxuICAgICAqIFJlc291cmNlczpcbiAgICAgKiBodHRwOi8vY2NsLm5vcnRod2VzdGVybi5lZHUvbmV0bG9nby9tb2RlbHMvQi1aUmVhY3Rpb25cbiAgICAgKiBodHRwOi8vd3d3LmZyYWN0YWxkZXNpZ24ubmV0L2F1dG9tYXRhYWxnb3JpdGhtLmFzcHhcbiAgICAgKi9cbiAgICBCZWxvdXNvdlpoYWJvdGluc2t5OiBmdW5jdGlvbih3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIGxldCB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHdyYXA6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gT3ZlcnJpZGUgZnJhbWUgZnJlcXVlbmN5IGZvciB0aGlzIHNldHVwXG4gICAgICAgIHdvcmxkLnJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3kgPSAxMDtcblxuICAgICAgICAvLyBDb25maWcgbGV0aWFibGVzXG4gICAgICAgIGxldCBrZXJuZWwgPSBbIC8vIHdlaWdodHMgZm9yIG5laWdoYm9ycy4gRmlyc3QgaW5kZXggaXMgZm9yIHNlbGYgd2VpZ2h0XG4gICAgICAgICAwLCAxLCAxLCAxLFxuICAgICAgICAgICAgMSwgICAgMSxcbiAgICAgICAgICAgIDEsIDEsIDFcbiAgICAgICAgXS5yZXZlcnNlKCk7XG4gICAgICAgIGxldCBrMSA9IDU7IC8vIExvd2VyIGdpdmVzIGhpZ2hlciB0ZW5kZW5jeSBmb3IgYSBjZWxsIHRvIGJlIHNpY2tlbmVkIGJ5IGlsbCBuZWlnaGJvcnNcbiAgICAgICAgbGV0IGsyID0gMTsgLy8gTG93ZXIgZ2l2ZXMgaGlnaGVyIHRlbmRlbmN5IGZvciBhIGNlbGwgdG8gYmUgc2lja2VuZWQgYnkgaW5mZWN0ZWQgbmVpZ2hib3JzXG4gICAgICAgIGxldCBnID0gNTtcbiAgICAgICAgbGV0IG51bVN0YXRlcyA9IDI1NTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU3RhdGVzOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBncmF5ID0gTWF0aC5mbG9vcigoMjU1IC8gbnVtU3RhdGVzKSAqIGkpO1xuICAgICAgICAgICAgd29ybGQucGFsZXR0ZS5wdXNoKFtncmF5LCBncmF5LCBncmF5LCAyNTVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2J6Jywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgbGV0IGhlYWx0aHkgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBpbmZlY3RlZCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IGlsbCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IHN1bVN0YXRlcyA9IHRoaXMuc3RhdGU7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGggKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5laWdoYm9yO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSA4KSBuZWlnaGJvciA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL2lmKG5laWdoYm9yICE9PSBudWxsICYmIG5laWdoYm9yLnN0YXRlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bVN0YXRlcyArPSBuZWlnaGJvci5zdGF0ZSAqIGtlcm5lbFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGtlcm5lbFtpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihuZWlnaGJvci5zdGF0ZSA9PSAwKSBoZWFsdGh5ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZihuZWlnaGJvci5zdGF0ZSA8IChudW1TdGF0ZXMgLSAxKSkgaW5mZWN0ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlsbCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLnN0YXRlID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IChpbmZlY3RlZCAvIGsxKSArIChpbGwgLyBrMik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlIDwgKG51bVN0YXRlcykgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAoc3VtU3RhdGVzIC8gaW5mZWN0ZWQgKyBpbGwgKyAxKSArIGc7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5uZXdTdGF0ZSA9IChzdW1TdGF0ZXMgLyA5KSArIGc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRvIHNldCBzdGF0ZSB0byBuZXdzdGF0ZSBpbiBhIHNlY29uZCBwYXNzXG4gICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKG51bVN0YXRlcyAtIDEsIE1hdGguZmxvb3IodGhpcy5uZXdTdGF0ZSkpKTtcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMubmV3U3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIEluaXRcbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIGEgcmFuZG9tIHN0YXRlXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gTWF0aC5yYW5kb20oKSA8IDEuMCA/IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG51bVN0YXRlcykgOiAwO1xuICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnYnonLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9XG5cbn1cblxuXG4vKipcbiAqIFNpbXVsYXRlcyBhIDFEIGF1dG9tYXRhLlxuICogRXhwZWN0cyBhIHByb3BlcnR5IGBydWxlYCBpbiBgb3B0aW9uc2AsIHdoaWNoIGlzIHRoZSBpbnRlZ2VyIHJ1bGUgb2YgdGhlIENBLlxuICogXG4gKiBOb3QgdG90YWxseSBjb3JyZWN0IHlldCFcbiAqIFxuICovXG5mdW5jdGlvbiBFbGVtZW50YXJ5KG9wdGlvbnMpIHtcbiAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQob3B0aW9ucyk7XG5cbiAgICBsZXQgcnVsZSA9IChvcHRpb25zLnJ1bGUgPj4+IDApLnRvU3RyaW5nKDIpO1xuICAgIHdoaWxlKHJ1bGUubGVuZ3RoIDwgOCkge1xuICAgICAgICBydWxlID0gXCIwXCIgKyBydWxlO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKG9wdGlvbnMucnVsZSk7XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzUnVsZShsZWZ0QWxpdmUsIGNlbnRlckFsaXZlLCByaWdodEFsaXZlKSB7XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGlmKHJpZ2h0QWxpdmUpIGluZGV4ICs9IDE7XG4gICAgICAgIGlmKGNlbnRlckFsaXZlKSBpbmRleCArPSAyO1xuICAgICAgICBpZihsZWZ0QWxpdmUpIGluZGV4ICs9IDQ7XG4gICAgICAgIHJldHVybiBydWxlW3J1bGUubGVuZ3RoIC0gMSAtIGluZGV4XTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gdGVzdFJ1bGUoKSB7XG4gICAgICAgIGxldCBsYXN0SW5kZXggPSBydWxlLmxlbmd0aCAtIDE7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCA4OyBpKyspIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgaSB0byBiaW5hcnkgYW5kIHVzZSBpdCB0byBmZWVkIHByb2Nlc3NSdWxlXG4gICAgICAgICAgICBsZXQgYmluID0gKChsYXN0SW5kZXggLSBpKSA+Pj4gMCkudG9TdHJpbmcoMik7XG4gICAgICAgICAgICB3aGlsZShiaW4ubGVuZ3RoIDwgMykgYmluID0gXCIwXCIgKyBiaW47XG4gICAgICAgICAgICBsZXQgcnVsZU91dCA9IHByb2Nlc3NSdWxlKGJpblswXSA9PSBcIjFcIiwgYmluWzFdID09IFwiMVwiLCBiaW5bMl0gPT0gXCIxXCIpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydChydWxlT3V0ID09IHJ1bGVbaV0sIGJpbiArIFwiIFwiICsgcnVsZVtpXSArIFwiIFwiICsgKHJ1bGVPdXQgPT0gcnVsZVtpXSkudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy90ZXN0UnVsZSgpO1xuXG4gICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWxpdmUgPyAwIDogMTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0V2FzQWxpdmUobmVpZ2hib3Ipe1xuICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZWlnaGJvci53YXNBbGl2ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElmIHRoZSBjZWxsIGlzbid0IGFjdGl2ZSB5ZXQsIGRldGVybWluZSBpdHMgc3RhdGUgYmFzZWQgb24gaXRzIHVwcGVyIG5laWdoYm9yc1xuICAgICAgICAgICAgaWYoIXRoaXMud2FzQWxpdmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFsaXZlID0gcHJvY2Vzc1J1bGUoZ2V0V2FzQWxpdmUobmVpZ2hib3JzWzBdKSwgZ2V0V2FzQWxpdmUobmVpZ2hib3JzWzFdKSwgZ2V0V2FzQWxpdmUobmVpZ2hib3JzWzJdKSkgPT0gXCIxXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLndhc0FsaXZlID0gdGhpcy5hbGl2ZTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIC8vIEluaXRcbiAgICAgICAgdGhpcy5hbGl2ZSA9ICh4ID09IE1hdGguZmxvb3Iob3B0aW9ucy53aWR0aCAvIDIpKSAmJiAoeSA9PSAxKTtcbiAgICAgICAgLy90aGlzLmFsaXZlID0gTWF0aC5yYW5kb20oKSA8IDAuMDE7XG4gICAgICAgIC8vdGhpcy53YXNBbGl2ZSA9IHRoaXMuYWxpdmU7XG4gICAgfSk7XG5cbiAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgIF0pO1xuXG4gICAgcmV0dXJuIHdvcmxkO1xufVxuXG4vKipcbiAqIFNpbXVsYXRlcyBhIExpZmUtbGlrZSBhdXRvbWF0YS4gVXNlcyBCL1Mgbm90YXRpb24uXG4gKiBTZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGlmZS1saWtlX2NlbGx1bGFyX2F1dG9tYXRvblxuICogXG4gKiBFeHBlY3RzIHR3byBhZGRpdGlvbmFsIHByb3BlcnRpZXMgaW4gYG9wdGlvbnNgOlxuICogYEJgOiBBbiBhcnJheSBvZiBpbnRzIHJlcHJlc2VudGluZyB0aGUgQiBjb21wb25lbnQgb2YgdGhlIHJ1bGVcbiAqIGBTYDogQW4gYXJyYXkgb2YgaW50cyByZXByZXNlbnRpbmcgdGhlIFMgY29tcG9uZW50IG9mIHRoZSBydWxlXG4gKi9cbmZ1bmN0aW9uIExpZmVMaWtlKG9wdGlvbnMsIGRpc3RyaWJ1dGlvbkZ1bmMpIHtcbiAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQob3B0aW9ucyk7XG5cbiAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdsaXZpbmcnLCB7XG4gICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hbGl2ZSA/IDAgOiAxO1xuICAgICAgICB9LFxuICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICBsZXQgc3Vycm91bmRpbmcgPSB0aGlzLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZShuZWlnaGJvcnMsICd3YXNBbGl2ZScpO1xuICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IG9wdGlvbnMuQi5pbmNsdWRlcyhzdXJyb3VuZGluZykgfHwgb3B0aW9ucy5TLmluY2x1ZGVzKHN1cnJvdW5kaW5nKSAmJiB0aGlzLmFsaXZlO1xuICAgICAgICB9LFxuICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53YXNBbGl2ZSA9IHRoaXMuYWxpdmU7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAvLyBJbml0XG4gICAgICAgIGlmKGRpc3RyaWJ1dGlvbkZ1bmMpXG4gICAgICAgICAgICB0aGlzLmFsaXZlID0gZGlzdHJpYnV0aW9uRnVuYyh4LCB5KTtcbiAgICAgICAgZWxzZSAgIFxuICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IE1hdGgucmFuZG9tKCkgPCAwLjU7XG4gICAgfSk7XG5cbiAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgIF0pO1xuXG4gICAgcmV0dXJuIHdvcmxkO1xufSJdfQ==
