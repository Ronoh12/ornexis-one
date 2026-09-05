import {
  evaluateAllSystemKpis
} from "../services/kpiEvaluatorService.js";

import {
  prisma
} from "../../../../packages/database/index.js";

async function main() {
  const result =
    await evaluateAllSystemKpis();

  console.log(
    JSON.stringify(
      {
        success:
          result.failed === 0,
        data:
          result
      },
      null,
      2
    )
  );

  if (
    result.failed > 0
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch(
    (error) => {
      console.error(
        JSON.stringify(
          {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "KPI evaluation failed."
          },
          null,
          2
        )
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );
