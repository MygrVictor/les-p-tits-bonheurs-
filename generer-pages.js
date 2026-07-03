"use strict";
const fs = require("fs");
const base = __dirname + "/public";

// ── FRAGMENTS PARTAGÉS ──────────────────────────────────────────
function sidenav(actif) {
  return `
    <nav class="sidenav" id="sidenav" aria-label="Navigation collections">
      <button class="sidenav__toggle" id="sidenav-toggle" aria-expanded="false" aria-label="Collections">
        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <span class="sidenav__label-vert" aria-hidden="true">Collections</span>
      <div class="sidenav__contenu">
        <div class="sidenav__logo"><img src="/logo.jpg" alt="Les P'tits Bonheurs"/></div>
        <p class="sidenav__section-titre">✦ Collections</p>
        <ul class="sidenav__liens">
          <li><a href="/produits.html">Tout voir</a></li>
          <li><a href="/produits.html?categorie=bagues">Bagues</a></li>
          <li><a href="/produits.html?categorie=colliers">Colliers</a></li>
          <li><a href="/produits.html?categorie=boucles">Boucles d'oreilles</a></li>
          <li><a href="/produits.html?categorie=pochettes">Pochettes</a></li>
          <li><a href="/produits.html?categorie=foulards">Foulards</a></li>
          <li><a href="/produits.html?categorie=epingles">Epingles</a></li>
        </ul>
        <hr class="sidenav__separateur"/>
        <ul class="sidenav__liens sidenav__liens--nav">
          <li><a href="/" ${actif === "accueil" ? 'class="actif"' : ""}>Accueil</a></li>
          <li><a href="/produits.html" ${actif === "produits" ? 'class="actif"' : ""}>La Boutique</a></li>
          <li><a href="/contact.html" ${actif === "contact" ? 'class="actif"' : ""}>Contact</a></li>
        </ul>
      </div>
    </nav>`;
}

function header(actif) {
  return `
    <header class="header" id="header">
      <a href="/" class="header__logo">
        <img src="/logo.jpg" alt="Les P'tits Bonheurs" class="header__logo-img"/>
      </a>
      <nav aria-label="Navigation principale">
        <ul class="header__nav">
          <li><a href="/produits.html"${actif === "produits" ? ' class="nav-actif"' : ""}>La Boutique</a></li>
          <li><a href="/#atelier">L'Atelier</a></li>
          <li><a href="/contact.html"${actif === "contact" ? ' class="nav-actif"' : ""}>Contact</a></li>
        </ul>
      </nav>
      <div class="header__actions">
        <button class="btn-panier" id="btn-ouvrir-panier" aria-label="Ouvrir le panier">
          <svg class="btn-panier__icone" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          Panier
          <span class="panier-badge" id="panier-badge" aria-live="polite">0</span>
        </button>
      </div>
    </header>`;
}

