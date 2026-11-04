import { percentage, scoreProject } from './model.mjs';

const dashboard = document.querySelector('#dashboard');
const status = document.querySelector('#load-status');
const refreshButton = document.querySelector('.refresh-button');
const themeButton = document.querySelector('.theme-toggle');
const dialog = document.querySelector('.reader');
const menu = document.querySelector('.mobile-menu');
const sidebar = document.querySelector('.sidebar');
let project;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function meter(score, label, style = 'mini-meter') {
  if (score === null) return '';
  return `<span class="${style}" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuenow="${Math.round(score * 100) / 100}"><span style="width:${score}%"></span></span>`;
}

function timeline({ startDate, timeZone }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return 'Start date pending';
  const start = new Date(startDate);
  if (!Number.isFinite(+start) || start.toISOString().slice(0, 10) !== startDate) return 'Start date pending';
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: timeZone || 'UTC' }).format(new Date());
  const days = Math.max(0, Math.round((Date.parse(today) - start.getTime()) / 86400000));
  return `<span>Started <time datetime="${startDate}">${startDate}</time></span><span>${days} calendar ${days === 1 ? 'day' : 'days'} elapsed</span>`;
}

function checklist(area) {
  if (!area.checks.length) return '<p>Checklist pending.</p>';
  return `<ul class="audit-checks">${area.checks.map(check => {
    const url = /^https:\/\/[^\s]+$/i.test(check.url || '') ? check.url : '';
    return `<li><span class="check-state ${check.state}">${check.state}</span><div><b>${escapeHtml(check.title)}</b>
      ${check.evidence ? `<p>${escapeHtml(check.evidence)}</p>` : ''}
      ${url ? `<a class="textbutton" href="${escapeHtml(url)}">View evidence</a>` : ''}</div></li>`;
  }).join('')}</ul>`;
}

function render(data) {
  const { areas, overall, milestone = {}, focus = {}, dependencies = [], history = [], sequence = [] } = data;
  const art = /^assets\/[\w/.-]+\.(avif|jpe?g|png|webp)$/i.test(data.heroImage || '') && !data.heroImage.includes('..')
    ? data.heroImage : '';
  const rows = areas.map((area, index) => {
    const statusClass = area.score === 100 ? 'confirmed' : area.resolved ? 'partial' : 'unconfirmed';
    const label = area.score === null ? 'Checklist pending' : area.score === 100 ? 'Complete' : area.resolved ? 'In progress' : 'Open';
    return `<tr><td class="area-number">${index + 1}</td><th scope="row"><button class="area-title" data-area="${index}">${escapeHtml(area.name)}</button></th>
      <td><span class="status-pill ${statusClass}">${label}</span></td><td><div class="table-coverage"><strong>${escapeHtml(percentage(area.score))}</strong>${meter(area.score, area.name)}</div></td></tr>`;
  }).join('');
  const ordered = sequence.map(id => areas.findIndex(area => area.id === id)).filter(index => index >= 0);
  const steps = ordered.map((index, position) => {
    const { name, score } = areas[index];
    return `<button class="sequence-row" data-area="${index}"><span class="sequence-id">${position + 1}</span><span class="sequence-name">${escapeHtml(name)}</span>
      <strong>${escapeHtml(percentage(score))}</strong>${meter(score, name)}</button>`;
  }).join('');
  const dateMarkup = timeline(data);
  document.title = data.name + ' · Project Progress';
  document.querySelector('#brand').textContent = data.mark || 'P / D';
  document.querySelector('#project-name').textContent = data.name;
  dashboard.innerHTML = `
    <section id="overview" class="hero ${art ? 'has-art' : ''}">
      ${art ? `<img class="hero-art" src="./${escapeHtml(art)}" alt="">` : ''}
      <div class="hero-copy"><p class="eyebrow">${escapeHtml(milestone.name || 'PROJECT PROGRESS')}</p>
        <h1>${escapeHtml(data.headline || data.name)}</h1><strong class="overall-number">${escapeHtml(percentage(overall))}</strong>
        <p class="hero-label">Overall checklist completion</p>${meter(overall, 'Overall checklist completion', 'goal-meter')}
        <p class="hero-caption">${overall === null ? 'Add a checklist to every planning area to calculate progress.' : 'Each planning area contributes equally.'}</p>
      </div>
    </section>
    <div class="project-timeline">${dateMarkup}</div>
    <div class="overview-grid">
      <section id="systems">
        <div class="section-title"><h2>Planning areas</h2><span>${areas.length} total</span></div>
        ${rows ? `<div class="table-scroll" tabindex="0" role="region" aria-label="Planning area progress"><table class="planning-table">
          <thead><tr><th scope="col">#</th><th scope="col">Planning area</th><th scope="col">Status</th><th scope="col">Progress</th></tr></thead><tbody>${rows}</tbody>
        </table></div>` : '<p>Add your first planning area to get started.</p>'}
      </section>
      <div class="context-column">
        <section class="mission-panel"><p class="eyebrow">CURRENT FOCUS</p><h2>${escapeHtml(focus.title || 'Focus pending')}</h2><p class="mission-next">${escapeHtml(focus.next || 'Record the next action in your project plan.')}</p></section>
        <section class="current-sequence"><h2>Current sequence</h2>${steps || '<p>Sequence pending.</p>'}</section>
        <section class="draft-readiness"><h2>Milestone readiness</h2><p class="readiness-status">${escapeHtml(milestone.status || 'Status pending')}</p><p class="checkpoint-note">${escapeHtml(milestone.criteria)}</p></section>
      </div>
    </div>
    <section id="milestones" class="detail-section milestones-section"><div class="section-title"><h2>Milestone history</h2></div>
      ${history.length ? `<div class="milestone-trail" tabindex="0" role="region" aria-label="Milestone history">${history.map(item => `<article><small>${escapeHtml(item.date)}</small><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.detail)}</p></article>`).join('')}</div>` : '<p>No milestones recorded yet.</p>'}
    </section>
    <section id="gates" class="detail-section"><div class="section-title"><h2>Dependencies and blockers</h2></div>
      ${dependencies.length ? `<div class="gate-grid">${dependencies.map(item => `<article><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.detail)}</p></article>`).join('')}</div>` : '<p>No dependencies recorded.</p>'}
    </section>
    <section id="evidence" class="detail-section baseline-evidence"><h2>Checklist evidence</h2>
      ${areas.map(area => `<details><summary>${escapeHtml(area.name)} <span>${area.resolved} of ${area.checks.length} resolved</span></summary>${checklist(area)}</details>`).join('')}
    </section>`;
}

