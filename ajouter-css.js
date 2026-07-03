"use strict";
const fs = require("fs");
const cssPath = __dirname + "/public/style.css";

const css = `

/* ═══════════════════════════════════════════════════════════════════════════════
   SIDENAV — navigation latérale dépliable
   ═══════════════════════════════════════════════════════════════════════════════ */
.sidenav {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 0;
}

.sidenav__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 56px;
  background: var(--noir);
  border: none;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  box-shadow: 4px 0 16px rgba(0,0,0,0.2);
  transition: background var(--transition);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.sidenav__toggle:hover {
  background: var(--or);
}

.sidenav__toggle svg {
  width: 18px;
  height: 18px;
  stroke: var(--blanc);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--transition);
}

.sidenav.ouvert .sidenav__toggle svg {
  transform: rotate(180deg);
}

.sidenav__label-vert {
  position: absolute;
  left: 40px;
  font-size: 0.6rem;
  font-family: var(--font-corps);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--noir);
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  padding: 0.75rem 0.25rem;
  background: var(--creme);
  border-radius: 0 0 4px 4px;
  opacity: 0.5;
  pointer-events: none;
  transition: opacity var(--transition);
}

.sidenav.ouvert .sidenav__label-vert {
  opacity: 0;
}

.sidenav__contenu {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%) translateX(-8px);
  opacity: 0;
  pointer-events: none;
  background: var(--creme-pure);
  border-radius: 0 8px 8px 0;
  border-left: 3px solid var(--or);
  box-shadow: 8px 0 40px rgba(0,0,0,0.15);
  padding: 2rem 1.5rem;
  min-width: 220px;
  transition: opacity var(--transition), transform var(--transition);
}

.sidenav.ouvert .sidenav__contenu {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
}

.sidenav__logo {
  margin-bottom: 1.5rem;
  text-align: center;
}

.sidenav__logo img {
  height: 48px;
  margin: 0 auto;
  object-fit: contain;
}

.sidenav__section-titre {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--or);
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.sidenav__liens {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.sidenav__liens a {
  display: block;
  padding: 0.35rem 0.5rem;
  font-size: 0.88rem;
  font-weight: 400;
  color: var(--noir);
  text-decoration: none;
  border-radius: 2px;
  transition: color var(--transition), background var(--transition);
}

.sidenav__liens a:hover,
.sidenav__liens a.actif {
  color: var(--or);
  background: rgba(201,149,108,0.08);
}

.sidenav__separateur {
  border: none;
  border-top: 1px solid var(--gris-clair);
  margin: 1rem 0 0.75rem;
}

.sidenav__liens--nav {
  margin-top: 0;
}

.sidenav__liens--nav a {
  font-size: 0.8rem;
  color: var(--gris);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE PRODUITS
   ═══════════════════════════════════════════════════════════════════════════════ */
.page-produits {
  padding: clamp(6rem, 10vw, 8rem) clamp(1.5rem, 6vw, 4rem) 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-produits__entete {
  text-align: center;
  margin-bottom: 3rem;
}

.filtres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 3rem;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE CONTACT
   ═══════════════════════════════════════════════════════════════════════════════ */
.page-contact {
  padding: clamp(6rem, 10vw, 8rem) clamp(1.5rem, 6vw, 4rem) 5rem;
}

.page-contact__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 4rem;
  align-items: start;
}

.page-contact__texte {
  color: var(--gris);
  margin: 1.5rem 0 2rem;
  line-height: 1.8;
}

.page-contact__coordonnees {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.page-contact__coord {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  font-size: 0.9rem;
}

.page-contact__coord svg {
  width: 18px;
  height: 18px;
  stroke: var(--or);
  fill: none;
  stroke-width: 1.5;
  flex-shrink: 0;
}

.page-contact__coord a {
  text-decoration: none;
  color: var(--noir);
  transition: color var(--transition);
}

.page-contact__coord a:hover {
  color: var(--or);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  background: var(--creme-pure);
  padding: 2.5rem;
  border-radius: 4px;
  box-shadow: var(--ombre-douce);
}

.form-groupe {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gris);
  font-weight: 500;
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gris-clair);
  border-radius: var(--rayon);
  background: var(--creme);
  color: var(--noir);
  font-family: var(--font-corps);
  font-size: 0.95rem;
  font-weight: 300;
  transition: border-color var(--transition), box-shadow var(--transition);
  outline: none;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--or);
  box-shadow: 0 0 0 3px rgba(201,149,108,0.15);
}

.form-textarea {
  resize: vertical;
  min-height: 130px;
}

.contact-retour {
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  border-radius: 2px;
  display: none;
}

.contact-retour:not(:empty) {
  display: block;
}

.contact-retour.succes {
  background: rgba(120,180,120,0.12);
  color: #3a7a3a;
  border-left: 3px solid #6bbf6b;
}

.contact-retour.erreur {
  background: rgba(200,80,80,0.1);
  color: #8b2020;
  border-left: 3px solid #c85050;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LIEN "VOIR TOUT"
   ═══════════════════════════════════════════════════════════════════════════════ */
.lien-voir-tout {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--or);
  font-weight: 500;
  transition: gap var(--transition), color var(--transition);
  white-space: nowrap;
  align-self: flex-end;
  padding-bottom: 0.25rem;
}

.lien-voir-tout svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  transition: transform var(--transition);
}

.lien-voir-tout:hover {
  color: var(--or-fonce);
  gap: 0.7rem;
}

.section__entete {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RESPONSIVE COMPLÉMENTAIRE
   ═══════════════════════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .page-contact__inner {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .contact-form {
    padding: 1.5rem;
  }

  .sidenav__contenu {
    min-width: 190px;
  }

  .section__entete {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

fs.appendFileSync(cssPath, css, "utf8");
console.log(
  "CSS ajouté — nouveau total :",
  fs.statSync(cssPath).size,
  "octets",
);
