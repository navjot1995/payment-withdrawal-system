import * as walletService from "./wallet.service.js";

export async function getWallet(req, res) {
  try {
    const { userId } = req.params;

    const wallet = await walletService.getWallet(userId);

    return res.json({
      userId,
      balance: wallet.balance.toString(),
      currency: wallet.currency
    });

  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}

export async function creditWallet(req, res) {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const wallet = await walletService.creditWallet(userId, amount);

    return res.json({
      userId,
      balance: wallet.balance.toString()
    });

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}