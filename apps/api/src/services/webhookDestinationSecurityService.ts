import {
  lookup
} from "node:dns/promises";

import {
  isIP
} from "node:net";

import {
  IntegrationServiceError
} from "./integrationTypes.js";

export type WebhookResolvedAddress = {
  address: string;
  family: number;
};

export type WebhookAddressResolver = (
  hostname: string
) =>
  Promise<
    WebhookResolvedAddress[]
  >;

const defaultResolver:
  WebhookAddressResolver =
  async (
    hostname
  ) => {
    const addresses =
      await lookup(
        hostname,
        {
          all:
            true,
          verbatim:
            true
        }
      );

    return addresses.map(
      (
        address
      ) => ({
        address:
          address.address,
        family:
          address.family
      })
    );
  };

function ipv4Parts(
  address: string
) {
  return address
    .split(".")
    .map(
      Number
    );
}

function isUnsafeIpv4(
  address: string
) {
  const parts =
    ipv4Parts(
      address
    );

  if (
    parts.length !==
      4 ||
    parts.some(
      (
        part
      ) =>
        !Number.isInteger(
          part
        ) ||
        part < 0 ||
        part > 255
    )
  ) {
    return true;
  }

  const [
    first,
    second
  ] = parts as [
    number,
    number,
    number,
    number
  ];

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (
      first === 100 &&
      second >= 64 &&
      second <= 127
    ) ||
    (
      first === 169 &&
      second === 254
    ) ||
    (
      first === 172 &&
      second >= 16 &&
      second <= 31
    ) ||
    (
      first === 192 &&
      second === 0
    ) ||
    (
      first === 192 &&
      second === 168
    ) ||
    (
      first === 198 &&
      (
        second === 18 ||
        second === 19
      )
    ) ||
    first >= 224
  );
}

function isUnsafeIpv6(
  address: string
) {
  const normalized =
    address
      .toLowerCase()
      .split(
        "%"
      )[0]!;

  if (
    normalized ===
      "::" ||
    normalized ===
      "::1"
  ) {
    return true;
  }

  if (
    normalized.startsWith(
      "::ffff:"
    )
  ) {
    const mapped =
      normalized.slice(
        "::ffff:".length
      );

    if (
      isIP(
        mapped
      ) ===
        4
    ) {
      return isUnsafeIpv4(
        mapped
      );
    }
  }

  const firstGroup =
    normalized.split(
      ":"
    )[0] || "0";

  const firstValue =
    Number.parseInt(
      firstGroup,
      16
    );

  return (
    (
      firstValue &
        0xfe00
    ) ===
      0xfc00 ||
    (
      firstValue &
        0xffc0
    ) ===
      0xfe80 ||
    (
      firstValue &
        0xff00
    ) ===
      0xff00 ||
    normalized.startsWith(
      "2001:db8:"
    )
  );
}

export function isPublicWebhookAddress(
  address: string
) {
  const family =
    isIP(
      address
    );

  if (
    family ===
      4
  ) {
    return !isUnsafeIpv4(
      address
    );
  }

  if (
    family ===
      6
  ) {
    return !isUnsafeIpv6(
      address
    );
  }

  return false;
}

export function parseWebhookUrl(
  value: string
) {
  let parsed:
    URL;

  try {
    parsed =
      new URL(
        value
      );
  } catch {
    throw new IntegrationServiceError(
      "WEBHOOK_URL_INVALID",
      "Webhook URL is invalid."
    );
  }

  if (
    parsed.protocol !==
      "https:"
  ) {
    throw new IntegrationServiceError(
      "WEBHOOK_URL_INVALID",
      "Webhook URL must use HTTPS."
    );
  }

  if (
    parsed.username ||
    parsed.password
  ) {
    throw new IntegrationServiceError(
      "WEBHOOK_URL_INVALID",
      "Webhook URL must not contain credentials."
    );
  }

  if (
    parsed.hash
  ) {
    throw new IntegrationServiceError(
      "WEBHOOK_URL_INVALID",
      "Webhook URL must not contain a fragment."
    );
  }

  if (
    !parsed.hostname ||
    parsed.href.length >
      2_048
  ) {
    throw new IntegrationServiceError(
      "WEBHOOK_URL_INVALID",
      "Webhook URL is invalid."
    );
  }

  const port =
    parsed.port
      ? Number(
          parsed.port
        )
      : 443;

  if (
    !Number.isInteger(
      port
    ) ||
    port < 1 ||
    port > 65_535
  ) {
    throw new IntegrationServiceError(
      "WEBHOOK_URL_INVALID",
      "Webhook URL port is invalid."
    );
  }

  parsed.hash =
    "";

  return parsed;
}

export async function validateWebhookDestination(
  value: string,
  resolver:
    WebhookAddressResolver =
      defaultResolver
) {
  const parsed =
    parseWebhookUrl(
      value
    );

  const hostname =
    parsed.hostname
      .startsWith(
        "["
      ) &&
    parsed.hostname
      .endsWith(
        "]"
      )
      ? parsed.hostname.slice(
          1,
          -1
        )
      : parsed.hostname;

  const literalFamily =
    isIP(
      hostname
    );

  let addresses:
    WebhookResolvedAddress[];

  if (
    literalFamily !==
      0
  ) {
    addresses = [
      {
        address:
          hostname,
        family:
          literalFamily
      }
    ];
  } else {
    try {
      addresses =
        await resolver(
          hostname
        );
    } catch {
      throw new IntegrationServiceError(
        "WEBHOOK_URL_UNRESOLVABLE",
        "Webhook destination could not be resolved."
      );
    }
  }

  if (
    addresses.length ===
      0 ||
    addresses.some(
      (
        resolved
      ) =>
        !isPublicWebhookAddress(
          resolved.address
        )
    )
  ) {
    throw new IntegrationServiceError(
      "WEBHOOK_URL_FORBIDDEN",
      "Webhook destination must resolve only to public addresses."
    );
  }

  return {
    url:
      parsed.toString(),
    hostname,
    port:
      parsed.port
        ? Number(
            parsed.port
          )
        : 443,
    addresses
  };
}
