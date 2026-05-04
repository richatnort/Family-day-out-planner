import { db } from "@/db";
import {
  activities,
  memberships,
  familyMemberships,
  activityMemberships,
} from "./schema";

const activityData = [
  // Batch 1
  { name: "Brimham Rocks", category: "nature" as const, costTier: "cheap" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "nearby" as const, prebookingRequired: false, lat: "54.076700", lng: "-1.684700", locationName: "Brimham, North Yorkshire" },
  { name: "Cannon Hall Farm", category: "farm" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.552000", lng: "-1.549000", locationName: "Cawthorne, Barnsley" },
  { name: "Cliffe Castle Museum", category: "museum" as const, costTier: "free" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: false, lat: "53.871900", lng: "-1.908600", locationName: "Keighley" },
  { name: "Cow and Calf Rocks", category: "nature" as const, costTier: "free" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "nearby" as const, prebookingRequired: false, lat: "53.917400", lng: "-1.819500", locationName: "Ilkley Moor" },
  { name: "Dalby Forest", category: "nature" as const, costTier: "cheap" as const, weather: "both" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.260000", lng: "-0.740000", locationName: "Thornton-le-Dale, North Yorkshire" },
  { name: "East Riddlesden Hall (NT)", category: "heritage" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.880600", lng: "-1.894400", locationName: "Keighley" },
  { name: "Emmerdale Studio Experience", category: "museum" as const, costTier: "premium" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "nearby" as const, prebookingRequired: true, lat: "53.800800", lng: "-1.549100", locationName: "Leeds" },
  { name: "Eureka! The National Children's Museum", category: "museum" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.716700", lng: "-1.863700", locationName: "Halifax" },
  { name: "Farmer Copleys", category: "farm" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.676000", lng: "-1.351000", locationName: "Pontefract" },
  { name: "Flamingo Land", category: "adventure" as const, costTier: "premium" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: true, lat: "54.185000", lng: "-0.972000", locationName: "Kirby Misperton, North Yorkshire" },
  { name: "Forbidden Corner", category: "adventure" as const, costTier: "moderate" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "none" as const, prebookingRequired: true, lat: "54.262000", lng: "-1.572000", locationName: "Coverham, North Yorkshire" },
  { name: "Fountains Abbey & Studley Royal (NT)", category: "heritage" as const, costTier: "moderate" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.115200", lng: "-1.572000", locationName: "Ripon" },
  { name: "Golden Acre Park", category: "nature" as const, costTier: "free" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.880500", lng: "-1.597800", locationName: "Leeds" },
  { name: "Harewood House", category: "heritage" as const, costTier: "premium" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.902700", lng: "-1.544700", locationName: "Harewood, Leeds" },
  { name: "Hesketh Farm", category: "farm" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.976000", lng: "-1.851000", locationName: "Skipton" },
  { name: "Hornsea Freeport", category: "rainy-day" as const, costTier: "free" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.910000", lng: "-0.162000", locationName: "Hornsea, East Yorkshire" },
  { name: "How Stean Gorge", category: "nature" as const, costTier: "cheap" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.182000", lng: "-1.825000", locationName: "Nidderdale, North Yorkshire" },
  { name: "Huddersfield Splash Park", category: "water" as const, costTier: "free" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "none" as const, prebookingRequired: false, lat: "53.646000", lng: "-1.789000", locationName: "Greenhead Park, Huddersfield" },
  { name: "Ilkley Lido", category: "water" as const, costTier: "cheap" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.920800", lng: "-1.821000", locationName: "Ilkley" },
  { name: "Jedidiah's Party at Stockeld Park", category: "adventure" as const, costTier: "moderate" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: true, lat: "53.973000", lng: "-1.482000", locationName: "Spofforth, North Yorkshire" },
  { name: "Knaresborough Castle & Museum", category: "heritage" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "nearby" as const, prebookingRequired: false, lat: "54.008000", lng: "-1.467000", locationName: "Knaresborough" },
  { name: "Knaresborough Paddling Pool", category: "water" as const, costTier: "free" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "none" as const, prebookingRequired: false, lat: "54.005000", lng: "-1.468000", locationName: "Knaresborough" },
  { name: "Kirkstall Abbey", category: "heritage" as const, costTier: "free" as const, weather: "both" as const, setting: "outdoor" as const, food: "nearby" as const, prebookingRequired: false, lat: "53.817000", lng: "-1.599000", locationName: "Kirkstall, Leeds" },
  { name: "Leeds Corn Exchange", category: "rainy-day" as const, costTier: "free" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.795600", lng: "-1.541000", locationName: "Leeds City Centre" },
  { name: "Leeds Industrial Museum at Armley Mills", category: "museum" as const, costTier: "cheap" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: false, lat: "53.799000", lng: "-1.587000", locationName: "Armley, Leeds" },
  // Batch 2
  { name: "Leeds Kirkgate Market", category: "rainy-day" as const, costTier: "free" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.797200", lng: "-1.537800", locationName: "Leeds City Centre" },
  { name: "Lotherton Hall & Estate", category: "heritage" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.813900", lng: "-1.369000", locationName: "Aberford, Leeds" },
  { name: "Middleton Railway", category: "heritage" as const, costTier: "cheap" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.774400", lng: "-1.547700", locationName: "Middleton, Leeds" },
  { name: "Mother Shiptons Cave", category: "heritage" as const, costTier: "moderate" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.004800", lng: "-1.477800", locationName: "Knaresborough" },
  { name: "National Coal Mining Museum", category: "museum" as const, costTier: "free" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.667000", lng: "-1.638000", locationName: "Wakefield" },
  { name: "National Media Museum", category: "museum" as const, costTier: "free" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.793400", lng: "-1.749200", locationName: "Bradford" },
  { name: "National Railway Museum", category: "museum" as const, costTier: "free" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.958500", lng: "-1.091300", locationName: "York" },
  { name: "Ninja Warrior UK Adventure Park (Leeds)", category: "adventure" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: true, lat: "53.837000", lng: "-1.608000", locationName: "Pudsey, Leeds" },
  { name: "Nostell (NT)", category: "heritage" as const, costTier: "moderate" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.654000", lng: "-1.427000", locationName: "Nostell, Wakefield" },
  { name: "Nunnington Hall (NT)", category: "heritage" as const, costTier: "moderate" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.153000", lng: "-0.981000", locationName: "Nunnington, North Yorkshire" },
  { name: "Parcevall Hall Gardens", category: "nature" as const, costTier: "cheap" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.063000", lng: "-1.876000", locationName: "Skyreholme, North Yorkshire" },
  { name: "Pirate Adventure Crazy Golf (Harrogate)", category: "rainy-day" as const, costTier: "cheap" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: false, lat: "53.993000", lng: "-1.543000", locationName: "Harrogate" },
  { name: "RHS Garden Harlow Carr", category: "nature" as const, costTier: "moderate" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.988500", lng: "-1.557000", locationName: "Harrogate" },
  { name: "Ripley Castle & Gardens", category: "heritage" as const, costTier: "moderate" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.068000", lng: "-1.531000", locationName: "Ripley, North Yorkshire" },
  { name: "Rievaulx Abbey", category: "heritage" as const, costTier: "moderate" as const, weather: "both" as const, setting: "outdoor" as const, food: "none" as const, prebookingRequired: false, lat: "54.248000", lng: "-1.117000", locationName: "Helmsley, North Yorkshire" },
  { name: "Roundhay Park", category: "nature" as const, costTier: "free" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.839100", lng: "-1.501100", locationName: "Roundhay, Leeds" },
  { name: "Royal Armouries Museum", category: "museum" as const, costTier: "free" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.794700", lng: "-1.536000", locationName: "Leeds" },
  { name: "Skipton Castle", category: "heritage" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "none" as const, prebookingRequired: false, lat: "53.961400", lng: "-2.016800", locationName: "Skipton" },
  { name: "Sledgehammer Smash Room (Leeds)", category: "rainy-day" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: true, lat: "53.803000", lng: "-1.549000", locationName: "Leeds" },
  { name: "Stockeld Park", category: "adventure" as const, costTier: "moderate" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: true, lat: "53.973000", lng: "-1.482000", locationName: "Spofforth, North Yorkshire" },
  { name: "Stump Cross Caverns", category: "nature" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: false, lat: "54.055600", lng: "-1.798800", locationName: "Greenhow Hill, North Yorkshire" },
  { name: "Temple Newsam", category: "heritage" as const, costTier: "free" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.781800", lng: "-1.469400", locationName: "Temple Newsam, Leeds" },
  { name: "Thackray Medical Museum", category: "museum" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.802100", lng: "-1.527000", locationName: "Harehills, Leeds" },
  { name: "The Deep", category: "museum" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.740000", lng: "-0.331000", locationName: "Kingston upon Hull" },
  // #50 (The Forbidden Corner) omitted — duplicate of #11
  { name: "Tropical World", category: "museum" as const, costTier: "cheap" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: false, lat: "53.840400", lng: "-1.500300", locationName: "Roundhay, Leeds" },
  { name: "Wentworth Castle Gardens", category: "nature" as const, costTier: "cheap" as const, weather: "both" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.534700", lng: "-1.556000", locationName: "Stainborough, Barnsley" },
  { name: "Williams Den", category: "adventure" as const, costTier: "moderate" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: true, lat: "53.887000", lng: "-0.506000", locationName: "North Cave, East Yorkshire" },
  { name: "York Chocolate Story", category: "museum" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: true, lat: "53.960100", lng: "-1.083600", locationName: "York" },
  { name: "York Dungeon", category: "adventure" as const, costTier: "premium" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: true, lat: "53.958100", lng: "-1.080300", locationName: "York" },
  // Batch 3
  { name: "York Maze", category: "adventure" as const, costTier: "cheap" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.987000", lng: "-1.031000", locationName: "Elvington, York" },
  { name: "York Minster (free entry to grounds)", category: "heritage" as const, costTier: "free" as const, weather: "both" as const, setting: "both" as const, food: "nearby" as const, prebookingRequired: false, lat: "53.962300", lng: "-1.081700", locationName: "York" },
  // #58 (York's Chocolate Story) omitted — duplicate of #54
  { name: "Yorkshire Dales Falconry Centre", category: "nature" as const, costTier: "moderate" as const, weather: "both" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.101000", lng: "-2.072000", locationName: "Settle, North Yorkshire" },
  { name: "Yorkshire Lavender", category: "nature" as const, costTier: "cheap" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.084000", lng: "-0.859000", locationName: "Terrington, North Yorkshire" },
  { name: "Yorkshire Museum", category: "museum" as const, costTier: "cheap" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.962000", lng: "-1.088900", locationName: "York" },
  { name: "Yorkshire Sculpture Park", category: "nature" as const, costTier: "free" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.621800", lng: "-1.567300", locationName: "Bretton, Wakefield" },
  { name: "Yorkshire Wildlife Park", category: "farm" as const, costTier: "moderate" as const, weather: "both" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.581000", lng: "-1.093000", locationName: "Branton, Doncaster" },
  { name: "Jorvik Viking Centre", category: "museum" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: true, lat: "53.956900", lng: "-1.081700", locationName: "York" },
  { name: "Aysgarth Falls", category: "nature" as const, costTier: "free" as const, weather: "both" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.303000", lng: "-2.002000", locationName: "Aysgarth, North Yorkshire" },
  { name: "Bolton Abbey", category: "heritage" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.985400", lng: "-1.892800", locationName: "Bolton Abbey, North Yorkshire" },
  { name: "Filey Beach", category: "water" as const, costTier: "free" as const, weather: "sunny" as const, setting: "outdoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.209800", lng: "-0.288000", locationName: "Filey, North Yorkshire" },
  { name: "Harrogate Turkish Baths", category: "rainy-day" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "none" as const, prebookingRequired: true, lat: "53.992000", lng: "-1.538000", locationName: "Harrogate" },
  { name: "Magna Science Adventure Centre", category: "museum" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.491000", lng: "-1.351000", locationName: "Rotherham" },
  { name: "Otley Chevin Forest Park", category: "nature" as const, costTier: "free" as const, weather: "both" as const, setting: "outdoor" as const, food: "none" as const, prebookingRequired: false, lat: "53.900000", lng: "-1.690000", locationName: "Otley, Leeds" },
  { name: "Piece Hall Halifax", category: "heritage" as const, costTier: "free" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.723500", lng: "-1.860800", locationName: "Halifax" },
  { name: "Scarborough Castle", category: "heritage" as const, costTier: "cheap" as const, weather: "both" as const, setting: "outdoor" as const, food: "none" as const, prebookingRequired: false, lat: "54.282600", lng: "-0.392100", locationName: "Scarborough" },
  { name: "Scarborough Sea Life Sanctuary", category: "museum" as const, costTier: "moderate" as const, weather: "rainy-friendly" as const, setting: "indoor" as const, food: "on-site" as const, prebookingRequired: false, lat: "54.283300", lng: "-0.394700", locationName: "Scarborough" },
  { name: "Shibden Hall", category: "heritage" as const, costTier: "cheap" as const, weather: "both" as const, setting: "both" as const, food: "on-site" as const, prebookingRequired: false, lat: "53.736700", lng: "-1.812100", locationName: "Halifax" },
  { name: "Skipton Woods", category: "nature" as const, costTier: "free" as const, weather: "both" as const, setting: "outdoor" as const, food: "none" as const, prebookingRequired: false, lat: "53.972000", lng: "-2.017000", locationName: "Skipton" },
];

const membershipData = [
  {
    name: "National Trust",
    description:
      "Covers NT properties including Fountains Abbey, Nostell, Nunnington Hall, East Riddlesden Hall, Brimham Rocks",
  },
  {
    name: "English Heritage",
    description: "Covers EH properties including Rievaulx Abbey, Scarborough Castle",
  },
];

async function seed() {
  console.log("Seeding activities...");
  await db
    .insert(activities)
    .values(activityData)
    .onConflictDoNothing();

  console.log("Seeding memberships...");
  const insertedMemberships = await db
    .insert(memberships)
    .values(membershipData)
    .onConflictDoNothing()
    .returning({ id: memberships.id, name: memberships.name });

  if (insertedMemberships.length === 0) {
    console.log("Memberships already seeded — skipping family and activity membership links.");
    return;
  }

  console.log("Linking memberships to family...");
  await db
    .insert(familyMemberships)
    .values(insertedMemberships.map((m) => ({ membershipId: m.id })))
    .onConflictDoNothing();

  const ntId = insertedMemberships.find((m) => m.name === "National Trust")?.id;
  const ehId = insertedMemberships.find((m) => m.name === "English Heritage")?.id;

  if (!ntId || !ehId) {
    console.error("Could not resolve membership IDs — skipping activity links.");
    return;
  }

  // NT-covered activities (by name)
  const ntActivityNames = [
    "Brimham Rocks",
    "East Riddlesden Hall (NT)",
    "Fountains Abbey & Studley Royal (NT)",
    "Nostell (NT)",
    "Nunnington Hall (NT)",
    "Wentworth Castle Gardens",
  ];

  // EH-covered activities (by name)
  const ehActivityNames = ["Rievaulx Abbey", "Scarborough Castle"];

  const { sql: rawSql, eq, inArray } = await import("drizzle-orm");
  void rawSql; void eq;

  const linkedActivities = await db.query.activities.findMany({
    where: (a, { inArray: inArr }) =>
      inArr(a.name, [...ntActivityNames, ...ehActivityNames]),
    columns: { id: true, name: true },
  });

  const activityMembershipLinks: { activityId: number; membershipId: number }[] = [];

  for (const activity of linkedActivities) {
    if (ntActivityNames.includes(activity.name)) {
      activityMembershipLinks.push({ activityId: activity.id, membershipId: ntId });
    }
    if (ehActivityNames.includes(activity.name)) {
      activityMembershipLinks.push({ activityId: activity.id, membershipId: ehId });
    }
  }

  if (activityMembershipLinks.length > 0) {
    console.log(`Linking ${activityMembershipLinks.length} activity-membership pairs...`);
    await db
      .insert(activityMemberships)
      .values(activityMembershipLinks)
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
