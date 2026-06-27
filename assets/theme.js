(function(){'use strict';

// ── Cart badge (declared first so quickAdd can reference it) ──────────────
const cartBadge={
  el:null,
  init(){
    this.el=document.querySelector('.cart-badge');
    if(!this.el)return;
    fetch('/cart.js').then(r=>r.json()).then(cart=>{
      this.set(cart.item_count);
    }).catch(()=>{});
  },
  set(count){
    if(!this.el)this.el=document.querySelector('.cart-badge');
    if(!this.el)return;
    this.el.textContent=count;
    this.el.style.display=count>0?'flex':'none';
  }
};

// ============================================
// CART DRAWER
// ============================================
const cartDrawer={
  overlay:null,drawer:null,
  init(){
    this.overlay=document.querySelector('.cart-drawer-overlay');
    this.drawer=document.querySelector('.cart-drawer');
    document.querySelectorAll('[data-cart-open]').forEach(btn=>btn.addEventListener('click',()=>this.open()));
    document.querySelectorAll('[data-cart-close]').forEach(el=>el.addEventListener('click',()=>this.close()));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')this.close();});
  },
  open(){
    cartDrawerUI.refresh();
    if(this.overlay)this.overlay.classList.add('open');
    if(this.drawer)this.drawer.classList.add('open');
    document.body.style.overflow='hidden';
  },
  close(){
    if(this.overlay)this.overlay.classList.remove('open');
    if(this.drawer)this.drawer.classList.remove('open');
    document.body.style.overflow='';
  }
};

// ============================================
// SEARCH
// ============================================
const searchOverlay={overlay:null,init(){this.overlay=document.querySelector('.search-overlay');const openBtn=document.querySelector('[data-search-open]');const closeBtn=document.querySelector('[data-search-close]');if(openBtn)openBtn.addEventListener('click',()=>this.open());if(closeBtn)closeBtn.addEventListener('click',()=>this.close());document.addEventListener('keydown',e=>{if(e.key==='Escape')this.close();if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();this.open()}})},open(){if(this.overlay){this.overlay.classList.add('open');const input=this.overlay.querySelector('.search-input');if(input)setTimeout(()=>input.focus(),100)}},close(){if(this.overlay)this.overlay.classList.remove('open')}};

// ============================================
// MOBILE NAV
// ============================================
const mobileNav={init(){const btn=document.querySelector('.mobile-menu-btn');const nav=document.querySelector('.mobile-nav');const overlay=document.querySelector('.mobile-nav-overlay');if(!btn)return;btn.addEventListener('click',()=>{nav.classList.toggle('open');overlay.classList.toggle('open');btn.classList.toggle('active');document.body.style.overflow=nav.classList.contains('open')?'hidden':''});if(overlay)overlay.addEventListener('click',()=>{nav.classList.remove('open');overlay.classList.remove('open');btn.classList.remove('active');document.body.style.overflow=''})}};

// ============================================
// PRODUCT GALLERY
// ============================================
const productGallery={init(){const thumbs=document.querySelectorAll('.product-thumb');const mainImg=document.querySelector('.product-main-image img');thumbs.forEach(thumb=>{thumb.addEventListener('click',()=>{thumbs.forEach(t=>t.classList.remove('active'));thumb.classList.add('active');if(mainImg){mainImg.style.opacity='0';mainImg.style.transform='scale(0.97)';setTimeout(()=>{mainImg.src=thumb.dataset.src||thumb.querySelector('img')?.src;mainImg.style.opacity='1';mainImg.style.transform='scale(1)'},200)}})})}};

// ============================================
// PRODUCT OPTIONS
// ============================================
const productOptions={init(){document.querySelectorAll('.option-btn').forEach(btn=>{btn.addEventListener('click',()=>{const group=btn.closest('.product-options');if(group)group.querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected')})})}};

// ============================================
// HEADER SCROLL
// ============================================
const headerScroll={init(){const header=document.querySelector('.site-header');if(!header)return;let last=0;window.addEventListener('scroll',()=>{const cur=window.scrollY;if(cur>100){header.style.boxShadow='0 4px 40px rgba(0,0,0,0.6)';header.style.borderBottomColor='rgba(180,79,255,0.25)'}else{header.style.boxShadow='none';header.style.borderBottomColor='rgba(180,79,255,0.15)'}last=cur},{passive:true})}};

// ============================================
// QUICK ADD
// ============================================
/* ── Cart drawer renderer + AJAX qty ────────────────────────────────────── */
const cartDrawerUI={
  _busy:false,

  /* Fetch /cart.js and re-render the drawer contents */
  async refresh(){
    try{
      const r=await fetch('/cart.js');
      const cart=await r.json();
      this.render(cart);
    }catch(e){}
  },

  /* Build the drawer items from a cart JSON object */
  render(cart){
    cartBadge.set(cart.item_count);

    // Update count in header
    const countEl=document.getElementById('cart-drawer-count');
    if(countEl)countEl.textContent=cart.item_count>0?'('+cart.item_count+')':'';

    // Update subtotal
    const sub=document.getElementById('cart-drawer-subtotal');
    if(sub)sub.textContent='$'+(cart.total_price/100).toFixed(2);

    // Update free shipping bar
    this._updateShipBar(cart.total_price);

    // Show/hide footer
    const footer=document.getElementById('cart-drawer-footer');
    if(footer)footer.style.display=cart.item_count>0?'block':'none';

    const body=document.getElementById('cart-drawer-items');
    if(!body)return;
    body.replaceChildren();

    if(cart.item_count===0){
      const wrap=document.createElement('div');
      wrap.className='drawer-empty';
      wrap.innerHTML='<div class="drawer-empty-icon">🛒</div><p style="font-family:var(--font-heading);font-size:16px;font-weight:600;margin-bottom:8px;">Your cart is empty</p><p style="font-size:13px;color:var(--text-muted);margin-bottom:24px;">Time to level up your rig.</p><a href="/collections/all" class="btn btn-primary" style="font-size:13px;padding:10px 24px;">Shop Now</a>';
      body.appendChild(wrap);
      return;
    }

    // Separate bundle items (have _bundle_id property) from regular items
    const bundleGroups={};
    const regularItems=[];
    cart.items.forEach(item=>{
      const props=item.properties||{};
      const bid=props._bundle_id;
      if(bid){
        if(!bundleGroups[bid])bundleGroups[bid]=[];
        bundleGroups[bid].push(item);
      } else {
        regularItems.push(item);
      }
    });

    // Render bundle groups first
    Object.values(bundleGroups).forEach(items=>{
      const first=items[0];
      const props=first.properties||{};
      const size=parseInt(props._bundle_size||'1',10);
      const disc=parseInt(props._bundle_disc||'0',10);
      const origCents=parseInt(props._bundle_orig||'0',10);
      const saveCents=parseInt(props._bundle_save||'0',10);
      const nowCents=origCents-saveCents;
      const fmt=c=>'$'+(c/100).toFixed(2);

      const group=document.createElement('div');
      group.className='drawer-bundle-group';
      group.innerHTML=
        '<div class="drawer-bundle-header">'+
          '<span class="drawer-bundle-title">Bundle</span>'+
          '<span class="drawer-bundle-badge">'+size+' ITEMS'+(disc>0?' · '+disc+'% OFF':'')+'</span>'+
        '</div>';

      items.forEach(it=>{
        const itRow=document.createElement('div');
        itRow.className='drawer-bundle-item';
        itRow.innerHTML=
          '<div class="drawer-bundle-item-img">'+
            (it.image?'<img src="'+it.image+'" alt="'+it.product_title+'">':'<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:20px;">🎮</div>')+
          '</div>'+
          '<div class="drawer-bundle-item-name">'+it.product_title+'</div>'+
          '<div class="drawer-bundle-item-price">'+fmt(it.price)+'</div>';
        group.appendChild(itRow);
      });

      const foot=document.createElement('div');
      foot.className='drawer-bundle-footer';
      foot.innerHTML=
        (disc>0?'<span class="drawer-bundle-was">'+fmt(origCents)+'</span>':'<span></span>')+
        '<span class="drawer-bundle-now">'+fmt(disc>0?nowCents:origCents)+'</span>';
      group.appendChild(foot);

      // Remove all bundle items
      const removeBtn=document.createElement('button');
      removeBtn.className='drawer-bundle-remove';
      removeBtn.textContent='Remove bundle';
      removeBtn.addEventListener('click',async()=>{
        removeBtn.textContent='Removing…';
        try{
          for(const it of items){
            await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:it.key,quantity:0})});
          }
          await cartDrawerUI.refresh();
        }catch{removeBtn.textContent='Remove bundle';}
      });
      group.appendChild(removeBtn);
      body.appendChild(group);
    });

    // Update checkout button with bundle discount code if applicable
    const checkoutForm=document.querySelector('.cart-drawer-footer form');
    if(checkoutForm){
      const bundleCode=cart.attributes&&cart.attributes._bundle_code;
      const existingInput=checkoutForm.querySelector('[name="discount"]');
      if(bundleCode){
        if(!existingInput){
          const inp=document.createElement('input');
          inp.type='hidden';inp.name='discount';inp.value=bundleCode;
          checkoutForm.appendChild(inp);
        } else {existingInput.value=bundleCode;}
      } else if(existingInput){existingInput.remove();}
    }

    // Render regular items
    regularItems.forEach(item=>{
      const row=document.createElement('div');
      row.className='drawer-item';
      row.dataset.key=item.key;

      // Image
      const imgWrap=document.createElement('div');
      imgWrap.className='drawer-item-img';
      if(item.image){const img=document.createElement('img');img.src=item.image;img.alt=item.product_title;imgWrap.appendChild(img);}
      else{imgWrap.innerHTML='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;">🎮</div>';}

      // Info column
      const info=document.createElement('div');
      const name=document.createElement('div');
      name.className='drawer-item-name';
      name.textContent=item.product_title;
      info.appendChild(name);

      if(item.variant_title&&item.variant_title!=='Default Title'){
        const v=document.createElement('div');
        v.className='drawer-item-variant';
        v.textContent=item.variant_title;
        info.appendChild(v);
      }

      const bottom=document.createElement('div');
      bottom.className='drawer-item-bottom';

      // Price (line price)
      const price=document.createElement('div');
      price.className='drawer-item-price';
      price.dataset.key=item.key;
      price.textContent='$'+(item.line_price/100).toFixed(2);

      // Qty control
      const qtyWrap=document.createElement('div');
      qtyWrap.className='drawer-qty';

      const btnMinus=document.createElement('button');
      btnMinus.className='drawer-qty-btn';
      btnMinus.textContent='−';
      btnMinus.setAttribute('aria-label','Decrease quantity');

      const qtyNum=document.createElement('div');
      qtyNum.className='drawer-qty-num';
      qtyNum.textContent=item.quantity;

      const btnPlus=document.createElement('button');
      btnPlus.className='drawer-qty-btn';
      btnPlus.textContent='+';
      btnPlus.setAttribute('aria-label','Increase quantity');

      qtyWrap.append(btnMinus,qtyNum,btnPlus);
      bottom.append(price,qtyWrap);
      info.appendChild(bottom);

      // Remove link
      const removeBtn=document.createElement('button');
      removeBtn.className='drawer-item-remove';
      removeBtn.textContent='Remove';

      info.appendChild(removeBtn);
      row.append(imgWrap,info);
      body.appendChild(row);

      // Wire up qty buttons
      const changeQty=async(delta)=>{
        if(this._busy)return;
        this._busy=true;
        const cur=parseInt(qtyNum.textContent,10);
        const next=Math.max(0,cur+delta);
        qtyNum.textContent='…';
        try{
          const res=await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.key,quantity:next})});
          const updated=await res.json();
          this.render(updated);
        }catch{qtyNum.textContent=cur;}
        finally{this._busy=false;}
      };
      btnMinus.addEventListener('click',()=>changeQty(-1));
      btnPlus.addEventListener('click',()=>changeQty(1));
      removeBtn.addEventListener('click',async()=>{
        if(this._busy)return;
        this._busy=true;
        removeBtn.textContent='Removing…';
        try{
          const res=await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.key,quantity:0})});
          const updated=await res.json();
          this.render(updated);
        }catch{removeBtn.textContent='Remove';}
        finally{this._busy=false;}
      });
    });
  },

  _updateShipBar(totalCents){
    const bar=document.getElementById('cart-drawer-ship-bar');
    if(!bar)return;
    const threshold=7500;
    if(totalCents>=threshold){
      bar.innerHTML='<div class="ship-bar-text ship-bar-done">✓ You qualify for free shipping!</div>';
    } else {
      const pct=Math.min(100,Math.round(totalCents/threshold*100));
      const remaining='$'+((threshold-totalCents)/100).toFixed(2);
      bar.innerHTML='<div class="ship-bar-text">Add <strong>'+remaining+'</strong> more for free shipping</div><div class="ship-bar-track"><div class="ship-bar-fill" style="width:'+pct+'%"></div></div>';
    }
  }
};

