import * as CellAuto from "./vendor/cellauto.js";
import { Worlds } from "./worlds.js";

export class Dust {
    constructor(container, initFinishedCallback) {
        this.container = container;

        var worldNames = Object.keys(Worlds);
        this.worldOptions = {
            name: worldNames[worldNames.length * Math.random() << 0], // Random startup world
            //width: 128, // Can force a width/height here
            //height: 128
        }

        // Create the app and put its canvas into `container`
        this.app = new PIXI.Application(
            {
                antialias: false, 
                transparent: false, 
                resolution: 1
            }
        );
        this.container.appendChild(this.app.view);

        // Start the update loop
        this.app.ticker.add((delta) => {
            this.OnUpdate(delta);
        });

        this.framecounter = new FrameCounter(1, null);

        // Stop application and wait for setup to finish
        this.app.stop();

        // Load resources needed for the program to run
        PIXI.loader
            .add('fragShader', '../resources/dust.frag')
            .load((loader, res) => {
                // Loading has finished
                this.loadedResources = res;
                this.Setup();
                this.app.start();
                initFinishedCallback();
            });
    }

    /**
     * Reusable method for setting up the simulation from `this.worldOptions`.
     * Also works as a reset function if you call this without changing
     * `this.worldOptions.name` beforehand.
     */
    Setup() {

        // Create the world from the string
        try {
            this.world = Worlds[this.worldOptions.name].call(this, this.worldOptions.width, this.worldOptions.height);
        } catch (err) {
            throw "World with the name " + this.worldOptions.name + " does not exist!";
        }
        this.framecounter.frameFrequency = this.world.recommendedFrameFrequency || 1;

        this.app.renderer.resize(this.world.width, this.world.height);

        // Remove canvas filtering through css
        this.app.renderer.view.style.cssText = ` 
            image-rendering: optimizeSpeed; 
            image-rendering: -moz-crisp-edges; 
            image-rendering: -webkit-optimize-contrast; 
            image-rendering: optimize-contrast;
            image-rendering: -o-crisp-edges; 
            image-rendering: pixelated; 
            -ms-interpolation-mode: nearest-neighbor; 
        `;
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
        this.sprite = new PIXI.Sprite(
            new PIXI.Texture(this.baseTexture, new PIXI.Rectangle(0, 0, this.world.width, this.world.height))
        );

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
    OnUpdate(delta) {
        var noskip = this.framecounter.IncrementFrame();
        if(noskip) {
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
    UpdateTexture() {
        
        var index = 0;
        var ctx = this.textureCtx;		
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.textureCanvas.width, this.textureCanvas.height);
        var pix = ctx.createImageData(this.textureCanvas.width, this.textureCanvas.height);		
        for (var y = 0; y < this.textureCanvas.height; y++) {			
            for (var x = 0; x < this.textureCanvas.width; x++) {
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

}

/**
 * Convenience class for restricting the refresh rate of the simulation.
 */
class FrameCounter {
    constructor(frameFrequency, frameLimit = null) {
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
    IncrementFrame(){
        this.frameCount += 1;
        if(this.frameCount % this.frameFrequency == 0) {
            // If we've reached the frame limit
            if(this.frameLimit != null && this.passedFrames >= this.frameLimit)
                return false;

            this.frameCount = 0;
            this.passedFrames += 1;
            return true;
        }
        return false;
    }
}