async function refresh() {
  if (refreshButton.disabled) return;
  refreshButton.disabled = true;
  try {
    const response = await fetch('./project.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Project data unavailable');
    const next = scoreProject(await response.json());
    if (JSON.stringify(next) !== JSON.stringify(project)) render(next);
    project = next;
    status.textContent = next.isExample ? 'Fictional sample data · replace with your project checklist' : 'Showing saved project data';
  } catch {
    status.textContent = project ? 'Refresh failed · showing the last loaded checklist' : 'Project data could not be loaded. Check the saved checklist and try Refresh.';
  } finally {
    refreshButton.disabled = false;
  }
}

function setMenu(open) {
  sidebar.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
  if (open) sidebar.querySelector('a').focus();
}

menu.addEventListener('click', () => setMenu(!sidebar.classList.contains('is-open')));
sidebar.addEventListener('click', event => {
  if (!event.target.closest('a') || !sidebar.classList.contains('is-open')) return;
  setMenu(false);
  menu.focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && sidebar.classList.contains('is-open')) {
    setMenu(false);
    menu.focus();
  }
});
dashboard.addEventListener('click', event => {
  const button = event.target.closest('[data-area]');
  if (!button) return;
  const area = project.areas[Number(button.dataset.area)];
  dialog.querySelector('h2').textContent = area.name;
  dialog.querySelector('#detail-content').innerHTML = `<p>${area.resolved} of ${area.checks.length} resolved</p>${meter(area.score, area.name, 'system-progress-track')}${checklist(area)}`;
  dialog.showModal();
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  themeButton.setAttribute('aria-checked', String(theme === 'dark'));
  themeButton.textContent = theme === 'dark' ? 'Dark' : 'Light';
}

setTheme(document.documentElement.dataset.theme || 'light');
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('project-dashboard-theme', theme); } catch {}
});
refreshButton.addEventListener('click', refresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(() => { if (!document.hidden) refresh(); }, 60000);
refresh();
