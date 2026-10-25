// ============================================================
//  RENDERER INJECTOR
// ============================================================
function __mrrInject(p) {
  try {
    if (window.__mrrCleanup) {
      try { window.__mrrCleanup(); } catch (e) {}
      window.__mrrCleanup = null;
    }

    // ---------- CSS ----------
    var style = document.createElement('style');
    style.id = 'mrr-global-style';
    style.textContent = [
      '#mrr-global-widget{position:fixed!important;z-index:2147483647!important;',
        'cursor:pointer!important;user-select:none!important;-webkit-user-select:none!important;',
        'transition:transform 120ms cubic-bezier(.34,1.56,.64,1),opacity 200ms ease,right 200ms ease,bottom 200ms ease!important;',
        'filter:drop-shadow(0 6px 16px rgba(0,0,0,.5))!important;}',
      '#mrr-global-widget.mrr-hidden{opacity:0!important;pointer-events:none!important;}',
      '#mrr-global-widget img{display:block!important;height:auto!important;',
        'border-radius:12px!important;pointer-events:none!important;-webkit-user-drag:none!important;}',
      '#mrr-global-speech{position:fixed!important;background:#191e26!important;',
        'border:1px solid #222730!important;border-radius:8px!important;padding:5px 10px!important;',
        'font-size:12px!important;color:#e7ebf0!important;',
        'font-family:"Inter","Segoe UI",system-ui,sans-serif!important;white-space:nowrap!important;',
        'opacity:0;pointer-events:none!important;transition:opacity 160ms ease!important;',
        'z-index:2147483647!important;transform:translateX(-50%)!important;}',
      '#mrr-global-speech.mrr-visible{opacity:1!important;}',
      '#mrr-global-ctx{position:fixed!important;z-index:2147483647!important;min-width:220px!important;',
        'background:#14181f!important;border:1px solid #222730!important;border-radius:12px!important;',
        'padding:14px 16px!important;box-shadow:0 16px 40px rgba(0,0,0,.6)!important;',
        'font-family:"Inter","Segoe UI",system-ui,sans-serif!important;color:#e7ebf0!important;}',
      '#mrr-global-ctx .mrr-title{font-size:11px!important;text-transform:uppercase!important;',
        'letter-spacing:.06em!important;color:#8a929e!important;margin-bottom:10px!important;}',
      '#mrr-global-ctx .mrr-title span{color:#e7ebf0!important;font-weight:600!important;}',
      '#mrr-global-ctx input[type="range"]{width:100%!important;accent-color:#7c9cff!important;margin:0 0 8px!important;}',
      '#mrr-global-ctx label{display:flex!important;align-items:center!important;gap:6px!important;',
        'font-size:12px!important;color:#8a929e!important;cursor:pointer!important;}',
      '#mrr-global-ctx label input{accent-color:#7c9cff!important;}',
      '#mrr-global-ctx .mrr-reset{margin-top:12px!important;width:100%!important;padding:7px 10px!important;',
        'border-radius:8px!important;border:1px solid #222730!important;background:transparent!important;',
        'color:#e7ebf0!important;font-size:12px!important;cursor:pointer!important;}',
      '#mrr-global-ctx .mrr-reset:hover{background:rgba(255,255,255,.04)!important;border-color:#2f3641!important;}'
    ].join('');
    document.head.appendChild(style);

    // ---------- виджет ----------
    var widget = document.createElement('div');
    widget.id = 'mrr-global-widget';
    var img = document.createElement('img');
    img.alt = 'Mrr';
    img.draggable = false;

    var FALLBACK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7c9cff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="96" height="96">' +
      '<path d="M5 9l1.5-4.5L10 7h4l3.5-2.5L19 9v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/>' +
      '<circle cx="9.5" cy="12.5" r=".9" fill="#7c9cff"/><circle cx="14.5" cy="12.5" r=".9" fill="#7c9cff"/>' +
      '<path d="M10 16c.7.6 1.3.9 2 .9s1.3-.3 2-.9"/></svg>'
    );

    function useFallbackSvg() {
      img.onerror = null;
      img.src = FALLBACK_SVG;
    }

    function useRemoteUrl(url) {
      if (!url) { useFallbackSvg(); return; }
      img.onerror = function () {
        console.warn('[Mrr] remote image failed:', url);
        useFallbackSvg();
      };
      img.src = url;
    }

    if (p.imgDataUrl) {
      img.onerror = function () {
        console.warn('[Mrr] local image failed, trying URL');
        useRemoteUrl(p.imageUrl);
      };
      img.src = p.imgDataUrl;
    } else if (p.imageUrl) {
      useRemoteUrl(p.imageUrl);
    } else {
      useFallbackSvg();
    }

    widget.appendChild(img);
    document.body.appendChild(widget);

    var speech = document.createElement('div');
    speech.id = 'mrr-global-speech';
    speech.textContent = '';
    document.body.appendChild(speech);

    // ---------- состояние ----------
    var size = Number(p.size) || 96;
    var soundEnabled = !!p.soundEnabled;
    var clickCount = 0;
    var speechTimer = null;

    try {
      var ls1 = localStorage.getItem('mrr_user_size');
      if (ls1 != null) size = Number(JSON.parse(ls1)) || size;
      var ls2 = localStorage.getItem('mrr_user_sound');
      if (ls2 != null) soundEnabled = JSON.parse(ls2);
    } catch (e) {}

    img.style.width = size + 'px';

    // ---------- аудио ----------
    function mkPool(list) {
      return (list || []).map(function (src) {
        try {
          // src уже может быть data: (локальный) или http(s): (URL)
          var a = new Audio(src);
          a.preload = 'auto';
          a.volume = 0.9;
          return a;
        } catch (e) { return null; }
      }).filter(Boolean);
    }
    var purrAudios = mkPool(p.purrList);
    var meowAudios = mkPool(p.meowList);

    console.log('[Mrr] renderer: purr=' + purrAudios.length + ' meow=' + meowAudios.length +
                ' img=' + (p.imgDataUrl ? 'local' : (p.imageUrl ? 'url' : 'none')) +
                ' purrTexts=' + p.purrTexts.length);

    function pick(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }

    function playRandom(pool) {
      if (!soundEnabled) return;
      var a = pick(pool); if (!a) return;
      try { a.currentTime = 0; var pr = a.play(); if (pr && pr.catch) pr.catch(function () {}); }
      catch (e) { console.warn('[Mrr] play error:', e); }
    }

    function showSpeech(text) {
      speech.textContent = text;
      var rect = widget.getBoundingClientRect();
      speech.style.left = (rect.left + rect.width / 2) + 'px';
      speech.style.top  = (rect.top - 34) + 'px';
      speech.classList.add('mrr-visible');
      if (speechTimer) clearTimeout(speechTimer);
      speechTimer = setTimeout(function () {
        speech.classList.remove('mrr-visible');
        speechTimer = null;
      }, 1300);
    }

    // ---------- клики ----------
    widget.addEventListener('click', function (e) {
      e.stopPropagation();
      clickCount++;
      var per = Number(p.clicksPerBounce) || 3;
      if (per < 1) per = 1;

      if (clickCount % per === 0) {
        widget.style.transform = 'translateY(-22px) scale(1.06)';
        setTimeout(function () { widget.style.transform = ''; }, 320);
        playRandom(meowAudios);
        showSpeech(pick(p.bounceTexts) || 'МНЯЯ!');
      } else {
        playRandom(purrAudios);
        showSpeech(pick(p.purrTexts) || 'Мррр');
      }
    });

    // ---------- контекстное меню ----------
    function closeCtx() {
      var c = document.getElementById('mrr-global-ctx');
      if (c) c.remove();
      document.removeEventListener('click', onOutside, true);
      document.removeEventListener('keydown', onEsc, true);
    }
    function onOutside(ev) {
      var c = document.getElementById('mrr-global-ctx');
      if (c && !c.contains(ev.target)) closeCtx();
    }
    function onEsc(ev) { if (ev.key === 'Escape') closeCtx(); }

    widget.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeCtx();

      var menu = document.createElement('div');
      menu.id = 'mrr-global-ctx';
      menu.innerHTML =
        '<div class="mrr-title">Размер: <span class="mrr-size">' + size + '</span> px</div>' +
        '<input type="range" class="mrr-range" min="' + (p.minSize || 60) + '" max="' + (p.maxSize || 240) + '" value="' + size + '">' +
        '<label><input type="checkbox" class="mrr-sound" ' + (soundEnabled ? 'checked' : '') + '> Звуки</label>' +
        '<button class="mrr-reset" type="button">Сбросить</button>';
      menu.style.left = Math.max(8, Math.min(e.clientX, window.innerWidth - 240)) + 'px';
      menu.style.top  = Math.max(8, Math.min(e.clientY, window.innerHeight - 170)) + 'px';
      document.body.appendChild(menu);

      var range = menu.querySelector('.mrr-range');
      var sizeVal = menu.querySelector('.mrr-size');
      var toggle = menu.querySelector('.mrr-sound');
      var reset = menu.querySelector('.mrr-reset');

      range.addEventListener('input', function () {
        size = Number(range.value);
        img.style.width = size + 'px';
        sizeVal.textContent = String(size);
        updatePosition();
      });
      range.addEventListener('change', function () {
        try { localStorage.setItem('mrr_user_size', JSON.stringify(size)); } catch (e) {}
      });
      toggle.addEventListener('change', function () {
        soundEnabled = !!toggle.checked;
        try { localStorage.setItem('mrr_user_sound', JSON.stringify(soundEnabled)); } catch (e) {}
      });
      reset.addEventListener('click', function () {
        size = p.defaultSize || 96;
        img.style.width = size + 'px';
        range.value = size;
        sizeVal.textContent = String(size);
        soundEnabled = !!p.defaultSound;
        toggle.checked = soundEnabled;
        try {
          localStorage.setItem('mrr_user_size', JSON.stringify(size));
          localStorage.setItem('mrr_user_sound', JSON.stringify(soundEnabled));
        } catch (e) {}
        updatePosition();
      });

      setTimeout(function () {
        document.addEventListener('click', onOutside, true);
        document.addEventListener('keydown', onEsc, true);
      }, 0);
    });

    // ---------- только на главной + над футером ----------
    function isMainPage() {
      if (!p.onlyOnMainPage) return true;
      if (document.querySelector('.home-title')) return true;
      if (document.querySelector('.home-carousel')) return true;
      if (document.querySelector('.home-slide')) return true;
      if (document.querySelector('.home-actions')) return true;
      if (document.querySelector('.home-page')) return true;
      if (document.querySelector('.hero')) return true;
      if (document.querySelector('.hero-card')) return true;
      if (document.querySelector('.music-card')) return true;
      return false;
    }

    function updatePosition() {
      var bottomOffset = 24;
      var rightOffset = 24;
      if (p.avoidPlayButton) {
        var foot = document.querySelector('.foot');
        if (foot) {
          var r = foot.getBoundingClientRect();
          if (r.height > 0 && r.bottom >= window.innerHeight - 30) {
            bottomOffset = Math.max(bottomOffset, window.innerHeight - r.top + 12);
          }
        }
      }
      widget.style.bottom = bottomOffset + 'px';
      widget.style.right  = rightOffset + 'px';
    }

    function updateVisibility() {
      var main = isMainPage();
      widget.classList.toggle('mrr-hidden', !main);
      if (main) updatePosition();
    }

    updatePosition();
    updateVisibility();

    window.addEventListener('resize', updatePosition);
    var pollInterval = setInterval(updateVisibility, 400);

    window.__mrrCleanup = function () {
      try {
        clearInterval(pollInterval);
        window.removeEventListener('resize', updatePosition);
        ['mrr-global-widget', 'mrr-global-speech', 'mrr-global-ctx', 'mrr-global-style']
          .forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.remove();
          });
        window.__mrrCleanup = null;
      } catch (e) {}
    };

    console.log('[Mrr] injected OK');
    return true;
  } catch (e) {
    console.error('[Mrr] injection error:', e);
    return false;
  }
}

