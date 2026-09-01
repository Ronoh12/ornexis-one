import {
  evaluateAllOrganizationsAttention
} from "../services/attentionEvaluatorService.js";

async function main() {
  const result =
    await evaluateAllOrganizationsAttention();

  console.log(
    JSON.stringify(
      {
        success: true,
        data: result
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error(
    "Attention Centre evaluation failed.",
    error
  );

  process.exitCode = 1;
});
