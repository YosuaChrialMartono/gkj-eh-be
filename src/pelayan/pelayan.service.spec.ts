import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { FindOperator } from "typeorm";
import { PelayanService, nextMonthStart } from "./pelayan.service";
import { PelayanRole } from "./entities/pelayan-role.entity";
import { PelayanPerson } from "./entities/pelayan-person.entity";
import { PelayanServiceEntity } from "./entities/pelayan-service.entity";
import { PelayanAssignment } from "./entities/pelayan-assignment.entity";

/** The `where` option passed to the first `repository.find(...)` call. */
function firstWhere(mock: jest.Mock): Record<string, unknown> {
  const calls = mock.mock.calls as Array<[{ where?: Record<string, unknown> }]>;
  return calls[0]?.[0]?.where ?? {};
}

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
    expect(firstWhere(serviceFind)).toEqual({});
  });

  it("findAllServices(month) filters date with a Raw range operator", async () => {
    await service.findAllServices("2026-12");
    const date = firstWhere(serviceFind).date as FindOperator<string>;
    expect(date).toBeInstanceOf(FindOperator);
    expect(date.type).toBe("raw");
  });

  it("findAllAssignments(serviceId) filters by serviceId", async () => {
    await service.findAllAssignments("svc-1");
    expect(firstWhere(assignmentFind)).toEqual({ serviceId: "svc-1" });
  });

  it("findAllAssignments() without serviceId does not filter", async () => {
    await service.findAllAssignments();
    expect(firstWhere(assignmentFind)).toEqual({});
  });
});
