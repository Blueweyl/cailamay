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

  // ---- Hero slideshow (8 clips autoplay/cross-fade one after another) ----

  loadSlide(i) {
    const video = this.videos[i];
    const st = this.videoState[i];
    if (!video || !st || st.status !== 'idle') return;
    const src = video.dataset.vsrc;
    if (!src) return;
    st.status = 'loading';
    // Direct relative src (not fetch->blob->objectURL): lets the browser
    // stream and byte-range-seek the file natively instead of holding the
    // whole clip in memory before anything can play. preload="none" in the
    // markup keeps this from pulling any actual frame data until now.
    video.src = src;
    video.load();
  }

  onSlideVideoReady(i) {
    const st = this.videoState[i];
    if (!st || st.status === 'failed') return;
    st.status = 'ready';
    if (i === this.activeSlide && st.pendingPlay) {
      st.pendingPlay = false;
      this.safePlayVideo(this.videos[i], i);
    }
  }

  onSlideVideoError(i) {
    const st = this.videoState[i] || (this.videoState[i] = {});
    st.status = 'failed';
    st.pendingPlay = false;
    console.error('[hero-slideshow] slide ' + i + ' video failed to load (' + (this.videos[i] && this.videos[i].dataset.vsrc) + '); its still poster remains in place and the cycle skips past it.');
    if (i === this.activeSlide) {
      clearTimeout(this._advanceTimer);
      this._advanceTimer = setTimeout(() => this.advanceSlide(), 1500);
    }
  }

  safePlayVideo(video, i) {
    const playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        console.warn('[hero-slideshow] slide ' + i + ' play() was rejected; its still poster remains visible instead.', err);
        if (i === this.activeSlide) {
          clearTimeout(this._advanceTimer);
          this._advanceTimer = setTimeout(() => this.advanceSlide(), 4000);
        }
      });
    }
  }

  // Moves the slideshow to the next of the 8 slides, looping back to slide
  // 0 after the last one. Triggered by the active clip's 'ended' event (the
  // normal path) or, if a clip fails/never starts, by a short fallback
  // timer so one broken file can't stall the whole cycle.
  advanceSlide() {
    if (this.reduced) return;
    clearTimeout(this._advanceTimer);
    const n = this.slides.length;
    const prev = this.activeSlide;
    const next = (prev + 1) % n;

    const prevVideo = this.videos[prev];
    if (prevVideo) {
      prevVideo.pause();
      try { prevVideo.currentTime = 0; } catch (e) {}
    }

    this.slides[prev].style.opacity = '0';
    this.slides[next].style.opacity = '1';
    this.activeSlide = next;
    this.updateDots(next);

    const nextVideo = this.videos[next];
    const st = this.videoState[next];
    if (nextVideo && st) {
      if (st.status === 'ready') this.safePlayVideo(nextVideo, next);
      else if (st.status === 'idle') { st.pendingPlay = true; this.loadSlide(next); }
      else if (st.status === 'loading') st.pendingPlay = true;
      else if (st.status === 'failed') { this._advanceTimer = setTimeout(() => this.advanceSlide(), 1500); }
    }

    this.loadSlide((next + 1) % n); // preload one slide ahead - never the whole set
  }

  updateDots(active) {
    if (active === this.lastDot) return;
    this.lastDot = active;
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

  initHero() {
    const video = this.heroVideo;
    if (!video) return;
    video.muted = true; video.defaultMuted = true; video.volume = 0;
    video.playsInline = true; video.setAttribute('playsinline', '');
    this.videoState[0] = { status: 'loading' };

    if (this.reduced) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }

    video.addEventListener('error', () => this.onSlideVideoError(0));
    video.addEventListener('ended', () => this.advanceSlide());
    video.addEventListener('canplay', () => {
      video.style.opacity = '1';
      this.reportHeroTransfer();
      const st = this.videoState[0];
      if (st) st.status = 'ready';
    });
    video.addEventListener('stalled', () => console.warn('[hero-slideshow] slide 0 stalled (slow/interrupted network)'));

    this.safePlayVideo(video, 0);
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

  // Nav solid-on-scroll + the gallery's parallax layers - the only things
  // tied to the page's own scroll position now that the hero is a normal,
  // fixed-height section instead of a scroll-scrubbed one.
  paintScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    if (this.nav) {
      const solid = y > 40;
      this.nav.style.background = solid ? 'rgba(16,22,21,0.72)' : 'transparent';
      this.nav.style.backdropFilter = solid ? 'blur(10px)' : 'blur(0px)';
      this.nav.style.borderBottomColor = solid ? 'rgba(234,226,213,0.14)' : 'rgba(234,226,213,0)';
      const padX = this.navPadX || '42px';
      this.nav.style.padding = (solid ? '17px ' : '26px ') + padX;
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

  applyResponsive() {
    const w = window.innerWidth;
    if (w === this.lastW) return;
    this.lastW = w;
    const narrow = w < 900;
    const mid = w < 1200;
    document.querySelectorAll('[data-resp]').forEach((el) => {
      const kind = el.dataset.resp;
      if (kind === 'two') el.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)';
      if (kind === 'tour') el.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : 'minmax(0,340px) minmax(0,1fr)';
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
    document.querySelectorAll('[data-resppad-x], #tour, #stay, #experience > div, #reserve, footer, #gallery > div, #gallery [style*="grid-template-columns:repeat(12"]').forEach((el) => { el.style.paddingLeft = pad; el.style.paddingRight = pad; });
    if (this.nav) this.nav.style.paddingLeft = pad;
    if (this.nav) this.nav.style.paddingRight = pad;
    const menu = document.querySelector('[data-navmenu]');
    const belowMobileBreak = w < 780;
    if (menu) menu.style.display = belowMobileBreak ? 'none' : 'flex';
    const toggle = document.querySelector('[data-navtoggle]');
    if (toggle) toggle.style.display = belowMobileBreak ? 'inline-flex' : 'none';
    if (!belowMobileBreak && this.state.mobileNavOpen) this.setMobileNav(false);
  }

  initCinema() {
    const root = document.querySelector('[data-hero-slideshow]');
    if (!root) return;
    this.heroRoot = root;
    this.nav = document.querySelector('[data-nav]');
    this.rail = root.querySelector('[data-rail]');
    this.slides = Array.from(root.querySelectorAll('[data-slide]'));
    this.dots = this.rail ? Array.from(this.rail.querySelectorAll('[data-dot]')) : [];
    this.pxs = Array.from(document.querySelectorAll('[data-px]'));
    this.videos = Array.from(root.querySelectorAll('[data-vid]'));
    this.heroVideo = root.querySelector('[data-hero-video]');
    this.videoState = {};
    this.activeSlide = 0;
    this.lastDot = -1;
    this.lastW = null;

    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.applyResponsive();

    this.videos.forEach((v, i) => {
      v.muted = true; v.defaultMuted = true; v.volume = 0;
      v.playsInline = true; v.setAttribute('playsinline', '');
      this.videoState[i] = { status: 'idle' };
      if (i === 0) return; // slide 0 is the hero video, wired up separately in initHero()
      v.addEventListener('error', () => this.onSlideVideoError(i));
      v.addEventListener('canplay', () => this.onSlideVideoReady(i));
      v.addEventListener('ended', () => this.advanceSlide());
      v.addEventListener('stalled', () => console.warn('[hero-slideshow] slide ' + i + ' stalled (slow/interrupted network)'));
      v.addEventListener('waiting', () => console.warn('[hero-slideshow] slide ' + i + ' buffering'));
    });

    this.initHero();
    this.updateDots(0);
    if (!this.reduced) this.loadSlide(1); // preload the next slide right away; never the whole set

    window.addEventListener('scroll', () => this.paintScroll(), { passive: true });
    window.addEventListener('resize', () => this.applyResponsive());
    this.paintScroll();
  }

  init() {
    this.initCinema();
    this.initReserveForm();
    this.setupMobileNav();
    this.initSoundToggle();
  }
}

document.addEventListener('DOMContentLoaded', () => { new CailamayPage().init(); });
