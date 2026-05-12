import { PrismaClient, OrgRole, TeamRole, TaskStatus, TimeEntryType, ActivityCategory, InvitationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
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

  const user6 = await prisma.user.create({
    data: {
      email: 'emma@trackly.dev',
      passwordHash,
      firstName: 'Emma',
      lastName: 'Davis',
    },
  });

  const user7 = await prisma.user.create({
    data: {
      email: 'raj@trackly.dev',
      passwordHash,
      firstName: 'Raj',
      lastName: 'Patel',
    },
  });

  const allUsers = [owner, user2, user3, user4, user5, user6, user7];
  console.log(`  ✓ Created ${allUsers.length} users`);

  // ─── ORGANIZATION ───────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      ownerId: owner.id,
    },
  });

  await prisma.orgMembership.create({
    data: { userId: owner.id, orgId: org.id, role: OrgRole.OWNER },
  });
  await prisma.orgMembership.create({
    data: { userId: user2.id, orgId: org.id, role: OrgRole.ADMIN },
  });
  for (const u of [user3, user4, user5, user6, user7]) {
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
  const qaTeam = await prisma.team.create({
    data: { name: 'QA & Testing', orgId: org.id },
  });

  await prisma.teamMember.createMany({
    data: [
      { userId: owner.id, teamId: devTeam.id, role: TeamRole.TEAM_LEAD },
      { userId: user3.id, teamId: devTeam.id, role: TeamRole.MEMBER },
      { userId: user4.id, teamId: devTeam.id, role: TeamRole.MEMBER },
      { userId: user7.id, teamId: devTeam.id, role: TeamRole.MEMBER },
      { userId: user2.id, teamId: marketingTeam.id, role: TeamRole.TEAM_LEAD },
      { userId: user5.id, teamId: marketingTeam.id, role: TeamRole.MEMBER },
      { userId: user6.id, teamId: marketingTeam.id, role: TeamRole.MEMBER },
      { userId: user4.id, teamId: designTeam.id, role: TeamRole.TEAM_LEAD },
      { userId: user6.id, teamId: designTeam.id, role: TeamRole.MEMBER },
      { userId: user3.id, teamId: qaTeam.id, role: TeamRole.TEAM_LEAD },
      { userId: user7.id, teamId: qaTeam.id, role: TeamRole.MEMBER },
    ],
  });
  console.log('  ✓ Created 4 teams with members');

  // ─── PROJECTS ───────────────────────────────────────
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern UI',
        color: '#6366f1',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App',
        description: 'Cross-platform mobile application using React Native',
        color: '#10b981',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Q2 Marketing Campaign',
        description: 'Social media and content marketing strategy for Q2',
        color: '#f59e0b',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'API Integration',
        description: 'Third-party API integrations for payment and auth',
        color: '#ef4444',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Customer Portal',
        description: 'Self-service portal for enterprise customers',
        color: '#8b5cf6',
        orgId: org.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Infrastructure Upgrade',
        description: 'Migrate to Kubernetes and improve CI/CD pipeline',
        color: '#06b6d4',
        orgId: org.id,
      },
    }),
  ]);
  console.log(`  ✓ Created ${projects.length} projects`);

  // ─── TASKS ──────────────────────────────────────────
  const taskData = [
    // Website Redesign
    { title: 'Design homepage mockup', projectId: projects[0].id, status: TaskStatus.DONE },
    { title: 'Implement navigation', projectId: projects[0].id, status: TaskStatus.DONE },
    { title: 'Build contact form', projectId: projects[0].id, status: TaskStatus.IN_PROGRESS },
    { title: 'SEO optimization', projectId: projects[0].id, status: TaskStatus.TODO },
    { title: 'Accessibility audit', projectId: projects[0].id, status: TaskStatus.TODO },
    // Mobile App
    { title: 'Setup React Native project', projectId: projects[1].id, status: TaskStatus.DONE },
    { title: 'User authentication flow', projectId: projects[1].id, status: TaskStatus.DONE },
    { title: 'Push notifications', projectId: projects[1].id, status: TaskStatus.IN_PROGRESS },
    { title: 'Offline sync', projectId: projects[1].id, status: TaskStatus.IN_PROGRESS },
    { title: 'App store submission', projectId: projects[1].id, status: TaskStatus.TODO },
    // Marketing
    { title: 'Create social media calendar', projectId: projects[2].id, status: TaskStatus.DONE },
    { title: 'Write blog posts', projectId: projects[2].id, status: TaskStatus.IN_PROGRESS },
    { title: 'Design email templates', projectId: projects[2].id, status: TaskStatus.TODO },
    { title: 'Launch landing page A/B test', projectId: projects[2].id, status: TaskStatus.TODO },
    // API Integration
    { title: 'Stripe payment integration', projectId: projects[3].id, status: TaskStatus.DONE },
    { title: 'OAuth2 provider setup', projectId: projects[3].id, status: TaskStatus.IN_PROGRESS },
    { title: 'Webhook handlers', projectId: projects[3].id, status: TaskStatus.TODO },
    { title: 'Rate limiting middleware', projectId: projects[3].id, status: TaskStatus.TODO },
    // Customer Portal
    { title: 'Dashboard wireframes', projectId: projects[4].id, status: TaskStatus.DONE },
    { title: 'Ticket management system', projectId: projects[4].id, status: TaskStatus.IN_PROGRESS },
    { title: 'Knowledge base integration', projectId: projects[4].id, status: TaskStatus.TODO },
    { title: 'SSO implementation', projectId: projects[4].id, status: TaskStatus.TODO },
    // Infrastructure
    { title: 'Docker containerization', projectId: projects[5].id, status: TaskStatus.DONE },
    { title: 'K8s deployment manifests', projectId: projects[5].id, status: TaskStatus.IN_PROGRESS },
    { title: 'Monitoring with Grafana', projectId: projects[5].id, status: TaskStatus.TODO },
    { title: 'Automated backup strategy', projectId: projects[5].id, status: TaskStatus.TODO },
  ];

  const tasks = await Promise.all(
    taskData.map((t) => prisma.task.create({ data: t })),
  );
  console.log(`  ✓ Created ${tasks.length} tasks`);

  // ─── TIME ENTRIES ───────────────────────────────────
  const timeEntries: any[] = [];

  for (let day = 0; day < 21; day++) {
    for (const user of allUsers) {
      const entriesPerDay = randomInt(2, 5);
      let currentHour = 9;

      for (let e = 0; e < entriesPerDay; e++) {
        const project = pick(projects);
        const projectTasks = tasks.filter((t) => t.projectId === project.id);
        const task = pick(projectTasks);

        const durationMins = randomInt(25, 180);
        const startTime = new Date(daysAgo(day));
        startTime.setHours(currentHour, randomInt(0, 45), 0, 0);
        const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);
        currentHour += Math.ceil(durationMins / 60) + 1;

        if (currentHour > 18) break;

        const isManual = randomInt(1, 10) <= 2;
        timeEntries.push({
          userId: user.id,
          projectId: project.id,
          taskId: task.id,
          type: isManual ? TimeEntryType.MANUAL : TimeEntryType.TIMER,
          startTime,
          endTime,
          duration: durationMins * 60,
          description: isManual
            ? `[Manual] ${task.title}`
            : `Working on ${task.title}`,
        });
      }
    }
  }

  await prisma.timeEntry.createMany({ data: timeEntries });
  console.log(`  ✓ Created ${timeEntries.length} time entries (21 days of data)`);

  // ─── ACTIVITY LOGS ──────────────────────────────────
  const appActivities = [
    { appName: 'VS Code', windowTitle: 'index.tsx - trackly', category: ActivityCategory.PRODUCTIVE },
    { appName: 'VS Code', windowTitle: 'schema.prisma - trackly', category: ActivityCategory.PRODUCTIVE },
    { appName: 'VS Code', windowTitle: 'api.service.ts - trackly', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Chrome', windowTitle: 'Pull Request #42 - GitHub', url: 'https://github.com/acme/trackly/pull/42', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Chrome', windowTitle: 'Stack Overflow - How to fix CORS', url: 'https://stackoverflow.com/questions/123', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Chrome', windowTitle: 'TypeScript Documentation', url: 'https://typescriptlang.org/docs', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Chrome', windowTitle: 'Prisma Docs - Relations', url: 'https://prisma.io/docs/concepts/relations', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Figma', windowTitle: 'Trackly - Dashboard Components', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Figma', windowTitle: 'Mobile App Wireframes v3', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Terminal', windowTitle: 'npm run dev', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Postman', windowTitle: 'Trackly API Collection', category: ActivityCategory.PRODUCTIVE },
    { appName: 'Slack', windowTitle: '#dev-general', category: ActivityCategory.NEUTRAL },
    { appName: 'Slack', windowTitle: '#random', category: ActivityCategory.NEUTRAL },
    { appName: 'Chrome', windowTitle: 'Gmail - Inbox', url: 'https://mail.google.com', category: ActivityCategory.NEUTRAL },
    { appName: 'Zoom', windowTitle: 'Daily Standup', category: ActivityCategory.NEUTRAL },
    { appName: 'Zoom', windowTitle: 'Sprint Planning', category: ActivityCategory.NEUTRAL },
    { appName: 'Notion', windowTitle: 'Sprint Board - Q2', category: ActivityCategory.NEUTRAL },
    { appName: 'Chrome', windowTitle: 'YouTube - Tech Talk', url: 'https://youtube.com/watch?v=abc', category: ActivityCategory.DISTRACTING },
    { appName: 'Chrome', windowTitle: 'Reddit - r/programming', url: 'https://reddit.com/r/programming', category: ActivityCategory.DISTRACTING },
    { appName: 'Chrome', windowTitle: 'Twitter / X', url: 'https://x.com/home', category: ActivityCategory.DISTRACTING },
    { appName: 'Chrome', windowTitle: 'Hacker News', url: 'https://news.ycombinator.com', category: ActivityCategory.DISTRACTING },
  ];

  const activityLogs: any[] = [];

  for (let day = 0; day < 14; day++) {
    for (const user of allUsers) {
      const logsPerDay = randomInt(10, 20);
      for (let i = 0; i < logsPerDay; i++) {
        const activity = pick(appActivities);
        const recordedAt = new Date(daysAgo(day));
        recordedAt.setHours(randomInt(9, 17), randomInt(0, 59), 0, 0);

        activityLogs.push({
          userId: user.id,
          appName: activity.appName,
          windowTitle: activity.windowTitle,
          url: activity.url || null,
          category: activity.category,
          durationSecs: randomInt(30, 3600),
          recordedAt,
        });
      }
    }
  }

  await prisma.activityLog.createMany({ data: activityLogs });
  console.log(`  ✓ Created ${activityLogs.length} activity logs (14 days of data)`);

  // ─── INVITATIONS ────────────────────────────────────
  const invitations = [
    {
      email: 'newdev@example.com',
      orgId: org.id,
      invitedById: owner.id,
      token: randomUUID(),
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      email: 'designer@example.com',
      orgId: org.id,
      invitedById: user2.id,
      token: randomUUID(),
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      email: 'past@example.com',
      orgId: org.id,
      invitedById: owner.id,
      token: randomUUID(),
      status: InvitationStatus.EXPIRED,
      expiresAt: daysAgo(3),
    },
  ];

  await prisma.invitation.createMany({ data: invitations });
  console.log(`  ✓ Created ${invitations.length} invitations`);

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
