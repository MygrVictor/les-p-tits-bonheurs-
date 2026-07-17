"use client";

import type { ReactNode } from "react";

/**
 * Bouton de soumission avec confirmation navigateur (window.confirm) avant
 * d'envoyer le formulaire — utilisé pour les actions destructrices (ex.
 * supprimer un produit) où une simple pression accidentelle serait trop
 * facile et coûteuse à défaire.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  children,
  className,
  disabled,
  title,
}: Readonly<{
  confirmMessage: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}>) {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={title}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
