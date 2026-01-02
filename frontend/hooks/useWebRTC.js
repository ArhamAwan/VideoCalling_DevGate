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
      console.log(`Received track from ${userId}`, event, {
        streams: event.streams?.length,
        track: event.track,
        trackKind: event.track?.kind,
        trackId: event.track?.id
      });
      
      // Only process video tracks for video elements
      if (event.track && event.track.kind !== 'video') {
        console.log(`Skipping non-video track for ${userId}:`, event.track.kind);
        return;
      }
      
      // Get stored user name if available
      const storedName = peersRef.current.get(`name-${userId}`);
      
      // Use the stream from the event, or create one from the track
      let streamToUse = null;
      if (event.streams && event.streams.length > 0) {
        streamToUse = event.streams[0];
      } else if (event.track && event.track.kind === 'video') {
        // Create a new stream from the video track if no stream is provided
        streamToUse = new MediaStream([event.track]);
      }
      
      if (streamToUse && streamToUse.getVideoTracks().length > 0) {
        console.log(`✅ Video stream ready for ${userId}, calling addVideoElement`, {
          stream: streamToUse,
          videoTracks: streamToUse.getVideoTracks().length,
          audioTracks: streamToUse.getAudioTracks().length,
          userName: storedName
        });
        
        // Ensure container ref is set
        if (!videoContainerRef.current) {
          const container = document.querySelector('.videos-grid-container');
          if (container) {
            videoContainerRef.current = container;
            console.log('Found and set video container ref');
          }
        }
        
        // Small delay to ensure container is ready
        setTimeout(() => {
          addVideoElement(userId, streamToUse, storedName);
          updateVideoLayout();
        }, 100);
      } else {
        console.warn(`❌ No video stream available for ${userId}`, {
          hasStream: !!streamToUse,
          videoTracks: streamToUse?.getVideoTracks()?.length || 0
        });
      }

      // Dismiss connecting overlay when we receive any track
      setIsConnecting(false);
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal', { candidate: event.candidate, to: userId });
      }
    };

    // Track connection state changes
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected' || peer.connectionState === 'completed') {
        // Connection established, dismiss connecting overlay
        setIsConnecting(false);
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
    console.log(`addVideoElement called for ${userId}`, {
      hasRef: !!videoContainerRef.current,
      refValue: videoContainerRef.current,
      stream,
      userName,
      streamTracks: stream?.getTracks()?.length
    });
    
    if (!videoContainerRef.current) {
      console.error('Video container ref is not set');
      // Try to find the container manually
      const container = document.querySelector('.videos-grid-container');
      if (container) {
        console.log('Found container manually, updating ref');
        videoContainerRef.current = container;
      } else {
        console.error('Could not find videos-grid-container in DOM');
        return;
      }
    }

    // Remove existing video if it exists
    removeVideoElement(userId);

    const videoContainer = videoContainerRef.current;
    
    // Ensure it's the grid container
    if (!videoContainer.classList.contains('videos-grid-container')) {
      console.error('Video container is not a grid container', {
        element: videoContainer,
        classes: videoContainer.className,
        tagName: videoContainer.tagName
      });
      return;
    }
    
    console.log(`Adding video element for ${userId}`, { 
      userName, 
      stream, 
      hasTracks: stream.getTracks().length,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length
    });

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper grid-video';
    videoWrapper.id = `wrapper-${userId}`;
    
    // Ensure wrapper is visible and properly styled
    videoWrapper.style.position = 'relative';
    videoWrapper.style.width = '100%';
    videoWrapper.style.height = '100%';
    videoWrapper.style.minHeight = '200px';
    videoWrapper.style.display = 'block';

    const video = document.createElement('video');
    video.id = `video-${userId}`;
    video.setAttribute('autoplay', 'true');
    video.setAttribute('playsinline', 'true');
    video.srcObject = stream;
    
    // Explicitly play the video after setting srcObject
    video.addEventListener('loadedmetadata', () => {
      video.play().catch((err) => {
        console.error(`Error playing video for ${userId}:`, err);
      });
    });
    
    // Also try to play immediately
    video.play().catch((err) => {
      console.error(`Error playing video for ${userId} (immediate):`, err);
    });

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = userName || `User ${userId.substring(0, 8)}`;

    // Add mic status icon - default to unmuted (blue)
    // TODO: Track actual mic status from stream tracks
    const micStatus = document.createElement('div');
    micStatus.className = 'mic-status mic-unmuted';
    micStatus.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z" fill="currentColor"/>
      </svg>
    `;
    
    // Store mic status element for later updates
    peersRef.current.set(`mic-status-${userId}`, micStatus);

    videoWrapper.appendChild(video);
    videoWrapper.appendChild(label);
    videoWrapper.appendChild(micStatus);
    videoContainer.appendChild(videoWrapper);
    
    console.log(`✅ Added video element for user ${userId}`, { 
      userName, 
      stream,
      videoElement: video,
      wrapper: videoWrapper,
      container: videoContainer,
      containerChildren: videoContainer.children.length,
      wrapperInDOM: document.body.contains(videoWrapper)
    });
    
    // Ensure video is visible
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.display = 'block';
    
    // Force a reflow to ensure the element is rendered
    void videoWrapper.offsetHeight;
    
    // Try playing again after a short delay to ensure everything is set up
    setTimeout(() => {
      if (video.paused || video.readyState < 2) {
        video.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error(`Error playing video for ${userId} (delayed):`, err);
          }
        });
      }
    }, 200);
  };

  const removeVideoElement = (userId) => {
    const wrapper = document.getElementById(`wrapper-${userId}`);
    if (wrapper) {
      wrapper.remove();
    }
    // Clean up stored references
    peersRef.current.delete(`mic-status-${userId}`);
    peersRef.current.delete(`name-${userId}`);
  };

  // Function to update mic status indicator
  const updateMicStatus = useCallback((userId, isMuted) => {
    const micStatus = peersRef.current.get(`mic-status-${userId}`);
    if (micStatus) {
      if (isMuted) {
        micStatus.className = 'mic-status mic-muted';
        micStatus.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 11H17.3C17.2 11.3 17.1 11.6 17 12V14C17 15.1 16.1 16 15 16H9C7.9 16 7 15.1 7 14V12C7 11.6 6.9 11.3 6.8 11H5C4.4 11 4 11.4 4 12C4 12.6 4.4 13 5 13H19C19.6 13 20 12.6 20 12C20 11.4 19.6 11 19 11Z" fill="currentColor"/>
            <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z" fill="currentColor"/>
            <path d="M3.7 2.3L2.3 3.7L20.3 21.7L21.7 20.3L3.7 2.3Z" fill="currentColor"/>
          </svg>
        `;
      } else {
        micStatus.className = 'mic-status mic-unmuted';
        micStatus.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z" fill="currentColor"/>
          </svg>
        `;
      }
    }
  }, []);

  const updateVideoLayout = () => {
    // Layout is now handled by CSS with the participants-row-container
    // No need for class-based layout management
  };

  const createPeer = useCallback((stream) => {
    if (!socket) return;

    // Set a timeout to dismiss connecting overlay if stuck
    const connectingTimeout = setTimeout(() => {
      setIsConnecting(false);
    }, 5000); // 5 second timeout

    const handleUserJoined = async (payload) => {
      // Handle both old format (string) and new format (object)
      const userId = typeof payload === 'string' ? payload : (payload?.id || payload);
      const userName = typeof payload === 'object' ? payload?.name : null;
      
      console.log(`User joined event received:`, { payload, userId, userName });
      
      // Store user name if provided
      if (userName) {
        peersRef.current.set(`name-${userId}`, userName);
      }
      
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

      // If no other users, dismiss connecting overlay immediately
      if (userIds.length === 0) {
        setIsConnecting(false);
        return;
      }

      // Create peer connections for existing users
      for (const userId of userIds) {
        await createPeerConnection(userId, false);
      }

      // Dismiss connecting overlay after creating peer connections
      // Tracks will arrive asynchronously, but we've initiated the connections
      setTimeout(() => {
        setIsConnecting(false);
      }, 1000); // Short delay to allow connections to initialize
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
      clearTimeout(connectingTimeout);
      if (socket) {
        socket.off('user-joined', handleUserJoined);
        socket.off('room-users', handleRoomUsers);
        socket.off('user-left', handleUserLeft);
        socket.off('signal', handleSignal);
      }
    };
  }, [socket, createPeerConnection, setIsConnecting]);

  return {
    createPeer,
    setVideoContainerRef,
    updateMicStatus,
  };
}

