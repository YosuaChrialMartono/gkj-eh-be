import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ContentService } from "./content.service";
import { Content } from "./entities/content.entity";
import { User } from "../users/entities/user.entity";

const author: User = {
  id: "u1",
  name: "Admin GKJ",
  email: "admin@gkj.test",
  password: "$2b$10$SUPERSECRETHASH",
  avatar: null as unknown as string,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeContent(): Content {
  return {
    id: "c1",
    title: "Hello",
    slug: "hello",
    type: "news",
    status: "published",
    body: "body",
    bodyHtml: "<p>body</p>",
    authorId: "u1",
    author: { ...author },
    featuredImageUrl: null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("ContentService author projection (F1 leak / F5 authorName)", () => {
  let service: ContentService;
  let repo: any;

  beforeEach(async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[makeContent()], 1]),
    };
    repo = {
      createQueryBuilder: jest.fn(() => qb),
      findOne: jest.fn().mockResolvedValue(makeContent()),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: getRepositoryToken(Content), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(ContentService);
  });

  it("findBySlug (PUBLIC) exposes only name + avatar, never password/email/role", async () => {
    const res: any = await service.findBySlug("hello");
    expect(res.author).toEqual({ name: "Admin GKJ", avatar: null });
    expect(res.author.password).toBeUndefined();
    expect(res.author.email).toBeUndefined();
    expect(res.author.role).toBeUndefined();
    expect(JSON.stringify(res)).not.toContain("SUPERSECRETHASH");
  });

  it("findPublic (PUBLIC list) exposes only name + avatar per item", async () => {
    const res: any = await service.findPublic({});
    expect(res.data[0].author).toEqual({ name: "Admin GKJ", avatar: null });
    expect(JSON.stringify(res)).not.toContain("SUPERSECRETHASH");
  });

  it("findById (AUTH) exposes name + email + avatar + role, never password", async () => {
    const res: any = await service.findById("c1");
    expect(res.author).toEqual({
      name: "Admin GKJ",
      email: "admin@gkj.test",
      avatar: null,
      role: "admin",
    });
    expect(res.author.password).toBeUndefined();
    expect(JSON.stringify(res)).not.toContain("SUPERSECRETHASH");
  });

  it("findAll (AUTH list) exposes name + email + avatar + role per item", async () => {
    const res: any = await service.findAll({});
    expect(res.data[0].author).toEqual({
      name: "Admin GKJ",
      email: "admin@gkj.test",
      avatar: null,
      role: "admin",
    });
    expect(JSON.stringify(res)).not.toContain("SUPERSECRETHASH");
  });
});
