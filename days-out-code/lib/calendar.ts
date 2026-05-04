import ical from "ical-generator";

interface CalendarParams {
  name: string;
  locationName?: string;
  websiteUrl?: string;
  date?: string;
  time?: string;
}

export function generateIcal(params: CalendarParams): string {
  const cal = ical({ name: "Days Out in Summer" });

  const startDate = params.date
    ? new Date(`${params.date}T${params.time ?? "10:00"}:00`)
    : new Date();

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 3);

  const description = [params.websiteUrl, params.locationName].filter(Boolean).join("\n");

  cal.createEvent({
    start: startDate,
    end: endDate,
    summary: params.name,
    location: params.locationName,
    description: description || undefined,
  });

  return cal.toString();
}

export function buildGoogleCalendarUrl(params: CalendarParams): string {
  let dates = "";
  if (params.date) {
    const start = new Date(`${params.date}T${params.time ?? "10:00"}:00`);
    const end = new Date(start);
    end.setHours(end.getHours() + 3);

    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z").slice(0, 15) + "00Z";

    dates = `${fmt(start)}/${fmt(end)}`;
  }

  const details = [params.websiteUrl, params.locationName].filter(Boolean).join("\n");

  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: params.name,
    ...(params.locationName && { location: params.locationName }),
    ...(dates && { dates }),
    ...(details && { details }),
  });

  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function buildOutlookCalendarUrl(params: CalendarParams): string {
  let startdt = "";
  let enddt = "";

  if (params.date) {
    const start = new Date(`${params.date}T${params.time ?? "10:00"}:00`);
    const end = new Date(start);
    end.setHours(end.getHours() + 3);
    startdt = start.toISOString().slice(0, 19);
    enddt = end.toISOString().slice(0, 19);
  }

  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: params.name,
    ...(params.locationName && { location: params.locationName }),
    ...(startdt && { startdt, enddt }),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${p.toString()}`;
}