// ============================================================
//  MAIN
// ============================================================
function splitList(s) {
  return String(s == null ? '' : s).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
}

function isUrl(str) {
  return /^https?:\/\//i.test(String(str).trim());
}

function tryEscape(api) {
  var sources = [api, api.log, api.warn, api.ui];
  for (var i = 0; i < sources.length; i++) {
    var src = sources[i];
    if (!src || !src.constructor) continue;
    try {
      var g = src.constructor.constructor('return global')();
      if (g && (g.process || g.BrowserWindow || g.document)) return g;
    } catch (e) {}
    try {
      var g2 = src.constructor.constructor('return this')();
      if (g2 && (g2.process || g2.BrowserWindow || g2.document)) return g2;
    } catch (e) {}
  }
  return null;
}

function getRequire(g) {
  if (!g) return null;
  try { if (typeof g.require === 'function') return g.require; } catch (e) {}
  try {
    if (g.process && g.process.mainModule && typeof g.process.mainModule.require === 'function') {
      return g.process.mainModule.require.bind(g.process.mainModule);
    }
  } catch (e) {}
  try { if (g.module && typeof g.module.require === 'function') return g.module.require.bind(g.module); } catch (e) {}
  return null;
}

function findPluginRoot(fs, path, pluginId, g, api) {
  var tried = [];

  var pluginsDirs = [];

  try {
    var req = getRequire(g);
    if (req) {
      try {
        var electron = req('electron');
        if (electron && electron.app && electron.app.getPath) {
          pluginsDirs.push(path.join(electron.app.getPath('userData'), 'plugins'));
          pluginsDirs.push(path.join(electron.app.getPath('appData'), 'Cryndel Launcher', 'plugins'));
        }
      } catch (e) {}
    }
  } catch (e) {}

  try {
    if (g && g.process) {
      var env = g.process.env;
      if (env.APPDATA) {
        pluginsDirs.push(path.join(env.APPDATA, 'Cryndel Launcher', 'plugins'));
        pluginsDirs.push(path.join(env.APPDATA, 'cryndel-launcher', 'plugins'));
        pluginsDirs.push(path.join(env.APPDATA, 'Cryndel', 'plugins'));
      }
      if (env.HOME) {
        pluginsDirs.push(path.join(env.HOME, '.config', 'Cryndel Launcher', 'plugins'));
        pluginsDirs.push(path.join(env.HOME, '.config', 'cryndel-launcher', 'plugins'));
        pluginsDirs.push(path.join(env.HOME, 'Library', 'Application Support', 'Cryndel Launcher', 'plugins'));
      }
      if (g.process.cwd) pluginsDirs.push(path.join(g.process.cwd(), 'plugins'));
    }
  } catch (e) {}

  pluginsDirs = pluginsDirs.filter(function (v, i, a) { return a.indexOf(v) === i; });

  for (var i = 0; i < pluginsDirs.length; i++) {
    var pd = pluginsDirs[i];
    tried.push(pd);
    try {
      if (!fs.existsSync(pd)) continue;

      var direct = path.join(pd, pluginId);
      if (fs.existsSync(path.join(direct, 'manifest.json'))) {
        return { root: direct, tried: tried };
      }

      var entries = fs.readdirSync(pd);
      for (var j = 0; j < entries.length; j++) {
        var dir = path.join(pd, entries[j]);
        try {
          if (!fs.statSync(dir).isDirectory()) continue;
          var mp = path.join(dir, 'manifest.json');
          if (!fs.existsSync(mp)) continue;
          var m = JSON.parse(fs.readFileSync(mp, 'utf8'));
          if (m && m.id === pluginId) return { root: dir, tried: tried };
        } catch (e) {}
      }
    } catch (e) {}
  }

  return { root: null, tried: tried };
}