const quickAdd={
  init(){
    document.querySelectorAll('[data-quick-add]').forEach(btn=>{
      btn.addEventListener('click',async e=>{
        e.preventDefault();
        const variantId=btn.dataset.variantId;
        if(!variantId)return;
        const orig=btn.textContent;
        btn.textContent='Adding...';
        btn.disabled=true;
        try{
          const res=await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:variantId,quantity:1})});
          if(res.ok){
            btn.textContent='Added ✓';
            btn.style.borderColor='var(--accent-cyan)';
            btn.style.color='var(--accent-cyan)';
            await cartDrawerUI.refresh();
            cartDrawer.open();
            setTimeout(()=>{btn.textContent=orig;btn.style.borderColor='';btn.style.color='';btn.disabled=false;},2000);
          }
        }catch{btn.textContent=orig;btn.disabled=false;}
      });
    });
  }
};


// ============================================
// ANNOUNCEMENT TICKER
// ============================================
const ticker={messages:['⚡ Free shipping on orders over $75','🎮 New arrivals: Cosmic Desk Mat Series','🌟 Bundle & save — Starter Rig Kit from $109.95','🚀 Fast AU shipping on all orders'],current:0,init(){const el=document.querySelector('.announcement-text');if(!el)return;el.style.transition='opacity 0.4s ease,transform 0.4s ease';setInterval(()=>{el.style.opacity='0';el.style.transform='translateY(-8px)';setTimeout(()=>{this.current=(this.current+1)%this.messages.length;el.textContent=this.messages[this.current];el.style.transform='translateY(8px)';requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateY(0)'})},400)},4000)}};

// ============================================
// CURSOR TRAIL
// ============================================
const cursorTrail={init(){if(window.innerWidth<1024||window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;const trail=document.createElement('div');trail.style.cssText='position:fixed;width:6px;height:6px;border-radius:50%;background:var(--accent-purple);pointer-events:none;z-index:9999;filter:blur(1px);opacity:0;transition:opacity 0.3s;box-shadow:0 0 10px var(--accent-purple),0 0 20px rgba(180,79,255,0.4)';document.body.appendChild(trail);const ring=document.createElement('div');ring.style.cssText='position:fixed;width:28px;height:28px;border-radius:50%;border:1px solid rgba(180,79,255,0.4);pointer-events:none;z-index:9998;opacity:0;transition:opacity 0.3s';document.body.appendChild(ring);let mx=0,my=0,tx=0,ty=0,rx=0,ry=0,vis=false;document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;if(!vis){vis=true;trail.style.opacity='1';ring.style.opacity='1'}});document.addEventListener('mouseleave',()=>{vis=false;trail.style.opacity='0';ring.style.opacity='0'});const animate=()=>{tx+=(mx-tx)*0.2;ty+=(my-ty)*0.2;rx+=(mx-rx)*0.08;ry+=(my-ry)*0.08;trail.style.left=(tx-3)+'px';trail.style.top=(ty-3)+'px';ring.style.left=(rx-14)+'px';ring.style.top=(ry-14)+'px';requestAnimationFrame(animate)};animate()}};

// ============================================
// GSAP ANIMATIONS (Phase 2)
// ============================================
const gsapAnimations={init(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  if(typeof gsap==='undefined'||typeof ScrollTrigger==='undefined')return;

  gsap.registerPlugin(ScrollTrigger);

  // Refresh ScrollTrigger after layout settles
  setTimeout(()=>ScrollTrigger.refresh(),400);

  // ── Scroll progress bar ──────────────────────────────────────────────────
  const bar=document.createElement('div');
  bar.style.cssText='position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,#b44fff,#00f5ff);z-index:9999;width:0%;pointer-events:none;transform-origin:left';
  document.body.appendChild(bar);
  gsap.to(bar,{width:'100%',ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:0.3}});

  // ── Hero entrance sequence ───────────────────────────────────────────────
  const hero=document.querySelector('.hero-section');
  if(hero){
    const tl=gsap.timeline({delay:0.15});
    tl.from('.hero-eyebrow',{y:20,opacity:0,duration:0.6,ease:'power3.out'})
      .from('.hero-title',{y:40,opacity:0,duration:0.8,ease:'power3.out'},'-=0.3')
      .from('.hero-subtitle',{y:20,opacity:0,duration:0.6,ease:'power3.out'},'-=0.4')
      .from('.hero-cta-group',{y:20,opacity:0,duration:0.5,ease:'power3.out'},'-=0.3')
      .from('.hero-stats > *',{y:20,opacity:0,stagger:0.12,duration:0.5,ease:'power3.out'},'-=0.2')
      .from('.showcase-card',{y:40,opacity:0,scale:0.94,stagger:0.1,duration:0.7,ease:'power3.out'},'-=0.5');

    // Parallax on hero bg layers
    gsap.to('.hero-grid',{y:'15%',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero-bg-gradient',{y:'8%',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});

    // Hero title reveal — animate child text nodes safely without touching HTML structure
    const heroTitle=document.querySelector('.hero-title');
    if(heroTitle){
      gsap.from(heroTitle.childNodes,{
        y:30,opacity:0,stagger:0.12,duration:0.7,ease:'power4.out',
        scrollTrigger:{trigger:heroTitle,start:'top 85%',toggleActions:'play none none none'}
      });
    }
  }

  // Helper: animate only on scroll-into-view; elements stay naturally visible until then
  function onEnter(trigger,fn,start){
    start=start||'top 85%';
    ScrollTrigger.create({trigger,start,once:true,onEnter:fn});
  }

  // ── Section headers ──────────────────────────────────────────────────────
  gsap.utils.toArray('.section-header').forEach(el=>{
    onEnter(el,()=>gsap.fromTo(el,{y:-20,opacity:0},{y:0,opacity:1,duration:0.7,ease:'power3.out'}));
  });

  // ── Product card stagger ─────────────────────────────────────────────────
  gsap.utils.toArray('.products-grid').forEach(grid=>{
    const cards=grid.querySelectorAll('.product-card');
    onEnter(grid,()=>gsap.fromTo(cards,{y:48,opacity:0},{y:0,opacity:1,stagger:0.08,duration:0.6,ease:'power3.out'}),'top 90%');
  });

  // ── Collection cards stagger ─────────────────────────────────────────────
  const colGrid=document.querySelector('.collections-grid');
  if(colGrid){
    onEnter(colGrid,()=>gsap.fromTo(colGrid.querySelectorAll('.collection-card'),{y:48,opacity:0},{y:0,opacity:1,stagger:0.1,duration:0.6,ease:'power3.out'}));
  }

  // ── Featured banner slide in ─────────────────────────────────────────────
  const bannerCols=document.querySelectorAll('.featured-banner-inner > *');
  if(bannerCols.length>=2){
    onEnter(bannerCols[0],()=>{
      gsap.fromTo(bannerCols[0],{x:-56,opacity:0},{x:0,opacity:1,duration:0.8,ease:'power3.out'});
      gsap.fromTo(bannerCols[1],{x:56,opacity:0},{x:0,opacity:1,duration:0.8,ease:'power3.out'});
    });
  }

  // ── Bundle card scale in ─────────────────────────────────────────────────
  const bundleCard=document.querySelector('.bundle-card');
  if(bundleCard) onEnter(bundleCard,()=>gsap.fromTo(bundleCard,{scale:0.96,opacity:0},{scale:1,opacity:1,duration:0.7,ease:'power3.out'}));

  // ── Why cards stagger ────────────────────────────────────────────────────
  const whyGrid=document.querySelector('.why-grid');
  if(whyGrid) onEnter(whyGrid,()=>gsap.fromTo(whyGrid.querySelectorAll('.why-card'),{y:40,opacity:0},{y:0,opacity:1,stagger:0.1,duration:0.6,ease:'power3.out'}));

  // ── Count-up on hero stats ───────────────────────────────────────────────
  document.querySelectorAll('.hero-stat-value').forEach(el=>{
    const text=el.textContent;
    const num=parseFloat(text.replace(/[^0-9.]/g,''));
    if(!num)return;
    const suffix=text.replace(/[0-9.]/g,'');
    const obj={val:0};
    gsap.to(obj,{val:num,duration:1.4,ease:'power2.out',
      scrollTrigger:{trigger:el,start:'top 90%',toggleActions:'play none none none'},
      onUpdate(){el.textContent=Math.floor(obj.val)+suffix}});
  });

  // ── Neon flicker on logo ─────────────────────────────────────────────────
  const logo=document.querySelector('.logo-text');
  if(logo){
    const tl=gsap.timeline({delay:0.6});
    tl.to(logo,{filter:'brightness(3) drop-shadow(0 0 8px #b44fff)',duration:0.08})
      .to(logo,{filter:'brightness(1)',duration:0.06})
      .to(logo,{filter:'brightness(3) drop-shadow(0 0 8px #b44fff)',duration:0.06})
      .to(logo,{filter:'brightness(1)',duration:0.12})
      .to(logo,{filter:'brightness(2) drop-shadow(0 0 4px #b44fff)',duration:0.08})
      .to(logo,{filter:'brightness(1)',duration:0.16});
  }
}};

// ============================================
// FLOATING PARTICLES ON HERO
// ============================================
const heroParticles={init(){const hero=document.querySelector('.hero-section');if(!hero||window.innerWidth<768||window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.4';hero.appendChild(canvas);const ctx=canvas.getContext('2d');let W,H,particles=[];const resize=()=>{W=canvas.width=hero.offsetWidth;H=canvas.height=hero.offsetHeight;particles=Array.from({length:40},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,hue:Math.random()<0.5?270:185,alpha:Math.random()*0.6+0.2}))};resize();window.addEventListener('resize',resize,{passive:true});const draw=()=>{ctx.clearRect(0,0,W,H);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},100%,70%,${p.alpha})`;ctx.shadowBlur=6;ctx.shadowColor=`hsla(${p.hue},100%,70%,0.8)`;ctx.fill()});requestAnimationFrame(draw)};draw()}};

// ============================================
// INIT
// ============================================
/* ── Cart page: AJAX quantity controls ───────────────────────────────── */
const cartPage={
  busy:false,
  init(){
    // qty +/- buttons
    document.querySelectorAll('.qty-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(this.busy)return;
        const key=btn.dataset.key;
        const row=btn.closest('[data-cart-row]')||btn.closest('div[style*="display:grid"]');
        const qtyEl=btn.closest('.qty-control')?.querySelector('.qty-display');
        const current=parseInt(qtyEl?.textContent||'1',10);
        const next=Math.max(0,current+parseInt(btn.dataset.delta,10));
        this.change(key,next,row,qtyEl);
      });
    });
    // remove buttons
    document.querySelectorAll('.qty-remove').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(this.busy)return;
        const key=btn.dataset.key;
        const row=btn.closest('div[style*="display:grid"]');
        this.change(key,0,row,null);
      });
    });
  },
  async change(key,qty,row,qtyEl){
    this.busy=true;
    if(qtyEl)qtyEl.textContent='…';
    try{
      const res=await fetch('/cart/change.js',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:key,quantity:qty})
      });
      const cart=await res.json();
      cartBadge.set(cart.item_count);
      // update subtotal / total
      const fmt=p=>'$'+(p/100).toFixed(2);
      const sub=document.getElementById('cart-page-subtotal');
      const tot=document.getElementById('cart-page-total');
      const drawerSub=document.getElementById('cart-drawer-subtotal');
      if(sub)sub.textContent=fmt(cart.total_price);
      if(tot)tot.textContent=fmt(cart.total_price);
      if(drawerSub)drawerSub.textContent=fmt(cart.total_price);
      // find updated item
      const item=cart.items.find(i=>i.key===key);
      if(qty===0||!item){
        // remove row from DOM
        if(row)row.remove();
        if(cart.item_count===0)location.reload();
      } else {
        if(qtyEl)qtyEl.textContent=item.quantity;
        // update line price
        const lineEl=document.querySelector(`.cart-line-price[data-key="${key}"]`);
        if(lineEl)lineEl.textContent=fmt(item.line_price);
      }
    }catch(e){
      if(qtyEl)qtyEl.textContent='!';
    }finally{
      this.busy=false;
    }
  }
};