const PANIER = `
    <div class="panier-overlay" id="panier-overlay" aria-hidden="true"></div>
    <aside class="panier-drawer" id="panier-drawer" role="dialog" aria-modal="true" aria-label="Votre panier">
      <div class="panier-drawer__header">
        <h2 class="panier-drawer__titre">Votre Panier</h2>
        <button class="panier-drawer__fermer" id="btn-fermer-panier" aria-label="Fermer le panier">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="panier-drawer__liste" id="panier-liste">
        <p class="panier-drawer__vide" id="panier-vide">Votre panier est vide.<br/><em>Laissez-vous tenter...</em></p>
      </div>
      <div class="panier-drawer__pied">
        <div class="panier-drawer__total">
          <span class="panier-drawer__total-label">Total</span>
          <span class="panier-drawer__total-montant" id="panier-total">0,00 \u20ac</span>
        </div>
        <button class="btn-commander" id="btn-commander" disabled>
          <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Passer commande
        </button>
        <p class="panier-drawer__note">\uD83D\uDD12 Paiement 100\u00a0% s\u00e9curis\u00e9 via Stripe</p>
      </div>
    </aside>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

const MODALE = `
    <div class="modal-overlay" id="modal-overlay" aria-hidden="true"></div>
    <dialog class="modal-produit" id="modal-produit" aria-modal="true">
      <button class="modal-produit__fermer" id="modal-fermer" aria-label="Fermer">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-produit__inner">
        <div class="modal-produit__galerie">
          <img id="modal-image" src="" alt="" class="modal-produit__img"/>
          <span class="modal-produit__categorie" id="modal-categorie"></span>
        </div>
        <div class="modal-produit__infos">
          <h2 class="modal-produit__nom" id="modal-nom"></h2>
          <p class="modal-produit__materiaux" id="modal-materiaux"></p>
          <p class="modal-produit__description" id="modal-description"></p>
          <div class="modal-produit__options" id="modal-bloc-couleurs">
            <p class="modal-produit__option-label">Couleur <span id="modal-couleur-choisie"></span></p>
            <div class="modal-produit__choix" id="modal-couleurs"></div>
          </div>
          <div class="modal-produit__options" id="modal-bloc-tailles">
            <p class="modal-produit__option-label">Taille <span id="modal-taille-choisie"></span></p>
            <div class="modal-produit__choix" id="modal-tailles"></div>
          </div>
          <div class="modal-produit__bas">
            <span class="modal-produit__prix" id="modal-prix"></span>
            <button class="btn-modal-ajouter" id="modal-btn-ajouter">
              <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </dialog>`;

const JS_SHARED = `
    <script>
    'use strict';
    var panier=new Map();
    var panierDrawer=document.getElementById('panier-drawer');
    var panierOverlay=document.getElementById('panier-overlay');
    var panierListe=document.getElementById('panier-liste');
    var panierVide=document.getElementById('panier-vide');
    var panierTotal=document.getElementById('panier-total');
    var panierBadge=document.getElementById('panier-badge');
    var btnOuvrirPanier=document.getElementById('btn-ouvrir-panier');
    var btnFermerPanier=document.getElementById('btn-fermer-panier');
    var btnCommander=document.getElementById('btn-commander');
    var toast=document.getElementById('toast');
    var modalOverlay=document.getElementById('modal-overlay');
    var modalDialog=document.getElementById('modal-produit');
    var modalFermer=document.getElementById('modal-fermer');
    var modalImage=document.getElementById('modal-image');
    var modalCategorie=document.getElementById('modal-categorie');
    var modalNom=document.getElementById('modal-nom');
    var modalMateriaux=document.getElementById('modal-materiaux');
    var modalDesc=document.getElementById('modal-description');
    var modalPrix=document.getElementById('modal-prix');
    var modalBlocCouleurs=document.getElementById('modal-bloc-couleurs');
    var modalBlocTailles=document.getElementById('modal-bloc-tailles');
    var modalCouleurs=document.getElementById('modal-couleurs');
    var modalTailles=document.getElementById('modal-tailles');
    var modalCouleurChoisie=document.getElementById('modal-couleur-choisie');
    var modalTailleChoisie=document.getElementById('modal-taille-choisie');
    var modalBtnAjouter=document.getElementById('modal-btn-ajouter');
    var modalProduitCourant=null;
    var h=document.getElementById('header');
    if(h)window.addEventListener('scroll',function(){h.classList.toggle('scrolled',window.scrollY>60);},{passive:true});
    var sn=document.getElementById('sidenav');
    var snt=document.getElementById('sidenav-toggle');
    if(snt){
      snt.addEventListener('click',function(){var o=sn.classList.toggle('ouvert');snt.setAttribute('aria-expanded',String(o));});
      document.addEventListener('click',function(e){if(!sn.contains(e.target)&&sn.classList.contains('ouvert')){sn.classList.remove('ouvert');snt.setAttribute('aria-expanded','false');}});
    }
    function ouvrirModale(produit){
      modalProduitCourant=produit;
      modalImage.src=produit.image_url||'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80';
      modalImage.alt=produit.nom;
      modalCategorie.textContent=libCategorie(produit.categorie);
      modalNom.textContent=produit.nom;
      modalMateriaux.textContent=produit.materiaux||'';
      modalDesc.textContent=produit.description||'';
      modalPrix.textContent=formaterPrix(produit.prix);
      var couleurs=produit.couleurs?JSON.parse(produit.couleurs):[];
      if(couleurs.length){
        modalBlocCouleurs.style.display='block';
        modalCouleurs.innerHTML='';
        modalCouleurChoisie.textContent='';
        couleurs.forEach(function(c,i){
          var btn=document.createElement('button');
          btn.className='option-pill'+(i===0?' actif':'');
          btn.textContent=c;
          if(i===0)modalCouleurChoisie.textContent='\u2014 '+c;
          btn.addEventListener('click',function(){
            modalCouleurs.querySelectorAll('.option-pill').forEach(function(b){b.classList.remove('actif');});
            btn.classList.add('actif');
            modalCouleurChoisie.textContent='\u2014 '+c;
          });
          modalCouleurs.appendChild(btn);
        });
      }else{modalBlocCouleurs.style.display='none';}
      var tailles=produit.tailles?JSON.parse(produit.tailles):[];
      if(tailles.length){
        modalBlocTailles.style.display='block';
        modalTailles.innerHTML='';
        modalTailleChoisie.textContent='';
        tailles.forEach(function(t,i){
          var btn=document.createElement('button');
          btn.className='option-pill'+(i===0?' actif':'');
          btn.textContent=t;
          if(i===0)modalTailleChoisie.textContent='\u2014 '+t;
          btn.addEventListener('click',function(){
            modalTailles.querySelectorAll('.option-pill').forEach(function(b){b.classList.remove('actif');});
            btn.classList.add('actif');
            modalTailleChoisie.textContent='\u2014 '+t;
          });
          modalTailles.appendChild(btn);
        });
      }else{modalBlocTailles.style.display='none';}
      modalDialog.showModal();
      modalOverlay.classList.add('ouvert');
      document.body.style.overflow='hidden';
      modalFermer.focus();
    }
    function fermerModale(){modalDialog.close();modalOverlay.classList.remove('ouvert');document.body.style.overflow='';modalProduitCourant=null;}
    modalFermer.addEventListener('click',fermerModale);
    modalOverlay.addEventListener('click',fermerModale);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modalDialog.open)fermerModale();});
    modalBtnAjouter.addEventListener('click',function(){
      if(!modalProduitCourant)return;
      var cb=modalCouleurs.querySelector('.option-pill.actif');
      var tb=modalTailles.querySelector('.option-pill.actif');
      ajouterAuPanier(modalProduitCourant,cb?cb.textContent:null,tb?tb.textContent:null);
      fermerModale();
    });
    function chargerPanier(){
      try{
        var d=localStorage.getItem('ptits_bonheurs_panier');
        if(d)panier=new Map(JSON.parse(d).map(function(i){return[i.produit.id+'__'+(i.couleur||'')+'__'+(i.taille||''),i];}));
      }catch(e){}
    }
    function sauvegarderPanier(){localStorage.setItem('ptits_bonheurs_panier',JSON.stringify(Array.from(panier.values())));}
    function ajouterAuPanier(produit,couleur,taille){
      couleur=couleur||null;taille=taille||null;
      var cle=produit.id+'__'+(couleur||'')+'__'+(taille||'');
      var ex=panier.get(cle);
      if(ex)ex.quantite+=1;
      else panier.set(cle,{produit:produit,quantite:1,couleur:couleur,taille:taille});
      sauvegarderPanier();mettreAJourUI();
      var d=[couleur,taille].filter(Boolean).join(' \u00b7 ');
      afficherToast('\u2756 '+produit.nom+(d?' ('+d+')':'')+' ajout\u00e9 au panier');
    }
    function modifierQuantite(cle,delta){
      var item=panier.get(cle);
      if(!item)return;
      item.quantite+=delta;
      if(item.quantite<=0)panier.delete(cle);
      sauvegarderPanier();mettreAJourUI();rendreListePanier();
    }
    function supprimerDuPanier(cle){panier.delete(cle);sauvegarderPanier();mettreAJourUI();rendreListePanier();}
    function totalPanier(){var t=0;panier.forEach(function(v){t+=v.produit.prix*v.quantite;});return t;}
    function nombreArticles(){var n=0;panier.forEach(function(v){n+=v.quantite;});return n;}
    function rendreListePanier(){
      if(panier.size===0){panierVide.style.display='block';panierListe.querySelectorAll('.panier-article').forEach(function(el){el.remove();});return;}
      panierVide.style.display='none';
      panierListe.querySelectorAll('.panier-article').forEach(function(el){el.remove();});
      panier.forEach(function(v){
        var cle=v.produit.id+'__'+(v.couleur||'')+'__'+(v.taille||'');
        var detail=[v.couleur,v.taille].filter(Boolean).join(' \u00b7 ');
        var a=document.createElement('div');
        a.className='panier-article';
        a.dataset.cle=cle;
        a.innerHTML='<img class="panier-article__image" src="'+(v.produit.image_url||'')+'"/>'
          +'<div><p class="panier-article__nom">'+v.produit.nom+'</p>'
          +(detail?'<p class="panier-article__variante">'+detail+'</p>':'')
          +'<p class="panier-article__prix-unitaire">'+formaterPrix(v.produit.prix)+' / pi\u00e8ce</p>'
          +'<div class="panier-article__qte"><button data-action="moins" data-cle="'+cle+'">\u2212</button><span>'+v.quantite+'</span><button data-action="plus" data-cle="'+cle+'">\u002b</button></div></div>'
          +'<button class="panier-article__supprimer" data-cle="'+cle+'">Retirer</button>';
        a.querySelectorAll('[data-action]').forEach(function(btn){btn.addEventListener('click',function(){modifierQuantite(btn.dataset.cle,btn.dataset.action==='plus'?1:-1);});});
        a.querySelector('.panier-article__supprimer').addEventListener('click',function(){supprimerDuPanier(cle);});
        panierListe.appendChild(a);
      });
    }
    function mettreAJourUI(){
      var n=nombreArticles();
      panierBadge.textContent=n;
      panierBadge.classList.toggle('visible',n>0);
      panierTotal.textContent=formaterPrix(totalPanier());
      btnCommander.disabled=panier.size===0;
      rendreListePanier();
    }
    function ouvrirPanier(){panierDrawer.classList.add('ouvert');panierOverlay.classList.add('ouvert');document.body.style.overflow='hidden';btnFermerPanier.focus();}
    function fermerPanier(){panierDrawer.classList.remove('ouvert');panierOverlay.classList.remove('ouvert');document.body.style.overflow='';}
    btnOuvrirPanier.addEventListener('click',ouvrirPanier);
    btnFermerPanier.addEventListener('click',fermerPanier);
    panierOverlay.addEventListener('click',fermerPanier);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')fermerPanier();});
    btnCommander.addEventListener('click',async function(){
      if(panier.size===0)return;
      btnCommander.disabled=true;
      btnCommander.textContent='Redirection en cours...';
      var items=Array.from(panier.values()).map(function(v){return{id:v.produit.id,quantite:v.quantite};});
      try{
        var res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items})});
        if(!res.ok){var err=await res.json();throw new Error(err.error||'Erreur serveur');}
        var data=await res.json();
        window.location.href=data.url;
      }catch(err){
        afficherToast('Erreur : '+err.message,'erreur');
        btnCommander.disabled=false;
        btnCommander.innerHTML='<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Passer commande';
      }
    });
    var toastTimer;
    function afficherToast(msg,type){
      clearTimeout(toastTimer);
      toast.textContent=msg;
      toast.className='toast'+(type?' '+type:'');
      void toast.offsetWidth;
      toast.classList.add('visible');
      toastTimer=setTimeout(function(){toast.classList.remove('visible');},3000);
    }
    function formaterPrix(p){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(p);}
    function libCategorie(cat){var m={bagues:'Bague',colliers:'Collier',boucles:'Boucles',pochettes:'Pochette',foulards:'Foulard',epingles:'\u00c9pingle','porte-monnaie':'Porte-monnaie'};return m[cat]||cat;}
    chargerPanier();mettreAJourUI();
    (function(){
      var logo=document.getElementById('footer-logo');
      if(!logo)return;
      logo.addEventListener('dblclick',function(){window.location.href='/admin.html';});
      var lpTimer;
      logo.addEventListener('touchstart',function(e){lpTimer=setTimeout(function(){window.location.href='/admin.html';},600);},{passive:true});
      logo.addEventListener('touchend',function(){clearTimeout(lpTimer);});
      logo.addEventListener('touchmove',function(){clearTimeout(lpTimer);});
    })();
    <\/script>`;

const BTN_ADMIN = `
    <a href="/admin.html" class="btn-admin-discret" aria-label="Administration" title="Administration">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
    </a>`;

function footer() {
  return `
    <footer class="footer">
      <div class="footer__inner">
        <div>
          <img src="/logo.jpg" alt="Les P'tits Bonheurs" id="footer-logo" style="height:60px;margin-bottom:1rem;cursor:default;user-select:none;"/>
          <p class="footer__tagline">&#171;&nbsp;Des pi\u00e8ces qui portent une \u00e2me.&nbsp;&#187;</p>
          <div class="footer__reseaux">
            <a href="https://www.facebook.com/Perlespornic/" target="_blank" class="footer__reseau-lien" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
            <a href="mailto:contact@lesptitsbonheurs.fr" class="footer__reseau-lien" aria-label="Email"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
          </div>
        </div>
        <div>
          <p class="footer__col-titre">Collections</p>
          <ul class="footer__liens">
            <li><a href="/produits.html">Tout voir</a></li>
            <li><a href="/produits.html?categorie=bagues">Bagues</a></li>
            <li><a href="/produits.html?categorie=colliers">Colliers</a></li>
            <li><a href="/produits.html?categorie=boucles">Boucles d'oreilles</a></li>
            <li><a href="/produits.html?categorie=pochettes">Pochettes</a></li>
          </ul>
        </div>
        <div>
          <p class="footer__col-titre">Navigation</p>
          <ul class="footer__liens">
            <li><a href="/">Accueil</a></li>
            <li><a href="/produits.html">La Boutique</a></li>
            <li><a href="/contact.html">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bas">
        <span>\u00a9 2026 Les P'tits Bonheurs \u2014 Tous droits r\u00e9serv\u00e9s</span>
        <span>Paiement s\u00e9curis\u00e9 par Stripe \u2756</span>
      </div>
    </footer>`;
}

// ══════════════════════════════════════════════════════════════
// INDEX.HTML
// ══════════════════════════════════════════════════════════════
const indexHtml = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="Les P'tits Bonheurs \u2014 Bijoux et accessoires artisanaux \u00e0 Pornic."/>
  <title>Les P'tits Bonheurs \u2014 Accueil</title>
  <link rel="stylesheet" href="/style.css"/>
  <link rel="icon" href="/logo.jpg"/>
</head>
<body>
  <div id="bandeau-paiement" class="bandeau-paiement" role="alert"></div>
  ${sidenav("accueil")}
  ${header("accueil")}

  <section class="hero hero--plein" aria-label="Pr\u00e9sentation">
    <div class="hero__image">
      <img src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1600&q=85" alt="Bijoux artisanaux" loading="eager"/>
      <div class="hero__overlay"></div>
    </div>
    <div class="hero__contenu hero__contenu--centre">
      <p class="hero__surtitre">\u2756 Cr\u00e9ations artisanales \u00b7 Pornic</p>
      <h1 class="hero__titre">Chaque pi\u00e8ce porte<br/>une <em>histoire</em></h1>
      <p class="hero__phrase">Bijoux &amp; accessoires fa\u00e7onn\u00e9s \u00e0 la main, avec soin et passion.</p>
      <a href="/produits.html" class="hero__cta">D\u00e9couvrir la collection <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
    </div>
  </section>

  <section class="section" id="phares">
    <div class="section__entete">
      <div>
        <p class="section__label">\u2756 S\u00e9lection du moment</p>
        <h2 class="section__titre">Nos coups de c\u0153ur</h2>
        <div class="section__trait"></div>
      </div>
      <a href="/produits.html" class="lien-voir-tout">Voir toute la collection <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
    </div>
    <div id="grille-phares" class="grille-produits">
      <div class="produits-loader" id="loader-phares"><span></span><span></span><span></span></div>
    </div>
  </section>

  <section class="section-atelier" id="atelier">
    <div class="section-atelier__inner">
      <div class="section-atelier__image">
        <img src="https://images.unsplash.com/photo-1584361853901-dd1904bb7987?w=900&q=80" alt="Atelier bijoux" loading="lazy"/>
      </div>
      <div>
        <p class="section-atelier__label">\u2756 L'Atelier</p>
        <h2 class="section-atelier__titre">Fait main, avec<br/>intention et douceur</h2>
        <p class="section-atelier__texte">Chaque cr\u00e9ation na\u00eet dans un petit atelier baign\u00e9 de lumi\u00e8re naturelle. Des mati\u00e8res authentiques \u2014 laiton, argent, soie, lin \u2014 qui vieillissent avec gr\u00e2ce.</p>
        <p class="section-atelier__signature">\u2014 Les P'tits Bonheurs, Pornic</p>
        <a href="/contact.html" class="hero__cta" style="margin-top:2rem;display:inline-flex;">Nous contacter <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>
  </section>

  ${footer()}
  ${PANIER}
  ${MODALE}
  ${JS_SHARED}
  <script>
  'use strict';
  var bandeau=document.getElementById('bandeau-paiement');
  (function(){
    var p=new URLSearchParams(window.location.search).get('paiement');
    if(p==='succes'){
      bandeau.textContent='\u2756 Merci pour votre commande\u00a0!';
      bandeau.className='bandeau-paiement succes';
      panier.clear();sauvegarderPanier();
      window.history.replaceState({},'','/');
    }else if(p==='annule'){
      bandeau.textContent='Commande annul\u00e9e. Vos articles restent dans le panier.';
      bandeau.className='bandeau-paiement annule';
      window.history.replaceState({},'','/');
    }
  })();
  async function chargerPhares(){
    try{
      var res=await fetch('/api/produits');
      var all=await res.json();
      afficherCartes(all.slice(0,4),document.getElementById('grille-phares'),all);
    }catch(e){
      document.getElementById('grille-phares').innerHTML='<p style="padding:3rem;color:var(--gris);text-align:center;grid-column:1/-1">Impossible de charger les produits.</p>';
    }
  }
  function afficherCartes(produits,grille,allProduits){
    var ldr=document.getElementById('loader-phares');
    if(ldr)ldr.remove();
    if(!produits.length){grille.innerHTML='';return;}
    grille.innerHTML=produits.map(function(p){
      return '<article class="carte-produit" data-id="'+p.id+'" style="cursor:pointer">'
        +'<div class="carte-produit__image"><img src="'+(p.image_url||'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=70')+'" alt="'+p.nom+'" loading="lazy"/>'
        +'<span class="carte-produit__categorie">'+libCategorie(p.categorie)+'</span>'
        +(p.stock<=2?'<span class="carte-produit__stock-alerte">Derni\u00e8re'+(p.stock>1?'s':'')+' pi\u00e8ce'+(p.stock>1?'s':'')+'</span>':'')
        +'</div><div class="carte-produit__corps"><h3 class="carte-produit__nom">'+p.nom+'</h3>'
        +'<p class="carte-produit__materiaux">'+(p.materiaux||'')+'</p>'
        +'<div class="carte-produit__bas"><span class="carte-produit__prix">'+formaterPrix(p.prix)+'</span>'
        +'<button class="btn-ajouter" data-id="'+p.id+'"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Ajouter</button>'
        +'</div></div></article>';
    }).join('');
    var obs=new IntersectionObserver(function(entries){entries.forEach(function(e,i){if(e.isIntersecting){setTimeout(function(){e.target.classList.add('visible');},i*80);obs.unobserve(e.target);}});},{threshold:0.1});
    grille.querySelectorAll('.carte-produit').forEach(function(c){
      obs.observe(c);
      c.addEventListener('click',function(e){
        if(e.target.closest('.btn-ajouter'))return;
        var p=(allProduits||produits).find(function(x){return x.id===parseInt(c.dataset.id);});
        if(p)ouvrirModale(p);
      });
    });
    grille.querySelectorAll('.btn-ajouter').forEach(function(btn){
      btn.addEventListener('click',function(){
        var p=(allProduits||produits).find(function(x){return x.id===parseInt(btn.dataset.id);});
        if(p)ajouterAuPanier(p,null,null);
      });
    });
  }
  chargerPhares();
  <\/script>
</body>
</html>`;

