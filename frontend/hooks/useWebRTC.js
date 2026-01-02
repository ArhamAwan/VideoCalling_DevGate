import { useRef, useCallback } from 'react';

export function useWebRTC(socket, localStream, setIsConnecting) {
  const peersRef = useRef(new Map());
  const videoContainerRef = useRef(null);
  
  // Expose ref setter
  const setVideoContainerRef = useCallback((ref) => {
    videoContainerRef.current = ref;
  }, []);

  const createPeerConnection = useCallback(async (userId, shouldCreateOffer) => {
    if (!localStream) return null;

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream tracks
    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    // Handle incoming stream
    peer.ontrack = (event) => {
      // Get stored user name if available
      const storedName = peersRef.current.get(`name-${userId}`);
      addVideoElement(userId, event.streams[0], storedName);
      updateVideoLayout();

      if (peersRef.current.size === 1) {
        setIsConnecting(false);
      }
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal', { candidate: event.candidate, to: userId });
      }
    };


    peersRef.current.set(userId, peer);

    // Create offer if this is the initiating side
    if (shouldCreateOffer) {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        if (socket) {
          socket.emit('signal', { offer, to: userId });
        }
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }

    return peer;
  }, [localStream, socket, setIsConnecting]);

  const addVideoElement = (userId, stream, userName = null) => {
    if (!videoContainerRef.current) return;

    // Remove existing video if it exists
    removeVideoElement(userId);

    const videoContainer = videoContainerRef.current;
    
    // Check if secondary videos wrapper exists, if not create it
    let secondaryWrapper = videoContainer.querySelector('.secondary-videos-wrapper');
    if (!secondaryWrapper) {
      secondaryWrapper = document.createElement('div');
      secondaryWrapper.className = 'secondary-videos-wrapper';
      videoContainer.appendChild(secondaryWrapper);
    }

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    videoWrapper.id = `wrapper-${userId}`;

    const video = document.createElement('video');
    video.id = `video-${userId}`;
    video.autoplay = true;
    video.playsinline = true;
    video.srcObject = stream;

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = userName || `User ${userId.substring(0, 8)}`;

    // Add mic status icon (placeholder - would need to track actual status)
    const micStatus = document.createElement('div');
    micStatus.className = 'mic-status';
    micStatus.textContent = '🎤';

    videoWrapper.appendChild(video);
    videoWrapper.appendChild(label);
    videoWrapper.appendChild(micStatus);
    secondaryWrapper.appendChild(videoWrapper);
  };

  const removeVideoElement = (userId) => {
    const wrapper = document.getElementById(`wrapper-${userId}`);
    if (wrapper) {
      wrapper.remove();
      
      // Remove secondary wrapper if empty
      if (videoContainerRef.current) {
        const secondaryWrapper = videoContainerRef.current.querySelector('.secondary-videos-wrapper');
        if (secondaryWrapper && secondaryWrapper.children.length === 0) {
          secondaryWrapper.remove();
        }
      }
    }
  };

  const updateVideoLayout = () => {
    // Layout is now handled by CSS with the secondary-videos-wrapper
    // No need for class-based layout management
  };

  const createPeer = useCallback((stream) => {
    if (!socket) return;

    const handleUserJoined = async (userId) => {
      await createPeerConnection(userId, true);
    };

    const handleRoomUsers = async (users) => {
      // users can be array of strings (old format) or array of objects { id, name }
      const userIds = Array.isArray(users) && users.length > 0 && typeof users[0] === 'object'
        ? users.map(u => u.id)
        : users;
      
      // Store user names for later use
      if (Array.isArray(users) && users.length > 0 && typeof users[0] === 'object') {
        users.forEach(({ id, name }) => {
          if (!peersRef.current.has(id)) {
            // Store name for when video element is created
            peersRef.current.set(`name-${id}`, name);
          }
        });
      }

      // If no other users, dismiss connecting overlay
      if (userIds.length === 0) {
        setIsConnecting(false);
        return;
      }

      for (const userId of userIds) {
        await createPeerConnection(userId, false);
      }
    };

    const handleUserLeft = (userId) => {
      if (peersRef.current.has(userId)) {
        peersRef.current.get(userId).close();
        peersRef.current.delete(userId);
        removeVideoElement(userId);
        updateVideoLayout();
      }
    };

    const handleSignal = async (data) => {
      const { from, offer, answer, candidate } = data;

      if (!peersRef.current.has(from)) {
        await createPeerConnection(from, false);
      }

      const peer = peersRef.current.get(from);

      try {
        if (offer) {
          await peer.setRemoteDescription(offer);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('signal', { answer, to: from });
        }

        if (answer) {
          await peer.setRemoteDescription(answer);
        }

        if (candidate) {
          await peer.addIceCandidate(candidate);
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    };

    // Set up event listeners
    socket.on('user-joined', handleUserJoined);
    socket.on('room-users', handleRoomUsers);
    socket.on('user-left', handleUserLeft);
    socket.on('signal', handleSignal);

    // Return cleanup function
    return () => {
      if (socket) {
        socket.off('user-joined', handleUserJoined);
        socket.off('room-users', handleRoomUsers);
        socket.off('user-left', handleUserLeft);
        socket.off('signal', handleSignal);
      }
    };
  }, [socket, createPeerConnection]);

  return {
    createPeer,
    setVideoContainerRef,
  };
}

