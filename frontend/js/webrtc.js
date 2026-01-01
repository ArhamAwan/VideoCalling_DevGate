import { socket } from "./socket.js";

let peer;
let localStream;

export function createPeer(stream) {
  localStream = stream;

  peer = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });

  stream.getTracks().forEach((track) => peer.addTrack(track, stream));

  peer.ontrack = (event) => {
    console.log("Received remote stream");
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { candidate: event.candidate });
    }
  };

  peer.onconnectionstatechange = () => {
    console.log("Connection state:", peer.connectionState);
    if (peer.connectionState === "connected") {
      // Hide connecting spinner when connected
      import("./ui.js").then((ui) => ui.hideConnecting());
    }
  };

  socket.on("signal", async (data) => {
    try {
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
    } catch (error) {
      console.error("Error handling signal:", error);
    }
  });

  socket.on("user-joined", (userId) => {
    console.log("User joined:", userId);
  });

  socket.on("user-left", (userId) => {
    console.log("User left:", userId);
    // Clear remote video when user leaves
    document.getElementById("remoteVideo").srcObject = null;
  });

  return peer;
}

export async function makeOffer() {
  try {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("signal", { offer });
  } catch (error) {
    console.error("Error making offer:", error);
  }
}
