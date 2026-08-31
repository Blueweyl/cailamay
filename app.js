"use strict";

// Compiled from Cailamay.dc.html's Component class. The scroll-cinema
// engine below is unchanged vanilla DOM code; only the dc-runtime plumbing
// (props/state/setState/renderVals/DCLogic lifecycle) is gone, replaced by
// a plain class with a tiny hand-rolled setState for the handful of bits
// (reservation form, mobile nav, sound toggle) that are genuinely reactive.
class CailamayPage {
  constructor() {
    this.state = {
      sound: false, arrival: '', departure: '', guests: 2, note: '',
      errors: {}, submitted: false, mobileNavOpen: false,
    };
  }

  setState(patch, cb) {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    Object.assign(this.state, next);
    this.renderReserveUI();
    this.renderMobileNavUI();
    this.renderSoundUI();
    if (cb) cb();
  }

  validate(arrival, departure) {
    const errors = {};
    if (!arrival) {
      errors.arrival = 'Arrival date is required.';
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const a = new Date(arrival + 'T00:00:00');
      if (a < today) errors.arrival = 'Arrival cannot be in the past.';
    }
    if (!departure) {
      errors.departure = 'Departure date is required.';
    }
    if (!errors.arrival && !errors.departure) {
      const a = new Date(arrival + 'T00:00:00');
      const b = new Date(departure + 'T00:00:00');
      const nights = Math.round((b - a) / 86400000);
      if (nights <= 0) errors.departure = 'Departure must be after the arrival date.';
      else if (nights < 3) errors.departure = 'Minimum stay is three nights (currently ' + nights + ').';
    }
    return errors;
  }

  renderReserveUI() {
    const s = this.state;
    const errors = s.errors || {};
    const errList = Object.keys(errors).map((k) => errors[k]);
    const errStyle = (msg) => 'display:block;font-size:11.5px;letter-spacing:0.02em;color:#F0A66B;min-height:' + (msg ? '16px' : '0') + ';margin-top:' + (msg ? '2px' : '0');

    if (this.arrivalInput && this.arrivalInput.value !== s.arrival) this.arrivalInput.value = s.arrival;
    if (this.departureInput && this.departureInput.value !== s.departure) this.departureInput.value = s.departure;
    if (this.arrivalInput) this.arrivalInput.setAttribute('aria-invalid', String(!!errors.arrival));
    if (this.departureInput) this.departureInput.setAttribute('aria-invalid', String(!!errors.departure));

    if (this.arrivalErrEl) { this.arrivalErrEl.textContent = errors.arrival || ''; this.arrivalErrEl.setAttribute('style', errStyle(errors.arrival)); }
    if (this.departureErrEl) { this.departureErrEl.textContent = errors.departure || ''; this.departureErrEl.setAttribute('style', errStyle(errors.departure)); }

    if (this.errorSummary) {
      this.errorSummary.setAttribute('style', 'background:#3a2420;padding:' + (errList.length ? '16px 22px' : '0') + ';max-height:' + (errList.length ? 'none' : '0') + ';overflow:hidden');
      if (this.errorSummaryText) this.errorSummaryText.textContent = errList.join(' ');
    }

    if (this.guestCount) this.guestCount.textContent = s.guests + (s.guests === 1 ? ' GUEST' : ' GUESTS');
    if (this.decBtn) this.decBtn.disabled = s.guests <= 1;
    if (this.incBtn) this.incBtn.disabled = s.guests >= 4;

    if (this.noteEl) this.noteEl.textContent = s.note;
  }

  renderMobileNavUI() {
    if (this.navToggle) {
      this.navToggle.setAttribute('aria-expanded', String(this.state.mobileNavOpen));
      this.navToggle.setAttribute('aria-label', this.state.mobileNavOpen ? 'Close menu' : 'Open menu');
    }
  }

  renderSoundUI() {
    if (this.soundBtn) {
      this.soundBtn.textContent = this.state.sound ? 'SOUND ON' : 'SOUND OFF';
      this.soundBtn.setAttribute('aria-label', this.state.sound ? 'Turn ambient sound off' : 'Turn ambient sound on');
    }
  }

  onArrival(e) {
    const arrival = e.target.value;
    this.setState((s) => ({ arrival, errors: s.submitted ? this.validate(arrival, s.departure) : s.errors }));
  }

  onDeparture(e) {
    const departure = e.target.value;
    this.setState((s) => ({ departure, errors: s.submitted ? this.validate(s.arrival, departure) : s.errors }));
  }

