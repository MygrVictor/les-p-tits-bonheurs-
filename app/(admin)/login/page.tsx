import { redirect } from "next/navigation";

// Ancienne page de connexion admin (mot de passe seul), désormais fusionnée
// avec le formulaire unique de /compte. Le middleware redirige déjà toutes
// les requêtes vers /compte avant d'atteindre cette page ; cette redirection
// serveur reste en place par sécurité (défense en profondeur).
export default function AdminLoginRedirectPage() {
  redirect("/compte");
}
