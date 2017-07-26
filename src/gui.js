import { Worlds } from "./worlds.js";

export class GUI {

    /**
     * Creates and attaches a GUI to the page if DAT.GUI is included.
     */
    static Init(dust){
        if(typeof(dat) === "undefined"){
            console.warn("No DAT.GUI instance found. Import on this page to use!");
            return;
        }

        var gui = new dat.GUI();

        gui.add(dust.framecounter, 'frameFrequency').min(1).max(30).step(1).listen();

        gui.add(dust.worldOptions, 'name', Object.getOwnPropertyNames(Worlds)).onChange(() => {
            dust.Setup();
        }).name("Preset");

        gui.add(dust, "Setup").name("Reset");
    }

}