chrome.runtime.sendMessage({action: 'options', type: 'get'}, setOptions)
chrome.runtime.sendMessage({action: 'allMonths', type: 'get'}, setallMonths)

function setOptions(response){
  let r = response.content
  $('dontShowBox').checked=r.dontShowBox
  $('dontSkipAds').checked=r.dontSkipAds
}

function setallMonths(response){
  let r = response.content
  $('popupsTamed').checked=r.popupsTamed
  $('skipAdClicked').checked=r.skipAdClicked
}

$('pages_u').href=chrome.runtime.getURL("update.html?v="+chrome.runtime.getManifest().version)
$('pages_i').href=chrome.runtime.getURL("instal.html?v="+chrome.runtime.getManifest().version)
$('pages_r').href=chrome.runtime.getURL("month.html?v="+chrome.runtime.getManifest().version)

$('dontShowBox').addEventListener("click", function(){chrome.runtime.sendMessage({action: 'option', type: 'set', key: 'dontShowBox', value: this.checked})})
$('dontSkipAds').addEventListener("click", function(){chrome.runtime.sendMessage({action: 'option', type: 'set', key: 'dontSkipAds', value: this.checked})})

function $(e){return document.getElementById(e)}