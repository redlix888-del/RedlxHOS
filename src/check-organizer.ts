import { prisma } from "./lib/db";

async function main() {
  const organizers = await prisma.organizer.findMany({
    select: { id: true, email: true, fullName: true }
  });
  console.log("Organizers:", organizers);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
