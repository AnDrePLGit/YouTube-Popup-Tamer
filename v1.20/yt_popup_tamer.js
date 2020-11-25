let tick = 0, timeoutId, box, boxBut, boxText, boxTimer, boxTimeout, fadeTimeout
let ytdPlayer, video, movie_player
let options = {}, stats = {}

chrome.runtime.sendMessage({action: "options", type: 'get'}, function(r) {options = r.content})
chrome.runtime.sendMessage({action: "allMonths", type: 'get'}, function(r) {stats = r.content})

/* --- messages start --- */
function handleMessage(message, sender, sendResponse) {
  //log('Recived message '+message.action+' , '+message.type+' , '+message.key+' , '+message.value)
  if (message.action == 'option'){
    if (message.type=='get') sendResponse({status: "error"})
    else if (message.type == 'set') options[message.key] = message.value
  }
  else if (message.action == 'allMonths'){
    if (message.type=='get') sendResponse({status: "error"})
    else if (message.type == 'set') stats = message.value
  }
}
chrome.runtime.onMessage.addListener(handleMessage)
/* --- messages stop --- */

initExtension()

function initObserver() {
  if (!('MutationObserver' in window)) return log('Fail to initiate: MutationObserver')

  ytdPlayer = getEl('ytd-player');
  if (!ytdPlayer) return false//log('Not found: ytd-player')

  let co = getEl('ytd-popup-container')
  if (!co) return log('Not found: ytd-popup-container')

  log('<b>'+cTime()+'</b> - Runing after '+tick)
  createBox()
  
  const callback = function(mutationsList, observer) {
    if (document.visibilityState != 'visible'){//paused continue watching? in inactive window
      mutationsList.forEach( (mutation) => {
        let mutT = mutation.target
        if(mutation.type == 'attributes' && mutT.nodeName == 'PAPER-DIALOG' && mutation.attributeName == 'aria-hidden' && mutT.getAttribute('aria-hidden') == null){//true -> null
          if (!(mutT.offsetParent || mutT.offsetWidth || mutT.offsetHeight || mutT.getClientRects().length) && !mutT.getAttribute('YTPT')){
            let tStr = mutT.getElementsByTagName('yt-formatted-string')
            if (tStr.length && tStr[0].id == 'title'){
              if (!video || !movie_player) getVideo()
              if (video && video.paused){
                mutT.style.display = 'block'
                log('Paused continue watching? - invisible, starting')
              }
            }
          }
        }
      })
    }
  
    let mutationVideoClicked = false//only one click play() on callback
    let dial = co.querySelectorAll('paper-dialog,iron-dropdown,yt-notification-action-renderer')
    if (!dial) return log('Not found: paper-dialog or iron-dropdown or yt-notification-action-renderer')
    let c = dial.length
    for(let i=0;i<c;i++){
      /*************************/
      /*if(!dial[i].getAttribute('YTPT')){
        let myTmp = dial[i].getElementsByTagName('yt-formatted-string')
        if (myTmp && myTmp[0]) myTmp = myTmp[0].id
        log(cTime()+' - '+dial[i].nodeName+' - '+myTmp+' - '+dial[i].offsetParent+' - '+dial[i].offsetWidth+' - '+dial[i].offsetHeight+' - '+dial[i].getClientRects().length)
      }*/
      
      if ((dial[i].offsetParent || dial[i].offsetWidth || dial[i].offsetHeight || dial[i].getClientRects().length) && !dial[i].getAttribute('YTPT')){
        if (dial[i].nodeName=='IRON-DROPDOWN' && dial[i].getElementsByTagName('ytd-multi-page-menu-renderer')[0]){
          dial[i].setAttribute('YTPT',1)
          log('Found login menu')
          continue
        }

        let boxAdd = 'Not found: yt-formatted-string', s = dial[i].getElementsByTagName('yt-formatted-string')
        if (!s) log(boxAdd)
        else {
          if (dial[i].nodeName == 'IRON-DROPDOWN'){//blue popups
            boxAdd = s[0].innerText=='<!--css-build:shady-->' || s[0].innerText==''?s[1].innerText:s[0].innerText
            boxAdd = '(4) '+boxAdd
          }
          else if (dial[i].nodeName == 'YT-NOTIFICATION-ACTION-RENDERER'){//Still watching?
            let butRen = dial[i].getElementsByTagName('yt-button-renderer')
            s = dial[i].getElementsByTagName('span')
            boxAdd = s[0].innerText
            if (butRen.length) dial[i].getElementsByTagName('yt-button-renderer')[0].click()
            else {//no button = Thank you for confirming
              dial[i].setAttribute('YTPT',1)
              continue
            }
          }
          else if (s[0].id == 'upsell-dialog-title'){//login
            boxAdd = '(1) '+s[0].innerText
            if(!mutationVideoClicked) mutationVideoClicked = startVideoIfPaused()
            //dial[i].getElementsByTagName('yt-button-renderer')[0].click()
          }
          else if (s[0].id == 'title'){//paused continue watching?
            boxAdd = '(2) '+s[1].innerText
            if(!mutationVideoClicked) mutationVideoClicked = startVideoIfPaused()
            dial[i].getElementsByTagName('yt-button-renderer')[1].click()
          }
          else if (s[0].id == 'text'){//age, music on desktop - mostly lower left
            let divs = dial[i].getElementsByTagName('div')
            boxAdd = '(3) '+trim(divs[1].innerText)
          }
          else{
            boxAdd='UNKNOWN'
            log(dial[i].innerHTML)
          }
        }
        
        dial[i].style.zIndex = -1000
        dial[i].setAttribute('YTPT', 1)
        
        let iron = getEl('iron-overlay-backdrop')
        if (iron) {
          iron.style.zIndex = -1
          iron.parentNode.removeChild(iron)
        }
        
        clearTimeout(boxTimeout)
        clearTimeout(fadeTimeout)
        
        chrome.runtime.sendMessage({action: "blocked", type: 'popup'})
        stats.popupsTamed++
        
        log(cTime()+' - Popup no. '+stats.popupsTamed+' tamed - '+boxAdd)
        if(!options.dontShowBox) showBox('Popup', stats.popupsTamed, ' tamed - '+boxAdd)

        setTimeout(function(){removeDial(stats.popupsTamed, dial[i])},2000);//2s arbitrary
      }
    }
  }
  const observer = new MutationObserver(callback)
  observer.observe(co, {attributes:true, childList:true, subtree:true, attributeOldValue:true})

  if (!options.dontSkipAds) initSkipAd()
  return true
}