async function buildPayload(api, g) {
  var cfg = {};
  try { cfg = (await api.config.get()) || {}; } catch (e) {}

  var payload = {
    imgDataUrl: null,
    imageUrl: String(cfg.imageUrl || 'http://my.cryndel.ru/a/musya/cat.png').trim(),
    purrList: [],
    meowList: [],
    purrTexts: splitList(cfg.purrTexts || 'Мррр,Няя,Мяу,Фыр фыр,Мюю,Мырр,Мсяя'),
    bounceTexts: splitList(cfg.bounceTexts || 'МНЯЯ!,Пиии!,Фыр-фыр-мяу!'),
    clicksPerBounce: Number(cfg.clicksPerBounce) || 3,
    size: Number(cfg.userSize || cfg.defaultSize) || 96,
    defaultSize: Number(cfg.defaultSize) || 96,
    minSize: Number(cfg.minSize) || 60,
    maxSize: Number(cfg.maxSize) || 240,
    soundEnabled: cfg.userSound != null ? !!cfg.userSound : (cfg.soundEnabled != null ? !!cfg.soundEnabled : true),
    defaultSound: cfg.soundEnabled != null ? !!cfg.soundEnabled : true,
    onlyOnMainPage: cfg.onlyOnMainPage != null ? !!cfg.onlyOnMainPage : true,
    avoidPlayButton: cfg.avoidPlayButton != null ? !!cfg.avoidPlayButton : true
  };

  try {
    var req = getRequire(g);
    if (!req) {
      api.log('Mrr: no require — URLs will be used as-is');
      // даже без require URL-звуки можно передать в renderer
      payload.purrList = splitList(cfg.purrSounds || '').filter(isUrl);
      payload.meowList = splitList(cfg.meowSounds || 'https://my.cryndel.ru/a/musya/1.mp3').filter(isUrl);
      return payload;
    }

    var fs = req('fs');
    var path = req('path');
    var pluginId = (api.launcher && api.launcher.id) || (api.manifest && api.manifest.id) || 'mrr-widget';

    var found = findPluginRoot(fs, path, pluginId, g, api);
    if (!found.root) {
      api.log('Mrr: local folder not found, only URLs will work');
      payload.purrList = splitList(cfg.purrSounds || '').filter(isUrl);
      payload.meowList = splitList(cfg.meowSounds || 'https://my.cryndel.ru/a/musya/1.mp3').filter(isUrl);
      return payload;
    }
    var root = found.root;
    api.log('Mrr plugin root: ' + root);

    function toDataUrl(rel) {
      try {
        var full = path.join(root, String(rel).replace(/^[\\/]+/, ''));
        if (!fs.existsSync(full)) return null;
        var stat = fs.statSync(full);
        if (!stat.isFile() || stat.size === 0) return null;
        if (stat.size > 5 * 1024 * 1024) return null;
        var buf = fs.readFileSync(full);
        var ext = path.extname(full).slice(1).toLowerCase();
        var mimes = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
          bmp: 'image/bmp', ico: 'image/x-icon',
          mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav',
          m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac'
        };
        var mime = mimes[ext];
        if (!mime) return null;
        return 'data:' + mime + ';base64,' + buf.toString('base64');
      } catch (e) { return null; }
    }

    // ---------- картинка ----------
    var userImg = String(cfg.imagePath || '').trim();
    if (userImg) {
      var local = toDataUrl(userImg);
      if (local) {
        payload.imgDataUrl = local;
        api.log('Mrr: local image OK (' + Math.round(local.length / 1024) + ' KB)');
      } else {
        api.log('Mrr: local image "' + userImg + '" not found, will use URL');
      }
    }

    // ---------- звуки: URL или локальный файл ----------
    function resolveSound(entry) {
      var s = String(entry).trim();
      if (!s) return null;
      if (isUrl(s)) return s;              // внешний URL — отдаём как есть
      return toDataUrl(s);                 // локальный путь — в data URL
    }

    payload.purrList = splitList(cfg.purrSounds || 'assets/purr1.mp3,assets/purr2.mp3')
      .map(resolveSound).filter(Boolean);

    // meowSounds: если пользователь не задал — URL по умолчанию
    var meowRaw = cfg.meowSounds;
    if (meowRaw == null || String(meowRaw).trim() === '') {
      meowRaw = 'https://my.cryndel.ru/a/musya/1.mp3';
    }
    payload.meowList = splitList(meowRaw).map(resolveSound).filter(Boolean);

    api.log('Mrr sounds: purr=' + payload.purrList.length + ' meow=' + payload.meowList.length);
    if (payload.meowList.length) api.log('Mrr meow[0] = ' + payload.meowList[0].slice(0, 60));
  } catch (e) {
    api.warn('Mrr buildPayload: ' + e.message);
  }

  api.log('Mrr: imageUrl=' + payload.imageUrl);
  return payload;
}

