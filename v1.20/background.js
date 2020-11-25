let options = {}, allMonths = {}, currentMonth = {}, currentDate = getCurrentDate(), lastMonth

/* --- convert start --- */
/*if(chrome.runtime.getManifest().version=='1.12'){
  chrome.storage.local.set({not: 12})
  chrome.storage.local.set({notAds: 22})
  chrome.storage.local.set({popupsTamed: 32})
  chrome.storage.local.set({skipAdClicked: 42})
}*/

function convertV112(){
  chrome.storage.local.get(["not", "notAds", "popupsTamed", "skipAdClicked"], responseV112);
  chrome.storage.local.remove(["not", "notAds", "popupsTamed", "skipAdClicked"])
}
function responseV112(r) {
  if (r.not) options.dontShowBox = r.not
  if (r.notAds) options.dontSkipAds = r.notAds
  if (r.popupsTamed){
    allMonths.popupsTamed = r.popupsTamed
    currentMonth.popupsTamed = r.popupsTamed
  }
  if (r.skipAdClicked){
    allMonths.skipAdClicked = r.skipAdClicked
    currentMonth.skipAdClicked = r.skipAdClicked
  }
  chrome.storage.local.set({options: options})
  chrome.storage.local.set({'allMonths': allMonths})
  chrome.storage.local.set({[currentDate]: currentMonth})
}
/* --- convert stop --- */

chrome.storage.local.get(['options', 'allMonths', currentDate, 'lastMonth'], function(r) {
  options = r.options?r.options:{dontShowBox: false, dontSkipAds: false}
  allMonths = r.allMonths?r.allMonths:{popupsTamed: 0, skipAdClicked: 0}
  currentMonth = r[currentDate]?r[currentDate]:{popupsTamed: 0, skipAdClicked: 0}
  if (!r.lastMonth){
    lastMonth = currentDate
    chrome.storage.local.set({lastMonth: lastMonth})
  }
  else if (r.lastMonth != currentDate){
    //log(r.lastMonth+' '+currentDate)
    //instalUrl = chrome.runtime.getURL("month.html?v="+chrome.runtime.getManifest().version)
    //chrome.tabs.create({ url: instalUrl })
    lastMonth = currentDate
    chrome.storage.local.set({lastMonth: lastMonth})
  }
})

/* --- messages start --- */
function handleMessage(message, sender, sendResponse) {//sendResponse was called synchronously. If you want to asynchronously use sendResponse, add return true; to the onMessage event handler.
  //log(message)
  if (message.action == 'options'){
    if (message.type == 'get') sendResponse({status: "ok", content: options});
    else if (message.type == 'set') sendResponse({status: "error"});
  }
  else if (message.action == 'option'){
    if (message.type=='get') sendResponse(options[message.key]);
    else if (message.type == 'set') {
      options[message.key] = message.value
      chrome.storage.local.set({options: options})
      sendResponse({status: "ok"});
      chrome.tabs.query({url: "*://www.youtube.com/*"}, function(tabs) {
        let c=tabs.length
        for(let i=0;i<c;i++){
          chrome.tabs.sendMessage(tabs[i].id, {action: 'option', type: 'set', key: message.key, value: message.value})
        }
      })
    }
  }
  else if (message.action == 'blocked'){
    if (message.type == 'popup'){
      allMonths.popupsTamed++
      currentMonth.popupsTamed++
    }
    else if (message.type == 'skipad'){
      allMonths.skipAdClicked++
      currentMonth.skipAdClicked++
    }
    else log('Unknown type '+message.type)
    chrome.tabs.query({url: "*://www.youtube.com/*"}, function(tabs) {
      let c = tabs.length
      for(let i=0;i<c;i++){
        log("Sending to tab "+tabs[i].id)
        if (sender.tab.id != tabs[i].id) chrome.tabs.sendMessage(tabs[i].id, {action: 'allMonths', type: 'set', value: allMonths})
      }
    })
    chrome.storage.local.set({'allMonths': allMonths})
    chrome.storage.local.set({[currentDate]: currentMonth})
  }
  else if (message.action == 'allMonths'){
    if (message.type == 'get') sendResponse({response: "ok", content: allMonths})
    else if (message.type == 'set') sendResponse({response: "error"})
  }
  else log('Unknown action '+message.action)
}
/* --- messages stop --- */

function getCurrentDate(){
  let d=new Date(), m=d.getMonth()+1
  return d.getFullYear()+'-'+(m<10?'0'+m:m)
}

function handleInstalled(d) {
  let instalUrl
  if (d.temporary) return;
  switch (d.reason) {
    case "install":
      instalUrl = chrome.runtime.getURL("instal.html?v="+chrome.runtime.getManifest().version)
      chrome.tabs.create({ url: instalUrl })
      break;
    case "update":
      if (d.previousVersion == '1.12') convertV112()
      instalUrl = chrome.runtime.getURL("update.html?v="+chrome.runtime.getManifest().version)
      chrome.tabs.create({ url: instalUrl })
      break;
  }
}

chrome.runtime.onInstalled.addListener(handleInstalled)
chrome.runtime.onMessage.addListener(handleMessage)

function log(m){
  console.log(m)
  return false
}