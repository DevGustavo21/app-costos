import { redirect } from "next/navigation";

export default function PlantasRedirectPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/${params.slug}/configuracion/productos`);
}
