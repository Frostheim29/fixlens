const issueData = {
  slow: {
    label: 'Slow laptop',
    questions: [
      { id: 'when', label: 'When does it feel slow?', options: [['startup','Mostly during startup'],['always','Almost all the time'],['specific','Only in one app'],['heat','When it gets hot']], hint: 'This helps distinguish startup load from an app-specific or heat-related issue.' },
      { id: 'recent', label: 'Did anything change recently?', options: [['nothing','No, nothing obvious'],['install','Installed an app or update'],['many','Many apps/tabs are open'],['storage','Storage is nearly full']] },
      { id: 'fan', label: 'Is the laptop unusually hot or loud?', options: [['no','No'],['yes','Yes, hot or fan is loud'],['unsure','Not sure']] }
    ]
  },
  wifi: {
    label: 'Wi-Fi issues',
    questions: [
      { id: 'scope', label: 'Which devices are affected?', options: [['laptop','Only this laptop'],['all','All devices on this Wi-Fi'],['unsure','I haven’t checked']], hint: 'Checking another device helps separate laptop issues from router or service issues.' },
      { id: 'symptom', label: 'What happens when you connect?', options: [['none','Network is missing'],['connect','Won’t connect / says no internet'],['drop','Connects, then disconnects'],['slow','Connected, but very slow']] },
      { id: 'recent', label: 'Did this start recently?', options: [['sudden','Yes, suddenly'],['update','After an update or settings change'],['ongoing','It has happened for a while']] }
    ]
  },
  crash: {
    label: 'App keeps crashing',
    questions: [
      { id: 'scope', label: 'How many apps are affected?', options: [['one','Just one app'],['several','Several apps'],['startup','An app crashes on launch']] },
      { id: 'when', label: 'When does it usually crash?', options: [['launch','As soon as it opens'],['action','After a specific action'],['random','Randomly / after some time']] },
      { id: 'recent', label: 'Was there a recent change?', options: [['update','App or Windows update'],['install','New app / plugin installed'],['none','No known change'],['space','Low disk space warning']] }
    ]
  }
};

const optionLabels = Object.fromEntries(Object.entries(issueData).map(([key, data]) => [key, Object.fromEntries(data.questions.map(q => [q.id, Object.fromEntries(q.options.map(([value, label]) => [value, label]))]))]));
let selectedIssue = 'slow';
let lastReport = null;
let toastTimer;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function renderQuestions() {
  const data = issueData[selectedIssue];
  $('#questions-container').innerHTML = data.questions.map((q, index) => `
    <div class="question-field ${q.hint ? 'full' : ''}">
      <label for="q-${q.id}">${index + 1}. ${q.label}</label>
      <select id="q-${q.id}" name="${q.id}" required>
        <option value="">Choose an answer…</option>
        ${q.options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
      </select>
      ${q.hint ? `<div class="field-hint">${q.hint}</div>` : ''}
    </div>`).join('');
  $$('#questions-container select').forEach(el => el.addEventListener('change', updateProgress));
  updateProgress();
}

function updateProgress() {
  const selects = $$('#questions-container select');
  const answered = selects.filter(el => el.value).length;
  $('#overview-issue').textContent = issueData[selectedIssue].label;
  $('#overview-answered').textContent = `${answered} of ${selects.length}`;
  $('#mini-progress-fill').style.width = `${selects.length ? answered / selects.length * 100 : 0}%`;
}

function selectIssue(issue) {
  selectedIssue = issue;
  $$('.issue-card').forEach(card => {
    const active = card.dataset.issue === issue;
    card.classList.toggle('selected', active);
    card.setAttribute('aria-pressed', String(active));
  });
  $('#results-section').classList.add('hidden');
  $('#crumb-current').textContent = 'New diagnosis';
  renderQuestions();
}

function readAnswers() {
  return Object.fromEntries($$('#questions-container select').map(el => [el.name, el.value]));
}

