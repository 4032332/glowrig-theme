(function(){'use strict';

// ============================================
// CART DRAWER
// ============================================
const cartDrawer={overlay:null,drawer:null,init(){this.overlay=document.querySelector('.cart-drawer-overlay');this.drawer=document.querySelector('.cart-drawer');document.querySelectorAll('[data-cart-open]').forEach(btn=>btn.addEventListener('click',()=>this.open()));const closeBtn=document.querySelector('[data-cart-close]');if(closeBtn)closeBtn.addEventListener('click',()=>this.close());if(this.overlay)this.overlay.addEventListener('click',()=>this.close());document.addEventListener('keydown',e=>{if(e.key==='Escape')this.close()})},open(){if(this.overlay)this.overlay.classList.add('open');if(this.drawer)this.drawer.classList.add('open');document.body.style.overflow='hidden'},close(){if(this.overlay)this.overlay.classList.remove('open');if(this.drawer)this.drawer.classList.remove('open');document.body.style.overflow=''}};

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
const productGallery={init(){const thumbs=document.querySelectorAll('.product-thumb');const mainImg=document.querySelector('.product-main-image img');thumbs.forEach(thumb=>{thumb.addEventListener('click',()=>{thumbs.forEach(t=>t.classList.remove('active'));thumb.classList.add('active');if(mainImg){mainImg.style.opacity='0';mainImg.style.transform='scale(0.97)';setTimeout(()=>{mainImg.src=thumb.querySelector('img')?.src||thumb.dataset.src;mainImg.style.opacity='1';mainImg.style.transform='scale(1)'},200)}})})}};

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
const quickAdd={init(){document.querySelectorAll('[data-quick-add]').forEach(btn=>{btn.addEventListener('click',async e=>{e.preventDefault();const variantId=btn.dataset.variantId;if(!variantId)return;const orig=btn.textContent;btn.textContent='Adding...';btn.disabled=true;try{const res=await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:variantId,quantity:1})});if(res.ok){btn.textContent='Added ✓';btn.style.borderColor='var(--accent-cyan)';btn.style.color='var(--accent-cyan)';await this.refreshDrawer();cartDrawer.open();setTimeout(()=>{btn.textContent=orig;btn.style.borderColor='';btn.style.color='';btn.disabled=false},2000)}}catch{btn.textContent=orig;btn.disabled=false}})})},async refreshDrawer(){try{const res=await fetch('/cart.js');const cart=await res.json();const badge=document.querySelector('.cart-badge');if(badge){badge.textContent=cart.item_count;badge.style.display=cart.item_count>0?'flex':'none'}const drawerBody=document.getElementById('cart-drawer-items');if(!drawerBody)return;drawerBody.replaceChildren();if(cart.item_count===0){const empty=document.createElement('div');empty.style.cssText='text-align:center;padding:48px 0';const icon=document.createElement('div');icon.style.cssText='font-size:48px;margin-bottom:16px';icon.textContent='🛒';const msg=document.createElement('p');msg.style.cssText='color:var(--text-secondary);font-size:14px';msg.textContent='Your cart is empty';const link=document.createElement('a');link.href='/collections/all';link.style.cssText='display:inline-block;margin-top:16px;font-family:var(--font-heading);font-size:13px;color:var(--accent-purple)';link.textContent='Start Shopping →';empty.append(icon,msg,link);drawerBody.appendChild(empty);return}cart.items.forEach(item=>{const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:72px 1fr;gap:16px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border-subtle)';const imgWrap=document.createElement('div');imgWrap.style.cssText='width:72px;height:72px;border-radius:var(--radius-md);overflow:hidden;background:var(--bg-secondary)';if(item.image){const img=document.createElement('img');img.src=item.image;img.alt=item.product_title;img.style.cssText='width:100%;height:100%;object-fit:cover';imgWrap.appendChild(img)}else{const ph=document.createElement('div');ph.style.cssText='width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px';ph.textContent='🎮';imgWrap.appendChild(ph)}const info=document.createElement('div');const title=document.createElement('div');title.style.cssText='font-family:var(--font-heading);font-size:14px;font-weight:600;margin-bottom:4px;line-height:1.3';title.textContent=item.product_title;info.appendChild(title);if(item.variant_title&&item.variant_title!=='Default Title'){const variant=document.createElement('div');variant.style.cssText='font-size:12px;color:var(--text-muted);margin-bottom:6px';variant.textContent=item.variant_title;info.appendChild(variant)}const priceRow=document.createElement('div');priceRow.style.cssText='display:flex;align-items:center;justify-content:space-between';const price=document.createElement('span');price.style.cssText='font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--accent-purple)';price.textContent='$'+(item.price/100).toFixed(2);const qty=document.createElement('span');qty.style.cssText='font-size:12px;color:var(--text-muted)';qty.textContent='Qty: '+item.quantity;priceRow.append(price,qty);info.appendChild(priceRow);row.append(imgWrap,info);drawerBody.appendChild(row)})}catch{}}};

// ============================================
// ANNOUNCEMENT TICKER
// ============================================
const ticker={messages:['⚡ Free shipping on orders over $75','🎮 New arrivals: Cosmic Desk Mat Series','🌟 Bundle & save — Starter Rig Kit from $109.95','🚀 Fast AU shipping on all orders'],current:0,init(){const el=document.querySelector('.announcement-text');if(!el)return;el.style.transition='opacity 0.4s ease,transform 0.4s ease';setInterval(()=>{el.style.opacity='0';el.style.transform='translateY(-8px)';setTimeout(()=>{this.current=(this.current+1)%this.messages.length;el.textContent=this.messages[this.current];el.style.transform='translateY(8px)';requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateY(0)'})},400)},4000)}};

// ============================================
// CURSOR TRAIL
// ============================================
const cursorTrail={init(){if(window.innerWidth<1024||window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;const trail=document.createElement('div');trail.style.cssText='position:fixed;width:6px;height:6px;border-radius:50%;background:var(--accent-purple);pointer-events:none;z-index:9999;filter:blur(1px);opacity:0;transition:opacity 0.3s;box-shadow:0 0 10px var(--accent-purple),0 0 20px rgba(180,79,255,0.4)';document.body.appendChild(trail);const ring=document.createElement('div');ring.style.cssText='position:fixed;width:28px;height:28px;border-radius:50%;border:1px solid rgba(180,79,255,0.4);pointer-events:none;z-index:9998;opacity:0;transition:opacity 0.3s';document.body.appendChild(ring);let mx=0,my=0,tx=0,ty=0,rx=0,ry=0,vis=false;document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;if(!vis){vis=true;trail.style.opacity='1';ring.style.opacity='1'}});document.addEventListener('mouseleave',()=>{vis=false;trail.style.opacity='0';ring.style.opacity='0'});const animate=()=>{tx+=(mx-tx)*0.2;ty+=(my-ty)*0.2;rx+=(mx-rx)*0.08;ry+=(my-ry)*0.08;trail.style.left=(tx-3)+'px';trail.style.top=(ty-3)+'px';ring.style.left=(rx-14)+'px';ring.style.top=(ry-14)+'px';requestAnimationFrame(animate)};animate()}};

// ============================================
// ENHANCED SCROLL ANIMATIONS
// ============================================
const scrollAnimations={init(){if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
// Fade up — product cards, why cards, collection cards
const fadeUpEls=document.querySelectorAll('.product-card,.why-card,.collection-card');fadeUpEls.forEach((el,i)=>{el.style.opacity='0';el.style.transform='translateY(40px)';el.style.transition='opacity 0.6s ease, transform 0.6s ease';el.style.transitionDelay=(i%4)*0.08+'s'});
// Fade in from left/right — alternating sections
document.querySelectorAll('.featured-banner-inner > *').forEach((el,i)=>{el.style.opacity='0';el.style.transform=i%2===0?'translateX(-48px)':'translateX(48px)';el.style.transition='opacity 0.7s ease, transform 0.7s ease'});
// Scale in — bundle card, section headers
document.querySelectorAll('.bundle-card').forEach(el=>{el.style.opacity='0';el.style.transform='scale(0.96)';el.style.transition='opacity 0.7s ease, transform 0.7s ease'});
// Slide down — section eyebrows and titles
document.querySelectorAll('.section-header').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(-20px)';el.style.transition='opacity 0.6s ease, transform 0.6s ease'});
// Showcase cards
document.querySelectorAll('.showcase-card').forEach((el,i)=>{el.style.opacity='0';el.style.transform='translateY(32px) scale(0.95)';el.style.transition=`opacity 0.6s ease ${i*0.12}s, transform 0.6s ease ${i*0.12}s`});
// Hero text lines
document.querySelectorAll('.hero-title,.hero-eyebrow,.hero-subtitle,.hero-cta-group,.hero-stats').forEach((el,i)=>{el.style.opacity='0';el.style.transform='translateY(24px)';el.style.transition=`opacity 0.7s ease ${0.1+i*0.12}s, transform 0.7s ease ${0.1+i*0.12}s`});

const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const el=entry.target;el.style.opacity='1';el.style.transform='none';observer.unobserve(el)}})},{threshold:0.12,rootMargin:'0px 0px -30px 0px'});
document.querySelectorAll('.product-card,.why-card,.collection-card,.featured-banner-inner > *,.bundle-card,.section-header,.showcase-card,.hero-title,.hero-eyebrow,.hero-subtitle,.hero-cta-group,.hero-stats').forEach(el=>observer.observe(el));

// Parallax on hero bg
window.addEventListener('scroll',()=>{const hero=document.querySelector('.hero-section');if(!hero)return;const scroll=window.scrollY;const grid=hero.querySelector('.hero-grid');const gradient=hero.querySelector('.hero-bg-gradient');if(grid)grid.style.transform=`translateY(${scroll*0.15}px)`;if(gradient)gradient.style.transform=`translateY(${scroll*0.08}px)`},{passive:true});

// Neon flicker on logo on load
const logo=document.querySelector('.logo-text');if(logo){setTimeout(()=>{logo.style.transition='filter 0.1s';const flicker=[0,80,120,180,220,350];flicker.forEach((t,i)=>{setTimeout(()=>{logo.style.filter=i%2===0?'brightness(3) drop-shadow(0 0 8px #b44fff)':'brightness(1)'},t)});setTimeout(()=>{logo.style.filter='';logo.style.transition=''},400)},600)}

// Count-up on hero stats
const stats=document.querySelectorAll('.hero-stat-value');const statObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const el=entry.target;const text=el.textContent;const num=parseFloat(text.replace(/[^0-9.]/g,''));if(!num)return;const suffix=text.replace(/[0-9.]/g,'');let start=0;const dur=1200;const step=16;const inc=num/(dur/step);const timer=setInterval(()=>{start+=inc;if(start>=num){el.textContent=text;clearInterval(timer)}else{el.textContent=Math.floor(start)+suffix}},step);statObserver.unobserve(el)})},{threshold:0.5});stats.forEach(el=>statObserver.observe(el));

