import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { FindOperator } from "typeorm";
import { PelayanService, nextMonthStart } from "./pelayan.service";
import { PelayanRole } from "./entities/pelayan-role.entity";
import { PelayanPerson } from "./entities/pelayan-person.entity";
import { PelayanServiceEntity } from "./entities/pelayan-service.entity";
import { PelayanAssignment } from "./entities/pelayan-assignment.entity";

describe("PelayanService filters (F6/F7)", () => {
  let service: PelayanService;
  let serviceFind: jest.Mock;
  let assignmentFind: jest.Mock;

  beforeEach(async () => {
    serviceFind = jest.fn().mockResolvedValue([]);
    assignmentFind = jest.fn().mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        PelayanService,
        { provide: getRepositoryToken(PelayanRole), useValue: {} },
        { provide: getRepositoryToken(PelayanPerson), useValue: {} },
        {
          provide: getRepositoryToken(PelayanServiceEntity),
          useValue: { find: serviceFind },
        },
        {
          provide: getRepositoryToken(PelayanAssignment),
          useValue: { find: assignmentFind },
        },
      ],
    }).compile();
    service = moduleRef.get(PelayanService);
  });

  it("nextMonthStart rolls over the year in December", () => {
    expect(nextMonthStart("2026-06")).toBe("2026-07-01");
    expect(nextMonthStart("2026-12")).toBe("2027-01-01");
  });

  it("findAllServices without month does not filter on date", async () => {
    await service.findAllServices();
    expect(serviceFind.mock.calls[0][0].where).toEqual({});
  });

  it("findAllServices(month) filters date with a Raw range operator", async () => {
    await service.findAllServices("2026-12");
    const where = serviceFind.mock.calls[0][0].where as {
      date: FindOperator<string>;
    };
    expect(where.date).toBeInstanceOf(FindOperator);
    expect(where.date.type).toBe("raw");
  });

  it("findAllAssignments(serviceId) filters by serviceId", async () => {
    await service.findAllAssignments("svc-1");
    expect(assignmentFind.mock.calls[0][0].where).toEqual({ serviceId: "svc-1" });
  });

  it("findAllAssignments() without serviceId does not filter", async () => {
    await service.findAllAssignments();
    expect(assignmentFind.mock.calls[0][0].where).toEqual({});
  });
});
