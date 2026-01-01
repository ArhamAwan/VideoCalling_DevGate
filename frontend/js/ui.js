export function setupUI(stream) {
  const camBtn = document.getElementById("toggleCam");
  const micBtn = document.getElementById("toggleMic");

  camBtn.onclick = () => {
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    camBtn.textContent = videoTrack.enabled ? "Camera" : "Camera Off";
    camBtn.classList.toggle("off", !videoTrack.enabled);
  };

  micBtn.onclick = () => {
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    micBtn.textContent = audioTrack.enabled ? "Mic" : "Mic Muted";
    micBtn.classList.toggle("off", !audioTrack.enabled);
  };
}

export function showConnecting() {
  document.querySelector(".connecting").style.display = "flex";
}

export function hideConnecting() {
  document.querySelector(".connecting").style.display = "none";
}
