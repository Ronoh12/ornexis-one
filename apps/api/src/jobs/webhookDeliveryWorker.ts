import {
  processWebhookDeliveries
} from "../services/webhookDeliveryService.js";

async function main() {
  const result =
    await processWebhookDeliveries();

  console.log(
    JSON.stringify(
      {
        success:
          true,
        data:
          result
      },
      null,
      2
    )
  );
}

main().catch(
  (
    error:
      unknown
  ) => {
    console.error(
      "Webhook delivery processing failed.",
      error
    );

    process.exitCode =
      1;
  }
);
