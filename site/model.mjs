export const states = ['resolved', 'open', 'deferred', 'unverified'];

export function scoreProject(project) {
  if (!project?.name?.trim() || !Array.isArray(project.areas)) {
    throw new Error('A project name and planning areas are required.');
  }
  const ids = new Set();
  const areas = project.areas.map(area => {
    if (!area.id || ids.has(area.id) || !area.name || !Array.isArray(area.checks)) {
      throw new Error('Each planning area needs a unique ID, name, and checklist.');
    }
    ids.add(area.id);
    if (area.checks.some(check => !check.title || !states.includes(check.state))) {
      throw new Error('Each checklist item needs a title and a supported state.');
    }
    const resolved = area.checks.filter(check => check.state === 'resolved').length;
    const score = area.checks.length ? 100 * resolved / area.checks.length : null;
    return { ...area, resolved, score };
  });
  const overall = areas.length && areas.every(area => area.score !== null)
    ? areas.reduce((total, area) => total + area.score, 0) / areas.length
    : null;
  return { ...project, areas, overall };
}

export function percentage(score) {
  if (score === null) return '—';
  const rounded = Math.round(score);
  if (score > 0 && rounded === 0) return '<1%';
  if (score < 100 && rounded === 100) return '>99%';
  return rounded + '%';
}