// Hover glow ripple on product cards
document.querySelectorAll('.product-card').forEach(card=>{card.addEventListener('mouseenter',e=>{const rect=card.getBoundingClientRect();const ripple=document.createElement('div');ripple.style.cssText=`position:absolute;width:100px;height:100px;border-radius:50%;background:radial-gradient(circle,rgba(180,79,255,0.15),transparent);pointer-events:none;transform:translate(-50%,-50%) scale(0);transition:transform 0.5s ease,opacity 0.5s ease;z-index:0;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px`;card.style.position='relative';card.appendChild(ripple);requestAnimationFrame(()=>{ripple.style.transform='translate(-50%,-50%) scale(4)';ripple.style.opacity='0'});setTimeout(()=>ripple.remove(),500)})});

// Scroll progress bar
const bar=document.createElement('div');bar.style.cssText='position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--accent-purple),var(--accent-cyan));z-index:9999;width:0%;transition:width 0.1s;pointer-events:none';document.body.appendChild(bar);window.addEventListener('scroll',()=>{const pct=(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100;bar.style.width=pct+'%'},{passive:true});

// Section divider glow sweep
document.querySelectorAll('.products-section::before').forEach(el=>{});
}};

// ============================================
// FLOATING PARTICLES ON HERO
// ============================================
const heroParticles={init(){const hero=document.querySelector('.hero-section');if(!hero||window.innerWidth<768||window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.4';hero.appendChild(canvas);const ctx=canvas.getContext('2d');let W,H,particles=[];const resize=()=>{W=canvas.width=hero.offsetWidth;H=canvas.height=hero.offsetHeight;particles=Array.from({length:40},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,hue:Math.random()<0.5?270:185,alpha:Math.random()*0.6+0.2}))};resize();window.addEventListener('resize',resize,{passive:true});const draw=()=>{ctx.clearRect(0,0,W,H);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},100%,70%,${p.alpha})`;ctx.shadowBlur=6;ctx.shadowColor=`hsla(${p.hue},100%,70%,0.8)`;ctx.fill()});requestAnimationFrame(draw)};draw()}};

// ============================================
// INIT
// ============================================
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
  scrollAnimations.init();
  heroParticles.init();
});

})();
