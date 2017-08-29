import { Worlds } from "./worlds.js";

class GUI {

    Init(dust, container){

        if(!guify) {
            console.log("Guify not found! Import it on your page to enable the GUI for this program.");
            return;
        }

        this.panel = new guify({
            title: "Dust", 
            theme: "dark", 
            root: container,
            width: 300,
            barMode: "above",
            align: "right",
            opacity: "0.95",
        });

        this.panel.Register({
            type: "range", label: "Frame Frequency",
            min: 1, max: 30, step: 1,
            object: dust.framecounter, property: "frameFrequency"
        });

        this.panel.Register({
            type: "select", label: "Preset",
            options: Object.getOwnPropertyNames(Worlds),
            object: dust.worldOptions, property: "name",
            onChange: () => dust.Setup()
        });

        this.panel.Register({
            type: "button", label: "Reset",
            action: () => dust.Setup()
        });

    }

}

export let gui = new GUI();