  onReserve(e) {
    e.preventDefault();
    const { arrival, departure } = this.state;
    const errors = this.validate(arrival, departure);
    this.setState({ errors, submitted: true }, () => {
      const keys = Object.keys(errors);
      if (keys.length) {
        const first = document.getElementById('res-' + keys[0]);
        if (first) first.focus();
        else if (this.errorSummary) this.errorSummary.focus();
        this.setState({ note: '' });
        return;
      }
      const nights = Math.round((new Date(departure + 'T00:00:00') - new Date(arrival + 'T00:00:00')) / 86400000);
      this.setState({
        note: 'Preview only: ' + arrival + ' to ' + departure + ' (' + nights + ' nights, ' + this.state.guests + (this.state.guests === 1 ? ' guest' : ' guests') + ') looks available in this planner. This does not send a reservation request — no message has been sent to CAILAMAY.'
      });
    });
  }

  initReserveForm() {
    this.arrivalInput = document.getElementById('res-arrival');
    this.departureInput = document.getElementById('res-departure');
    this.arrivalErrEl = document.getElementById('res-arrival-err');
    this.departureErrEl = document.getElementById('res-departure-err');
    this.errorSummary = document.querySelector('[data-errorsummary]');
    this.errorSummaryText = document.querySelector('[data-errorsummary-text]');
    this.guestCount = document.getElementById('res-guest-count');
    this.decBtn = document.getElementById('res-dec-guests');
    this.incBtn = document.getElementById('res-inc-guests');
    this.noteEl = document.getElementById('res-note');
    const form = document.getElementById('reserve-form');

    if (this.arrivalInput) this.arrivalInput.addEventListener('input', (e) => this.onArrival(e));
    if (this.departureInput) this.departureInput.addEventListener('input', (e) => this.onDeparture(e));
    if (this.decBtn) this.decBtn.addEventListener('click', () => this.setState((s) => ({ guests: Math.max(1, s.guests - 1) })));
    if (this.incBtn) this.incBtn.addEventListener('click', () => this.setState((s) => ({ guests: Math.min(4, s.guests + 1) })));
    if (form) form.addEventListener('submit', (e) => this.onReserve(e));
  }

  // ---- Mobile nav ----

