  let ver='version newest ;)',p,l,s=location.search
  if(s){
    s=s.substr(1)
    s=s.split('&')
    l=s.length
    for(let i=0;i<l;i++){
      p=s[i].split('=')
      if(p[0]=='v') ver='v'+p[1]
    }
  }

  let span=document.getElementsByClassName('ver')
  l=span.length
  for(let i=0;i<l;i++){
    span[i].innerText=ver
  }