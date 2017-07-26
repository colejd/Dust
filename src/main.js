import { Detector } from "./utils/webgl-detect.js";
import { Dust } from "./dust.js";
import { GUI } from "./gui.js";

let container = document.getElementById("dust-container");

if ( !Detector.HasWebGL() ) {
    //exit("WebGL is not supported on this browser.");
    console.log("WebGL is not supported on this browser.");
    container.innerHTML = Detector.GetErrorHTML();
    container.classList.add("no-webgl");
}
else {
    let dust = new Dust(container, () => {
        // Dust is now fully loaded
        GUI.Init(dust);
    });
}