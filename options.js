function $(e){return document.getElementById(e)}

function storeNot(){
  chrome.storage.local.set({not: $('not').checked})
}
function storeNotAds(){
  chrome.storage.local.set({notAds: $('notAds').checked})
}

chrome.storage.local.get("not", function(r){$('not').checked=r.not});
chrome.storage.local.get("notAds", function(r){$('notAds').checked=r.notAds});
chrome.storage.local.get("popupsTamed", function(r){$('popupsTamed').innerText=r.popupsTamed === undefined || r.popupsTamed === null || isNaN(r.popupsTamed)?0:r.popupsTamed});
chrome.storage.local.get("skipAdClicked", function(r){$('skipAdClicked').innerText=r.skipAdClicked === undefined || r.skipAdClicked === null || isNaN(r.skipAdClicked)?0:r.skipAdClicked});

$('pages_u').href=chrome.runtime.getURL("update.html?v="+chrome.runtime.getManifest().version)
$('pages_i').href=chrome.runtime.getURL("instal.html?v="+chrome.runtime.getManifest().version)

$('not').addEventListener("click", storeNot);
$('notAds').addEventListener("click", storeNotAds);

