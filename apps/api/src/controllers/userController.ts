import type { Request, Response } from "express";

import {
  createUser,
  getUserById,
  getUsers
} from "../services/userService.js";

export async function listUsers(
  _req: Request,
  res: Response
) {
  const users = await getUsers();

  return res.json({
    success: true,
    data: users
  });
}

export async function getUser(
  req: Request,
  res: Response
) {
  const id = req.params.id;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required"
    });
  }

  const user = await getUserById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  return res.json({
    success: true,
    data: user
  });
}

export async function addUser(
  req: Request,
  res: Response
) {
  try {
    const user = await createUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists"
      });
    }

    throw error;
  }
}