/* ── Bundle Builder ──────────────────────────────────────────────────────── */
const bundleBuilder = {
  step: 1,
  sel: [null, null, null], // [mat, second, third]
  usedCats: [],            // which non-mat cats have been selected
  ALL_CATS: ['lighting', 'organisation'],

  init() {
    if (!window.GR_BUNDLE) return;
    if (!document.getElementById('bb-grid')) return;
    this._tagProducts();
    this.renderStep(1);
    document.getElementById('bb-add-cart').addEventListener('click', () => this.addToCart());
    document.getElementById('bb-back').addEventListener('click', () => this.goBack());
  },

  /* Tag each product with its category for step 2/3 logic */
  _tagProducts() {
    const d = window.GR_BUNDLE;
    d.mats = d.mats.map(p => ({...p, _cat:'mats'}));
    d.lighting = d.lighting.map(p => ({...p, _cat:'lighting'}));
    d.organisation = d.organisation.map(p => ({...p, _cat:'organisation'}));
  },

  fmt(cents) { return '$' + (cents / 100).toFixed(2); },

  discount() {
    const filled = this.sel.filter(Boolean).length;
    if (filled >= 3) return 0.20;
    if (filled >= 2) return 0.10;
    return 0;
  },

  renderStep(n) {
    this.step = n;
    const d = window.GR_BUNDLE;
    const heading = document.getElementById('bb-step-heading');
    const catLabel = document.getElementById('bb-category-label');
    const backBtn  = document.getElementById('bb-back');

    // Step indicators
    [1,2,3].forEach(i => {
      const el = document.getElementById('bb-step-ind-' + i);
      el.classList.remove('active', 'done');
      if (i < n) el.classList.add('done');
      else if (i === n) el.classList.add('active');
    });

    if (n === 1) {
      heading.textContent = 'Step 1 — Choose your desk mat';
      catLabel.textContent = d.mats.length + ' mats available';
      backBtn.style.display = 'none';
      this.renderGrid(d.mats);
    } else if (n === 2) {
      // Show products from both non-mat categories
      const avail = [...d.lighting, ...d.organisation];
      heading.textContent = 'Step 2 — Add lighting or an accessory';
      catLabel.textContent = 'Choose one item from Lighting or Organisation';
      backBtn.style.display = 'inline-block';
      this.renderGrid(avail, true);
    } else if (n === 3) {
      // Only show the category not yet selected
      const usedCat = this.sel[1]?._cat;
      const remainCat = this.ALL_CATS.find(c => c !== usedCat);
      const avail = d[remainCat] || [];
      const label = remainCat === 'lighting' ? 'Lighting' : 'Organisation';
      heading.textContent = 'Step 3 — Add a ' + label + ' item';
      catLabel.textContent = avail.length + ' items available — and save 20%';
      backBtn.style.display = 'inline-block';
      this.renderGrid(avail);
    }

    this.updateSummary();
  },

  _variantIdx(p) {
    return p._variantIdx || 0;
  },

  _activeVariant(p) {
    const idx = this._variantIdx(p);
    return p.variants && p.variants[idx] ? p.variants[idx] : (p.variants && p.variants[0]);
  },

  renderGrid(products, showCat = false) {
    const grid = document.getElementById('bb-grid');
    grid.innerHTML = '';
    products.forEach(p => {
      const variant = this._activeVariant(p);
      const price   = variant ? variant.price : 0;
      // Robust image: featured_image object or array
      const imgSrc  = (p.featured_image && (p.featured_image.src || p.featured_image)) ||
                      (p.images && p.images[0] && (p.images[0].src || p.images[0])) || '';
      const catLabel  = showCat ? (p._cat === 'lighting' ? 'Lighting' : 'Organisation') : '';
      const isSelected = this.sel.some(s => s && s.id === p.id);

      // Build variant pills if product has multiple variants with size-like options
      const hasVariants = p.variants && p.variants.length > 1;
      let variantHtml = '';
      if (hasVariants) {
        variantHtml = '<div class="bb-card-variants" data-pid="' + p.id + '">';
        p.variants.forEach((v, i) => {
          const label = v.option1 || v.title;
          const isActive = i === this._variantIdx(p);
          variantHtml += '<button class="bb-var' + (isActive ? ' active' : '') + '" data-vidx="' + i + '">' + label + '</button>';
        });
        variantHtml += '</div>';
      }

      const card = document.createElement('div');
      card.className = 'bb-card' + (isSelected ? ' selected' : '');
      card.innerHTML =
        '<div class="bb-card-img">' +
          (imgSrc ? '<img src="' + imgSrc + '" alt="' + p.title + '" loading="lazy">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;">🎮</div>') +
        '</div>' +
        '<div class="bb-card-body">' +
          (catLabel ? '<div class="bb-card-cat">' + catLabel + '</div>' : '') +
          '<div class="bb-card-name">' + p.title + '</div>' +
          variantHtml +
          '<div class="bb-card-price" data-price-pid="' + p.id + '">' + this.fmt(price) + '</div>' +
        '</div>' +
        '<div class="bb-card-check">✓</div>';

      // Variant pill clicks — update selection without triggering card select
      if (hasVariants) {
        card.querySelectorAll('.bb-var').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.vidx, 10);
            p._variantIdx = idx;
            card.querySelectorAll('.bb-var').forEach(b => b.classList.toggle('active', b === btn));
            const priceEl = card.querySelector('[data-price-pid]');
            if (priceEl) priceEl.textContent = this.fmt(p.variants[idx].price);
            // If this product is already selected, update summary price
            if (this.sel.some(s => s && s.id === p.id)) this.updateSummary();
          });
        });
      }

      card.addEventListener('click', () => this.selectProduct(p));
      grid.appendChild(card);
    });
  },

  selectProduct(p) {
    const idx = this.step - 1;
    this.sel[idx] = p;

    if (this.step === 1) {
      this.renderStep(2);
    } else if (this.step === 2) {
      this.renderStep(3);
    } else {
      // Step 3 done — just update summary, enable CTA
      this.updateSummary();
      this.renderGrid(
        window.GR_BUNDLE[this.ALL_CATS.find(c => c !== this.sel[1]?._cat)] || [],
        false
      );
      // Re-render to show check mark
      const usedCat = this.sel[1]?._cat;
      const remainCat = this.ALL_CATS.find(c => c !== usedCat);
      this.renderGrid(window.GR_BUNDLE[remainCat] || []);
    }
  },

  goBack() {
    if (this.step === 2) {
      this.sel[1] = null;
      this.renderStep(1);
    } else if (this.step === 3) {
      this.sel[2] = null;
      this.renderStep(2);
    }
  },

  updateSummary() {
    const slots = [
      { el: document.getElementById('bb-slot-1'), nameEl: document.getElementById('bb-slot-1-name'), sel: this.sel[0] },
      { el: document.getElementById('bb-slot-2'), nameEl: document.getElementById('bb-slot-2-name'), sel: this.sel[1] },
      { el: document.getElementById('bb-slot-3'), nameEl: document.getElementById('bb-slot-3-name'), sel: this.sel[2] },
    ];
    slots.forEach((s, i) => {
      if (s.sel) {
        s.el.classList.add('bb-slot--filled');
        s.el.classList.remove('bb-slot--locked');
        s.nameEl.textContent = s.sel.title;
      } else {
        s.el.classList.remove('bb-slot--filled');
        if (i > 0) s.el.classList.add('bb-slot--locked');
        s.nameEl.textContent = 'Not selected';
      }
    });

    const filled = this.sel.filter(Boolean);
    const pricingEl = document.getElementById('bb-pricing');
    const addBtn    = document.getElementById('bb-add-cart');
    const hintEl    = document.getElementById('bb-cta-hint');
    const discRow   = document.getElementById('bb-discount-row');
    const discLabel = document.getElementById('bb-discount-label');
    const savingEl  = document.getElementById('bb-saving');
    const origEl    = document.getElementById('bb-original-price');
    const totalEl   = document.getElementById('bb-total-price');

    // Tier highlighting
    [1,2,3].forEach(n => {
      const t = document.getElementById('bb-tier-' + n);
      if (t) t.classList.toggle('bb-tier--active', filled.length === n - 1 || (n === 3 && filled.length >= 3));
    });
    if (document.getElementById('bb-tier-1')) {
      document.getElementById('bb-tier-1').classList.toggle('bb-tier--active', filled.length === 0);
      document.getElementById('bb-tier-2').classList.toggle('bb-tier--active', filled.length === 1);
      document.getElementById('bb-tier-3').classList.toggle('bb-tier--active', filled.length >= 2);
    }

    if (filled.length === 0) {
      pricingEl.style.display = 'none';
      addBtn.disabled = true;
      hintEl.textContent = 'Select a desk mat to start';
      return;
    }

    const originalTotal = filled.reduce((sum, p) => {
      const v = this._activeVariant(p);
      return sum + (v ? v.price : 0);
    }, 0);
    const disc   = this.discount();
    const saving = Math.round(originalTotal * disc);
    const total  = originalTotal - saving;

    pricingEl.style.display = 'flex';
    origEl.textContent = this.fmt(originalTotal);
    totalEl.textContent = this.fmt(total);

    if (disc > 0) {
      discRow.style.display = 'flex';
      discLabel.textContent = 'Bundle discount (' + Math.round(disc * 100) + '% off)';
      savingEl.textContent  = '−' + this.fmt(saving);
    } else {
      discRow.style.display = 'none';
    }

    addBtn.disabled = false;
    const count = filled.length;
    hintEl.textContent = count === 1 ? 'Add a 2nd item for 10% off' : count === 2 ? 'Add a 3rd item for 20% off' : '20% bundle discount applied!';
    addBtn.textContent = 'Add Bundle to Cart (' + count + ' item' + (count > 1 ? 's' : '') + ')';
  },

  async addToCart() {
    const filled = this.sel.filter(Boolean);
    if (!filled.length) return;
    const btn = document.getElementById('bb-add-cart');
    btn.textContent = 'Adding...';
    btn.disabled = true;

    const bundleId  = 'bundle-' + Date.now();
    const bundleSize = filled.length;
    const discPct   = Math.round(this.discount() * 100);
    const discCode  = discPct === 20 ? 'BUNDLE20' : discPct === 10 ? 'BUNDLE10' : null;

    const originalTotal = filled.reduce((sum, p) => { const v = this._activeVariant(p); return sum + (v ? v.price : 0); }, 0);
    const saving = Math.round(originalTotal * this.discount());

    try {
      for (const p of filled) {
        const variantId = this._activeVariant(p)?.id || null;
        if (!variantId) continue;
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: variantId,
            quantity: 1,
            properties: {
              _bundle_id:   bundleId,
              _bundle_size: String(bundleSize),
              _bundle_disc: String(discPct),
              _bundle_save: String(saving),
              _bundle_orig: String(originalTotal),
            }
          })
        });
      }

      // Store discount code as cart attribute so we can use it at checkout
      if (discCode) {
        await fetch('/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributes: { _bundle_code: discCode } })
        });
      }

      await cartDrawerUI.refresh();
      cartDrawer.open();

      // Reset builder
      this.sel = [null, null, null];
      this.renderStep(1);
      btn.textContent = 'Add Bundle to Cart';
      btn.disabled = true;
    } catch(e) {
      btn.textContent = 'Error — try again';
      btn.disabled = false;
    }
  }
};

