import ActivityForm from "@/components/activity-form";

export default function NewActivityPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
        Add Activity
      </h1>
      <ActivityForm />
    </div>
  );
}
