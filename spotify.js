let spotifyPlayer;
let spotifyDeviceId = null;

window.onSpotifyWebPlaybackSDKReady = () => {
  const token = localStorage.getItem("spotify_access_token");

  if (!token) {
    console.log("Spotify login required.");
    return;
  }

  spotifyPlayer = new Spotify.Player({
    name: "Abdullah Music Player",
    getOAuthToken: callback => {
      callback(localStorage.getItem("spotify_access_token"));
    },
    volume: 0.7
  });

  spotifyPlayer.addListener("ready", ({ device_id }) => {
    spotifyDeviceId = device_id;

    console.log("Spotify Player Ready:", device_id);

    alert("Spotify Player Connected!");
  });

  spotifyPlayer.addListener("not_ready", ({ device_id }) => {
    console.log("Spotify device went offline:", device_id);
  });

  spotifyPlayer.addListener("player_state_changed", state => {
    if (!state) return;

    console.log("Current Spotify track:", state.track_window.current_track.name);
  });

  spotifyPlayer.addListener("initialization_error", ({ message }) => {
    console.error("Initialization error:", message);
  });

  spotifyPlayer.addListener("authentication_error", ({ message }) => {
    console.error("Authentication error:", message);
  });

  spotifyPlayer.addListener("account_error", ({ message }) => {
    console.error("Account error:", message);
  });

  spotifyPlayer.connect();
};