module.exports = {
  async activate(api) {
    api.log('Mrr: activating');
    var g = tryEscape(api);
    if (!g) {
      api.warn('Mrr: cannot escape sandbox');
      if (api.ui && api.ui.toast) api.ui.toast('Mrr: sandbox закрыт', 'bad');
      return;
    }

    var payload = await buildPayload(api, g);
    var script = '(' + __mrrInject.toString() + ')(' + JSON.stringify(payload) + ')';

    if (g.document && g.document.body) {
      try {
        var ok = g.eval(script);
        api.log('Mrr: renderer injection = ' + ok);
      } catch (e) { api.warn('Mrr: renderer inject failed: ' + e.message); }
      return;
    }

    try {
      var req = getRequire(g);
      var electron = req('electron');
      var wins = electron.BrowserWindow.getAllWindows();
      if (!wins.length) throw new Error('no windows');
      var ok = await wins[0].webContents.executeJavaScript(script, true);
      api.log('Mrr: executeJavaScript = ' + ok);
    } catch (e) {
      api.warn('Mrr: executeJavaScript failed: ' + e.message);
      if (api.ui && api.ui.toast) api.ui.toast('Mrr: инжект не удался', 'bad');
    }
  },

  async deactivate(api) {
    var g = tryEscape(api);
    if (!g) return;
    var cleanup = 'if (window.__mrrCleanup) window.__mrrCleanup();';
    if (g.document) { try { g.eval(cleanup); } catch (e) {} return; }
    try {
      var req = getRequire(g);
      var electron = req('electron');
      var win = electron.BrowserWindow.getAllWindows()[0];
      if (win) await win.webContents.executeJavaScript(cleanup);
    } catch (e) {}
  }
};