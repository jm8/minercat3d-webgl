document.getElementById("enterfullscreen")!.onclick = enterFullscreen;

export function enterFullscreen() {
  document.querySelector(".guiPlayer")!.classList.add("fullscreen");
  document.querySelector(".stage-wrapper_stage-wrapper_2bejr")!.classList.add("stage-wrapper_full-screen_2hjMb");
  document.querySelector(".stage-wrapper_stage-wrapper_2bejr > .box_box_2jjDp")!.innerHTML = `
    <div class="stage-header_stage-header-wrapper-overlay_5vfJa box_box_2jjDp">
      <div class="stage-header_stage-menu-wrapper_15JJt box_box_2jjDp" style="width: 960px;">
        <div class="controls_controls-container_2xinB"><img class="green-flag_green-flag_1kiAo"
          draggable="false" src="/greenflag.svg" title="Go"><img class="stop-all_stop-all_1Y8P9"
          draggable="false" src="/stop.svg" title="Stop"></div><span
        class="button_outlined-button_1bS__ stage-header_stage-button_hkl9B" role="button">
        <div class="button_content_3jdgj"><img alt="Exit full screen mode"
            class="stage-header_stage-button-icon_3zzFK" id="closefullscreen" draggable="false" src="/closefullscreen.svg"
            title="Full Screen Control">
        </div>
      </span>
    </div>
  `;
  (document.querySelector(".stage_stage_1fD7k")! as HTMLElement).style.width = "960px";
  (document.querySelector(".stage_stage_1fD7k")! as HTMLElement).style.height = "720px";
  (document.getElementById("canvas")! as HTMLElement).style.width = "960px";
  (document.getElementById("canvas")! as HTMLElement).style.height = "720px";
  (document.querySelector(".stage_stage-bottom-wrapper_KIBfo") as HTMLElement).style.width = "960";
  (document.querySelector(".stage_stage-bottom-wrapper_KIBfo") as HTMLElement).style.height = "720";
  (document.querySelector(".stage_stage-overlays_eE14L") as HTMLElement).classList.add("stage_full-screen_ZO7xi");
  document.getElementById("closefullscreen")!.onclick = closeFullscreen;
}


export function closeFullscreen() {
  document.querySelector(".guiPlayer")!.classList.remove("fullscreen");
  document.querySelector(".stage-wrapper_stage-wrapper_2bejr")!.classList.remove("stage-wrapper_full-screen_2hjMb");
  document.querySelector(".stage-wrapper_stage-wrapper_2bejr > .box_box_2jjDp")!.innerHTML = `
  <div class="stage-header_stage-header-wrapper_1F4gT box_box_2jjDp">
    <div class="stage-header_stage-menu-wrapper_15JJt box_box_2jjDp"
      style="padding-bottom: 0px; padding-top: 0px;">
      <!-- I don't know why but I had to add these width: 20px; height: 20px or else it to big -->
      <div class="controls_controls-container_2xinB"><img id="greenflag"
          class="green-flag_green-flag_1kiAo" draggable="false" src="/greenflag.svg" title="Go"
          ><img class="stop-all_stop-all_1Y8P9" draggable="false"
           src="/stop.svg" title="Stop" id="stop"></div>
      <div class="stage-header_stage-size-row_14N65">
        <div><span class="button_outlined-button_1bS__ stage-header_stage-button_hkl9B"
             id="enterfullscreen" role="button">
            <div class="button_content_3jdgj"><img alt="Enter full screen mode"
                class="stage-header_stage-button-icon_3zzFK" draggable="false"
                src="/fullscreen.svg" title="Full Screen Control">
            </div>
          </span></div>
      </div>
    </div>
  `;

  (document.querySelector(".stage_stage_1fD7k")! as HTMLElement).style.width = "480px";
  (document.querySelector(".stage_stage_1fD7k")! as HTMLElement).style.height = "360px";
  (document.getElementById("canvas")! as HTMLElement).style.width = "480px";
  (document.getElementById("canvas")! as HTMLElement).style.height = "360px";
  (document.querySelector(".stage_stage-bottom-wrapper_KIBfo") as HTMLElement).style.width = "480";
  (document.querySelector(".stage_stage-bottom-wrapper_KIBfo") as HTMLElement).style.height = "360";
  (document.querySelector(".stage_stage-overlays_eE14L") as HTMLElement).classList.remove("stage_full-screen_ZO7xi");
  
  document.getElementById("enterfullscreen")!.onclick = enterFullscreen;
}