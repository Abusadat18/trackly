import { PrismaClient, OrgRole, TeamRole, TaskStatus, TimeEntryType, ActivityCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.orgMembership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── USERS ──────────────────────────────────────────
  const owner = await prisma.user.create({
    data: {
      email: 'admin@trackly.dev',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Morgan',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'sarah@trackly.dev',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Chen',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'james@trackly.dev',
      passwordHash,
      firstName: 'James',
      lastName: 'Wilson',
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'priya@trackly.dev',
      passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
    },
  });

  const user5 = await prisma.user.create({
    data: {
      email: 'mike@trackly.dev',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Johnson',
    },
  });

  const allUsers = [owner, user2, user3, user4, user5];
  console.log(`  ✓ Created ${allUsers.length} users`);

  // ─── ORGANIZATION ───────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      ownerId: owner.id,
    },
  });

  // Add all users as org members
  await prisma.orgMembership.create({
    data: { userId: owner.id, orgId: org.id, role: OrgRole.OWNER },
  });
  await prisma.orgMembership.create({
    data: { userId: user2.id, orgId: org.id, role: OrgRole.ADMIN },
  });
  for (const u of [user3, user4, user5]) {
    await prisma.orgMembership.create({
      data: { userId: u.id, orgId: org.id, role: OrgRole.MEMBER },
    });
  }
  console.log(`  ✓ Created organization: ${org.name}`);

  // ─── TEAMS ──────────────────────────────────────────
  const devTeam = await prisma.team.create({
    data: { name: 'Development', orgId: org.id },
  });
  const marketingTeam = await prisma.team.create({
    data: { name: 'Marketing', orgId: org.id },
  });
  const designTeam = await prisma.team.create({
    data: { name: 'Design', orgId: org.id },
  });

  // Assign team members
  await prisma.teamMember.createMany({
    data: [
      { userId: owner.id, teamId: devTeam.id, role: TeamRole.TEAM_LEAD },
      { userId: user3.id, teamId: devTeam.id, role: TeamRole.MEMBER },
      { userId: user4.id, teamId: devTeam.id, role: TeamRole.MEMBER },
      { userId: user2.id, teamId: marketingTeam.id, role: TeamRole.TEAM_LEAD },
      { userId: user5.id, teamId: marketingTeam.id, role: TeamRole.MEMBER },
      { userId: user4.id, teamId: designTeam.id, role: TeamRole.TEAM_LEAD },
    ],
  });
  console.log('  ✓ Created 3 teams with members');

  // ─── PROJECTS ───────────────────────────────────────
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website',
        color: '#6366f1',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App',
        description: 'Cross-platform mobile application',
        color: '#10b981',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Q2 Marketing Campaign',
        description: 'Social media and content marketing for Q2',
        color: '#f59e0b',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'API Integration',
        description: 'Third-party API integrations',
        color: '#ef4444',
        orgId: org.id,
      },
    }),
  ]);
  console.log(`  ✓ Created ${projects.length} projects`);

  // ─── TASKS ──────────────────────────────────────────
  const taskData = [
    // Website Redesign tasks
    { title: 'Design homepage mockup', projectId: projects[0].id, status: TaskStatus.DONE },
    { title: 'Implement navigation', projectId: projects[0].id, status: TaskStatus.DONE },
    { title: 'Build contact form', projectId: projects[0].id, status: TaskStatus.IN_PROGRESS },
    { title: 'SEO optimization', projectId: projects[0].id, status: TaskStatus.TODO },
    // Mobile App tasks
    { title: 'Setup React Native project', projectId: projects[1].id, status: TaskStatus.DONE },
    { title: 'User authentication flow', projectId: projects[1].id, status: TaskStatus.IN_PROGRESS },
    { title: 'Push notifications', projectId: projects[1].id, status: TaskStatus.TODO },
    { title: 'App store submission', projectId: projects[1].id, status: TaskStatus.TODO },
    // Marketing tasks
    { title: 'Create social media calendar', projectId: projects[2].id, status: TaskStatus.DONE },
    { title: 'Write blog posts', projectId: projects[2].id, status: TaskStatus.IN_PROGRESS },
    { title: 'Design email templates', projectId: projects[2].id, status: TaskStatus.TODO },
    // API Integration tasks
    { title: 'Stripe payment integration', projectId: projects[3].id, status: TaskStatus.IN_PROGRESS },
    { title: 'OAuth2 provider setup', projectId: projects[3].id, status: TaskStatus.TODO },
    { title: 'Webhook handlers', projectId: projects[3].id, status: TaskStatus.TODO },
  ];

  const tasks = await Promise.all(
    taskData.map((t) => prisma.task.create({ data: t })),
  );
  console.log(`  ✓ Created ${tasks.length} tasks`);

  // ─── TIME ENTRIES ───────────────────────────────────
  const timeEntries: any[] = [];

  for (let day = 0; day < 14; day++) {
    for (const user of allUsers) {
      const entriesPerDay = randomInt(2, 4);
      let currentHour = 9;

      for (let e = 0; e < entriesPerDay; e++) {
        const projectIdx = randomInt(0, projects.length - 1);
        const project = projects[projectIdx];
        const projectTasks = tasks.filter((t) => t.projectId === project.id);
        const task = projectTasks[randomInt(0, projectTasks.length - 1)];

        const durationMins = randomInt(30, 180);
        const startTime = new Date(daysAgo(day));
        startTime.setHours(currentHour, randomInt(0, 30), 0, 0);
        const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);
        currentHour += Math.ceil(durationMins / 60) + 1;

        if (currentHour > 18) break;

        timeEntries.push({
          userId: user.id,
          projectId: project.id,
          taskId: task.id,
          type: TimeEntryType.TIMER,
          startTime,
          endTime,
          duration: durationMins * 60,
          description: `Working on ${task.title}`,
        });
      }
    }
  }

  await prisma.timeEntry.createMany({ data: timeEntries });
  console.log(`  ✓ Created ${timeEntries.length} time entries (14 days of data)`);

  // ─── ACTIVITY LOGS ──────────────────────────────────
  const apps = [
    { appName: 'VS Code', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Chrome - GitHub', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Chrome - Stack Overflow', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Figma', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Slack', category: ActivityCategory.NEUTRAL },
    { appName: 'Chrome - Gmail', category: ActivityCategory.NEUTRAL },
    { appName: 'Zoom', category: ActivityCategory.NEUTRAL },
    { appName: 'Chrome - YouTube', category: ActivityCategory.DISTRACTING },
    { appName: 'Chrome - Twitter', category: ActivityCategory.DISTRACTING },
    { appName: 'Chrome - Reddit', category: ActivityCategory.DISTRACTING },
  ];

  const activityLogs: any[] = [];

  for (let day = 0; day < 7; day++) {
    for (const user of allUsers) {
      const logsPerDay = randomInt(8, 15);
      for (let i = 0; i < logsPerDay; i++) {
        const app = apps[randomInt(0, apps.length - 1)];
        const recordedAt = new Date(daysAgo(day));
        recordedAt.setHours(randomInt(9, 17), randomInt(0, 59), 0, 0);

        activityLogs.push({
          userId: user.id,
          appName: app.appName,
          category: app.category,
          durationSecs: randomInt(60, 3600),
          recordedAt,
        });
      }
    }
  }

  await prisma.activityLog.createMany({ data: activityLogs });
  console.log(`  ✓ Created ${activityLogs.length} activity logs (7 days of data)`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Email: admin@trackly.dev');
  console.log('   Password: password123');
  console.log('\n   All users share the same password: password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