function buildReport(issue, answers) {
  if (issue === 'slow') {
    if (answers.when === 'specific') return { title: 'The issue may be isolated to one application', description: 'Because the slowdown happens in one app, start by checking that app’s updates, extensions, and resource usage before changing system-wide settings.', confidence: 'High for a focused check', score: 78, steps: [
      step('Close and reopen the affected app', 'Save your work first, fully close the app, then reopen it. Check whether the slowdown returns.', 'EASY'),
      step('Check for an app update', 'Use the app’s built-in updater or its official website/store. Avoid third-party download sites.', 'EASY'),
      step('Try a clean, minimal session', 'Close optional extensions or plugins if the app supports it. Change one thing at a time so you can identify what helps.', 'EASY'),
      step('Check whether other apps behave normally', 'If multiple apps also become slow, revisit system resources or seek further support.', 'VERIFY')
    ]};
    if (answers.when === 'startup' || answers.recent === 'many') return { title: 'Startup load or background activity may be contributing', description: 'The pattern you selected can happen when many programs start together or several apps compete for memory and processor time. This is a likely direction, not a confirmed cause.', confidence: 'Moderate', score: 62, steps: [
      step('Save your work and restart once', 'A normal restart can clear temporary issues. Save open files first and choose Restart from the power menu.', 'EASY'),
      step('Review active apps', 'Open Task Manager with Ctrl + Shift + Esc. In Processes, sort by CPU or Memory to see what is using resources. Do not end unfamiliar system processes.', 'EASY'),
      step('Close apps you recognize and do not need', 'Close only apps you opened or recognize. Check whether performance improves before changing anything else.', 'EASY'),
      step('Review startup apps carefully', 'In Task Manager, open Startup apps and disable only nonessential apps you recognize. If unsure, leave the setting unchanged.', 'OPTIONAL')
    ]};
    if (answers.fan === 'yes' || answers.when === 'heat') return { title: 'Heat or sustained workload may be affecting performance', description: 'A hot chassis or loud fan can indicate heavy workload or restricted airflow. It does not by itself prove a hardware fault.', confidence: 'Moderate', score: 66, steps: [
      step('Move the laptop to a hard, flat surface', 'Keep air vents unobstructed. Avoid using the laptop on bedding or soft fabric.', 'EASY'),
      step('Close demanding apps and save work', 'Check whether the fan settles and performance improves after workload drops.', 'EASY'),
      step('Let the laptop cool naturally', 'If it is very hot, shut it down normally and let it cool. Do not place it in a fridge or use liquids.', 'SAFETY'),
      step('Check manufacturer guidance if overheating repeats', 'Repeated overheating, burning smells, battery swelling, or unexpected shutdowns need professional support. Stop using a device with a swollen battery.', 'VERIFY')
    ]};
    if (answers.recent === 'storage') return { title: 'Low available storage may be part of the slowdown', description: 'Low disk space can affect updates and some tasks. Confirm available storage before deleting anything.', confidence: 'Moderate', score: 60, steps: [
      step('Check available storage', 'Open Settings → System → Storage and review the available space.', 'EASY'),
      step('Use Windows temporary-file cleanup carefully', 'Review the categories before removing files. Do not select Downloads or personal files unless you have checked them.', 'SAFETY'),
      step('Empty the Recycle Bin only after reviewing it', 'Make sure there is nothing you need to restore before emptying it.', 'OPTIONAL'),
      step('Restart and check performance again', 'After freeing space, restart normally and see whether the issue improves.', 'VERIFY')
    ]};
    return { title: 'System resource usage is a useful first check', description: 'Slow performance has several possible causes. A quick resource check is a safe first step before making bigger changes.', confidence: 'Moderate', score: 54, steps: [
      step('Restart the laptop normally', 'Save open work, then use Start → Power → Restart.', 'EASY'),
      step('Open Task Manager', 'Press Ctrl + Shift + Esc and review CPU, Memory, and Disk usage under Processes.', 'EASY'),
      step('Close only apps you recognize', 'Quit unnecessary browser tabs and applications. Do not end unfamiliar Windows processes.', 'SAFETY'),
      step('Check for updates through Windows Settings', 'Install pending updates when convenient and restart if requested. Keep the laptop plugged in during major updates.', 'VERIFY')
    ]};
  }
  if (issue === 'wifi') {
    if (answers.scope === 'all') return { title: 'The router or internet service may be the shared point of failure', description: 'If several devices are affected, the issue may be beyond this laptop. Check the connection before changing laptop settings.', confidence: 'Moderate to high', score: 74, steps: [
      step('Check the router’s status lights', 'Look for the normal internet/online indicator described in the router manual. Do not press the reset pin.', 'EASY'),
      step('Check whether your internet provider reports an outage', 'Use the provider’s official app or status page, or ask someone on another connection to check.', 'EASY'),
      step('Power-cycle the router only if appropriate', 'If you control the router and nobody depends on an active connection, follow the provider’s restart instructions. Do not factory-reset it.', 'OPTIONAL'),
      step('Contact the provider if all devices remain offline', 'Share the outage status and router indicator pattern with official support.', 'VERIFY')
    ]};
    if (answers.symptom === 'none') return { title: 'The laptop may not be detecting the expected network', description: 'A missing network can be caused by range, router settings, Wi-Fi being disabled, or a temporary adapter issue.', confidence: 'Moderate', score: 61, steps: [
      step('Check Wi-Fi is switched on', 'Open Quick Settings and confirm Wi-Fi is enabled and Airplane mode is off.', 'EASY'),
      step('Move closer to the router', 'Check whether the network appears when you are closer. Walls and distance can weaken a signal.', 'EASY'),
      step('Refresh the available network list', 'Turn Wi-Fi off, wait a few seconds, turn it on, then check the list again.', 'EASY'),
      step('Restart the laptop if the network is still missing', 'If only this laptop cannot see any network, consult official device support before changing drivers.', 'VERIFY')
    ]};
    if (answers.symptom === 'drop' || answers.recent === 'sudden') return { title: 'A temporary adapter or signal issue may be causing disconnects', description: 'Frequent drops can be related to signal strength, a router issue, or the laptop’s network adapter. Test the simplest causes first.', confidence: 'Moderate', score: 63, steps: [
      step('Check whether other devices stay connected', 'If they also disconnect, focus on the router or service rather than changing this laptop.', 'EASY'),
      step('Move closer to the router and retest', 'If the connection becomes stable nearby, signal strength may be a factor.', 'EASY'),
      step('Toggle Wi-Fi and reconnect', 'Turn Wi-Fi off briefly, turn it back on, and reconnect to your usual network.', 'EASY'),
      step('Run the built-in network troubleshooter', 'Open Settings and search for Network troubleshooter or Get Help. Follow official Windows prompts.', 'VERIFY')
    ]};
    return { title: 'Separate a laptop connection issue from an internet issue', description: 'A connection can be active while internet access is unavailable or slow. Compare another device and try a safe reconnect before resetting network settings.', confidence: 'Moderate', score: 60, steps: [
      step('Check another device on the same Wi-Fi', 'Try opening a familiar website on another phone or laptop.', 'EASY'),
      step('Reconnect to the network', 'Select the Wi-Fi network, disconnect, then reconnect using your normal password. Never share that password with a diagnostic tool.', 'EASY'),
      step('Open the Windows network troubleshooter', 'Use Settings or search for Get Help and follow the network prompts.', 'EASY'),
      step('Avoid network resets for now', 'Network reset can remove saved network settings. Use it only after reviewing official instructions or getting support.', 'SAFETY')
    ]};
  }
  if (answers.scope === 'several') return { title: 'A wider system issue may be affecting multiple apps', description: 'If several apps are crashing, check for a pending restart, available storage, and Windows updates before troubleshooting each app separately.', confidence: 'Moderate', score: 62, steps: [
    step('Save work and restart Windows', 'A normal restart can clear temporary issues and complete pending updates.', 'EASY'),
    step('Check for available storage', 'Open Settings → System → Storage. Avoid deleting personal files just to free space.', 'EASY'),
    step('Check Windows Update', 'Open Settings → Windows Update and review the status. Use official updates only.', 'EASY'),
    step('Record any error message', 'Write down the exact error or take a screenshot after hiding personal information. Use it when consulting official support.', 'VERIFY')
  ]};
  if (answers.when === 'launch' || answers.scope === 'one') return { title: 'The issue may be specific to this application', description: 'An app that crashes on launch or fails while others work may have a damaged update, configuration, or compatibility issue.', confidence: 'Moderate to high', score: 70, steps: [
    step('Restart the app and check for an error message', 'Save any available work, reopen the app, and note the exact message if it fails again.', 'EASY'),
    step('Check for an official app update', 'Use the app’s own updater, Microsoft Store, or the publisher’s official website.', 'EASY'),
    step('Restart Windows', 'Save work and perform a normal restart before testing again.', 'EASY'),
    step('Use the app’s built-in repair option if available', 'Review the app publisher’s instructions before resetting or reinstalling. Back up important app data first.', 'VERIFY')
  ]};
  return { title: 'A recent change may be related to the crash', description: 'If the crash began after an update, new app, or plugin, checking that change is a reasonable first step. The timing alone does not prove it caused the issue.', confidence: 'Moderate', score: 58, steps: [
    step('Record when the crash occurs', 'Note the app, what you were doing, and any error message. Avoid repeatedly triggering a crash if unsaved work is at risk.', 'EASY'),
    step('Check the app publisher’s support page', 'Look for known issues related to your app version or recent update.', 'EASY'),
    step('Install updates from official sources', 'Update the affected app if a fix is available. Avoid unofficial patches or driver-download sites.', 'EASY'),
    step('Consider repair or reinstall only after backing up', 'Reinstalling can remove local settings or data. Follow the publisher’s instructions and confirm your files are backed up first.', 'SAFETY')
  ]};
}

