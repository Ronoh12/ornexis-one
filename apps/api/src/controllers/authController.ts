import type {
  Request,
  Response
} from "express";

import {
  activateUser,
  loginUser
} from "../services/authService.js";

export async function activate(
  req: Request,
  res: Response
) {
  const {
    userId,
    password
  } = req.body;

  if (
    typeof userId !== "string" ||
    typeof password !== "string" ||
    !userId ||
    password.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid userId and password of at least 8 characters are required"
    });
  }

  try {
    const user = await activateUser({
      userId,
      password
    });

    return res.json({
      success: true,
      message: "User activated successfully",
      data: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    throw error;
  }
}

export async function login(
  req: Request,
  res: Response
) {
  const {
    email,
    password
  } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  const result =
    await loginUser({
      email,
      password
    });

  if (!result) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  return res.json({
    success: true,
    message: "Login successful",
    data: result
  });
}