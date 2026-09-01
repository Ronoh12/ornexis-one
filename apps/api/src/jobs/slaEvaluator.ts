import {
  evaluateAllOrganizationsSla
} from "../services/slaService.js";

async function main() {
  const result =
    await evaluateAllOrganizationsSla();

  console.log(
    JSON.stringify(
      {
        success: true,
        data:
          result
      },
      null,
      2
    )
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "SLA evaluation failed.",
      error
    );

    process.exitCode = 1;
  }
);