function step(title, description, tag) { return { title, description, tag }; }

function generateDiagnosis(event) {
  event.preventDefault();
  const form = $('#diagnostic-form');
  if (!form.reportValidity()) return;
  const answers = readAnswers();
  const report = buildReport(selectedIssue, answers);
  lastReport = { issue: selectedIssue, answers, report };
  renderReport(lastReport);
  $('#results-section').classList.remove('hidden');
  $('#crumb-current').textContent = 'Diagnostic report';
  $('#results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Your diagnostic report is ready.');
}

function renderReport({ issue, answers, report }) {
  $('#result-title').textContent = report.title;
  $('#result-description').textContent = report.description;
  $('#confidence-text').textContent = report.confidence;
  $('#confidence-fill').style.width = `${report.score}%`;
  const qMap = Object.fromEntries(issueData[issue].questions.map(q => [q.id, q.label]));
  $('#answer-summary').innerHTML = Object.entries(answers).map(([key, value]) => `<div class="answer-item"><span>${escapeHTML(qMap[key] || key)}</span><strong>${escapeHTML(optionLabels[issue][key][value] || value)}</strong></div>`).join('');
  $('#steps-list').innerHTML = report.steps.map((s, i) => `<div class="step-item" data-step="${i}"><input class="step-check" type="checkbox" aria-label="Mark ${escapeHTML(s.title)} complete"/><div class="step-content"><strong>${i + 1}. ${escapeHTML(s.title)}</strong><p>${escapeHTML(s.description)}</p></div><span class="step-tag">${escapeHTML(s.tag)}</span></div>`).join('');
  $$('.step-check').forEach(check => check.addEventListener('change', () => {
    check.closest('.step-item').classList.toggle('completed', check.checked);
    updateCompletion();
  }));
  updateCompletion();
  $('#copy-feedback').textContent = '';
}

