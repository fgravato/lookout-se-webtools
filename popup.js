const TARGET_URL = 'https://mtp.lookout.com/les/api/public/v1/console/cache';

const dot       = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const btn        = document.getElementById('btn-connect');
const btnIcon    = document.getElementById('btn-icon');
const btnLabel   = document.getElementById('btn-label');

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const url = tab?.url || '';
  const onTarget = url.startsWith(TARGET_URL) || url.includes('/les/api/public/v1/console/cache');
  const onLookout = url.includes('lookout.com');

  if (onTarget) {
    dot.className = 'active';
    statusText.textContent = 'Feature flags page is open.';
    btn.classList.add('on-page');
    btnIcon.textContent = '↺';
    btnLabel.textContent = 'Reload Feature Flags';
    btn.onclick = () => {
      chrome.tabs.reload(tab.id);
      window.close();
    };
  } else if (onLookout) {
    dot.className = 'inactive';
    statusText.textContent = 'On lookout.com — click to open the feature flags endpoint.';
    btn.onclick = () => {
      chrome.tabs.update(tab.id, { url: TARGET_URL });
      window.close();
    };
  } else {
    dot.className = 'inactive';
    statusText.textContent = 'Not on lookout.com. Opens in a new tab.';
    btn.onclick = () => {
      chrome.tabs.create({ url: TARGET_URL });
      window.close();
    };
  }
});
