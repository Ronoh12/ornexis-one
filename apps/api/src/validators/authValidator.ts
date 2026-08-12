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
  userId: string;
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

  const data = body as Record<string, unknown>;

  if (
    typeof data.userId !== "string" ||
    !data.userId.trim()
  ) {
    return {
      success: false,
      message: "A valid user ID is required"
    };
  }

  if (
    typeof data.password !== "string" ||
    data.password.length < 8
  ) {
    return {
      success: false,
      message: "Password must be at least 8 characters long"
    };
  }

  return {
    success: true,
    data: {
      userId: data.userId.trim(),
      password: data.password
    }
  };
}