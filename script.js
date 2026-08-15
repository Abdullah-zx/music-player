(function () {

  const tracks = [

    {
      title: "Amber Static",
      artist: "Nightbloom Trio",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },

    {
      title: "Slow Neon",
      artist: "Kōji Aoyama",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },

    {
      title: "Corner Booth",
      artist: "The Low Fidelities",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    },

    {
      title: "Velvet Rewind",
      artist: "Marta Solene",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    },

    {
      title: "Streetlight Haze",
      artist: "Nightbloom Trio",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
    },

    {
      title: "Analog Heart",
      artist: "Ruth & The Radios",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
    },

    {
      title: "After Hours Reprise",
      artist: "Kōji Aoyama",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
    },

    {
      title: "Last Call",
      artist: "The Low Fidelities",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    }

  ];


  /* DOM ELEMENTS */

  const audio =
    document.getElementById("audio");

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


  /* ICONS */

  const ICON_PLAY =
    '<path d="M8 5v14l11-7z"/>';

  const ICON_PAUSE =
    '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';


  /* SETTINGS */

  const BAR_COUNT = 48;

  let current = 0;

  let isPlaying = false;

  let shuffle = false;

  let repeat = false;


  /* FORMAT TIME */

  function fmt(seconds) {

    if (
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      seconds = 0;
    }


    const minutes =
      Math.floor(seconds / 60);


    const secs =
      Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");


    return `${minutes}:${secs}`;

  }


  /* BUILD SEEK BARS */

  for (
    let i = 0;
    i < BAR_COUNT;
    i++
  ) {

    const bar =
      document.createElement("div");

    bar.className = "bar";

    barsEl.appendChild(bar);

  }


  const barEls =
    Array.from(
      barsEl.children
    );


  /* PLAYLIST */

  function renderPlaylist() {

    playlistEl.innerHTML = "";

    playlistCount.textContent =
      `${tracks.length} tracks`;


    tracks.forEach(
      (track, index) => {

        const li =
          document.createElement("li");


        li.className =
          "track" +
          (
            index === current
              ? " active"
              : ""
          );


        li.tabIndex = 0;


        li.innerHTML = `
          <span class="track-num">
            ${index + 1}
          </span>

          <span class="eq-mini">
            <i></i>
            <i></i>
            <i></i>
          </span>

          <span class="track-info">

            <div class="track-title">
              ${track.title}
            </div>

            <div class="track-artist">
              ${track.artist}
            </div>

          </span>

          <span
            class="track-dur"
            data-dur="${index}"
          >
            --:--
          </span>
        `;


        li.addEventListener(
          "click",
          () => {
            loadTrack(index, true);
          }
        );


        li.addEventListener(
          "keydown",
          (event) => {

            if (
              event.key === "Enter" ||
              event.key === " "
            ) {

              event.preventDefault();

              loadTrack(index, true);

            }

          }
        );


        playlistEl.appendChild(li);

      }
    );

  }


  /* ACTIVE TRACK */

  function setActiveRow() {

    Array.from(
      playlistEl.children
    ).forEach(
      (li, index) => {

        li.classList.toggle(
          "active",
          index === current
        );

      }
    );

  }


  /* LOAD TRACK */

  function loadTrack(
    index,
    autoplay
  ) {

    current =
      (
        index + tracks.length
      ) % tracks.length;


    const track =
      tracks[current];


    audio.src =
      track.src;


    nowTitle.textContent =
      track.title;


    nowArtist.textContent =
      track.artist;


    setActiveRow();

    updateStatus();


    if (autoplay) {

      play();

    } else {

      pause();

    }

  }


  /* PLAY */

  function play() {

    audio.play()
      .then(() => {

        isPlaying = true;

        playIcon.innerHTML =
          ICON_PAUSE;

        playBtn.title =
          "Pause";

        platter.classList.add(
          "spinning"
        );

        tonearm.classList.add(
          "playing"
        );

        viz.classList.add(
          "on"
        );

        updateStatus();

      })
      .catch(() => {

        isPlaying = false;

      });

  }


  /* PAUSE */

  function pause() {

    audio.pause();

    isPlaying = false;

    playIcon.innerHTML =
      ICON_PLAY;

    playBtn.title =
      "Play";

    platter.classList.remove(
      "spinning"
    );

    tonearm.classList.remove(
      "playing"
    );

    viz.classList.remove(
      "on"
    );

    updateStatus();

  }


  /* PLAY / PAUSE */

  function togglePlay() {

    if (!audio.src) {

      loadTrack(0, true);

      return;

    }


    if (isPlaying) {

      pause();

    } else {

      play();

    }

  }


  /* STATUS */

  function updateStatus() {

    statusLine.textContent =
      `${isPlaying ? "Playing" : "Paused"} · Track ${
        current + 1
      } of ${
        tracks.length
      }${
        shuffle ? " · Shuffle" : ""
      }${
        repeat ? " · Repeat" : ""
      }`;

  }


  /* NEXT */

  function nextTrack() {

    if (shuffle) {

      let randomIndex;


      do {

        randomIndex =
          Math.floor(
            Math.random() *
            tracks.length
          );

      } while (
        tracks.length > 1 &&
        randomIndex === current
      );


      loadTrack(
        randomIndex,
        true
      );

    } else {

      loadTrack(
        current + 1,
        true
      );

    }

  }


  /* PREVIOUS */

  function prevTrack() {

    if (
      audio.currentTime > 3
    ) {

      audio.currentTime = 0;

      return;

    }


    loadTrack(
      current - 1,
      true
    );

  }


  /* PROGRESS */

  function renderProgress() {

    const duration =
      audio.duration || 0;


    const currentTime =
      audio.currentTime || 0;


    const ratio =
      duration
        ? currentTime / duration
        : 0;


    const filledCount =
      Math.round(
        ratio * BAR_COUNT
      );


    barEls.forEach(
      (bar, index) => {

        bar.classList.toggle(
          "fill",
          index < filledCount
        );

      }
    );


    curTimeEl.textContent =
      fmt(currentTime);


    durTimeEl.textContent =
      fmt(duration);

  }


  /* SEEK */

  function seekFromClientX(
    clientX
  ) {

    const rect =
      barsEl.getBoundingClientRect();


    let ratio =
      (
        clientX - rect.left
      ) / rect.width;


    ratio =
      Math.min(
        1,
        Math.max(0, ratio)
      );


    if (audio.duration) {

      audio.currentTime =
        ratio * audio.duration;


      renderProgress();

    }

  }


  let dragging = false;


  barsEl.addEventListener(
    "mousedown",
    (event) => {

      dragging = true;

      seekFromClientX(
        event.clientX
      );

    }
  );


  window.addEventListener(
    "mousemove",
    (event) => {

      if (dragging) {

        seekFromClientX(
          event.clientX
        );

      }

    }
  );


  window.addEventListener(
    "mouseup",
    () => {

      dragging = false;

    }
  );


  barsEl.addEventListener(
    "touchstart",
    (event) => {

      dragging = true;

      seekFromClientX(
        event.touches[0].clientX
      );

    },
    { passive: true }
  );


  barsEl.addEventListener(
    "touchmove",
    (event) => {

      if (dragging) {

        seekFromClientX(
          event.touches[0].clientX
        );

      }

    },
    { passive: true }
  );


  window.addEventListener(
    "touchend",
    () => {

      dragging = false;

    }
  );


  barsEl.addEventListener(
    "keydown",
    (event) => {

      if (!audio.duration) {
        return;
      }


      if (
        event.key === "ArrowRight"
      ) {

        audio.currentTime =
          Math.min(
            audio.duration,
            audio.currentTime + 5
          );

      }


      if (
        event.key === "ArrowLeft"
      ) {

        audio.currentTime =
          Math.max(
            0,
            audio.currentTime - 5
          );

      }

    }
  );


  /* AUDIO EVENTS */

  audio.addEventListener(
    "timeupdate",
    renderProgress
  );


  audio.addEventListener(
    "loadedmetadata",
    () => {

      renderProgress();


      const durationElement =
        playlistEl.querySelector(
          `[data-dur="${current}"]`
        );


      if (durationElement) {

        durationElement.textContent =
          fmt(audio.duration);

      }

    }
  );


  audio.addEventListener(
    "ended",
    () => {

      if (repeat) {

        audio.currentTime = 0;

        play();

      } else {

        nextTrack();

      }

    }
  );


  /* CONTROLS */

  playBtn.addEventListener(
    "click",
    togglePlay
  );


  nextBtn.addEventListener(
    "click",
    nextTrack
  );


  prevBtn.addEventListener(
    "click",
    prevTrack
  );


  shuffleBtn.addEventListener(
    "click",
    () => {

      shuffle = !shuffle;

      shuffleBtn.classList.toggle(
        "active",
        shuffle
      );

      updateStatus();

    }
  );


  repeatBtn.addEventListener(
    "click",
    () => {

      repeat = !repeat;

      repeatBtn.classList.toggle(
        "active",
        repeat
      );

      updateStatus();

    }
  );


  volumeInput.addEventListener(
    "input",
    () => {

      audio.volume =
        Number(volumeInput.value) / 100;

    }
  );


  /* KEYBOARD SHORTCUTS */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.target.tagName === "INPUT"
      ) {
        return;
      }


      if (event.code === "Space") {

        event.preventDefault();

        togglePlay();

      }


      if (
        event.code === "ArrowRight" &&
        event.shiftKey
      ) {

        nextTrack();

      }


      if (
        event.code === "ArrowLeft" &&
        event.shiftKey
      ) {

        prevTrack();

      }

    }
  );


  /* INITIALIZE */

  audio.volume =
    Number(volumeInput.value) / 100;


  renderPlaylist();

  loadTrack(0, false);


  /* PRELOAD DURATIONS */

  tracks.forEach(
    (track, index) => {

      const probe =
        new Audio();


      probe.preload =
        "metadata";


      probe.src =
        track.src;


      probe.addEventListener(
        "loadedmetadata",
        () => {

          const durationElement =
            playlistEl.querySelector(
              `[data-dur="${index}"]`
            );


          if (durationElement) {

            durationElement.textContent =
              fmt(probe.duration);

          }

        }
      );

    }
  );

})();