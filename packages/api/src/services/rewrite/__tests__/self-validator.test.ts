import { SelfValidator } from "../self-validator";

describe("SelfValidator", () => {
  let validator: SelfValidator;

  beforeEach(() => {
    validator = new SelfValidator();
  });

  describe("evaluateRisks", () => {
    it("should flag eval() in code as a security risk", async () => {
      const module = {
        id: "test",
        code: `
          function doSomething(input: string) {
            eval(input);
          }
        `,
      };

      const result = await validator.validateModule(module, "test");
      const riskCheck = result.results.find((r) => r.check === "risk_evaluation");

      expect(riskCheck).toBeDefined();
      expect(riskCheck?.status).toBe("warning");
      expect(riskCheck?.message).toContain("Uses eval() - security risk");
    });

    it("should flag eval() as a security risk if usesEval is true (fallback)", async () => {
      const module = {
        id: "test",
        usesEval: true,
      };

      const result = await validator.validateModule(module, "test");
      const riskCheck = result.results.find((r) => r.check === "risk_evaluation");

      expect(riskCheck).toBeDefined();
      expect(riskCheck?.status).toBe("warning");
      expect(riskCheck?.message).toContain("Uses eval() - security risk");
    });

    it("should pass if no risks are found", async () => {
      const module = {
        id: "test",
        code: `
          function doSomething(input: string) {
            console.log(input);
          }
        `,
      };

      const result = await validator.validateModule(module, "test");
      const riskCheck = result.results.find((r) => r.check === "risk_evaluation");

      expect(riskCheck).toBeDefined();
      expect(riskCheck?.status).toBe("pass");
      expect(riskCheck?.message).toBe("No significant risks detected");
    });
  });
});