  setupMobileNav() {
    this.mobilePanel = document.querySelector('[data-mobilenav]');
    this.mobileToggle = document.querySelector('[data-navtoggle]');
    this.navToggle = this.mobileToggle;
    if (!this.mobilePanel) return;
    this.mobilePanel.style.display = 'none';
    this.mobilePanel.setAttribute('aria-hidden', 'true');
    if (this.mobileToggle) this.mobileToggle.addEventListener('click', () => this.setMobileNav(!this.state.mobileNavOpen));
    document.addEventListener('keydown', (e) => {
      if (!this.state.mobileNavOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); this.setMobileNav(false); return; }
      if (e.key === 'Tab') {
        const focusable = Array.from(this.mobilePanel.querySelectorAll('a,button')).filter((el) => !el.disabled);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    this.mobilePanel.addEventListener('click', (e) => {
      if (e.target.closest('[data-mobilelink]')) this.setMobileNav(false);
    });
  }

  setMobileNav(open) {
    this.setState({ mobileNavOpen: open }, () => {
      if (!this.mobilePanel) return;
      this.mobilePanel.style.display = open ? 'flex' : 'none';
      this.mobilePanel.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        const first = this.mobilePanel.querySelector('[data-mobilelink]');
        if (first) first.focus();
      } else if (this.mobileToggle) {
        this.mobileToggle.focus();
      }
    });
  }

  // ---- Ambient sound (synthesized, no audio file) ----

  toggleSound() {
    if (this.state.sound) { this.stopSound(); this.setState({ sound: false }); return; }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 520;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain).connect(gain.gain);
      src.connect(lp).connect(gain).connect(ctx.destination);
      gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 2.5);
      src.start(); lfo.start();
      this.audio = { ctx, src, lfo };
      this.setState({ sound: true });
    } catch (e) { this.setState({ note: 'Ambient sound is unavailable in this browser.' }); }
  }

  stopSound() {
    if (!this.audio) return;
    try { this.audio.src.stop(); this.audio.lfo.stop(); this.audio.ctx.close(); } catch (e) {}
    this.audio = null;
  }

  initSoundToggle() {
    this.soundBtn = document.getElementById('sound-toggle');
    if (this.soundBtn) this.soundBtn.addEventListener('click', () => this.toggleSound());
  }

  // ---- Scroll cinema (hero video + 7 scroll-controlled scenes) ----

  loadLeg(i) {
    const video = this.videos[i];
    const st = this.videoState[i];
    if (!video || !st || st.status !== 'idle') return;
    const src = video.dataset.vsrc;
    if (!src) return;
    st.status = 'loading';
    // Direct relative src (not fetch->blob->objectURL): lets the browser
    // stream and byte-range-seek the file natively instead of holding the
    // whole clip in memory before anything can play. preload="metadata" in
    // the markup keeps this from pulling any actual frame data until now.
    video.src = src;
    video.load();
  }

  onVideoReady(i) {
    const st = this.videoState[i];
    if (!st || st.status === 'failed' || st.status === 'ready') return;
    const video = this.videos[i];
    st.duration = video.duration || 8;
    st.status = 'ready';
    if (i === this.activeVideoIdx || st.pendingPlay) {
      st.pendingPlay = false;
      this.safePlayVideo(video, i);
    } else {
      // Loaded ahead of time but not the active scene yet. Safari/iOS won't
      // paint a frame on a video that has never played, even when muted, so
      // prime it with a silent play + immediate pause.
      const primed = video.play();
      if (primed && primed.then) primed.then(() => { if (i !== this.activeVideoIdx) video.pause(); }).catch(() => {});
    }
  }

  onVideoError(i) {
    const st = this.videoState[i] || (this.videoState[i] = {});
    st.status = 'failed';
    st.pendingPlay = false;
    const video = this.videos[i];
    console.error('[cinema] leg ' + i + ' video failed to load (' + (video && video.dataset.vsrc) + '); its still poster remains in place permanently.');
  }

  safePlayVideo(video, i) {
    const playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        console.warn('[cinema] leg ' + i + ' play() was rejected; its still poster remains visible instead.', err);
      });
    }
  }

  playActiveVideo() {
    const i = this.activeVideoIdx;
    const video = this.videos[i];
    const st = this.videoState[i];
    if (!video || !st) return;
    if (st.status === 'ready') this.safePlayVideo(video, i);
    else if (st.status !== 'failed') { st.pendingPlay = true; this.loadLeg(i); }
  }

  // Whichever leg is closest to fully visible actually plays (looping) via
  // play()/pause(); every other clip stays paused. Only the active scene
  // plus the next one or two are ever loaded ahead of time.
  hydrateVideos() {
    if (!this.videos || this.videos.length <= 1 || this.reduced) return;
    const n = this.legs.length;
    const active = this.activeLeg;

    if (active !== this.activeVideoIdx) {
      const prev = this.videos[this.activeVideoIdx];
      if (prev && !prev.paused) prev.pause();
      this.activeVideoIdx = active;
      if (active > 0) this.playActiveVideo(); // index 0 is the hero; it manages its own playback
    }

    for (let k = 0; k <= 2; k++) {
      const idx = active + k;
      if (idx >= 1 && idx <= n - 1) this.loadLeg(idx);
    }

    this.videos.forEach((video, i) => {
      if (i === 0 || i === active) return;
      if (!video.paused) video.pause();
    });
  }

  initHero() {
    const video = this.heroVideo;
    if (!video) return;
    video.loop = true;
    video.muted = true; video.defaultMuted = true; video.volume = 0;
    video.playsInline = true; video.setAttribute('playsinline', '');

    if (this.reduced) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }

    video.addEventListener('error', () => {
      console.error('[hero] leg1.mp4 failed to load (' + (video.currentSrc || video.src) + '); keeping poster in place.', video.error);
    });
    video.addEventListener('canplay', () => {
      video.style.opacity = '1';
      this.reportHeroTransfer();
    }, { once: true });
    video.addEventListener('stalled', () => console.warn('[hero] leg1.mp4 stalled (slow/interrupted network)'));

    const playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        console.warn('[hero] autoplay was rejected; showing poster instead.', err);
      });
    }
  }

  reportHeroTransfer() {
    if (!window.performance || !performance.getEntriesByType) return;
    const report = () => {
      const entry = performance.getEntriesByType('resource')
        .filter((e) => e.name.indexOf('leg1.mp4') !== -1)
        .pop();
      if (!entry) return false;
      const kb = (n) => Math.round(n / 1024) + 'KB';
      console.log('[hero] leg1.mp4 initial transfer: ' + kb(entry.transferSize || 0) +
        ' over the wire (' + kb(entry.decodedBodySize || 0) + ' decoded) by canplay.');
      return true;
    };
    if (!report()) setTimeout(report, 300);
  }

  hydrate() {
    this.activeLeg = Math.round(this.eased * (this.legs.length - 1));
    this.hydrateVideos();
    if (!this.deferred || !this.deferred.length) return;
    const vh = window.innerHeight;
    this.deferred = this.deferred.filter((el) => {
      const legHost = el.closest('[data-leg]');
      let near;
      if (legHost) {
        near = Math.abs(Number(legHost.dataset.leg) - this.activeLeg) <= 1;
      } else {
        const r = el.getBoundingClientRect();
        near = r.top < vh * 2.2 && r.bottom > -vh;
      }
      if (!near) return true;
      el.setAttribute('src', el.dataset.src);
      el.removeAttribute('data-src');
      return false;
    });
  }

  applyResponsive() {
    const w = window.innerWidth;
    if (w === this.lastW) return;
    this.lastW = w;
    const narrow = w < 900;
    const mid = w < 1200;
    const compact = w <= 1024;
    if (this.legs) this.legs.forEach((el) => { el.style.inset = compact ? '0%' : '-4%'; });
    if (this.videos) this.videos.forEach((el) => { el.style.objectFit = compact ? 'contain' : 'cover'; });
    document.querySelectorAll('[data-resp]').forEach((el) => {
      const kind = el.dataset.resp;
      if (kind === 'two') el.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)';
      if (kind === 'reserve') el.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,420px)';
      if (kind === 'three') el.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : 'repeat(3,minmax(0,1fr))';
      if (kind === 'footer') el.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : (mid ? 'repeat(2,minmax(0,1fr))' : 'minmax(0,2fr) repeat(3,minmax(0,1fr))');
    });
    document.querySelectorAll('[data-respspan]').forEach((el) => {
      el.style.gridColumn = narrow ? '1 / -1' : el.dataset.respspan;
      el.style.paddingTop = narrow ? '0px' : (el.dataset.resppad || '');
    });
    document.querySelectorAll('[data-respmin]').forEach((el) => {
      el.style.minHeight = narrow ? '320px' : el.dataset.respmin;
    });
    const pad = narrow ? '20px' : '42px';
    this.navPadX = pad;
    document.querySelectorAll('[data-resppad-x], [data-hero], #stay, #experience > div, #reserve, footer, #gallery > div, #gallery [style*="grid-template-columns:repeat(12"]').forEach((el) => { el.style.paddingLeft = pad; el.style.paddingRight = pad; });
    if (this.nav) this.nav.style.paddingLeft = pad;
    if (this.nav) this.nav.style.paddingRight = pad;
    const menu = document.querySelector('[data-navmenu]');
    const belowMobileBreak = w < 780;
    if (menu) menu.style.display = belowMobileBreak ? 'none' : 'flex';
    const toggle = document.querySelector('[data-navtoggle]');
    if (toggle) toggle.style.display = belowMobileBreak ? 'inline-flex' : 'none';
    if (!belowMobileBreak && this.state.mobileNavOpen) this.setMobileNav(false);
  }

  measure() {
    const r = this.cinema.getBoundingClientRect();
    const span = Math.max(1, this.cinema.offsetHeight - window.innerHeight);
    this.target = Math.min(1, Math.max(0, -r.top / span));
    this.heroP = Math.min(1, Math.max(0, -r.top / (window.innerHeight * 0.75)));
  }

  tick(ts) {
    if (typeof ts === 'number') {
      this.raf = requestAnimationFrame(this.tick);
      if (this.timer) { clearInterval(this.timer); this.timer = 0; }
    }
    this.applyResponsive();
    const now = (window.performance && performance.now) ? performance.now() : Date.now();
    const dt = Math.min(250, Math.max(1, now - (this.lastT || now)));
    this.lastT = now;
    const top = this.cinema.getBoundingClientRect().top;
    if (top !== this.lastTop) { this.lastTop = top; this.measure(); }
    else if (this.eased === this.target) return;
    const k = this.reduced ? 1 : Math.min(1, 1 - Math.exp(-dt / 110));
    this.eased += (this.target - this.eased) * k;
    if (Math.abs(this.target - this.eased) < 0.0004) this.eased = this.target;
    this.hydrate();
    this.paint();
  }

  paint() {
    const p = this.eased;
    const n = this.legs.length;
    const t = p * (n - 1);

    for (let i = 0; i < n; i++) {
      const d = t - i;
      const o = Math.max(0, Math.min(1, 1 - Math.abs(d) / 1));
      const el = this.legs[i];
      el.style.opacity = o.toFixed(3);
      if (!this.reduced) {
        const fwd = Math.max(-1, Math.min(1, d));
        el.style.transform = 'scale(' + (1.035 + fwd * 0.035).toFixed(4) + ') translate3d(0,' + (fwd * -1.2).toFixed(2) + '%,0)';
      }
      const on = o > 0.002;
      el.style.visibility = on ? 'visible' : 'hidden';
      el.style.willChange = on ? 'opacity,transform' : 'auto';
    }

    if (this.hero) {
      const h = 1 - this.heroP;
      this.hero.style.opacity = h.toFixed(3);
      this.hero.style.transform = 'translate3d(0,' + (this.heroP * -34).toFixed(1) + 'px,0)';
      this.hero.style.letterSpacing = (this.heroP * 0.6).toFixed(3) + 'px';
      this.hero.style.visibility = h > 0.01 ? 'visible' : 'hidden';
    }
    if (this.rail) this.rail.style.opacity = Math.min(1, Math.max(0, (this.heroP - 0.35) * 2.2)).toFixed(3);
    if (this.outscrim) this.outscrim.style.opacity = Math.max(0, (p - 0.94) / 0.06 * 0.55).toFixed(3);
    if (this.nav) {
      const solid = p > 0.02;
      this.nav.style.background = solid ? 'rgba(16,22,21,0.72)' : 'transparent';
      this.nav.style.backdropFilter = solid ? 'blur(10px)' : 'blur(0px)';
      this.nav.style.borderBottomColor = solid ? 'rgba(234,226,213,0.14)' : 'rgba(234,226,213,0)';
      const padX = this.navPadX || '42px';
      this.nav.style.padding = (solid ? '17px ' : '26px ') + padX;
    }

    const active = this.activeLeg;
    if (active !== this.lastLeg) {
      this.lastLeg = active;
      this.dots.forEach((dot, i) => {
        const pip = dot.querySelector('[data-pip]');
        const label = dot.querySelector('[data-label]');
        if (pip) { pip.style.background = i === active ? '#D8945B' : 'rgba(246,242,235,0.28)'; pip.style.transform = i === active ? 'scale(1.7)' : 'scale(1)'; }
        if (label) {
          label.style.opacity = i === active ? '1' : '0';
          if (i === active) { clearTimeout(this._lt); this._lt = setTimeout(() => { label.style.opacity = '0'; }, 1600); }
        }
      });
    }

    if (!this.reduced) {
      const vh = window.innerHeight;
      this.pxs.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (c * parseFloat(el.dataset.px) * -22).toFixed(1) + 'px,0)';
      });
    }
  }

  initCinema() {
    const root = document.querySelector('[data-cinema]');
    if (!root) return;
    this.cinema = root;
    this.nav = document.querySelector('[data-nav]');
    this.hero = root.querySelector('[data-hero]');
    this.rail = root.querySelector('[data-rail]');
    this.outscrim = root.querySelector('[data-outscrim]');
    this.legs = Array.from(root.querySelectorAll('[data-leg]'));
    this.dots = this.rail ? Array.from(this.rail.querySelectorAll('[data-dot]')) : [];
    this.pxs = Array.from(document.querySelectorAll('[data-px]'));
    this.deferred = Array.from(document.querySelectorAll('[data-src]'));
    this.videos = Array.from(root.querySelectorAll('[data-vid]'));
    this.heroVideo = root.querySelector('[data-hero-video]');
    this.videoState = {};

    root.style.height = (this.legs.length * 95) + 'vh'; // legHeight, fixed at the prototype's default

    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.target = 0; this.eased = 0; this.lastLeg = -1; this.lastTop = null; this.lastW = null;
    this.activeVideoIdx = 0; this.activeLeg = 0;
    this.tick = this.tick.bind(this);
    this.applyResponsive();
    this.measure();
    this.eased = this.target;
    this.lastT = 0;
    this.videos.forEach((v, i) => {
      v.muted = true; v.defaultMuted = true; v.volume = 0;
      v.playsInline = true; v.setAttribute('playsinline', '');
      v.loop = true;
      this.videoState[i] = { status: 'idle' };
      if (i === 0) return; // leg 0 is the hero video, wired up separately in initHero()
      v.addEventListener('error', () => this.onVideoError(i));
      v.addEventListener('canplay', () => this.onVideoReady(i));
      v.addEventListener('stalled', () => console.warn('[cinema] leg ' + i + ' stalled (slow/interrupted network)'));
      v.addEventListener('waiting', () => console.warn('[cinema] leg ' + i + ' buffering'));
    });
    this.initHero();
    this.hydrate();
    this.paint();
    if (!this.reduced) {
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 500));
      idle(() => this.loadLeg(3));
    }
    this.raf = requestAnimationFrame(this.tick);
    this.timer = setInterval(this.tick, 60);
  }

  init() {
    this.initCinema();
    this.initReserveForm();
    this.setupMobileNav();
    this.initSoundToggle();
  }
}

document.addEventListener('DOMContentLoaded', () => { new CailamayPage().init(); });