function updateCompletion() {
  const checks = $$('.step-check');
  const done = checks.filter(c => c.checked).length;
  $('#completion-count').textContent = `${done}/${checks.length}`;
  $('#completion-fill').style.width = `${checks.length ? done / checks.length * 100 : 0}%`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function resetAll() {
  $('#diagnostic-form').reset();
  $('#results-section').classList.add('hidden');
  lastReport = null;
  $('#crumb-current').textContent = 'New diagnosis';
  renderQuestions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyReport() {
  if (!lastReport) return;
  const { issue, answers, report } = lastReport;
  const qMap = Object.fromEntries(issueData[issue].questions.map(q => [q.id, q.label]));
  const lines = [
    `FixLens diagnostic report — ${new Date().toLocaleString()}`,
    `Issue: ${issueData[issue].label}`,
    `Likely direction: ${report.title}`,
    `Guidance confidence: ${report.confidence}`,
    report.description,
    '', 'Answers:', ...Object.entries(answers).map(([key, value]) => `- ${qMap[key]}: ${optionLabels[issue][key][value] || value}`),
    '', 'Recommended actions:', ...report.steps.map((s, i) => `${i + 1}. ${s.title} [${s.tag}]\n   ${s.description}`),
    '', 'Note: Rule-based guidance only; this is not a confirmed diagnosis.'
  ];
  const text = lines.join('\n');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => { $('#copy-feedback').textContent = 'Report copied to clipboard.'; showToast('Report copied.'); }).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}

function fallbackCopy(text) {
  const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select();
  try { document.execCommand('copy'); $('#copy-feedback').textContent = 'Report copied to clipboard.'; showToast('Report copied.'); }
  catch { $('#copy-feedback').textContent = 'Copy was blocked by the browser. Select and copy the report from the page manually.'; }
  area.remove();
}

function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

$$('.issue-card').forEach(card => card.addEventListener('click', () => selectIssue(card.dataset.issue)));
$('#diagnostic-form').addEventListener('submit', generateDiagnosis);
$('#reset-btn').addEventListener('click', () => { $('#diagnostic-form').reset(); renderQuestions(); showToast('Answers reset.'); });
$('#new-diagnosis-btn').addEventListener('click', () => { resetAll(); $('#diagnosis-section').scrollIntoView({ behavior: 'smooth' }); });
$('#edit-answers-btn').addEventListener('click', () => { $('#diagnosis-section').scrollIntoView({ behavior: 'smooth' }); });
$('#copy-report-btn').addEventListener('click', copyReport);
$('#nav-new').addEventListener('click', () => { resetAll(); $('#hero').scrollIntoView({ behavior: 'smooth' }); });
$('#nav-how').addEventListener('click', () => { document.querySelector('.safety-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); showToast('FixLens uses symptom-based rules in this prototype.'); });
renderQuestions();
