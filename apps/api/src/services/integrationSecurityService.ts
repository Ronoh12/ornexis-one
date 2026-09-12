import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from "node:crypto";

import {
  IntegrationServiceError,
  type EncryptedIntegrationSecret,
  type GeneratedIntegrationCredential
} from "./integrationTypes.js";

const CREDENTIAL_SCHEME =
  "ornx";

const CREDENTIAL_PREFIX_BYTES =
  8;

const CREDENTIAL_SECRET_BYTES =
  32;

const WEBHOOK_SECRET_BYTES =
  32;

const AES_ALGORITHM =
  "aes-256-gcm";

function sha256(
  value: string
) {
  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest(
      "hex"
    );
}

function encryptionKey() {
  const configured =
    process.env
      .INTEGRATION_SECRET_ENCRYPTION_KEY;

  if (
    !configured ||
    !/^[0-9a-f]{64}$/i.test(
      configured
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_SECRET_UNAVAILABLE",
      "Integration secret encryption is not configured."
    );
  }

  return Buffer.from(
    configured,
    "hex"
  );
}

function secretKeyVersion() {
  const configured =
    process.env
      .INTEGRATION_SECRET_KEY_VERSION
      ?.trim();

  return configured ||
    "v1";
}

export function generateIntegrationCredential():
  GeneratedIntegrationCredential {
  const prefix =
    randomBytes(
      CREDENTIAL_PREFIX_BYTES
    ).toString(
      "hex"
    );

  const secret =
    randomBytes(
      CREDENTIAL_SECRET_BYTES
    ).toString(
      "base64url"
    );

  const credential =
    `${CREDENTIAL_SCHEME}_${prefix}_${secret}`;

  return {
    credential,
    prefix,
    credentialHash:
      sha256(
        credential
      )
  };
}

export function parseIntegrationCredential(
  credential: string
) {
  const normalized =
    credential.trim();

  const match =
    /^ornx_([0-9a-f]{16})_([A-Za-z0-9_-]{40,64})$/
      .exec(
        normalized
      );

  if (!match) {
    throw new IntegrationServiceError(
      "INTEGRATION_AUTH_INVALID",
      "Integration credential is invalid."
    );
  }

  return {
    credential:
      normalized,
    prefix:
      match[1]!
  };
}

export function hashIntegrationCredential(
  credential: string
) {
  return sha256(
    credential
  );
}

export function safeHashEquals(
  leftHash: string,
  rightHash: string
) {
  if (
    !/^[0-9a-f]{64}$/i.test(
      leftHash
    ) ||
    !/^[0-9a-f]{64}$/i.test(
      rightHash
    )
  ) {
    return false;
  }

  const left =
    Buffer.from(
      leftHash,
      "hex"
    );

  const right =
    Buffer.from(
      rightHash,
      "hex"
    );

  return timingSafeEqual(
    left,
    right
  );
}

export function encryptWebhookSecret():
  EncryptedIntegrationSecret {
  const key =
    encryptionKey();

  const plaintext =
    randomBytes(
      WEBHOOK_SECRET_BYTES
    ).toString(
      "base64url"
    );

  const iv =
    randomBytes(
      12
    );

  const cipher =
    createCipheriv(
      AES_ALGORITHM,
      key,
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        plaintext,
        "utf8"
      ),
      cipher.final()
    ]);

  const authTag =
    cipher.getAuthTag();

  return {
    plaintext,
    encryptedSecret:
      encrypted.toString(
        "base64"
      ),
    secretIv:
      iv.toString(
        "base64"
      ),
    secretAuthTag:
      authTag.toString(
        "base64"
      ),
    secretKeyVersion:
      secretKeyVersion()
  };
}

export function decryptWebhookSecret(
  input: {
    encryptedSecret: string;
    secretIv: string;
    secretAuthTag: string;
    secretKeyVersion: string;
  }
) {
  if (
    input.secretKeyVersion !==
      secretKeyVersion()
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_SECRET_UNAVAILABLE",
      "The webhook secret key version is unavailable."
    );
  }

  try {
    const decipher =
      createDecipheriv(
        AES_ALGORITHM,
        encryptionKey(),
        Buffer.from(
          input.secretIv,
          "base64"
        )
      );

    decipher.setAuthTag(
      Buffer.from(
        input.secretAuthTag,
        "base64"
      )
    );

    return Buffer.concat([
      decipher.update(
        Buffer.from(
          input.encryptedSecret,
          "base64"
        )
      ),
      decipher.final()
    ]).toString(
      "utf8"
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        IntegrationServiceError
    ) {
      throw error;
    }

    throw new IntegrationServiceError(
      "INTEGRATION_SECRET_INVALID",
      "The webhook signing secret could not be decrypted."
    );
  }
}

export function createWebhookSignature(
  secret: string,
  timestamp: string,
  rawBody: string
) {
  const digest =
    createHmac(
      "sha256",
      secret
    )
      .update(
        `${timestamp}.${rawBody}`,
        "utf8"
      )
      .digest(
        "hex"
      );

  return `v1=${digest}`;
}

export function verifyWebhookSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string
) {
  const expected =
    createWebhookSignature(
      secret,
      timestamp,
      rawBody
    );

  const actualBuffer =
    Buffer.from(
      signature,
      "utf8"
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8"
    );

  if (
    actualBuffer.length !==
      expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    actualBuffer,
    expectedBuffer
  );
}