// ══════════════════════════════════════════════════════════════
// PRODUITS.HTML
// ══════════════════════════════════════════════════════════════
const produitsHtml = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="Les P'tits Bonheurs \u2014 Toute la collection."/>
  <title>Les P'tits Bonheurs \u2014 La Boutique</title>
  <link rel="stylesheet" href="/style.css"/>
  <link rel="icon" href="/logo.jpg"/>
</head>
<body>
  ${sidenav("produits")}
  ${header("produits")}

  <div class="page-produits">
    <div class="page-produits__entete">
      <p class="section__label">\u2756 La Collection</p>
      <h1 class="section__titre">Bijoux &amp; Accessoires</h1>
      <div class="section__trait"></div>
    </div>

    <!-- Barre de filtres + tri -->
    <div class="filtres-bar">
      <!-- Catégories -->
      <div class="filtres-bar__categories" role="group" aria-label="Cat\u00e9gorie">
        <button class="filtre-btn actif" data-categorie="">Tout</button>
        <button class="filtre-btn" data-categorie="perles">Perles</button>
        <button class="filtre-btn" data-categorie="maroquinerie">Maroquinerie</button>
        <button class="filtre-btn" data-categorie="bijoux-createurs">Bijoux cr\u00e9ateurs</button>
        <button class="filtre-btn" data-categorie="or-argent">Or &amp; Argent</button>
        <button class="filtre-btn" data-categorie="cadeaux">Cadeaux</button>
        <button class="filtre-btn" data-categorie="cosmetique">Cosm\u00e9tique</button>
      </div>

      <!-- Tri + options -->
      <div class="filtres-bar__controls">
        <!-- Tri -->
        <div class="filtre-select-wrap">
          <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <select id="tri-select" class="filtre-select" aria-label="Trier par">
            <option value="defaut">Ordre par d\u00e9faut</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix d\u00e9croissant</option>
            <option value="nom-asc">Nom A \u2192 Z</option>
            <option value="nom-desc">Nom Z \u2192 A</option>
            <option value="stock-asc">Disponibilit\u00e9</option>
          </select>
        </div>

        <!-- Prix min/max -->
        <div class="filtre-prix">
          <input class="filtre-prix__input" id="prix-min" type="number" min="0" placeholder="Min €" aria-label="Prix minimum"/>
          <span class="filtre-prix__sep">\u2014</span>
          <input class="filtre-prix__input" id="prix-max" type="number" min="0" placeholder="Max €" aria-label="Prix maximum"/>
          <button class="filtre-prix__ok" id="btn-prix-ok" aria-label="Appliquer le filtre prix">OK</button>
        </div>

        <!-- Compteur résultats -->
        <span class="filtres-compteur" id="filtres-compteur"></span>

        <!-- Reset -->
        <button class="filtre-reset" id="btn-reset" title="R\u00e9initialiser les filtres">
          <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          R\u00e9init
        </button>
      </div>
    </div>

    <div id="grille-produits" class="grille-produits" aria-live="polite">
      <div class="produits-loader" id="loader"><span></span><span></span><span></span></div>
    </div>
  </div>

  ${footer()}
  ${PANIER}
  ${MODALE}
  ${JS_SHARED}
  <script>
  'use strict';
  var tousLesProduits=[];
  var categorieActive='';
  var triActif='defaut';
  var prixMin=null,prixMax=null;
  var grille=document.getElementById('grille-produits');
  var triSelect=document.getElementById('tri-select');
  var filtrePrixMin=document.getElementById('prix-min');
  var filtrePrixMax=document.getElementById('prix-max');
  var btnPrixOk=document.getElementById('btn-prix-ok');
  var btnReset=document.getElementById('btn-reset');
  var compteur=document.getElementById('filtres-compteur');

  async function chargerProduits(cat){
    try{
      var url=cat?'/api/produits?categorie='+encodeURIComponent(cat):'/api/produits';
      var res=await fetch(url);
      tousLesProduits=await res.json();
      appliquerFiltres();
    }catch(e){
      grille.innerHTML='<p style="padding:3rem;color:var(--gris);text-align:center;grid-column:1/-1">Impossible de charger les produits.</p>';
    }
  }

  function appliquerFiltres(){
    var produits=tousLesProduits.filter(function(p){return p.stock>0;});
    if(prixMin!==null)produits=produits.filter(function(p){return p.prix>=prixMin;});
    if(prixMax!==null)produits=produits.filter(function(p){return p.prix<=prixMax;});
    produits=trierProduits(produits,triActif);
    compteur.textContent=produits.length+' article'+(produits.length>1?'s':'');
    afficherProduits(produits);
  }

  function trierProduits(arr,tri){
    var a=arr.slice();
    if(tri==='prix-asc')a.sort(function(x,y){return x.prix-y.prix;});
    else if(tri==='prix-desc')a.sort(function(x,y){return y.prix-x.prix;});
    else if(tri==='nom-asc')a.sort(function(x,y){return x.nom.localeCompare(y.nom,'fr');});
    else if(tri==='nom-desc')a.sort(function(x,y){return y.nom.localeCompare(x.nom,'fr');});
    else if(tri==='stock-asc')a.sort(function(x,y){return y.stock-x.stock;});
    return a;
  }

  function afficherProduits(produits){
    var ldr=document.getElementById('loader');
    if(ldr)ldr.remove();
    if(!produits.length){
      grille.innerHTML='<p style="padding:3rem;color:var(--gris);text-align:center;grid-column:1/-1">Aucun produit ne correspond \u00e0 votre s\u00e9lection.</p>';
      return;
    }
    grille.innerHTML=produits.map(function(p){
      return '<article class="carte-produit" data-id="'+p.id+'" style="cursor:pointer">'
        +'<div class="carte-produit__image"><img src="'+(p.image_url||'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=70')+'" alt="'+p.nom+'" loading="lazy"/>'
        +'<span class="carte-produit__categorie">'+libCategorie(p.categorie)+'</span>'
        +(p.stock<=2?'<span class="carte-produit__stock-alerte">Derni\u00e8re'+(p.stock>1?'s':'')+' pi\u00e8ce'+(p.stock>1?'s':'')+'</span>':'')
        +'</div><div class="carte-produit__corps"><h3 class="carte-produit__nom">'+p.nom+'</h3>'
        +'<p class="carte-produit__materiaux">'+(p.materiaux||'')+'</p>'
        +'<div class="carte-produit__bas"><span class="carte-produit__prix">'+formaterPrix(p.prix)+'</span>'
        +'<button class="btn-ajouter" data-id="'+p.id+'"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Ajouter</button>'
        +'</button>'
        +'</div></div></article>';
    }).join('');
    var obs=new IntersectionObserver(function(entries){entries.forEach(function(e,i){if(e.isIntersecting){setTimeout(function(){e.target.classList.add('visible');},i*60);obs.unobserve(e.target);}});},{threshold:0.08});
    grille.querySelectorAll('.carte-produit').forEach(function(c){
      obs.observe(c);
      c.addEventListener('click',function(e){
        if(e.target.closest('.btn-ajouter'))return;
        var p=tousLesProduits.find(function(x){return x.id===parseInt(c.dataset.id);});
        if(p)ouvrirModale(p);
      });
    });
    grille.querySelectorAll('.btn-ajouter:not([disabled])').forEach(function(btn){
      btn.addEventListener('click',function(){
        var p=tousLesProduits.find(function(x){return x.id===parseInt(btn.dataset.id);});
        if(p)ajouterAuPanier(p,null,null);
      });
    });
  }

  document.querySelectorAll('.filtre-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      document.querySelectorAll('.filtre-btn').forEach(function(b){b.classList.remove('actif');});
      btn.classList.add('actif');
      categorieActive=btn.dataset.categorie;
      grille.innerHTML='<div class="produits-loader"><span></span><span></span><span></span></div>';
      chargerProduits(categorieActive);
    });
  });

  triSelect.addEventListener('change',function(){triActif=triSelect.value;appliquerFiltres();});
  btnPrixOk.addEventListener('click',function(){
    var mn=parseFloat(filtrePrixMin.value);
    var mx=parseFloat(filtrePrixMax.value);
    prixMin=isNaN(mn)?null:mn;
    prixMax=isNaN(mx)?null:mx;
    appliquerFiltres();
  });
  filtrePrixMin.addEventListener('keydown',function(e){if(e.key==='Enter')btnPrixOk.click();});
  filtrePrixMax.addEventListener('keydown',function(e){if(e.key==='Enter')btnPrixOk.click();});
  btnReset.addEventListener('click',function(){
    document.querySelectorAll('.filtre-btn').forEach(function(b){b.classList.remove('actif');});
    document.querySelector('.filtre-btn[data-categorie=""]').classList.add('actif');
    categorieActive='';triActif='defaut';prixMin=null;prixMax=null;
    triSelect.value='defaut';filtrePrixMin.value='';filtrePrixMax.value='';
    chargerProduits('');
  });

  var catParam=new URLSearchParams(window.location.search).get('categorie');
  if(catParam){
    var btnCat=document.querySelector('.filtre-btn[data-categorie="'+catParam+'"]');
    if(btnCat)btnCat.click();else chargerProduits('');
  }else{chargerProduits('');}
  <\/script>
