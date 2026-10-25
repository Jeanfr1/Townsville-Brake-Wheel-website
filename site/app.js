/* Townsville — approved yellow/black vintage layout, Heritage Seal A. */
(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,p)=>a+(b-a)*p;
 const smooth=n=>{const p=clamp(n);return p*p*(3-2*p);},range=(p,a,b)=>smooth((p-a)/(b-a));
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:760px)');
 const hero=$('.hero'),stage=$('.hero-stage'),camera=$('.hero-camera'),lettering=$('.hero-lettering'),tagline=$('.hero-tagline'),side=$('.hero-side'),controls=$('.hero-controls'),handoff=$('.hero-handoff');
 const video=$('#hero-film'),scrubber=$('#film-position'),replay=$('.replay'),viewer=$('#viewer-video'),motionButton=$('.motion'),progress=$('.reading-progress');
 const maskCamera=$('#mask-camera'),maskSurface=$('#mask-surface'),mask=$('#type-occlusion'),cloth=$('#cloth-occlusion');
 const sceneCameras=$$('.scene-camera'),contourPaths=$$('.contours path'),wheel=$('.wheel-drawing'),localWord=$('.local-word');
 contourPaths.forEach(p=>p.setAttribute('pathLength','1'));
 let geometry=null,frame=0,eased=scrollY,userPaused=false,paused=preference.matches,filmLoaded=false,filmVisible=true,wasPlaying=false,resumeOnReturn=false,dialogWasPlaying=false;
 const top=el=>el.getBoundingClientRect().top+scrollY;
 function measure(){
  geometry={view:innerHeight,width:innerWidth,stageWidth:stage.clientWidth,stageHeight:stage.clientHeight,heroTop:top(hero),travel:Math.max(1,hero.offsetHeight-stage.offsetHeight),
   total:Math.max(1,document.documentElement.scrollHeight-innerHeight),
   scenes:sceneCameras.map(el=>({el,top:top(el.closest('.scene')),height:el.closest('.scene').offsetHeight,original:el.classList.contains('documentary')||el.classList.contains('contact-camera')})),
   services:{top:top($('#services')),height:$('#services').offsetHeight},local:{top:top($('#local')),height:$('#local').offsetHeight}};
  mask.setAttribute('width',geometry.stageWidth);mask.setAttribute('height',geometry.stageHeight);
  maskSurface.setAttribute('width',geometry.stageWidth);maskSurface.setAttribute('height',geometry.stageHeight);
  schedule();
 }
 function typeMask(y){
  if(!geometry||mobile.matches)return;
  const g=geometry,w=g.stageWidth,h=g.stageHeight,p=paused?0:clamp((y-g.heroTop)/g.travel);
  const c=paused?1:1+.075*range(p,0,.6)+.7*range(p,.58,.95),t=filmLoaded?video.currentTime:3.4;
  const z=filmLoaded&&video.readyState>=2?1+.032*clamp(t/11.65):1;
  const s=Math.max(w/1672,h/941),dx=(w-1672*s)/2,dy=(h-941*s)/2;
  const tx=c*(dx-s*.53*(z-1)*1672)+w*.54*(1-c),ty=c*(dy-s*.61*(z-1)*941)+h*.68*(1-c);
  maskCamera.setAttribute('transform','translate('+tx+' '+ty+') scale('+(s*c*z)+')');
  const lifted=range(t,5.35,7.1)*(1-range(t,8.2,9.2));
  const crest=mix(290,65,lifted),right=mix(400,100,lifted);
  cloth.setAttribute('d','M900 316 Q1120 '+crest+' 1510 '+right+' Q1640 170 1650 315 L1440 620 L1390 776 L1293 666 L1208 488 Z');
  cloth.style.opacity=String(1-range(t,8.25,8.95));
 }
 function render(y){
  if(!geometry)return;
  const g=geometry,p=clamp((y-g.heroTop)/g.travel);
  progress.style.transform='scaleX('+clamp(scrollY/g.total)+')';
  typeMask(y);
  if(paused)return;
  const zoom=range(p,0,.85),scale=mobile.matches?mix(1,1.035,zoom):1+.075*range(p,0,.6)+.7*range(p,.58,.95);
  camera.style.transform='scale('+scale+')';
  const fade=1-range(p,.52,.89);
  lettering.style.opacity=String(fade);tagline.style.opacity=String(fade);side.style.opacity=String(fade);
  controls.style.opacity=String(1-range(p,.12,.65));
  const hand=range(p,.74,1);
  handoff.style.clipPath='inset('+((1-hand)*100)+'% 0 0)';
  handoff.style.transform='scale('+mix(1.08,1,hand)+')';
  contourPaths.forEach(el=>el.style.strokeDashoffset=String(1-range(p,.02,.88)));
  for(const s of g.scenes){
   const r=s.top-y;if(r>g.view+150||r+s.height< -150)continue;
   const q=clamp((y+g.view-s.top)/(g.view+s.height)),amount=s.original?1.8:3;
   s.el.style.transform='translate3d(0,'+mix(amount,-amount,q)+'%,0)';
  }
  const sp=clamp((y+g.view-g.services.top)/(g.view+g.services.height));
  wheel.style.transform='rotate('+mix(-12,16,sp)+'deg)';
  const lp=clamp((y+g.view-g.local.top)/(g.view+g.local.height));
  localWord.style.transform='translate3d('+mix(-1,1,lp)+'%,0,0)';
 }
 function tick(){frame=0;const target=scrollY;eased=mix(eased,target,.2);if(Math.abs(target-eased)<.2)eased=target;render(eased);if(!paused&&Math.abs(target-eased)>.2)schedule();}
 function schedule(){if(!frame)frame=requestAnimationFrame(tick);}
 function loadFilm(play=false){
  if(mobile.matches||preference.matches||userPaused||navigator.connection?.saveData)return;
  if(!filmLoaded){video.src='assets/hero-reveal-HD.mp4';video.load();filmLoaded=true;}
  if(play&&filmVisible&&!document.hidden&&!$('dialog[open]')){const p=video.play();p?.catch(()=>{});}
 }
 function motionState(){
  paused=preference.matches||userPaused;document.documentElement.classList.toggle('motion-paused',paused);
  motionButton.disabled=preference.matches;motionButton.setAttribute('aria-pressed',String(paused));
  const label=preference.matches?'Reduced motion enabled in your device settings':paused?'Resume motion':'Pause motion';
  motionButton.setAttribute('aria-label',label);motionButton.title=label;motionButton.firstElementChild.textContent=paused?'▷':'Ⅱ';
  if(paused){
   video.pause();[camera,lettering,tagline,side,controls,handoff,...sceneCameras,wheel,localWord].forEach(el=>{el.style.transform='';el.style.opacity='';});
   handoff.style.clipPath='inset(100% 0 0)';contourPaths.forEach(p=>p.style.strokeDashoffset='0');
  }else loadFilm(filmVisible);
  eased=scrollY;measure();
 }
 motionButton.addEventListener('click',()=>{userPaused=!userPaused;motionState();});
 preference.addEventListener('change',motionState);
 mobile.addEventListener('change',()=>{video.pause();document.documentElement.classList.remove('film-ready');if(!mobile.matches){loadFilm(filmVisible);if(video.readyState>=2)document.documentElement.classList.add('film-ready');}measure();});
 video.addEventListener('loadeddata',()=>{if(!mobile.matches&&!preference.matches)document.documentElement.classList.add('film-ready');});
 video.addEventListener('timeupdate',()=>{if(Number.isFinite(video.duration)&&video.duration>0)scrubber.value=String(video.currentTime/video.duration*100);typeMask(eased);});
 video.addEventListener('error',()=>{document.documentElement.classList.remove('film-ready');});
 replay.addEventListener('click',()=>{loadFilm(false);if(!filmLoaded||paused)return;video.currentTime=0;video.play().catch(()=>{});});
 scrubber.addEventListener('input',()=>{loadFilm(false);if(!filmLoaded||!Number.isFinite(video.duration))return;video.pause();video.currentTime=Number(scrubber.value)/100*video.duration;});
 if('IntersectionObserver'in window){
  new IntersectionObserver(entries=>{filmVisible=entries[0].isIntersecting;if(!filmVisible){resumeOnReturn=!video.paused;video.pause();}else if(!filmLoaded||resumeOnReturn){loadFilm(true);resumeOnReturn=false;}},{threshold:.2}).observe(stage);
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.1,rootMargin:'0px 0px -14px 0px'});
  $$('.reveal').forEach(el=>observer.observe(el));document.documentElement.classList.add('enhanced');
 }else loadFilm(true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){wasPlaying=!video.paused;video.pause();viewer.pause();}else if(wasPlaying&&!paused){loadFilm(true);}});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});addEventListener('load',measure,{once:true});document.fonts?.ready.then(measure);
 if('ResizeObserver'in window)new ResizeObserver(measure).observe(document.body);
 const menu=$('#mobile-menu'),toggle=$('.menu-toggle');
 function closeMenu(focus=false){menu.hidden=true;toggle.setAttribute('aria-expanded','false');$('.sr-only',toggle).textContent='Open menu';if(focus)toggle.focus();}
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';menu.hidden=open;toggle.setAttribute('aria-expanded',String(!open));$('.sr-only',toggle).textContent=open?'Open menu':'Close menu';});
 $$('a,button',menu).forEach(el=>el.addEventListener('click',()=>closeMenu()));
 addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden)closeMenu(true);});addEventListener('resize',()=>{if(!mobile.matches)closeMenu();});
 let returnFocus=null,activeService='General enquiry';
 function openDialog(id,trigger){
  const dialog=document.getElementById(id);if(!dialog)return;
  const active=$('dialog[open]');if(!active||!active.contains(trigger))returnFocus=trigger||document.activeElement;
  if(!active)dialogWasPlaying=!video.paused;
  video.pause();
  $$('dialog[open]').forEach(el=>el.close());dialog.showModal();document.body.classList.add('modal-open');$('.dialog-close',dialog).focus();
  if(id==='film-viewer'){const source=$('source',viewer);if(!source.getAttribute('src')){source.src=source.dataset.src;viewer.load();}video.pause();if(!preference.matches)viewer.play().catch(()=>{});}
 }
 $$('[data-dialog]').forEach(el=>el.addEventListener('click',()=>openDialog(el.dataset.dialog,el)));
 $$('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
 $$('dialog').forEach(d=>{
  d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});
  d.addEventListener('close',()=>{if(d.id==='film-viewer')viewer.pause();if(!$('dialog[open]')){document.body.classList.remove('modal-open');if(returnFocus?.isConnected)returnFocus.focus();if(dialogWasPlaying&&!paused)loadFilm(true);dialogWasPlaying=false;}});
 });
 const services={
  alignment:['Wheel alignment','If your car is pulling to one side or your tyres are wearing unevenly, talk to us about an alignment check. Tell us about your vehicle and what you have noticed.'],
  brakes:['Brake repairs','Concerned about noise, vibration or the way your brakes feel? Contact the workshop to discuss an inspection and the work your vehicle needs.'],
  tyres:['Tyres & balancing','We supply and fit tyres, and provide rotation and balancing. Tell us your vehicle and tyre requirements so we can discuss the options.'],
  suspension:['Steering & suspension','Talk to us about steering, suspension and bearing work. Share your vehicle details and the symptoms you have noticed when you enquire.']
 };
 $$('[data-service]').forEach(el=>el.addEventListener('click',()=>{const service=services[el.dataset.service];activeService=service[0];$('#service-title').textContent=service[0];$('#service-description').textContent=service[1];openDialog('service-detail',el);}));
 $('.service-enquire').addEventListener('click',e=>{$('#enquiry-form select').value=activeService;openDialog('enquiry',e.currentTarget);});
 $('#enquiry-form').addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
  const f=new FormData(form),name=String(f.get('name')).trim(),vehicle=String(f.get('vehicle')).trim(),service=String(f.get('service')),message=String(f.get('message')).trim();
  const subject=service+' enquiry — '+vehicle;
  const body='Name: '+name+'\r\nVehicle: '+vehicle+'\r\nService: '+service+'\r\n\r\n'+message;
  $('.form-status',form).textContent='Your email app has been requested. If it does not open, use the email address below or call the workshop.';
  location.href='mailto:bjefferies80@outlook.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 });
 motionState();
})();

