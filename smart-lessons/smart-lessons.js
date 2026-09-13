/**
 * GCSE Revise - Smart Lessons Player
 * Guided step-by-step lessons generated from topic content.
 * Pure client-side, uses localStorage for completion tracking.
 */
(function() {
'use strict';

var KIND_ICON = { learn: '📖', example: '💡', try: '✏️', check: '✅', review: '🎯' };
var KIND_LABEL = { learn: 'Learn', example: 'Worked example', try: 'Try it', check: 'Check', review: 'Review' };

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function SmartLessonRenderer(containerSelector) {
  this.container = document.querySelector(containerSelector);
  this.steps = [];
  this.index = 0;
  this.meta = {};
}

SmartLessonRenderer.prototype.storageKey = function() {
  return 'gcserevise_lesson_done';
};

SmartLessonRenderer.prototype.isDone = function() {
  try {
    var done = JSON.parse(localStorage.getItem(this.storageKey()) || '{}');
    return !!done[this.lessonKey()];
  } catch (e) { return false; }
};

SmartLessonRenderer.prototype.markDone = function() {
  try {
    var done = JSON.parse(localStorage.getItem(this.storageKey()) || '{}');
    done[this.lessonKey()] = Date.now();
    localStorage.setItem(this.storageKey(), JSON.stringify(done));
  } catch (e) { /* storage unavailable */ }
};

SmartLessonRenderer.prototype.lessonKey = function() {
  return [this.meta.subject, this.meta.topic].join('|').toLowerCase();
};

SmartLessonRenderer.prototype.loadLesson = function(url, meta) {
  var self = this;
  self.meta = meta || {};
  return fetch(url).then(function(r) {
    if (!r.ok) {
      // Board variants share content: fall back to the AQA pack.
      var fallbackUrl = url.replace(
        /(\/gcserevise\/[a-z-]+\/[a-z0-9-]+-)(edexcel|ocr|eduqas|ccea)(?=-)/, '$1aqa');
      if (fallbackUrl !== url) return fetch(fallbackUrl).then(function(r2) {
        if (!r2.ok) throw new Error('HTTP ' + r2.status);
        return r2.json();
      });
      throw new Error('HTTP ' + r.status);
    }
    return r.json();
  }).then(function(data) {
    self.steps = (data.steps || []).filter(function(s) { return s && s.title && s.body; });
    self.index = 0;
    return self.steps;
  }).catch(function() {
    self.steps = [];
    return [];
  });
};

SmartLessonRenderer.prototype.render = function() {
  var self = this;
  if (!this.container) return;
  if (!this.steps.length) {
    this.container.innerHTML = '<p class="lesson-empty">Smart lesson coming soon for this topic.</p>';
    return;
  }
  var step = this.steps[this.index];
  var pct = Math.round(((this.index + 1) / this.steps.length) * 100);
  var dots = this.steps.map(function(s, i) {
    return '<span class="lesson-dot' + (i === self.index ? ' active' : '') +
      (i < self.index ? ' seen' : '') + '" data-i="' + i + '"></span>';
  }).join('');
  var last = this.index === this.steps.length - 1;
  this.container.innerHTML =
    '<div class="lesson-player">' +
    '<div class="lesson-progress"><div class="lesson-progress-fill" style="width:' + pct + '%"></div></div>' +
    '<div class="lesson-step-count">Step ' + (this.index + 1) + ' of ' + this.steps.length +
    (this.isDone() ? ' <span class="lesson-done-badge">✓ completed</span>' : '') + '</div>' +
    '<div class="lesson-dots">' + dots + '</div>' +
    '<div class="lesson-card"><div class="lesson-kind">' +
    (KIND_ICON[step.kind] || '📖') + ' ' + esc(KIND_LABEL[step.kind] || step.kind) +
    '</div><h3 class="lesson-title">' + esc(step.title) + '</h3>' +
    '<p class="lesson-body">' + esc(step.body) + '</p></div>' +
    '<div class="lesson-nav">' +
    '<button id="lesson-back"' + (this.index === 0 ? ' disabled' : '') + '>← Back</button>' +
    (last
      ? '<button id="lesson-finish">Finish lesson ✓</button>'
      : '<button id="lesson-next">Next →</button>') +
    '</div></div>';
  var back = document.getElementById('lesson-back');
  var next = document.getElementById('lesson-next');
  var finish = document.getElementById('lesson-finish');
  if (back) back.addEventListener('click', function() {
    if (self.index > 0) { self.index--; self.render(); }
  });
  if (next) next.addEventListener('click', function() {
    if (self.index < self.steps.length - 1) { self.index++; self.render(); }
  });
  if (finish) finish.addEventListener('click', function() {
    self.markDone(); self.render();
  });
  this.container.querySelectorAll('.lesson-dot').forEach(function(d) {
    d.addEventListener('click', function() {
      self.index = parseInt(d.getAttribute('data-i'), 10); self.render();
    });
  });
};

function parseTopicFromPath(path) {
  var n = path.match(/\/topics\/([^/]+)\/([^/]+)\.html$/);
  if (n) return { subject: n[1], topic: n[2] };
  return null;
}

function initTopicLessons() {
  var container = document.getElementById('smart-lesson-container');
  if (!container) return;
  var info = parseTopicFromPath(window.location.pathname);
  if (!info) return;
  var url = '/alevelrevise/smart-lessons/' + info.subject + '-' + info.topic + '.json';
  var renderer = new SmartLessonRenderer('#smart-lesson-container');
  renderer.loadLesson(url, info).then(function() { renderer.render(); });
}

document.addEventListener('DOMContentLoaded', initTopicLessons);

window.GCSESmartLessons = { SmartLessonRenderer: SmartLessonRenderer };
})();
