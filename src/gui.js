import { Worlds } from "./worlds.js";
let guify = require("guify");

class GUI {

    Init(dust, container){

        this.panel = new guify.GUI({
            title: "Dust", 
            theme: "dark", 
            root: container,
            width: 350,
            barMode: "above",
            align: "right",
            opacity: "0.95",
            useMenuBar: true
        }, []);

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