function initSkipAd(){
  const callback2 = function(mutationsList, observer) {
    let but = ytdPlayer.getElementsByClassName('ytp-ad-skip-button ytp-button')//always returns collection
    let c = but.length
    for(let i=0;i<c;i++){
      //if (but[i].offsetParent !== null)//don't have to be visible to click ;)
      but[i].click()
      clearTimeout(boxTimeout)
      clearTimeout(fadeTimeout)
      
      chrome.runtime.sendMessage({action: "blocked", type: 'skipad'})
      stats.skipAdClicked++

      log(cTime()+' - Skip ad no. '+stats.skipAdClicked+' clicked')
      if(!options.dontShowBox) showBox('Skip ad', stats.skipAdClicked, ' clicked')
    }
  }
  const observer2 = new MutationObserver(callback2);
  observer2.observe(ytdPlayer, {childList:true, subtree:true});
}

function removeDial(n, d){
  d.style.display = 'none'
  d.setAttribute('YTPT','')
  //d.parentNode.removeChild(d)// - problem with backbutton, popup removed so no play()
  log('Popup no. '+n+' removed')
}

function startVideoIfPaused(){
  if(!video || !movie_player) getVideo()
  if(video && video.paused){
    movie_player.click()
    log('Video paused - starting')
    return true
  }
  return false
}

function getVideo(){
  video=ytdPlayer.getElementsByTagName('video')[0]
  if (!video) return log('Not found: video')

  let t=ytdPlayer.getElementsByTagName('div')
  let c=t.length
  for(let i=0;i<c;i++){
    if(t[i].id=='movie_player'){movie_player=t[i];break}
  }
  if (!movie_player || movie_player.id!='movie_player') return log('Not found: movie_player')
}

