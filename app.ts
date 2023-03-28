import express from "express";
import * as fs from "fs";

const app = express();

app.get("/", (req, res) => {
  interface Transaction {
    type: "B" | "S";
    coin: string;
    price: number;
    quantity: number;
  }

  function calculateFIFOTax(transactions: Transaction[]) {
    let btcBought = 0;
    let btcCost = 0;
    let ethBought = 0;
    let ethCost = 0;
    let capitalGains = 0;
    let capitalLosses = 0;

    for (const t of transactions) {
      if (t.type === "B") {
        if (t.coin === "BTC") {
          btcBought += t.quantity;
          btcCost += t.price * t.quantity;
        } else if (t.coin === "ETH") {
          ethBought += t.quantity;
          ethCost += t.price * t.quantity;
        }
      } else if (t.type === "S") {
        if (t.coin === "BTC") {
          const btcSold = t.quantity;
          const btcPrice = t.price;
          const btcAvgCost = btcCost / btcBought;
          let btcGain = 0;
          if (btcSold <= btcBought) {
            btcCost -= btcAvgCost * btcSold;
            btcBought -= btcSold;
            btcGain = (btcPrice - btcAvgCost) * btcSold;
          } else {
            btcGain = (btcPrice - btcAvgCost) * btcBought;
            btcCost = 0;
            btcBought = 0;
            const btcRemaining = btcSold - btcBought;
            capitalGains += btcRemaining * (btcPrice - btcAvgCost);
          }
          capitalGains += btcGain;
        } else if (t.coin === "ETH") {
          const ethSold = t.quantity;
          const ethPrice = t.price;
          const ethAvgCost = ethCost / ethBought;
          let ethGain = 0;
          if (ethSold <= ethBought) {
            ethCost -= ethAvgCost * ethSold;
            ethBought -= ethSold;
            ethGain = (ethPrice - ethAvgCost) * ethSold;
          } else {
            ethGain = (ethPrice - ethAvgCost) * ethBought;
            ethCost = 0;
            ethBought = 0;
            const ethRemaining = ethSold - ethBought;
            capitalGains += ethRemaining * (ethPrice - ethAvgCost);
          }
          capitalGains += ethGain;
        }
      }
    }

    if (capitalGains < 0) {
      capitalLosses = Math.abs(capitalGains);
      capitalGains = 0;
    }

    console.log(`Capital gains: $${capitalGains.toFixed(2)}`);
    console.log(`Capital losses: $${capitalLosses.toFixed(2)}`);
    res.send(
      `Capital gains: ${capitalGains.toFixed(2)}` +
        `\n Capital losses: ${capitalLosses.toFixed(2)}`
    );
  }

  const fileContent = fs.readFileSync("crypto_tax.txt", "utf-8");
  const lines = fileContent.trim().split("\n");
  const transactions: Transaction[] = lines.map((line) => {
    const [type, coin, price, quantity] = line.trim().split(" ");
    return {
      type: type as "B" | "S",
      coin,
      price: parseFloat(price),
      quantity: parseFloat(quantity),
    };
  });

  calculateFIFOTax(transactions);
});

app.listen(3000, () => {
  console.log("App is running at http://localhost:3000");
});
