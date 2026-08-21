require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("./config/db");

const DEFAULT_BULLETINS = [
  {
    title: "CPR: The First Five Minutes",
    category: "First Aid",
    summary: "What to do before paramedics arrive when someone stops breathing.",
    body: "Call for emergency medical help first, then check if the person responds. If they don't, and they aren't breathing normally, begin chest compressions: push hard and fast in the center of the chest, about two inches deep, at a steady rhythm of roughly 100 to 120 pushes a minute. Let the chest rise fully between pushes. Keep going until help arrives or the person starts breathing on their own. If you're trained in rescue breaths, give two after every 30 compressions — but hands-only CPR is far better than no CPR at all.",
  },
  {
    title: "If You Witness a Robbery or Assault",
    category: "Safety",
    summary: "Staying safe while still being able to give a useful report afterward.",
    body: "Your safety comes first — never intervene physically. Move to a safe distance, and if you can do so without being noticed, note details that matter: what the person looked like, what direction they went, any vehicle and its plate. Do not chase or confront anyone. Once you're safe, report what you saw through this portal or by phone, including the time and exact location. Small details — a jacket color, a limp, a phrase someone shouted — are often what helps officers the most.",
  },
  {
    title: "Treating Cuts, Burns, and Bleeding Until Help Arrives",
    category: "First Aid",
    summary: "Basic first response for common injuries while waiting for medical help.",
    body: "For bleeding, apply firm, direct pressure with a clean cloth and keep the injured area raised above the heart if possible. Don't remove the cloth if it soaks through — add another layer on top. For burns, cool the area under running water for at least ten minutes; never use ice, butter, or ointments on a fresh burn. For minor cuts, clean with water and cover with a sterile dressing. Seek emergency care for deep wounds, burns larger than a hand, or any injury that doesn't stop bleeding after ten minutes of pressure.",
  },
  {
    title: "Reporting Safely: Protecting Your Identity",
    category: "Safety",
    summary: "How this portal handles what you share, and how to stay cautious.",
    body: "You can include as much or as little identifying detail as you're comfortable with in a report. Photos and video are stored only for the officers reviewing your case. Avoid sharing personal safety details — like when you'll be home alone — in a public place while reporting nearby activity. If you ever feel unsafe because of a report you've filed, mention it directly in your report thread so it can be handled with extra care.",
  },
  {
    title: "Spotting Suspicious Activity in Your Neighborhood",
    category: "Community",
    summary: "Patterns worth a second look — and worth reporting even if you're unsure.",
    body: "Trust your instincts. Vehicles circling a block repeatedly, someone testing multiple car or door handles, or property being loaded into a vehicle at odd hours are all worth reporting — even if it turns out to be nothing. You don't need to be certain a crime is happening to file a report; officers would rather review something minor than miss something serious. The more specific you can be about time, location, and description, the more useful your report becomes.",
  },
];

async function main() {
  const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { username: "admin", name: "Duty Officer", password: hashed, role: "ADMIN" },
    });
    console.log("Created admin account -> username: admin, password: admin123 (change this immediately)");
  } else {
    console.log("Admin account already exists, skipping.");
  }

  const bulletinCount = await prisma.bulletin.count();
  if (bulletinCount === 0) {
    await prisma.bulletin.createMany({ data: DEFAULT_BULLETINS });
    console.log(`Seeded ${DEFAULT_BULLETINS.length} starter bulletins.`);
  } else {
    console.log("Bulletins already exist, skipping.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