function boxTimeoutF(){
  if(--boxTimer<0){
    clearTimeout(boxTimeout)
    box.style.opacity=0
    fadeTimeout=setTimeout(fadeTimeoutF,2100)
    return
  }
  boxBut.innerText='Close in: '+boxTimer+' s'
  boxTimeout=setTimeout(boxTimeoutF,1000)
}

function fadeTimeoutF(){
  box.style.display='none'
  boxText.innerHTML=''
}

function initExtension(){
  if (initObserver()) return
  if(++tick>10){
    clearTimeout(timeoutId);
    return log('Can not initialize extension')
  }
  timeoutId=setTimeout(initExtension,500)
}

function showBox(type, no, content){
  let b, t
  let div=createElement('div','','')
  //b=createElement('b','','innerText:'+cTime())
  //div.appendChild(b)
  t = document.createTextNode(''+type+' no. ');
  div.appendChild(t)
  b=createElement('b','','innerText:'+no)
  div.appendChild(b)
  content=content.length<51?content:content.substr(0,50)+'...'
  t = document.createTextNode(content);
  div.appendChild(t)
  if(boxText.hasChildNodes()) boxText.insertBefore(div, boxText.firstElementChild)
  else boxText.appendChild(div)

  boxBut.innerText='Close in: 10 s'
  boxTimer=10
  boxTimeout=setTimeout(boxTimeoutF,1000);
  box.style.opacity=1
  box.style.display='block'
}

function createBox(){
  box=createElement('div','display:none;opacity:1;transition:opacity 2s ease-out;position:fixed;padding:10px;background-color:#000;left:5px;bottom:25px;z-index:9999;color:#fff;border:#444 1px solid;border-radius:3px;box-shadow:3px 3px 6px 3px #555;font:11px Tahoma,Verdana,sans-serif','')

  let d=createElement('div','fontWeight:bold;paddingBottom:5px;color:#FF0000;width:200px','innerText:YouTube Popup Tamer v.'+chrome.runtime.getManifest().version)
  box.appendChild(d)

  d=createElement('div','max-height:65px;overflow:hidden','id:TPTTextBox')
  box.appendChild(d)
  boxText=d
  
  let bts=createElement('div','padding-top:10px','')
  
  let b=createElement('button','float:right;cursor:pointer;font:11px Tahoma,Verdana,sans-serif','')
  b.onclick=function(){clearTimeout(boxTimeout);clearTimeout(fadeTimeout);fadeTimeoutF()}
  bts.appendChild(b)
  boxBut=b

  b=createElement('a','display:block;float:left;cursor:pointer;width:58px;padding:1px 5px;border:#2677C9 2px solid;border-radius:6px;background:#fff','target:_blank')
  b.href='http://www.bit.ly/382is5H'
  bts.appendChild(b)

  d = createElement('img', 'display:block;height:15px', '')
  d.src = chrome.runtime.getURL("img/paypal_20.png")
  b.appendChild(d)

  box.appendChild(bts)
  document.body.appendChild(box)
}

function cTime(){
  let d=new Date(),h=d.getHours(),m=d.getMinutes(),s=d.getSeconds()
  return (h<10?'0'+h:h)+':'+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s)
}

function createElement(e,s,a){
  e=document.createElement(e)
  return setElement(e,s,a)
}

function setElement(e,s,a){
  e=typeof e=='string'?$(e):e
  s=s.split(';')
  let l=s.length,i,b
  for(i=0;i<l;i++){
    if(s[i]){
      s[i]=s[i].split(':')
      e.style[s[i][0]]=s[i][1]
    }
  }
  if(a){
    a=a.split(';')
    l=a.length
    for(i=0;i<l;i++){
      if(a[i]){
        a[i]=a[i].split(':')
        b=a[i][0]
        a[i][0]=null
        a[i]=a[i].join(':').slice(1)
        e.setAttribute(b,a[i])
        e[b]=a[i]
      }
    }
  }
  return e
}

function trim(s){
  return s.replace(/^\s*|\s*$/g,"")
}

function getEl(n){
  return document.body.getElementsByTagName(n)[0]
}

function log(m){
  console.log('YouTube Popup Tamer: '+m)
  return false
}

function grabBG(message){
  chrome.runtime.sendMessage(message)
}

function grabBGFunc(message, response){
  chrome.runtime.sendMessage(message, response)
}