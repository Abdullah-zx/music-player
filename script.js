(() => {

  const CLIENT_ID = "4ecf3c792b244381bef1eb73f5c78055";
  const REDIRECT_URI = "https://abdullah-zx.github.io/music-player/";

  const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-modify-playback-state"
  ].join(" ");


  /* =========================
     DOM
  ========================= */

  const loginScreen = document.getElementById("loginScreen");
  const playerApp = document.getElementById("playerApp");
  const loginBtn = document.getElementById("loginBtn");
  const loginStatus = document.getElementById("loginStatus");

  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const shuffleBtn = document.getElementById("shuffleBtn");
  const repeatBtn = document.getElementById("repeatBtn");

  const barsEl = document.getElementById("bars");
  const curTimeEl = document.getElementById("curTime");
  const durTimeEl = document.getElementById("durTime");

  const nowTitle = document.getElementById("nowTitle");
  const nowArtist = document.getElementById("nowArtist");

  const statusLine = document.getElementById("statusLine");

  const platter = document.getElementById("platter");
  const tonearm = document.getElementById("tonearm");
  const viz = document.getElementById("viz");

  const volumeInput = document.getElementById("volume");

  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const searchResults = document.getElementById("searchResults");


  /* =========================
     VARIABLES
  ========================= */

  const BAR_COUNT = 48;

  let accessToken = null;
  let player = null;
  let deviceId = null;

  let isPlaying = false;
  let shuffle = false;
  let repeat = false;


  /* =========================
     SEEK BARS
  ========================= */

  for (let i = 0; i < BAR_COUNT; i++) {

    const bar = document.createElement("div");

    bar.className = "bar";

    barsEl.appendChild(bar);

  }

  const barEls = Array.from(barsEl.children);


  /* =========================
     PKCE
  ========================= */

  function randomString(length = 64) {

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const values =
      crypto.getRandomValues(
        new Uint8Array(length)
      );

    return Array.from(values)
      .map(value => chars[value % chars.length])
      .join("");

  }


  async function createChallenge(verifier) {

    const data =
      new TextEncoder().encode(verifier);

    const digest =
      await crypto.subtle.digest(
        "SHA-256",
        data
      );

    return btoa(
      String.fromCharCode(
        ...new Uint8Array(digest)
      )
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  }


  /* =========================
     LOGIN
  ========================= */

  async function login() {

    const verifier =
      randomString();

    const challenge =
      await createChallenge(verifier);

    localStorage.setItem(
      "spotify_verifier",
      verifier
    );

    const params =
      new URLSearchParams();

    params.set(
      "client_id",
      CLIENT_ID
    );

    params.set(
      "response_type",
      "code"
    );

    params.set(
      "redirect_uri",
      REDIRECT_URI
    );

    params.set(
      "code_challenge_method",
      "S256"
    );

    params.set(
      "code_challenge",
      challenge
    );

    params.set(
      "scope",
      SCOPES
    );

    window.location.href =
      "https://accounts.spotify.com/authorize?" +
      params.toString();

  }


  loginBtn.addEventListener(
    "click",
    login
  );


  /* =========================
     CALLBACK
  ========================= */

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
        "Spotify login cancelled.";

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
        "Login session expired. Login again.";

      return false;

    }


    try {

      loginStatus.textContent =
        "Connecting to Spotify...";


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

        console.error(
          "Spotify Token Error:",
          data
        );

        throw new Error(
          data.error_description ||
          "Authentication failed"
        );

      }


      accessToken =
        data.access_token;


      localStorage.setItem(
        "spotify_access_token",
        accessToken
      );


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


  /* =========================
     SPOTIFY SDK
  ========================= */

  function initializeSpotifyPlayer() {

    if (!accessToken) {

      console.log(
        "No Spotify access token."
      );

      return;

    }


    if (
      typeof Spotify === "undefined"
    ) {

      console.error(
        "Spotify SDK not loaded."
      );

      statusLine.textContent =
        "Spotify SDK failed to load.";

      return;

    }


    console.log(
      "Initializing Spotify Player..."
    );


    player =
      new Spotify.Player({

        name:
          "Late Groove",

        volume:
          Number(volumeInput.value) / 100,

        getOAuthToken:
          callback => {

            callback(
              accessToken
            );

          },

        enableMediaSession:
          true

      });


    /* READY */

    player.addListener(
      "ready",
      ({ device_id }) => {

        deviceId =
          device_id;

        console.log(
          "Spotify Device Ready:",
          deviceId
        );

        statusLine.textContent =
          "Spotify Ready";

        nowTitle.textContent =
          "Late Groove";

        nowArtist.textContent =
          "Spotify Connected";

      }
    );


    /* NOT READY */

    player.addListener(
      "not_ready",
      ({ device_id }) => {

        console.log(
          "Spotify device offline:",
          device_id
        );

        statusLine.textContent =
          "Spotify device offline.";

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


        if (track) {

          nowTitle.textContent =
            track.name;

          nowArtist.textContent =
            track.artists
              .map(
                artist => artist.name
              )
              .join(", ");

        }


        isPlaying =
          !state.paused;


        updatePlaybackState(
          state
        );

      }
    );


    /* ERRORS */

    player.addListener(
      "initialization_error",
      ({ message }) => {

        console.error(
          "Initialization Error:",
          message
        );

        statusLine.textContent =
          "Spotify player initialization failed.";

      }
    );


    player.addListener(
      "authentication_error",
      ({ message }) => {

        console.error(
          "Authentication Error:",
          message
        );

        statusLine.textContent =
          "Spotify authentication failed.";

      }
    );


    player.addListener(
      "account_error",
      ({ message }) => {

        console.error(
          "Account Error:",
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
          "Playback Error:",
          message
        );

        statusLine.textContent =
          "Spotify playback error.";

      }
    );


    /* CONNECT */

    player.connect()
      .then(success => {

        console.log(
          "SPOTIFY CONNECT RESULT:",
          success
        );

        if (success) {

          statusLine.textContent =
            "Connecting Spotify device...";

        } else {

          statusLine.textContent =
            "Spotify connection failed.";

        }

      });

  }


  /* =========================
     WAIT FOR SDK
  ========================= */

  function waitForSpotifySDK() {

    if (
      typeof Spotify !== "undefined"
    ) {

      initializeSpotifyPlayer();

      return;

    }


    console.log(
      "Waiting for Spotify SDK..."
    );


    setTimeout(
      waitForSpotifySDK,
      300
    );

  }


  /* =========================
     PLAY / PAUSE
  ========================= */

  playBtn.addEventListener(
    "click",
    async () => {

      if (!player) {

        statusLine.textContent =
          "Spotify player is connecting...";

        return;

      }

      await player.togglePlay();

    }
  );


  /* =========================
     NEXT
  ========================= */

  nextBtn.addEventListener(
    "click",
    async () => {

      if (!player) return;

      await player.nextTrack();

    }
  );


  /* =========================
     PREVIOUS
  ========================= */

  prevBtn.addEventListener(
    "click",
    async () => {

      if (!player) return;

      await player.previousTrack();

    }
  );


  /* =========================
     VOLUME
  ========================= */

  volumeInput.addEventListener(
    "input",
    () => {

      if (!player) return;

      player.setVolume(
        Number(volumeInput.value) / 100
      );

    }
  );


  /* =========================
     PLAYBACK UI
  ========================= */

  function updatePlaybackState(
    state
  ) {

    const position =
      state.position || 0;

    const duration =
      state.duration || 0;


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
        "Spotify Ready";

    }

  }


  function formatTime(ms) {

    const seconds =
      Math.floor(ms / 1000);

    const minutes =
      Math.floor(seconds / 60);

    const remaining =
      String(seconds % 60)
        .padStart(2, "0");

    return (
      `${minutes}:${remaining}`
    );

  }


  /* =========================
     SEARCH
  ========================= */

  searchBtn.addEventListener(
    "click",
    searchSpotify
  );


  searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        searchSpotify();

      }

    }
  );


  async function searchSpotify() {

    const query =
      searchInput.value.trim();


    if (!query) {
      return;
    }


    if (!accessToken) {

      searchResults.innerHTML =
        "<p>Please login to Spotify first.</p>";

      return;

    }


    searchResults.innerHTML =
      "<p>Searching Spotify...</p>";


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


  /* =========================
     SEARCH RESULTS
  ========================= */

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
          document.createElement(
            "div"
          );

        item.className =
          "search-track";


        const image =
          track.album?.images?.[2]?.url ||
          track.album?.images?.[0]?.url ||
          "";


        item.innerHTML = `

          <img
            src="${image}"
            alt=""
          >

          <div
            class="search-track-info"
          >

            <strong>
              ${escapeHTML(
                track.name
              )}
            </strong>

            <span>
              ${escapeHTML(
                track.artists
                  .map(
                    artist =>
                      artist.name
                  )
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


  /* =========================
     PLAY SEARCH RESULT
  ========================= */

  async function playSpotifyTrack(
    uri
  ) {

    if (
      !accessToken ||
      !deviceId
    ) {

      alert(
        "Spotify player is still connecting."
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

        console.error(
          error
        );

        alert(
          error.error?.message ||
          "Unable to play track."
        );

      }

    } catch (error) {

      console.error(error);

    }

  }


  /* =========================
     SHUFFLE
  ========================= */

  shuffleBtn.addEventListener(
    "click",
    async () => {

      shuffle =
        !shuffle;

      shuffleBtn.classList.toggle(
        "active",
        shuffle
      );


      if (!accessToken) return;


      await fetch(
        `https://api.spotify.com/v1/me/player/shuffle?state=${shuffle}`,
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


  /* =========================
     REPEAT
  ========================= */

  repeatBtn.addEventListener(
    "click",
    async () => {

      repeat =
        !repeat;

      repeatBtn.classList.toggle(
        "active",
        repeat
      );


      if (!accessToken) return;


      await fetch(
        `https://api.spotify.com/v1/me/player/repeat?state=${repeat ? "track" : "off"}`,
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


  /* =========================
     SEEK
  ========================= */

  barsEl.addEventListener(
    "click",
    async event => {

      if (!player) return;


      const state =
        await player.getCurrentState();


      if (!state) return;


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


      await player.seek(
        state.duration * ratio
      );

    }
  );


  /* =========================
     ESCAPE HTML
  ========================= */

  function escapeHTML(
    value
  ) {

    return String(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );

  }


  /* =========================
     START
  ========================= */

  async function start() {

    console.log(
      "Late Groove starting..."
    );


    const authenticated =
      await handleCallback();


    if (!authenticated) {

      const savedToken =
        localStorage.getItem(
          "spotify_access_token"
        );


      if (savedToken) {

        accessToken =
          savedToken;

      }

    }


    if (!accessToken) {

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
      "Loading Spotify...";


    waitForSpotifySDK();

  }


  start();

})();