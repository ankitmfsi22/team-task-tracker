import { hash } from '@node-rs/argon2';
import { createPrismaClient } from '../src/common/db/prisma.js';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

// Demo credentials for local development only. Never used outside `pnpm --filter backend db:seed`.
const DEMO_PASSWORD = 'demo-password-1';

const prisma = createPrismaClient(databaseUrl);

const main = async (): Promise<void> => {
  const passwordHash = await hash(DEMO_PASSWORD, { memoryCost: 19456, timeCost: 2 });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: { email: 'owner@example.com', displayName: 'Olivia Owner', passwordHash },
  });
  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: { email: 'member@example.com', displayName: 'Marco Member', passwordHash },
  });

  const existing = await prisma.project.findFirst({ where: { name: 'Demo Project' } });
  if (existing) return;

  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      description: 'Seed data for local development.',
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const tasks = [
    { title: 'Set up the repository', status: 'DONE', priority: 'HIGH', assigneeId: owner.id },
    { title: 'Design the board', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: member.id },
    {
      title: 'Review the API contract',
      status: 'IN_REVIEW',
      priority: 'URGENT',
      assigneeId: owner.id,
    },
    { title: 'Write the user guide', status: 'TODO', priority: 'LOW', assigneeId: null },
  ] as const;

  for (const task of tasks) {
    const created = await prisma.task.create({
      data: { ...task, projectId: project.id, createdById: owner.id },
    });
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        taskId: created.id,
        actorId: owner.id,
        action: 'task.created',
        metadata: { title: created.title },
      },
    });
  }
};

main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
