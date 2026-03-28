/**
 * Generates the HTML content for the WebView-based avatar player.
 * Uses livekit-client via CDN to connect to the LiveKit room and render the avatar video.
 * Communicates with React Native via postMessage.
 */
export function getAvatarWebViewHtml(livekitUrl: string, livekitToken: string, isMuted: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0F0F1A; overflow: hidden; }
    #container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
    video { width: 100%; height: 100%; object-fit: cover; background: #0F0F1A; }
    #overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #0F0F1A; gap: 12px; transition: opacity 0.3s;
    }
    #overlay.hidden { opacity: 0; pointer-events: none; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(91,79,233,0.3);
      border-top-color: #5B4FE9; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #status { color: #8888AA; font-size: 14px; font-family: -apple-system, sans-serif; }
    #error { display: none; color: #FF6B6B; font-size: 13px; font-family: -apple-system, sans-serif; text-align: center; padding: 20px; max-width: 280px; }
  </style>
</head>
<body>
  <div id="container">
    <video id="avatarVideo" autoplay playsinline ${isMuted ? "muted" : ""}></video>
    <div id="overlay">
      <div class="spinner"></div>
      <div id="status">Connecting to avatar...</div>
      <div id="error"></div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/livekit-client@2.5.7/dist/livekit-client.umd.min.js"></script>
  <script>
    var LIVEKIT_URL = ${JSON.stringify(livekitUrl)};
    var LIVEKIT_TOKEN = ${JSON.stringify(livekitToken)};
    var video = document.getElementById('avatarVideo');
    var overlay = document.getElementById('overlay');
    var statusEl = document.getElementById('status');
    var errorEl = document.getElementById('error');

    function postMsg(type, data) {
      try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, data))); } catch(e) {}
    }

    function showError(msg) {
      statusEl.style.display = 'none';
      errorEl.style.display = 'block';
      errorEl.textContent = msg;
      postMsg('error', { message: msg });
    }

    function connect() {
      try {
        var Room = LivekitClient.Room;
        var RoomEvent = LivekitClient.RoomEvent;
        var Track = LivekitClient.Track;

        var room = new Room({ adaptiveStream: true, dynacast: true });

        room.on(RoomEvent.Connected, function() {
          statusEl.textContent = 'Waiting for avatar...';
          postMsg('connected', {});
        });

        room.on(RoomEvent.Disconnected, function() {
          overlay.classList.remove('hidden');
          statusEl.textContent = 'Disconnected';
          postMsg('disconnected', {});
        });

        room.on(RoomEvent.TrackSubscribed, function(track, publication, participant) {
          if (track.kind === Track.Kind.Video) {
            track.attach(video);
            overlay.classList.add('hidden');
            postMsg('videoStarted', {});
          } else if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, function(track) {
          if (track.detach) track.detach();
        });

        room.connect(LIVEKIT_URL, LIVEKIT_TOKEN).catch(function(err) {
          showError(err.message || 'Failed to connect to avatar');
        });

      } catch(err) {
        showError(err.message || 'LiveKit initialization failed');
      }
    }

    window.addEventListener('message', function(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'mute') { video.muted = msg.muted; }
      } catch(e) {}
    });

    connect();
  </script>
</body>
</html>`;
}
