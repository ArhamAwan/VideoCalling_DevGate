import { startMedia } from "./media.js";
import { setupUI, showConnecting, hideConnecting } from "./ui.js";
import { joinRoom } from "./socket.js";
import { createPeer, makeOffer } from "./webrtc.js";

let stream;

async function init() {
  stream = await startMedia();
  setupUI(stream);

  document.getElementById("joinRoom").onclick = async () => {
    showConnecting();
    joinRoom("test-room");
    createPeer(stream);
    await makeOffer();
    // hideConnecting will be called when connection is established
  };
}

init();
