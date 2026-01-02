import { socket } from "./socket.js";

let peers = new Map(); // Store multiple peer connections
let localStream;

export function createPeer(stream) {
  localStream = stream;

  // Listen for new users joining
  socket.on("user-joined", async (userId) => {
    console.log("User joined:", userId);
    await createPeerConnection(userId, true); // true = create offer
  });

  // Listen for existing users in room
  socket.on("room-users", async (userIds) => {
    console.log("Existing users in room:", userIds);
    for (const userId of userIds) {
      await createPeerConnection(userId, false); // false = wait for offer
    }
  });

  socket.on("user-left", (userId) => {
    console.log("User left:", userId);
    if (peers.has(userId)) {
      peers.get(userId).close();
      peers.delete(userId);
      removeVideoElement(userId);
      updateVideoLayout();
    }
  });

  socket.on("signal", async (data) => {
    const { from, offer, answer, candidate } = data;

    if (!peers.has(from)) {
      await createPeerConnection(from, false);
    }

    const peer = peers.get(from);

    try {
      if (offer) {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("signal", { answer, to: from });
      }

      if (answer) {
        await peer.setRemoteDescription(answer);
      }

      if (candidate) {
        await peer.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error("Error handling signal:", error);
    }
  });
}

async function createPeerConnection(userId, shouldCreateOffer) {
  const peer = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });

  // Add local stream tracks
  localStream.getTracks().forEach((track) => {
    peer.addTrack(track, localStream);
  });

  // Handle incoming stream
  peer.ontrack = (event) => {
    console.log("Received remote stream from:", userId);
    addVideoElement(userId, event.streams[0]);
    updateVideoLayout();

    // Hide connecting spinner when first connection is established
    if (peers.size === 0) {
      import("./ui.js").then((ui) => ui.hideConnecting());
    }
  };

  // Handle ICE candidates
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { candidate: event.candidate, to: userId });
    }
  };

  peer.onconnectionstatechange = () => {
    console.log(`Connection state with ${userId}:`, peer.connectionState);
  };

  peers.set(userId, peer);

  // Create offer if this is the initiating side
  if (shouldCreateOffer) {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("signal", { offer, to: userId });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  return peer;
}

function addVideoElement(userId, stream) {
  // Remove existing video if it exists
  removeVideoElement(userId);

  const videoContainer = document.getElementById("videoContainer");
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "video-wrapper";
  videoWrapper.id = `wrapper-${userId}`;

  const video = document.createElement("video");
  video.id = `video-${userId}`;
  video.autoplay = true;
  video.playsinline = true;
  video.srcObject = stream;

  const label = document.createElement("div");
  label.className = "video-label";
  label.textContent = `User ${userId.substring(0, 8)}`;

  videoWrapper.appendChild(video);
  videoWrapper.appendChild(label);
  videoContainer.appendChild(videoWrapper);
}

function removeVideoElement(userId) {
  const wrapper = document.getElementById(`wrapper-${userId}`);
  if (wrapper) {
    wrapper.remove();
  }
}

function updateVideoLayout() {
  const container = document.getElementById("videoContainer");
  const videoCount = container.children.length;

  // Remove all layout classes
  container.classList.remove(
    "one-video",
    "two-videos",
    "three-videos",
    "four-videos",
    "many-videos"
  );

  // Add appropriate class based on video count
  if (videoCount === 1) {
    container.classList.add("one-video");
  } else if (videoCount === 2) {
    container.classList.add("two-videos");
  } else if (videoCount === 3) {
    container.classList.add("three-videos");
  } else if (videoCount === 4) {
    container.classList.add("four-videos");
  } else {
    container.classList.add("many-videos");
  }
}

export async function makeOffer() {
  // This function is now handled automatically when users join
  console.log("Ready to accept connections");
}
