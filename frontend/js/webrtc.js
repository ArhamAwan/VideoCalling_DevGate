import { socket } from "./socket.js";

let peer;
let localStream;

export function createPeer(stream) {
  localStream = stream;

  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  stream.getTracks().forEach((track) => peer.addTrack(track, stream));

  peer.ontrack = (event) => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { candidate: event.candidate });
    }
  };

  socket.on("signal", async (data) => {
    if (data.offer) {
      await peer.setRemoteDescription(data.offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("signal", { answer });
    }

    if (data.answer) {
      await peer.setRemoteDescription(data.answer);
    }

    if (data.candidate) {
      await peer.addIceCandidate(data.candidate);
    }
  });

  return peer;
}

export async function makeOffer() {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("signal", { offer });
}
