import {
  request as httpsRequest
} from "node:https";

import {
  INTEGRATION_MAX_RESPONSE_SUMMARY,
  IntegrationServiceError,
  type WebhookTransport
} from "./integrationTypes.js";

import {
  validateWebhookDestination
} from "./webhookDestinationSecurityService.js";

const WEBHOOK_TIMEOUT_MS =
  15_000;

function boundedResponseText(
  chunks:
    Buffer[]
) {
  const combined =
    Buffer.concat(
      chunks
    );

  return combined
    .subarray(
      0,
      INTEGRATION_MAX_RESPONSE_SUMMARY
    )
    .toString(
      "utf8"
    );
}

export const secureWebhookTransport:
  WebhookTransport =
  async (
    request
  ) => {
    const destination =
      await validateWebhookDestination(
        request.url
      );

    const selected =
      destination.addresses[0];

    if (!selected) {
      throw new IntegrationServiceError(
        "WEBHOOK_URL_UNRESOLVABLE",
        "Webhook destination has no usable address."
      );
    }

    const parsed =
      new URL(
        destination.url
      );

    return new Promise(
      (
        resolve,
        reject
      ) => {
        let settled =
          false;

        const finishReject = (
          error:
            Error
        ) => {
          if (settled) {
            return;
          }

          settled =
            true;

          reject(
            error
          );
        };

        const outgoing =
          httpsRequest(
            {
              protocol:
                parsed.protocol,
              hostname:
                parsed.hostname,
              port:
                parsed.port ||
                "443",
              path:
                `${
                  parsed.pathname
                }${
                  parsed.search
                }`,
              method:
                "POST",
              headers:
                request.headers,
              servername:
                destination.hostname,
              agent:
                false,
              lookup: (
                _hostname,
                _options,
                callback
              ) => {
                callback(
                  null,
                  selected.address,
                  selected.family as
                    4 |
                    6
                );
              }
            },
            (
              response
            ) => {
              const chunks:
                Buffer[] = [];

              let capturedBytes =
                0;

              response.on(
                "data",
                (
                  chunk:
                    Buffer |
                    string
                ) => {
                  if (
                    capturedBytes >=
                      INTEGRATION_MAX_RESPONSE_SUMMARY
                  ) {
                    return;
                  }

                  const buffer =
                    Buffer.isBuffer(
                      chunk
                    )
                      ? chunk
                      : Buffer.from(
                          chunk
                        );

                  const remaining =
                    INTEGRATION_MAX_RESPONSE_SUMMARY -
                    capturedBytes;

                  const captured =
                    buffer.subarray(
                      0,
                      remaining
                    );

                  chunks.push(
                    captured
                  );

                  capturedBytes +=
                    captured.length;
                }
              );

              response.on(
                "end",
                () => {
                  if (settled) {
                    return;
                  }

                  settled =
                    true;

                  resolve({
                    status:
                      response.statusCode ??
                      500,
                    body:
                      boundedResponseText(
                        chunks
                      )
                  });
                }
              );

              response.on(
                "error",
                finishReject
              );
            }
          );

        outgoing.setTimeout(
          request.timeoutMs ||
            WEBHOOK_TIMEOUT_MS,
          () => {
            outgoing.destroy(
              new Error(
                "Webhook delivery timed out."
              )
            );
          }
        );

        outgoing.on(
          "error",
          finishReject
        );

        outgoing.end(
          request.body
        );
      }
    );
  };