</body>
</html>`;

// ══════════════════════════════════════════════════════════════
// CONTACT.HTML
// ══════════════════════════════════════════════════════════════
const contactHtml = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="Les P'tits Bonheurs \u2014 Contactez-nous."/>
  <title>Les P'tits Bonheurs \u2014 Contact</title>
  <link rel="stylesheet" href="/style.css"/>
  <link rel="icon" href="/logo.jpg"/>
</head>
<body>
  ${sidenav("contact")}
  ${header("contact")}

  <main class="page-contact">
    <div class="page-contact__inner">
      <div class="page-contact__infos">
        <p class="section__label">\u2756 Nous \u00e9crire</p>
        <h1 class="section__titre">Contact</h1>
        <div class="section__trait"></div>
        <p class="page-contact__texte">Une question sur une cr\u00e9ation, une commande sur mesure, ou simplement l'envie de dire bonjour \u2014 nous serons ravis de vous lire.</p>
        <div class="page-contact__coordonnees">
          <div class="page-contact__coord">
            <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <a href="mailto:contact@lesptitsbonheurs.fr">contact@lesptitsbonheurs.fr</a>
          </div>
          <div class="page-contact__coord">
            <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            <a href="https://www.facebook.com/Perlespornic/" target="_blank">Facebook \u2014 Les P'tits Bonheurs</a>
          </div>
          <div class="page-contact__coord">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Pornic, Loire-Atlantique</span>
          </div>
        </div>
      </div>
      <div class="page-contact__formulaire">
        <form id="form-contact" class="contact-form" novalidate>
          <div class="form-groupe">
            <label class="form-label" for="contact-nom">Votre nom *</label>
            <input class="form-input" id="contact-nom" name="nom" type="text" required autocomplete="name" placeholder="Marie Dupont"/>
          </div>
          <div class="form-groupe">
            <label class="form-label" for="contact-email">Votre email *</label>
            <input class="form-input" id="contact-email" name="email" type="email" required autocomplete="email" placeholder="marie@exemple.fr"/>
          </div>
          <div class="form-groupe">
            <label class="form-label" for="contact-sujet">Sujet</label>
            <input class="form-input" id="contact-sujet" name="sujet" type="text" placeholder="Commande, question..."/>
          </div>
          <div class="form-groupe">
            <label class="form-label" for="contact-message">Message *</label>
            <textarea class="form-textarea" id="contact-message" name="message" rows="5" required placeholder="Votre message..."></textarea>
          </div>
          <div id="contact-retour" class="contact-retour" role="alert"></div>
          <button type="submit" class="btn-primary" id="btn-envoyer">Envoyer le message</button>
        </form>
      </div>
    </div>
  </main>

  ${footer()}
  ${PANIER}
  ${JS_SHARED}
  <script>
  'use strict';
  var form=document.getElementById('form-contact');
  var retour=document.getElementById('contact-retour');
  var btnEnvoyer=document.getElementById('btn-envoyer');
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    var nom=form.nom.value.trim(),email=form.email.value.trim(),sujet=form.sujet.value.trim(),message=form.message.value.trim();
    if(!nom||!email||!message){retour.textContent='Merci de remplir tous les champs obligatoires.';retour.className='contact-retour erreur';return;}
    btnEnvoyer.disabled=true;btnEnvoyer.textContent='Envoi en cours...';
    try{
      var res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nom:nom,email:email,sujet:sujet,message:message})});
      if(!res.ok)throw new Error('Erreur serveur');
      retour.textContent='\u2756 Message envoy\u00e9\u00a0! Nous vous r\u00e9pondrons tr\u00e8s vite.';
      retour.className='contact-retour succes';
      form.reset();
    }catch(err){
      retour.textContent='Une erreur est survenue. R\u00e9essayez ou contactez-nous par email.';
      retour.className='contact-retour erreur';
    }finally{
      btnEnvoyer.disabled=false;btnEnvoyer.textContent='Envoyer le message';
    }
  });
  <\/script>
</body>
</html>`;

fs.writeFileSync(base + "/index.html", indexHtml, "utf8");
fs.writeFileSync(base + "/produits.html", produitsHtml, "utf8");
fs.writeFileSync(base + "/contact.html", contactHtml, "utf8");
console.log("OK — 3 pages écrites avec succès");
console.log(
  "  index.html  :",
  fs.statSync(base + "/index.html").size,
  "octets",
);
console.log(
  "  produits.html:",
  fs.statSync(base + "/produits.html").size,
  "octets",
);
console.log(
  "  contact.html :",
  fs.statSync(base + "/contact.html").size,
  "octets",
);
