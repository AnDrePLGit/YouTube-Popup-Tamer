let tick=0, timeoutId, box, boxBut, boxText, boxTimer, boxTimeout, fadeTimeout
let ytdPlayer, video, movie_player
let dontShowBox, dontSkipAds='slowChromeDontKnowYet', popupsTamed, skipAdClicked, runFromAsync=false

chrome.storage.local.get("not", function(r){dontShowBox=r.not});
chrome.storage.local.get("notAds", function(r){
  dontSkipAds = r.notAds
  if(runFromAsync && !dontSkipAds){
    initSkipAd()//Chrome too slow to read storage before skipad shows
    log('<b>'+cTime()+'</b> - Skip ad started from async')
  }
});
chrome.storage.local.get("popupsTamed", function(r){popupsTamed=r.popupsTamed === undefined || r.popupsTamed === null || isNaN(r.popupsTamed)?0:r.popupsTamed});
chrome.storage.local.get("skipAdClicked", function(r){skipAdClicked=r.skipAdClicked === undefined || r.skipAdClicked === null || isNaN(r.skipAdClicked)?0:r.skipAdClicked});

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
    let mutationVideoClicked = false//only one click play() on callback
    let dial = co.querySelectorAll('paper-dialog,iron-dropdown')
    if (!dial) return log('Not found: paper-dialog or iron-dropdown')
    let c=dial.length
    for(let i=0;i<c;i++){
      if ((dial[i].offsetParent || dial[i].offsetWidth || dial[i].offsetHeight || dial[i].getClientRects().length) && !dial[i].getAttribute('YTPT')){
        dial[i].setAttribute('YTPT',1)
        if(dial[i].nodeName=='IRON-DROPDOWN' && dial[i].getElementsByTagName('ytd-multi-page-menu-renderer')[0]){
          log('Found login menu')
          continue
        }
        else dial[i].style.zIndex=-1000
        
        let iron = getEl('iron-overlay-backdrop')
        if (!iron) log('Not found: iron-overlay-backdrop but do not worry')//no return, not every popup has this, only login?
        else{
          iron.style.zIndex=-1
          iron.parentNode.removeChild(iron)
        }

        clearTimeout(boxTimeout)
        clearTimeout(fadeTimeout)
        let boxAdd='Not found: yt-formatted-string', s=dial[i].getElementsByTagName('yt-formatted-string')
        if (!s) log(boxAdd)
        else {
          if (dial[i].nodeName=='IRON-DROPDOWN'){//blue popups
            boxAdd=s[0].innerText=='<!--css-build:shady-->' || s[0].innerText==''?s[1].innerText:s[0].innerText
            boxAdd='(4) '+boxAdd
          }
          else if (s[0].id=='upsell-dialog-title'){//login
            boxAdd='(1) '+s[0].innerText
            if(!mutationVideoClicked) mutationVideoClicked=startVideoIfPaused()
          }
          else if (s[0].id=='title'){//paused continue watching?
            boxAdd='(2) '+s[1].innerText
            if(!mutationVideoClicked) mutationVideoClicked=startVideoIfPaused()
          }
          else if (s[0].id=='text'){//age, music on desktop - mostly lower left
            let divs=dial[i].getElementsByTagName('div')
            boxAdd='(3) '+trim(divs[1].innerText)
          }
          else{
            boxAdd='UNKNOWN'
            log(dial[i].innerHTML)
          }
        }
        chrome.storage.local.set({popupsTamed: ++popupsTamed});
        let tempPT=popupsTamed
        
        log(cTime()+' - Popup no. '+tempPT+' tamed - '+boxAdd)
        if(!dontShowBox) showBox('Popup', tempPT, ' tamed - '+boxAdd)

        setTimeout(function(){removeDial(tempPT, dial[i])},2000);//2s arbitrary
      }
    }
  }
  const observer = new MutationObserver(callback)
  observer.observe(co, {attributes:true, subtree:true})

  if(dontSkipAds=='slowChromeDontKnowYet') runFromAsync=true//Chrome too slow to read storage before skipad shows
  else if (!dontSkipAds) initSkipAd()

  return true
}

function initSkipAd(){
  const callback2 = function(mutationsList, observer) {
    let but=ytdPlayer.getElementsByClassName('ytp-ad-skip-button ytp-button')//always returns collection
    let c=but.length
    for(let i=0;i<c;i++){
      //if (but[i].offsetParent !== null)//don't have to be visible to click ;)
      but[i].click();
      clearTimeout(boxTimeout)
      clearTimeout(fadeTimeout)
      chrome.storage.local.set({skipAdClicked: ++skipAdClicked});
      let tempSAC=skipAdClicked

      log(cTime()+' - Skip ad no. '+tempSAC+' clicked')
      if(!dontShowBox) showBox('Skip ad', tempSAC, ' clicked')
    }
  }
  const observer2 = new MutationObserver(callback2);
  observer2.observe(ytdPlayer, {childList:true, subtree:true});
}

function removeDial(n,d){
  d.style.display='none'
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

  b=createElement('a','display:block;float:left;cursor:pointer;width:58px;padding:1px 5px;border:#2677C9 2px solid;border-radius:6px;background:#fff','')
  b.href='http://www.bit.ly/382is5H'
  b.target='_blank'
  bts.appendChild(b)

  let paypal=chrome.runtime.getURL("img/paypal_20.png");
  d=createElement('img','display:block;height:15px','');
  d.src=paypal
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