import { NestFactory } from "@nestjs/core";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppModule } from "../app.module";
import { User } from "../users/entities/user.entity";
import { Content } from "../content/entities/content.entity";
import { PelayanRole } from "../pelayan/entities/pelayan-role.entity";
import { PelayanPerson } from "../pelayan/entities/pelayan-person.entity";
import { PelayanServiceEntity } from "../pelayan/entities/pelayan-service.entity";
import { PelayanAssignment } from "../pelayan/entities/pelayan-assignment.entity";
import { UsersService } from "../users/users.service";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nextSundays(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() === 0) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "warn", "error"],
  });

  const usersService = app.get(UsersService);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const contentRepo = app.get<Repository<Content>>(getRepositoryToken(Content));
  const roleRepo = app.get<Repository<PelayanRole>>(
    getRepositoryToken(PelayanRole),
  );
  const personRepo = app.get<Repository<PelayanPerson>>(
    getRepositoryToken(PelayanPerson),
  );
  const serviceRepo = app.get<Repository<PelayanServiceEntity>>(
    getRepositoryToken(PelayanServiceEntity),
  );
  const assignmentRepo = app.get<Repository<PelayanAssignment>>(
    getRepositoryToken(PelayanAssignment),
  );

  // 1. Users
  const userSeeds = [
    {
      email: "admin@gkj.test",
      name: "Admin GKJ",
      password: "admin123",
      role: "admin",
    },
    {
      email: "editor@gkj.test",
      name: "Editor GKJ",
      password: "editor123",
      role: "editor",
    },
    {
      email: "viewer@gkj.test",
      name: "Viewer GKJ",
      password: "viewer123",
      role: "viewer",
    },
  ];

  let admin: User | null = null;
  for (const u of userSeeds) {
    let existing = await usersService.findByEmail(u.email);
    if (!existing) {
      const passwordHash = await usersService.hashPassword(u.password);
      existing = await usersService.create({
        name: u.name,
        email: u.email,
        password: u.password,
        passwordHash,
      });
      // bump role if not default viewer
      if (u.role !== "viewer") {
        await userRepo.update(existing.id, { role: u.role });
        existing.role = u.role;
      }
      console.log(`  user: ${u.email} (${u.role}) — created`);
    } else {
      console.log(`  user: ${u.email} — already exists`);
    }
    if (u.role === "admin") admin = existing;
  }
  if (!admin) throw new Error("admin user missing after seed");

  // 2. Content
  const contentSeeds: Array<Partial<Content>> = [
    {
      title: "Selamat Datang di GKJ Eben Haezer",
      type: "news",
      status: "published",
      body: "Selamat datang di website resmi GKJ Eben Haezer. Mari bertumbuh bersama dalam iman.",
    },
    {
      title: "Jadwal Ibadah Minggu Ini",
      type: "news",
      status: "published",
      body: "Ibadah minggu ini akan diadakan pukul 07.00 dan 09.30 WIB.",
    },
    {
      title: "Renungan: Kasih yang Tidak Pernah Pudar",
      type: "renungan",
      status: "published",
      body: "Kasih Allah tidak pernah pudar. Dalam segala keadaan, Ia selalu menyertai.",
    },
    {
      title: "Draft: Pengumuman Acara Natal",
      type: "news",
      status: "draft",
      body: "Persiapan acara Natal sedang berlangsung. Detail menyusul.",
    },
  ];
  for (const c of contentSeeds) {
    const slug = slugify(c.title!);
    const existing = await contentRepo.findOne({ where: { slug } });
    if (existing) {
      console.log(`  content: ${slug} — already exists`);
      continue;
    }
    await contentRepo.save(
      contentRepo.create({
        title: c.title!,
        slug,
        type: c.type!,
        status: c.status!,
        body: c.body!,
        bodyHtml: `<p>${c.body}</p>`,
        authorId: admin.id,
        publishedAt: c.status === "published" ? new Date() : null,
      }),
    );
    console.log(`  content: ${slug} (${c.status}) — created`);
  }

  // 3. Pelayan roles
  const roleSeeds = [
    { name: "Pelayan Firman", order: 1 },
    { name: "Liturgos", order: 2 },
    { name: "Singer", order: 3 },
    { name: "Musisi", order: 4 },
  ];
  const roleByName: Record<string, PelayanRole> = {};
  for (const r of roleSeeds) {
    let existing = await roleRepo.findOne({ where: { name: r.name } });
    if (!existing) {
      existing = await roleRepo.save(roleRepo.create(r));
      console.log(`  role: ${r.name} — created`);
    } else {
      console.log(`  role: ${r.name} — already exists`);
    }
    roleByName[r.name] = existing;
  }

  // 4. Pelayan persons
  const personSeeds = [
    "Pdt. Yohanes",
    "Bp. Andreas",
    "Ibu Maria",
    "Sdri. Ruth",
    "Sdr. Daniel",
    "Bp. Petrus",
  ];
  for (const name of personSeeds) {
    const existing = await personRepo.findOne({ where: { name } });
    if (!existing) {
      await personRepo.save(personRepo.create({ name }));
      console.log(`  person: ${name} — created`);
    } else {
      console.log(`  person: ${name} — already exists`);
    }
  }

  // 5. Services (next 3 Sundays) + assignments
  const sundays = nextSundays(3);
  const servicePlans = [
    {
      date: sundays[0],
      label: "Ibadah Minggu 07.00",
      assignments: {
        "Pelayan Firman": "Pdt. Yohanes",
        Liturgos: "Bp. Andreas",
        Singer: "Ibu Maria",
        Musisi: "Sdr. Daniel",
      },
    },
    {
      date: sundays[1],
      label: "Ibadah Minggu 07.00",
      assignments: {
        "Pelayan Firman": "Pdt. Yohanes",
        Liturgos: "Bp. Petrus",
        Singer: "Sdri. Ruth",
        Musisi: "Sdr. Daniel",
      },
    },
    {
      date: sundays[2],
      label: "Ibadah Minggu 09.30",
      assignments: {
        Liturgos: "Bp. Andreas",
        Singer: "Ibu Maria",
      },
    },
  ];

  for (const plan of servicePlans) {
    let service = await serviceRepo.findOne({
      where: { date: plan.date, label: plan.label },
    });
    if (!service) {
      service = await serviceRepo.save(
        serviceRepo.create({ date: plan.date, label: plan.label }),
      );
      console.log(`  service: ${plan.date} ${plan.label} — created`);
    } else {
      console.log(`  service: ${plan.date} ${plan.label} — already exists`);
    }

    for (const [roleName, pelayanName] of Object.entries(plan.assignments)) {
      const role = roleByName[roleName];
      if (!role) continue;
      const existing = await assignmentRepo.findOne({
        where: { serviceId: service.id, roleId: role.id },
      });
      if (existing) {
        if (existing.pelayanName !== pelayanName) {
          await assignmentRepo.update(existing.id, { pelayanName });
          console.log(
            `    assignment: ${roleName} → ${pelayanName} — updated`,
          );
        }
      } else {
        await assignmentRepo.save(
          assignmentRepo.create({
            serviceId: service.id,
            roleId: role.id,
            pelayanName,
          }),
        );
        console.log(`    assignment: ${roleName} → ${pelayanName} — created`);
      }
    }
  }

  console.log("\nseed complete.");
  console.log("login as: admin@gkj.test / admin123");
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
