type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

type LoginInput = {
  email: string;
  password: string;
};

type ActivationInput = {
  invitationToken: string;
  password: string;
};

type RefreshTokenInput = {
  refreshToken: string;
};

type ForgotPasswordInput = {
  email: string;
};

type ResetPasswordInput = {
  resetToken: string;
  password: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLoginInput(
  body: unknown
): ValidationResult<LoginInput> {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      success: false,
      message: "Invalid request body"
    };
  }

  const data = body as Record<string, unknown>;

  if (
    typeof data.email !== "string" ||
    !data.email.trim()
  ) {
    return {
      success: false,
      message: "Email is required"
    };
  }

  const email = data.email.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return {
      success: false,
      message: "A valid email address is required"
    };
  }

  if (
    typeof data.password !== "string" ||
    !data.password
  ) {
    return {
      success: false,
      message: "Password is required"
    };
  }

  return {
    success: true,
    data: {
      email,
      password: data.password
    }
  };
}

export function validateActivationInput(
  body: unknown
): ValidationResult<ActivationInput> {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      success: false,
      message: "Invalid request body"
    };
  }

  const data =
    body as Record<string, unknown>;

  if (
    typeof data.invitationToken !== "string" ||
    !data.invitationToken.trim()
  ) {
    return {
      success: false,
      message:
        "Invitation token is required"
    };
  }

  if (
    typeof data.password !== "string" ||
    data.password.length < 8
  ) {
    return {
      success: false,
      message:
        "Password must be at least 8 characters long"
    };
  }

  return {
    success: true,
    data: {
      invitationToken:
        data.invitationToken.trim(),
      password: data.password
    }
  };
}

export function validateRefreshTokenInput(
  body: unknown
): ValidationResult<RefreshTokenInput> {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      success: false,
      message: "Invalid request body"
    };
  }

  const data = body as Record<string, unknown>;

  if (
    typeof data.refreshToken !== "string" ||
    !data.refreshToken.trim()
  ) {
    return {
      success: false,
      message: "Refresh token is required"
    };
  }

  return {
    success: true,
    data: {
      refreshToken:
        data.refreshToken.trim()
    }
  };
}

export function validateForgotPasswordInput(
  body: unknown
): ValidationResult<ForgotPasswordInput> {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      success: false,
      message: "Invalid request body"
    };
  }

  const data =
    body as Record<string, unknown>;

  if (
    typeof data.email !== "string" ||
    !data.email.trim()
  ) {
    return {
      success: false,
      message: "Email is required"
    };
  }

  const email =
    data.email.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return {
      success: false,
      message:
        "A valid email address is required"
    };
  }

  return {
    success: true,
    data: {
      email
    }
  };
}

export function validateResetPasswordInput(
  body: unknown
): ValidationResult<ResetPasswordInput> {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      success: false,
      message: "Invalid request body"
    };
  }

  const data =
    body as Record<string, unknown>;

  if (
    typeof data.resetToken !== "string" ||
    !data.resetToken.trim()
  ) {
    return {
      success: false,
      message:
        "Reset token is required"
    };
  }

  if (
    typeof data.password !== "string" ||
    data.password.length < 8
  ) {
    return {
      success: false,
      message:
        "Password must be at least 8 characters long"
    };
  }

  return {
    success: true,
    data: {
      resetToken:
        data.resetToken.trim(),
      password:
        data.password
    }
  };
}