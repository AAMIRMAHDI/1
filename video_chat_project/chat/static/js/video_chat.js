document.addEventListener('DOMContentLoaded', () => {
      const localVideo = document.getElementById('localVideo');
      const remoteVideo = document.getElementById('remoteVideo');
      const startCallButton = document.getElementById('startCall');
      const hangUpButton = document.getElementById('hangUp');

      if (!startCallButton || !hangUpButton) {
          console.error('Buttons not found in DOM');
          return;
      }

      let localStream;
      let peerConnection;
      const socket = new WebSocket('ws://' + window.location.host + '/ws/video_chat/');

      const configuration = {
          iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
          ]
      };

      socket.onopen = () => {
          console.log('WebSocket connected successfully');
      };

      socket.onerror = (error) => {
          console.error('WebSocket error:', error);
      };

      socket.onmessage = async (event) => {
          try {
              const message = JSON.parse(event.data);
              if (message.offer) {
                  peerConnection = new RTCPeerConnection(configuration);
                  peerConnection.ontrack = (event) => {
                      console.log('Received remote stream');
                      remoteVideo.srcObject = event.streams[0];
                  };
                  peerConnection.onicecandidate = (event) => {
                      if (event.candidate) {
                          socket.send(JSON.stringify({ candidate: event.candidate }));
                      }
                  };
                  await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
                  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
                  const answer = await peerConnection.createAnswer();
                  await peerConnection.setLocalDescription(answer);
                  socket.send(JSON.stringify({ answer }));
              } else if (message.answer) {
                  await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
              } else if (message.candidate) {
                  await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
              }
          } catch (error) {
              console.error('Error handling WebSocket message:', error);
          }
      };

      startCallButton.onclick = async () => {
          try {
              localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              localVideo.srcObject = localStream;
              console.log('Local stream obtained');

              peerConnection = new RTCPeerConnection(configuration);
              localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

              peerConnection.ontrack = (event) => {
                  console.log('Received remote stream');
                  remoteVideo.srcObject = event.streams[0];
              };
              peerConnection.onicecandidate = (event) => {
                  if (event.candidate) {
                      socket.send(JSON.stringify({ candidate: event.candidate }));
                  }
              };

              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);
              socket.send(JSON.stringify({ offer }));

              startCallButton.disabled = true;
              hangUpButton.disabled = false;
          } catch (error) {
              console.error('Error starting call:', error);
              alert('خطا در دسترسی به دوربین یا میکروفون. لطفاً دسترسی را مجاز کنید.');
          }
      };

      hangUpButton.onclick = () => {
          if (peerConnection) {
              peerConnection.close();
              peerConnection = null;
          }
          if (localStream) {
              localStream.getTracks().forEach(track => track.stop());
              localStream = null;
          }
          localVideo.srcObject = null;
          remoteVideo.srcObject = null;
          startCallButton.disabled = false;
          hangUpButton.disabled = true;
          console.log('Call ended');
      };
  });