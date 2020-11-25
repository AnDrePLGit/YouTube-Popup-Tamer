chrome.storage.local.get('allMonths', function(r) {setallMonths(r.allMonths, 'All time')})

let d = new Date(), m = d.getMonth()+1, y = d.getFullYear(), limit = 0
while ((y > 2020 || (y == 2020 && m > 10)) && limit < 120){
  ddd = d.getFullYear()+'-'+(m<10?'0'+m:m)
  chrome.storage.local.get([ddd], function(r) {setallMonths(r[ddd], ddd)})
  m--
  if (m == 0){
    y--
    m = 12
  }
  limit++
}

function setallMonths(r, ddd){
  let tr ,td
  //log(r)
  if(r){
    tr = createElement('tr','','class:light')
    td = createElement('th','','innerText:'+ddd)
    tr.appendChild(td)
    td = createElement('td','','innerText:'+r.popupsTamed)
    tr.appendChild(td)
    td = createElement('td','','innerText:'+r.skipAdClicked)
    tr.appendChild(td)
    $('monthsTab').getElementsByTagName('tbody')[0].appendChild(tr)
  }
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

function $(e){return document.getElementById(e)}

function log(m){
  console.log(m)
  return false
}