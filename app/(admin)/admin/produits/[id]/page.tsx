import { redirect } from "next/navigation";

export default function ProductAdminPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/admin/produits/${params.id}/modifier`);
}
