import * as userService from "./user.service.js";

export async function createUser(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await userService.createUser(email);

    return res.status(201).json({
      userId: user._id,
      email: user.email,
      status: user.status
    });

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    return res.json({
      userId: user._id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt
    });

  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await userService.updateUserStatus(userId, status);

    return res.json({
      userId: user._id,
      status: user.status
    });

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}