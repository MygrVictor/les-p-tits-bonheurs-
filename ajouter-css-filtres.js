const fs = require("fs");
const path = require("path");

const cssFile = path.join(__dirname, "public", "style.css");

const css = `

/* ═══════════════════════════════════════════════════════════════════════════
   BARRE DE FILTRES COMPLÈTE
   ═══════════════════════════════════════════════════════════════════════════ */

.filtres-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.filtres-bar__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filtres-bar__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.2rem;
  background: var(--creme);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 4px;
}

/* Select tri */
.filtre-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.filtre-select {
  appearance: none;
  -webkit-appearance: none;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 2px;
  padding: 0.4rem 2rem 0.4rem 0.6rem;
  font-family: var(--font-corps);
  font-size: 0.82rem;
  color: var(--noir);
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b6560' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.4rem center;
  background-size: 14px;
  transition: border-color 0.2s;
  outline: none;
  min-width: 170px;
}

.filtre-select:focus {
  border-color: var(--or);
}

/* Fourchette de prix */
.filtre-prix {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.filtre-prix__input {
  width: 72px;
  padding: 0.38rem 0.5rem;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 2px;
  background: #fff;
  font-family: var(--font-corps);
  font-size: 0.82rem;
  color: var(--noir);
  outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}

.filtre-prix__input::-webkit-outer-spin-button,
.filtre-prix__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.filtre-prix__input:focus {
  border-color: var(--or);
}

.filtre-prix__sep {
  color: var(--gris);
  font-size: 0.8rem;
}

.filtre-prix__ok {
  padding: 0.38rem 0.65rem;
  background: var(--or);
  color: #fff;
  border: none;
  border-radius: 2px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  letter-spacing: 0.05em;
}

.filtre-prix__ok:hover {
  opacity: 0.85;
}

/* Toggle stock */
.filtre-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.filtre-toggle input[type="checkbox"] {
  display: none;
}

.filtre-toggle__track {
  width: 34px;
  height: 18px;
  background: rgba(0,0,0,0.15);
  border-radius: 9px;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.filtre-toggle__track::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.filtre-toggle input[type="checkbox"]:checked ~ .filtre-toggle__track {
  background: var(--or);
}

.filtre-toggle input[type="checkbox"]:checked ~ .filtre-toggle__track::after {
  transform: translateX(16px);
}

.filtre-toggle__label {
  font-size: 0.82rem;
  color: var(--gris);
}

/* Compteur résultats */
.filtres-compteur {
  font-size: 0.78rem;
  color: var(--gris);
  margin-left: auto;
  white-space: nowrap;
  font-style: italic;
}

/* Bouton reset */
.filtre-reset {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.38rem 0.65rem;
  background: transparent;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 2px;
  font-size: 0.78rem;
  color: var(--gris);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  white-space: nowrap;
}

.filtre-reset:hover {
  border-color: var(--or);
  color: var(--or);
}

/* Tags filtres actifs */
.filtres-actifs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: -0.25rem;
}

.filtre-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  background: var(--or);
  color: #fff;
  border-radius: 2px;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}

.filtre-tag button {
  background: none;
  border: none;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  font-size: 1rem;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.filtre-tag button:hover {
  color: #fff;
}

/* Etat vide */
.produits-vide {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gris);
}

.produits-vide p {
  font-size: 1rem;
  margin-bottom: 1rem;
}

/* btn-ajouter desactive */
.btn-ajouter:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(0,0,0,0.08);
  color: var(--gris);
}

@media (max-width: 768px) {
  .filtres-bar__controls {
    gap: 0.6rem;
    padding: 0.75rem;
  }

  .filtre-select {
    min-width: 140px;
    font-size: 0.8rem;
  }

  .filtre-prix__input {
    width: 58px;
  }

  .filtres-compteur {
    margin-left: 0;
    width: 100%;
  }
}
`;

fs.appendFileSync(cssFile, css, "utf8");
console.log("CSS filtres ajouté —", fs.statSync(cssFile).size, "octets");
