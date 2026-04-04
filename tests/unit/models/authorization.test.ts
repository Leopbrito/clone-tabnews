import { InternalServerError } from "infra/errors";
import { Feature } from "src/enums/feature.enum";
import { Authorization } from "src/models/authorization";

describe("models/authorization", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        Authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "userWithoutFeatures",
      };

      expect(() => {
        Authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        Authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and known `feature`", () => {
      const createdUser = {
        features: [Feature.READ_USER],
      };

      expect(Authorization.can(createdUser, Feature.READ_USER)).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        Authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "userWithoutFeatures",
      };

      expect(() => {
        Authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        Authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` but no `resource`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        Authorization.filterOutput(createdUser, Feature.READ_USER);
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        features: [Feature.READ_USER],
      };

      const resource = {
        id: 1,
        username: "resource",
        features: [Feature.READ_USER],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        email: "resource@resource.com",
        password: "resource",
      };

      const result = Authorization.filterOutput(createdUser, Feature.READ_USER, resource);

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: [Feature.READ_USER],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });
});
