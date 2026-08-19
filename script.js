(() => {

  /* ================================
     SPOTIFY CONFIG
  ================================= */

  const CLIENT_ID = "4ecf3c792b244381bef1eb73f5c78055";

  const REDIRECT_URI =
    "https://abdullah-zx.github.io/music-player/";

  const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-modify-playback-state"
  ];


  /* ================================
     DOM
  ================================= */

  const loginScreen =
    document.getElementById("loginScreen");

  const playerApp =
    document.getElementById("playerApp");

  const loginBtn =
    document.getElementById("loginBtn");

  const loginStatus =
    document.getElementById("loginStatus");

  const playBtn =
    document.getElementById("playBtn");

  const playIcon =
    document.getElementById("playIcon");

  const prevBtn =
    document.getElementById("prevBtn");

  const nextBtn =
    document.getElementById("nextBtn");

  const shuffleBtn =
    document.getElementById("shuffleBtn");

  const repeatBtn =
    document.getElementById("repeatBtn");

  const barsEl =
    document.getElementById("bars");

  const curTimeEl =
    document.getElementById("curTime");

  const durTimeEl =
    document.getElementById("durTime");

  const nowTitle =
    document.getElementById("nowTitle");

  const nowArtist =
    document.getElementById("nowArtist");

  const statusLine =
    document.getElementById("statusLine");

  const platter =
    document.getElementById("platter");

  const tonearm =
    document.getElementById("tonearm");

  const viz =
    document.getElementById("viz");

  const volumeInput =
    document.getElementById("volume");

  const playlistEl =
    document.getElementById("playlist");

  const playlistCount =
    document.getElementById("playlistCount");

  const searchInput =
    document.getElementById("searchInput");

  const searchBtn =
    document.getElementById("searchBtn");

  const searchResults =
    document.getElementById("searchResults");


  /* ================================
     VARIABLES
  ================================= */

  const BAR_COUNT = 48;

  let accessToken = null;

  let player = null;

  let deviceId = null;

  let currentTrack = null;

  let isPlaying = false;

  let shuffle = false;

  let repeat = false;


  /* ================================
     PKCE
  ================================= */

  function randomString(length = 64) {

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    const randomValues =
      crypto.getRandomValues(
        new Uint8Array(length)
      );

    randomValues.forEach(value => {
      result += chars[value % chars.length];
    });

    return result;
  }


  async function sha256(plain) {

    const encoder =
      new TextEncoder();

    const data =
      encoder.encode(plain);

    return window.crypto.subtle.digest(
      "SHA-256",
      data
    );
  }


  function base64urlencode(input) {

    return btoa(
      String.fromCharCode(...new Uint8Array(input))
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }


  async function createChallenge(verifier) {

    const hashed =
      await sha256(verifier);

    return base64urlencode(hashed);
  }


  /* ================================
     LOGIN
  ================================= */

  async function login() {

    const verifier =
      randomString(64);

    const challenge =
      await createChallenge(verifier);

    localStorage.setItem(
      "spotify_verifier",
      verifier
    );

    const params =
      new URLSearchParams({

        client_id: CLIENT_ID,

        response_type: "code",

        redirect_uri: REDIRECT_URI,

        code_challenge_method: "S256",

        code_challenge: challenge,

        scope: SCOPES.join(" ")

      });


    window.location.href =
      "https://accounts.spotify.com/authorize?" +
      params.toString();

  }


  loginBtn.addEventListener(
    "click",
    login
  );


  /* ================================
     GET ACCESS TOKEN
  ================================= */

  async function handleCallback() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const code =
      params.get("code");

    const error =
      params.get("error");


    if (error) {

      loginStatus.textContent =
        "Spotify login was cancelled.";

      return false;

    }


    if (!code) {

      return false;

    }


    const verifier =
      localStorage.getItem(
        "spotify_verifier"
      );


    if (!verifier) {

      loginStatus.textContent =
        "Login session expired. Please login again.";

      return false;

    }


    try {

      const response =
        await fetch(
          "https://accounts.spotify.com/api/token",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded"
            },

            body:
              new URLSearchParams({

                client_id:
                  CLIENT_ID,

                grant_type:
                  "authorization_code",

                code:
                  code,

                redirect_uri:
                  REDIRECT_URI,

                code_verifier:
                  verifier

              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(data);

        throw new Error(
          "Token request failed"
        );

      }


      accessToken =
        data.access_token;


      localStorage.removeItem(
        "spotify_verifier"
      );


      window.history.replaceState(
        {},
        document.title,
        REDIRECT_URI
      );


      return true;

    } catch (error) {

      console.error(error);

      loginStatus.textContent =
        "Spotify authentication failed.";

      return false;

    }

  }


  /* ================================
     SPOTIFY PLAYER
  ================================= */

  window.onSpotifyWebPlaybackSDKReady =
    () => {

      if (!accessToken) {
        return;
      }


      player =
        new Spotify.Player({

          name:
            "Late Groove",

          volume:
            Number(volumeInput.value) / 100,

          getOAuthToken: callback => {

            callback(accessToken);

          },

          enableMediaSession: true

        });


      /* READY */

      player.addListener(
  "ready",
  async ({ device_id }) => {

    deviceId = device_id;

    console.log("Spotify Device Ready:", device_id);

    statusLine.textContent =
      "Spotify Connected";

    nowArtist.textContent =
      "Ready to play";

    try {

      const response = await fetch(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            device_ids: [device_id],
            play: false
          })
        }
      );

      if (!response.ok) {

        const error =
          await response.json();

        console.error(
          "Transfer error:",
          error
        );

        statusLine.textContent =
          "Spotify device transfer failed.";

        return;
      }

      statusLine.textContent =
        "Spotify Ready";

      console.log(
        "Playback transferred to Late Groove"
      );

    } catch (error) {

      console.error(error);

    }

  }
);


      /* NOT READY */

      player.addListener(
        "not_ready",
        ({ device_id }) => {

          console.log(
            "Device offline:",
            device_id
          );

          statusLine.textContent =
            "Spotify device offline";

        }
      );


      /* PLAYER STATE */

      player.addListener(
        "player_state_changed",
        state => {

          if (!state) {
            return;
          }


          const track =
            state.track_window.current_track;


          currentTrack =
            track;


          isPlaying =
            !state.paused;


          updateTrackInfo(track);

          updatePlaybackState(state);

        }
      );


      /* ERRORS */

      player.addListener(
        "initialization_error",
        ({ message }) => {

          console.error(
            "Initialization:",
            message
          );

        }
      );


      player.addListener(
        "authentication_error",
        ({ message }) => {

          console.error(
            "Authentication:",
            message
          );

          statusLine.textContent =
            "Spotify authentication error.";

        }
      );


      player.addListener(
        "account_error",
        ({ message }) => {

          console.error(
            "Account:",
            message
          );

          statusLine.textContent =
            "Spotify Premium is required.";

        }
      );


      player.addListener(
        "playback_error",
        ({ message }) => {

          console.error(
            "Playback:",
            message
          );

          statusLine.textContent =
            "Playback error.";

        }
      );


      player.addListener(
        "autoplay_failed",
        () => {

          console.log(
            "Autoplay blocked by browser."
          );

        }
      );


      
    player.connect().then(success => {

  if (success) {
    console.log("Spotify SDK connected successfully");
    statusLine.textContent = "Spotify Connected";
  } else {
    console.error("Spotify SDK connection failed");
    statusLine.textContent = "Spotify connection failed";
  }

});

    };


  /* ================================
     TRACK INFO
  ================================= */

  function updateTrackInfo(track) {

    if (!track) {
      return;
    }


    nowTitle.textContent =
      track.name;


    nowArtist.textContent =
      track.artists
        .map(artist => artist.name)
        .join(", ");


    if (track.album?.images?.length) {

      const image =
        track.album.images[0].url;

      document.body.style.setProperty(
        "--album-art",
        `url("${image}")`
      );

    }

  }


  /* ================================
     PLAYBACK STATE
  ================================= */

  function updatePlaybackState(state) {

    const position =
      state.position;

    const duration =
      state.duration;


    curTimeEl.textContent =
      formatTime(position);


    durTimeEl.textContent =
      formatTime(duration);


    const ratio =
      duration
        ? position / duration
        : 0;


    const filled =
      Math.round(
        ratio * BAR_COUNT
      );


    barEls.forEach(
      (bar, index) => {

        bar.classList.toggle(
          "fill",
          index < filled
        );

      }
    );


    if (isPlaying) {

      playIcon.innerHTML =
        '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

      platter.classList.add(
        "spinning"
      );

      tonearm.classList.add(
        "playing"
      );

      viz.classList.add(
        "on"
      );

      playBtn.title =
        "Pause";

      statusLine.textContent =
        "Playing on Late Groove";

    } else {

      playIcon.innerHTML =
        '<path d="M8 5v14l11-7z"/>';

      platter.classList.remove(
        "spinning"
      );

      tonearm.classList.remove(
        "playing"
      );

      viz.classList.remove(
        "on"
      );

      playBtn.title =
        "Play";

      statusLine.textContent =
        "Paused";

    }

  }


  /* ================================
     TIME
  ================================= */

  function formatTime(ms) {

    const seconds =
      Math.floor(ms / 1000);

    const minutes =
      Math.floor(seconds / 60);

    const remaining =
      String(seconds % 60)
        .padStart(2, "0");


    return `${minutes}:${remaining}`;

  }


  /* ================================
     SEEK BARS
  ================================= */

  for (
    let i = 0;
    i < BAR_COUNT;
    i++
  ) {

    const bar =
      document.createElement("div");

    bar.className =
      "bar";

    barsEl.appendChild(bar);

  }


  const barEls =
    Array.from(
      barsEl.children
    );


  /* ================================
     PLAY / PAUSE
  ================================= */

  playBtn.addEventListener(
    "click",
    async () => {

      if (!player) {
        return;
      }


      await player.togglePlay();

    }
  );


  /* ================================
     NEXT
  ================================= */

  nextBtn.addEventListener(
    "click",
    async () => {

      if (!player) {
        return;
      }


      await player.nextTrack();

    }
  );


  /* ================================
     PREVIOUS
  ================================= */

  prevBtn.addEventListener(
    "click",
    async () => {

      if (!player) {
        return;
      }


      await player.previousTrack();

    }
  );


  /* ================================
     VOLUME
  ================================= */

  volumeInput.addEventListener(
    "input",
    () => {

      if (!player) {
        return;
      }


      player.setVolume(
        Number(volumeInput.value) / 100
      );

    }
  );


  /* ================================
     SHUFFLE
  ================================= */

  shuffleBtn.addEventListener(
    "click",
    async () => {

      shuffle =
        !shuffle;


      shuffleBtn.classList.toggle(
        "active",
        shuffle
      );


      if (!accessToken) {
        return;
      }


      await fetch(
        "https://api.spotify.com/v1/me/player/shuffle?state=" +
        shuffle,
        {

          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${accessToken}`
          }

        }
      );

    }
  );


  /* ================================
     REPEAT
  ================================= */

  repeatBtn.addEventListener(
    "click",
    async () => {

      repeat =
        !repeat;


      repeatBtn.classList.toggle(
        "active",
        repeat
      );


      if (!accessToken) {
        return;
      }


      await fetch(
        "https://api.spotify.com/v1/me/player/repeat?state=" +
        (repeat ? "track" : "off"),
        {

          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${accessToken}`
          }

        }
      );

    }
  );


  /* ================================
     SEARCH SPOTIFY
  ================================= */

  searchBtn.addEventListener(
    "click",
    searchSpotify
  );


  searchInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        searchSpotify();

      }

    }
  );


  async function searchSpotify() {

    const query =
      searchInput.value.trim();


    if (!query || !accessToken) {
      return;
    }


    searchResults.innerHTML =
      "<p>Searching...</p>";


    try {

      const response =
        await fetch(
          "https://api.spotify.com/v1/search?" +
          new URLSearchParams({

            q: query,

            type: "track",

            limit: "10"

          }),
          {

            headers: {

              Authorization:
                `Bearer ${accessToken}`

            }

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error?.message ||
          "Search failed"
        );

      }


      renderSearchResults(
        data.tracks.items
      );


    } catch (error) {

      console.error(error);

      searchResults.innerHTML =
        "<p>Unable to search Spotify.</p>";

    }

  }


  /* ================================
     SEARCH RESULTS
  ================================= */

  function renderSearchResults(
    tracks
  ) {

    searchResults.innerHTML =
      "";


    if (!tracks.length) {

      searchResults.innerHTML =
        "<p>No tracks found.</p>";

      return;

    }


    tracks.forEach(
      track => {

        const item =
          document.createElement("div");

        item.className =
          "search-track";


        const image =
          track.album?.images?.[2]?.url ||
          track.album?.images?.[0]?.url ||
          "";


        item.innerHTML = `

          <img
            src="${image}"
            alt="${escapeHTML(track.name)}"
          >

          <div class="search-track-info">

            <strong>
              ${escapeHTML(track.name)}
            </strong>

            <span>
              ${escapeHTML(
                track.artists
                  .map(a => a.name)
                  .join(", ")
              )}
            </span>

          </div>

          <button>
            Play
          </button>

        `;


        item
          .querySelector("button")
          .addEventListener(
            "click",
            () => {

              playSpotifyTrack(
                track.uri
              );

            }
          );


        searchResults.appendChild(
          item
        );

      }
    );

  }


  /* ================================
     PLAY SPOTIFY TRACK
  ================================= */

  async function playSpotifyTrack(
    uri
  ) {

    if (!accessToken || !deviceId) {

      alert(
        "Spotify player is still connecting. Please wait a moment."
      );

      return;

    }


    try {

      const response =
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {

            method: "PUT",

            headers: {

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({

                uris: [uri]

              })

          }
        );


      if (!response.ok) {

        const error =
          await response.json();

        console.error(error);

        alert(
          error.error?.message ||
          "Unable to start playback."
        );

      }

    } catch (error) {

      console.error(error);

    }

  }


  /* ================================
     SEEK
  ================================= */

  barsEl.addEventListener(
    "click",
    event => {

      if (!player) {
        return;
      }


      const rect =
        barsEl.getBoundingClientRect();


      const ratio =
        Math.min(
          1,
          Math.max(
            0,
            (event.clientX - rect.left) /
            rect.width
          )
        );


      player.getCurrentState()
        .then(state => {

          if (!state) {
            return;
          }


          const position =
            state.duration * ratio;


          player.seek(
            position
          );

        });

    }
  );


  /* ================================
     KEYBOARD
  ================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.target.tagName === "INPUT"
      ) {
        return;
      }


      if (
        event.code === "Space"
      ) {

        event.preventDefault();

        player?.togglePlay();

      }


      if (
        event.shiftKey &&
        event.code === "ArrowRight"
      ) {

        player?.nextTrack();

      }


      if (
        event.shiftKey &&
        event.code === "ArrowLeft"
      ) {

        player?.previousTrack();

      }

    }
  );


  /* ================================
     HTML ESCAPE
  ================================= */

  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* ================================
     START
  ================================= */

  async function start() {

    const authenticated =
      await handleCallback();


    if (!authenticated && !accessToken) {

      loginScreen.style.display =
        "flex";

      playerApp.style.display =
        "none";

      return;

    }


    loginScreen.style.display =
      "none";

    playerApp.style.display =
      "grid";


    statusLine.textContent =
      "Connecting to Spotify...";

  }


  start();

})();