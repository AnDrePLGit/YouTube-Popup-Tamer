function handleInstalled(d) {
  let instalUrl
  if (d.temporary) return;
  switch (d.reason) {
    case "install":
      instalUrl = chrome.runtime.getURL("instal.html?v="+chrome.runtime.getManifest().version);
      chrome.tabs.create({ url:instalUrl });
      break;
    case "update":
      instalUrl = chrome.runtime.getURL("update.html?v="+chrome.runtime.getManifest().version);
      chrome.tabs.create({ url:instalUrl });
      break;
  }
}

chrome.runtime.onInstalled.addListener(handleInstalled);