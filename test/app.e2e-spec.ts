import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "./../src/app.module";

describe("App (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // There is no root controller — routes are served at their controller paths
  // (no global /api prefix). GET / must therefore 404.
  it("GET / → 404 (no root route)", () => {
    return request(app.getHttpServer()).get("/").expect(404);
  });

  it("GET /users/me without a token → 401 (route is guarded)", () => {
    return request(app.getHttpServer()).get("/users/me").expect(401);
  });
});
