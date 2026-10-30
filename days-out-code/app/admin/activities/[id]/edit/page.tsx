import { notFound } from "next/navigation";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq } from "drizzle-orm";
import ActivityForm from "@/components/activity-form";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) notFound();

  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);

  if (!activity) notFound();

  const initialData = {
    name: activity.name,
    category: activity.category,
    costTier: activity.costTier,
    weather: activity.weather,
    setting: activity.setting,
    websiteUrl: activity.websiteUrl ?? "",
    lat: activity.lat ?? "",
    lng: activity.lng ?? "",
    locationName: activity.locationName ?? "",
    description: activity.description ?? "",
    food: activity.food ?? "unknown",
    ageMin: activity.ageMin?.toString() ?? "",
    ageMax: activity.ageMax?.toString() ?? "",
    prebookingRequired: activity.prebookingRequired ?? false,
    imageUrl: activity.imageUrl ?? "",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
        Edit: {activity.name}
      </h1>
      <ActivityForm initialData={initialData} activityId={id} />
    </div>
  );
}
