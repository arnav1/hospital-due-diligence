(function () {
  const form = document.getElementById('dd-form');
  const results = document.getElementById('results');

  function getFormState() {
    const data = new FormData(form);
    const state = data.get('state');
    const services = data.getAll('services');
    return { country: 'IN', state, services };
  }

  // Evaluate a single condition block
  function matches(ctx, cond) {
    if (cond.countryIs) return ctx.country === cond.countryIs;
    if (cond.stateIn) return cond.stateIn.includes(ctx.state);
    if (cond.serviceIn) return cond.serviceIn.some(s => ctx.services.includes(s));
    if (cond.allOf) return cond.allOf.every(c => matches(ctx, c));
    if (cond.anyOf) return cond.anyOf.some(c => matches(ctx, c));
    return false;
  }

  function ruleApplies(ctx, rule) {
    // applies_if is an array of condition groups; if any group matches, rule applies
    if (!rule.applies_if || rule.applies_if.length === 0) return true;
    return rule.applies_if.some(cond => matches(ctx, cond));
  }

  function renderChecklist(ctx, rules) {
    if (!rules.length) return '<p>No requirements matched. Adjust inputs.</p>';
    const items = rules.map(r => {
      let label = r.name;
      let authority = r.authority || '';
      if (r.variant_by_state && r.variant_by_state[ctx.state]) {
        label = r.variant_by_state[ctx.state].label || label;
        authority = r.variant_by_state[ctx.state].authority || authority;
      }
      const docs = (r.documents || []).map(d => `<li>${d}</li>`).join('');
      const source = r.source_url ? `<a href="${r.source_url}" target="_blank" rel="noopener">Source</a>` : '';
      return `
        <li class="card">
          <h3>${label}</h3>
          <p><strong>Authority:</strong> ${authority || '—'}</p>
          ${r.notes ? `<p>${r.notes}</p>` : ''}
          ${source}
          <details>
            <summary>Documents</summary>
            <ul>${docs}</ul>
          </details>
        </li>`;
    }).join('');

    return `
      <h2>Checklist</h2>
      <ol>${items}</ol>
      <button id="savePlan">Save this plan</button>
      <button id="printPlan">Print / PDF</button>
    `;
  }

  function savePlan(ctx, rules) {
    const payload = { ctx, rules, savedAt: new Date().toISOString() };
    localStorage.setItem('dd_plan', JSON.stringify(payload));
    alert('Saved to your browser.');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ctx = getFormState();
    const matched = window.RULES.filter(r => ruleApplies(ctx, r));
    results.innerHTML = renderChecklist(ctx, matched);
    document.getElementById('savePlan').onclick = () => savePlan(ctx, matched);
    document.getElementById('printPlan').onclick = () => window.print();
  });
})();
