import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { getCurrentUserProfile } from "@/lib/actions/profile";

export default async function PerfilPage() {
  const user = await getCurrentUserProfile();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Perfil"
        description="Administre su información personal y foto de perfil"
      />
      <ProfileForm user={user} />
    </div>
  );
}