document.addEventListener('DOMContentLoaded',()=>{
  cartDrawer.init();
  searchOverlay.init();
  mobileNav.init();
  productGallery.init();
  productOptions.init();
  headerScroll.init();
  quickAdd.init();
  ticker.init();
  cursorTrail.init();
  heroParticles.init();
  cartBadge.init();
  cartPage.init();
  bundleBuilder.init();

  // Intercept product page "Add to Cart" form — open drawer instead of navigating
  const productForm=document.querySelector('[data-product-form]');
  if(productForm){
    productForm.addEventListener('submit',async e=>{
      e.preventDefault();
      const btn=productForm.querySelector('[data-add-to-cart]');
      const variantSelect=productForm.querySelector('[name="id"]');
      if(!variantSelect)return;
      const orig=btn?btn.textContent:'';
      if(btn){btn.textContent='Adding...';btn.disabled=true;}
      try{
        const res=await fetch('/cart/add.js',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id:variantSelect.value,quantity:1})
        });
        if(res.ok){
          await cartDrawerUI.refresh();
          cartDrawer.open();
          if(btn){
            btn.textContent='Added ✓';
            btn.style.background='linear-gradient(135deg,rgba(0,245,255,0.3),rgba(0,245,255,0.1))';
            setTimeout(()=>{btn.textContent=orig;btn.style.background='';btn.disabled=false;},2200);
          }
        }
      }catch{
        if(btn){btn.textContent=orig;btn.disabled=false;}
      }
    });
  }
  // GSAP runs after other scripts load (defer order)
  window.addEventListener('load',()=>gsapAnimations.init());
});

})();
