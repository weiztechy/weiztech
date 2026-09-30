import * as THREE from './assets/vendor/three.module.min.js';

const stage = document.getElementById('scene-stage');
const motionButton = document.getElementById('motion-toggle');
const hint = document.getElementById('scene-hint');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
} catch {
  if (hint) hint.textContent = 'Computer, WLAN & Drucker. Alles aus einer Hand.';
  if (motionButton) motionButton.hidden = true;
  document.querySelector('.scene-switcher').hidden = true;
}

if (renderer && stage) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 650 ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4,4,3,-3,.1,100);
  camera.position.set(5,3.5,9);
  camera.lookAt(0,.12,0);
  scene.add(new THREE.HemisphereLight(0xf3f1df,0x667249,2.4));
  const key = new THREE.DirectionalLight(0xfff3d9,4.5);
  key.position.set(-3,7,5); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:30});
  key.shadow.bias=-.001; key.shadow.normalBias=.025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc4e79c,3);
  rim.position.set(5,3,-4);scene.add(rim);
  const amber = new THREE.PointLight(0xff7e30,17,10,2);
  amber.position.set(-2,-.2,3);scene.add(amber);
  const metal = new THREE.MeshStandardMaterial({color:0xa6b09a,metalness:.52,roughness:.36});
  const edge = new THREE.MeshStandardMaterial({color:0x59664b,metalness:.5,roughness:.36});
  const black = new THREE.MeshStandardMaterial({color:0x121a10,metalness:.12,roughness:.47});
  const keys = new THREE.MeshStandardMaterial({color:0x303c28,metalness:.12,roughness:.4});
  const orange = new THREE.MeshStandardMaterial({color:0xff8a3e,emissive:0xff641e,emissiveIntensity:.18,metalness:.2,roughness:.4});
  const lime = new THREE.MeshStandardMaterial({color:0xc3e399,emissive:0x91ce48,emissiveIntensity:.5,roughness:.4});
  const paper = new THREE.MeshStandardMaterial({color:0xe8ead9,roughness:.85});

  function rounded(w,h,d,r,material){
    const s = new THREE.Shape();
    const x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const bevel=Math.min(d/4,.035);
    const geo = new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:8});
    geo.translate(0,0,-(d-2*bevel)/2);
    const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;
    return mesh;
  }
  function box(w,h,d,material,x=0,y=0,z=0){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  function planeTexture(canvas,w,h){
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,transparent:true}));
  }
  // Use the original local logo in screen artwork and device badges.
  const logoImage = new Image();
  logoImage.src = new URL('./assets/weiztech-logo-orange.png', import.meta.url).href;
  const logoLoaded = logoImage.decode().then(() => true).catch(() => false);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=1200;screenCanvas.height=760;
  const ctx=screenCanvas.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,1200,760);gradient.addColorStop(0,'#283626');gradient.addColorStop(.55,'#172217');gradient.addColorStop(1,'#0d150e');ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,760);
  ctx.strokeStyle='#bbd79418';ctx.lineWidth=1;
  for(let i=-600;i<1600;i+=70){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+470,760);ctx.stroke();}
  for(let i=0;i<760;i+=70){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(1200,i);ctx.stroke();}
  ctx.fillStyle='#aaba97';ctx.font='18px Arial';ctx.fillText('WEIZTECH / PERSÖNLICH VOR ORT',53,61);
  ctx.fillStyle='#b6d68e';ctx.beginPath();ctx.arc(1062,54,5,0,Math.PI*2);ctx.fill();ctx.fillText('ONLINE',1080,61);
  ctx.strokeStyle='#9fc67d29';ctx.lineWidth=1;
  [120,178,234].forEach(r=>{ctx.beginPath();ctx.ellipse(608,347,r*1.6,r*.75,-.22,0,Math.PI*2);ctx.stroke();});
  ctx.fillStyle='#eff1de';ctx.font='bold 72px Arial';ctx.textAlign='center';ctx.fillText('WeizTech',600,390);
  ctx.fillStyle='#eef0da';ctx.font='40px Arial';ctx.textAlign='center';ctx.fillText('Alles läuft.',600,535);
  ctx.fillStyle='#98af83';ctx.font='18px Arial';ctx.fillText('Ihre Technik. Unsere Hilfe.',600,577);
  ctx.fillStyle='#ffffff07';ctx.fillRect(40,660,1120,65);
  ctx.textAlign='left';ctx.fillStyle='#a6bd90';ctx.font='16px Arial';ctx.fillText('PC & LAPTOP',65,701);ctx.fillText('WLAN & INTERNET',415,701);ctx.fillText('DRUCKER & ZUBEHÖR',815,701);

  const laptop = new THREE.Group();
  const deck=rounded(4.45,2.85,.16,.13,metal);deck.rotation.x=-Math.PI/2;deck.position.set(0,-.58,.35);laptop.add(deck);
  const under=rounded(4.35,2.76,.10,.13,edge);under.rotation.x=-Math.PI/2;under.position.set(0,-.68,.35);laptop.add(under);
  laptop.add(box(4.1,.035,.13,edge,0,-.47,-.99));
  const lid=new THREE.Group();lid.position.set(0,-.48,-1);lid.rotation.x=-.12;
  const shell=rounded(4.45,2.82,.17,.14,metal);shell.position.y=1.4;lid.add(shell);
  const bezel=rounded(4.24,2.59,.027,.075,black);bezel.position.set(0,1.41,.104);lid.add(bezel);
  const display=planeTexture(screenCanvas,4.03,2.34);display.position.set(0,1.42,.126);lid.add(display);
  const webcam=new THREE.Mesh(new THREE.SphereGeometry(.017,10,10),black);webcam.position.set(0,2.715,.128);lid.add(webcam);
  const brandLabelCanvas=document.createElement('canvas');brandLabelCanvas.width=512;brandLabelCanvas.height=112;
  const bc=brandLabelCanvas.getContext('2d');bc.fillStyle='#a8b198';bc.font='18px Arial';bc.textAlign='center';bc.fillText('W E I Z T E C H',256,30);
  const label=planeTexture(brandLabelCanvas,.65,.14);label.position.set(0,.115,.125);lid.add(label);laptop.add(lid);
  // Individual keys give the deck real depth as it turns.
  const keyGeo=new THREE.BoxGeometry(.265,.047,.20);
  const keyInstances=new THREE.InstancedMesh(keyGeo,keys,65);keyInstances.castShadow=true;keyInstances.receiveShadow=true;
  const temp=new THREE.Object3D();let ki=0;
  for(let row=0;row<5;row++)for(let col=0;col<13;col++){
    temp.position.set((col-6)*.292,-.469,-.71+row*.26);temp.updateMatrix();keyInstances.setMatrixAt(ki++,temp.matrix);
  }
  laptop.add(keyInstances);laptop.add(box(1.85,.035,.16,keys,0,-.466,.57));
  const trackpad=rounded(1.27,.64,.012,.06,edge);trackpad.rotation.x=-Math.PI/2;trackpad.position.set(0,-.486,1.14);laptop.add(trackpad);
  for(let i=0;i<9;i++){laptop.add(box(.016,.006,.88,edge,-2.02+i*.018,-.487,-.2));laptop.add(box(.016,.006,.88,edge,1.88+i*.018,-.487,-.2));}
  laptop.add(box(.31,.004,.08,orange,1.7,-.484,1.56));

  const router = new THREE.Group();
  const routerBody=rounded(3.4,1.96,.48,.20,metal);routerBody.rotation.x=-Math.PI/2;routerBody.position.y=-.3;router.add(routerBody);
  const routerBottom=rounded(3.35,1.9,.12,.18,edge);routerBottom.rotation.x=-Math.PI/2;routerBottom.position.y=-.6;router.add(routerBottom);
  for(const x of [-1.22,1.22]){
    const antenna=new THREE.Mesh(new THREE.CapsuleGeometry(.065,1.6,5,12),edge);antenna.position.set(x,.66,-.6);antenna.rotation.z=x>0?-.1:.1;router.add(antenna);
    const socket=new THREE.Mesh(new THREE.SphereGeometry(.1,12,12),edge);socket.position.set(x,-.07,-.6);router.add(socket);
  }
  for(let i=0;i<5;i++)router.add(box(.09,.032,.04,i===0?orange:lime,-.55+i*.28,-.3,1.001));
  for(let i=0;i<12;i++)router.add(box(.055,.004,.82,edge,-.83+i*.15,-.046,-.12));
  const routerLabel=planeTexture(brandLabelCanvas,1.25,.27);routerLabel.rotation.x=-Math.PI/2;routerLabel.position.set(0,-.044,.58);router.add(routerLabel);
  const waveGroup=new THREE.Group();waveGroup.position.set(0,1.9,-.6);router.add(waveGroup);
  for(let i=0;i<3;i++){
    const arc=new THREE.Mesh(new THREE.TorusGeometry(.42+i*.28,.016,6,48,Math.PI*.85),orange);
    arc.rotation.z=Math.PI*.075;arc.position.x=0;arc.position.y=-i*.18;waveGroup.add(arc);
  }
  router.scale.setScalar(1.17);

  const printer=new THREE.Group();
  const printerBody=rounded(3.35,1.44,1.75,.18,metal);printerBody.position.y=-.17;printer.add(printerBody);
  const bottom=rounded(3.30,.35,1.8,.12,edge);bottom.position.y=-.88;printer.add(bottom);
  const lidPrinter=rounded(3.4,1.92,.13,.16,edge);lidPrinter.rotation.x=-Math.PI/2;lidPrinter.position.y=.59;printer.add(lidPrinter);
  printer.add(box(2.6,.18,.02,black,0,-.39,.912));
  const tray=rounded(2.74,.86,.10,.08,edge);tray.rotation.x=-Math.PI/2;tray.position.set(0,-.56,1.28);printer.add(tray);
  const sheet=rounded(2.19,1.42,.018,.014,paper);sheet.rotation.x=-Math.PI/2-.07;sheet.position.set(0,-.49,1.43);printer.add(sheet);
  for(let i=0;i<5;i++)printer.add(box(1.35-i*.13,.004,.018,edge,-.2,-.437,1.35+i*.1));
  const paperFeed=rounded(2.15,1.27,.02,.02,paper);paperFeed.position.set(0,1.07,-.65);paperFeed.rotation.x=-.14;printer.add(paperFeed);
  printer.add(box(.43,.18,.033,black,-1.11,.29,.909));
  printer.add(box(.31,.09,.037,lime,-1.11,.29,.93));
  printer.add(box(.055,.055,.04,orange,-.7,.29,.93));
  printer.scale.setScalar(1.12);

  const rig=new THREE.Group();scene.add(rig);
  const models={laptop,router,printer};
  for(const model of Object.values(models)){rig.add(model);model.visible=false;}
  laptop.visible=true;
  rig.rotation.set(.035,-.20,-.075);
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(2.88,2.95,.14,96),new THREE.MeshStandardMaterial({color:0x1e2819,metalness:.25,roughness:.7}));
  pedestal.position.y=-1.43;pedestal.receiveShadow=true;scene.add(pedestal);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.9,.018,8,120),orange);ring.rotation.x=Math.PI/2;ring.position.y=-1.34;scene.add(ring);
  const innerRing=new THREE.Mesh(new THREE.TorusGeometry(2.48,.007,6,96),new THREE.MeshBasicMaterial({color:0x788958,transparent:true,opacity:.35}));innerRing.rotation.x=Math.PI/2;innerRing.position.y=-1.348;scene.add(innerRing);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.ShadowMaterial({opacity:.3}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.51;floor.receiveShadow=true;scene.add(floor);
  const satellite=new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),orange);scene.add(satellite);
  const satellite2=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),lime);scene.add(satellite2);
  const positions = [];
  for(let i=0;i<36;i++){const a=i*2.39996;const r=2.6+(i%6)*.26;positions.push(Math.cos(a)*r,-.5+(i%5)*.5,Math.sin(a)*r);}
  const dotsGeo=new THREE.BufferGeometry();dotsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const dots=new THREE.Points(dotsGeo,new THREE.PointsMaterial({color:0xadc481,size:.025,transparent:true,opacity:.45}));scene.add(dots);

  let paused=reduced.matches, onScreen=true, active='laptop', frame=0, last=0, time=0, switchStarted=0, switching=false, pending='laptop';
  let pointerX=0,pointerY=0,dragging=false,dragStart=0,dragBase=0,dragRotation=0;
  const labels={laptop:'PC & Laptop',router:'WLAN & Internet',printer:'Drucker & Zubehör'};
  const descriptions={laptop:'Eine neue Perspektive auf Ihre Technik.',router:'Gute Verbindung. In jedem Alltag.',printer:'Damit aus „offline“ wieder ein Ausdruck wird.'};
  function draw(){renderer.render(scene,camera);}
  logoLoaded.then(loaded => {
    if (!loaded) return;
    // The center region stays separate from the screen's service labels.
    ctx.fillStyle=gradient;ctx.fillRect(170,225,860,245);
    const logoWidth=800, logoHeight=logoWidth*logoImage.naturalHeight/logoImage.naturalWidth;
    ctx.drawImage(logoImage,(1200-logoWidth)/2,347-logoHeight/2,logoWidth,logoHeight);
    display.material.map.needsUpdate=true;
    bc.clearRect(0,0,512,112);bc.drawImage(logoImage,0,0,512,512*logoImage.naturalHeight/logoImage.naturalWidth);
    label.material.map.needsUpdate=true;routerLabel.material.map.needsUpdate=true;
    draw();
  });
  function resize(){
    const width=stage.clientWidth,height=stage.clientHeight;
    const view=innerWidth<650?5.9:6.15;
    const ratio=width/height;
    camera.left=-view*ratio/2;camera.right=view*ratio/2;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);draw();
  }
  new ResizeObserver(resize).observe(stage);resize();
  stage.classList.add('scene-ready');
  function updateMotionButton(){
    motionButton.setAttribute('aria-pressed',String(paused));
    motionButton.setAttribute('aria-label',paused?'3D-Animation starten':'3D-Animation pausieren');
    motionButton.innerHTML=paused?'<span aria-hidden="true">▷</span>':'<span aria-hidden="true">Ⅱ</span>';
  }
  function loop(now){
    frame=0;
    if(!onScreen||document.hidden)return;
    const dt=Math.min((now-last)/1000,.06);last=now;
    if(!paused)time+=dt;
    if(!paused){
      rig.position.y=Math.sin(time*.9)*.075;
      rig.rotation.y+=(-.2+pointerX*.24+dragRotation+Math.sin(time*.32)*.08-rig.rotation.y)*.05;
      rig.rotation.x+=(.035+pointerY*.1-rig.rotation.x)*.05;
      rig.rotation.z=-.065+Math.sin(time*.6)*.016;
      satellite.position.set(Math.cos(time*.24)*2.9,-1.1,Math.sin(time*.24)*2.9);
      satellite2.position.set(Math.cos(time*.24+Math.PI)*2.9,-1.1,Math.sin(time*.24+Math.PI)*2.9);
      waveGroup.children.forEach((wave,i)=>{wave.material=orange;wave.scale.setScalar(1+Math.sin(time*2-i*.4)*.018);});
    }
    if(switching){
      const progress=Math.min(1,(now-switchStarted)/650);
      if(progress>.5&&active!==pending){models[active].visible=false;active=pending;models[active].visible=true;}
      const scale=.08+.92*Math.abs(Math.cos(progress*Math.PI));rig.scale.setScalar(scale);
      if(progress===1){switching=false;rig.scale.setScalar(1);}
    }
    draw();
    if(!paused||switching)frame=requestAnimationFrame(loop);
  }
  function start(){if(!frame&&onScreen&&!document.hidden){last=performance.now();frame=requestAnimationFrame(loop);}}
  function setDevice(name){
    if(!models[name])return;
    pending=name;
    document.querySelectorAll('[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===name)));
    document.querySelector('.tag-one').innerHTML=`<i></i> ${labels[name]}`;
    hint.textContent=descriptions[name];
    stage.setAttribute('aria-label',`3D-Ansicht: ${labels[name]}`);
    if(reduced.matches||paused){models[active].visible=false;active=name;models[active].visible=true;switching=false;rig.scale.setScalar(1);draw();}
    else{switchStarted=performance.now();switching=true;start();}
  }
  document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>setDevice(button.dataset.scene)));
  stage.addEventListener('pointermove',event=>{
    if(reduced.matches)return;
    const rect=stage.getBoundingClientRect();
    pointerX=(event.clientX-rect.left)/rect.width-.5;pointerY=(event.clientY-rect.top)/rect.height-.5;
    if(dragging){dragRotation=dragBase+(event.clientX-dragStart)*.005;if(paused){rig.rotation.y=-.2+dragRotation;draw();}}
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  stage.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||reduced.matches)return;
    dragging=true;dragStart=event.clientX;dragBase=dragRotation;stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup',()=>{dragging=false;});stage.addEventListener('pointercancel',()=>{dragging=false;});
  motionButton.addEventListener('click',()=>{paused=!paused;updateMotionButton();if(!paused)start();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;updateMotionButton();if(paused){rig.position.y=0;rig.rotation.set(.035,-.2,-.075);draw();}else start();});
  const observer=new IntersectionObserver(entries=>{
    onScreen=entries[0].isIntersecting;
    if(onScreen){draw();if(!paused||switching)start();}else if(frame){cancelAnimationFrame(frame);frame=0;}
  },{rootMargin:'80px'});observer.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else if(!paused||switching)start();});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();if(frame)cancelAnimationFrame(frame);frame=0;stage.classList.remove('scene-ready');hint.textContent='Ihre Technik. Unsere Hilfe.';});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{stage.classList.add('scene-ready');draw();start();});
  satellite.position.set(2.9,-1.1,0);satellite2.position.set(-2.9,-1.1,0);
  updateMotionButton();draw();if(!paused)start();
}
