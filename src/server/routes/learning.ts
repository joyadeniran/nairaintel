import { Router, Request, Response, NextFunction } from "express";
import { dbFirestore } from "../db.js";

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get("/", asyncHandler(async (req, res) => {
  if (dbFirestore) {
    try {
      const snapshot = await dbFirestore.collection("learning_content").get();
      if (snapshot.empty) {
        // Seed demo content if empty or insufficient
        const demoContent = [
          {
            title: "Stock Market Basics",
            description: "Learn how the Nigerian Stock Exchange works and how to start investing.",
            content: "The Nigerian Exchange Group (NGX) is the principal stock exchange of Nigeria...\n\n### How to start investing:\n1. Open a brokerage account with an SEC-registered firm.\n2. Obtain your CSCS account number.\n3. Fund your account and start trading.\n\nRemember to always do thorough research before buying stocks.",
            category: "Beginner",
            image: "https://picsum.photos/seed/stocks1/400/300",
            url: "#"
          },
          {
            title: "Understanding T-Bills",
            description: "A guide to government-backed securities and how they can secure your future.",
            content: "Treasury Bills (T-Bills) are short-term debt instruments issued by the Federal Government of Nigeria through the Central Bank (CBN).\n\n### Why Invest in T-Bills?\n- **Safety:** Backed by the full faith of the government.\n- **Tax-Free:** Interest earned is exempt from state and local taxes.\n- **Liquidity:** They can be sold in the secondary market before maturity.",
            category: "Fixed Income",
            image: "https://picsum.photos/seed/tbills1/400/300",
            url: "#"
          },
          {
            title: "Dividend Growth Strategy",
            description: "How to build a portfolio that pays you regularly through dividends.",
            content: "A dividend growth strategy involves investing in companies that have a history of paying and consistently increasing their dividends.\n\n### Benefits of Dividend Investing in NGX\nMany Nigerian banks and telecom companies (like GTCO, Zenith, MTNN) pay attractive dividend yields. Over time, these dividends can be reinvested to buy more shares, compounding your wealth.",
            category: "Advanced",
            image: "https://picsum.photos/seed/dividends1/400/300",
            url: "#"
          },
          {
            title: "Risk Management 101",
            description: "Protecting your capital in a volatile market like Nigeria's.",
            content: "Risk management is the most crucial part of investing.\n\n### Key Concepts:\n- **Position Sizing:** Never bet your entire portfolio on a single stock.\n- **Diversification:** Spread your investments across different sectors (Banking, Consumer Goods, Industrial).\n- **Stop Loss:** Always have a predetermined exit point if the trade goes against you.",
            category: "Strategy",
            image: "https://picsum.photos/seed/risk1/400/300",
            url: "#"
          },
          {
            title: "Fundamental Analysis 101",
            description: "Learn how to evaluate a company's intrinsic value.",
            content: "Fundamental analysis involves looking at the financial and economic health of a company.\n\n### Key Metrics:\n- **P/E Ratio:** Tells you how much you are paying for ₦1 of earnings.\n- **EPS:** Profit divided by shares.\n- **Yield:** Annual dividend / price.\n\nAlways read Q1/Q2/Q3 reports.",
            category: "Analysis",
            image: "https://picsum.photos/seed/fundamental/400/300",
            url: "#"
          },
          {
            title: "Intro to IPOs in Nigeria",
            description: "What happens when a company goes public and how you participate.",
            content: "An Initial Public Offering (IPO) is when a privately owned company lists its shares on the NGX.\n\n### How to Participate:\n1. Check NGX news.\n2. Read the prospectus.\n3. Apply via stockbroker.\n\n*Note: IPOs can be volatile.*",
            category: "Beginner",
            image: "https://picsum.photos/seed/ipo/400/300",
            url: "#"
          },
          {
            title: "Technical Analysis Basics",
            description: "Using charts and patterns for predictability.",
            content: "While fundamental analysis looks at *what* to buy, technical analysis helps decide *when* to buy.\n\n### Common Indicators:\n- **MA:** Moving Average.\n- **RSI:** Relative Strength Index (>70 is overbought).\n- **Support/Resistance**",
            category: "Advanced",
            image: "https://picsum.photos/seed/technical/400/300",
            url: "#"
          },
          {
            title: "Stock Splits & Bonuses",
            description: "Why do companies issue bonus shares?",
            content: "Companies reward loyal shareholders with bonus issues (e.g., 1 shares for every 4 held).\n\n### What You Need to Know:\n- **Bonus:** Price usually adjusts downward proportionally.\n- **Why do it?** Increases liquidity.\n- **Qualification:** Must buy before the 'Mark-Down' date.",
            category: "Strategy",
            image: "https://picsum.photos/seed/bonus/400/300",
            url: "#"
          }
        ];
        
        const batch = dbFirestore.batch();
        demoContent.forEach(content => {
          const docRef = dbFirestore.collection("learning_content").doc();
          batch.set(docRef, content);
        });
        await batch.commit();
        
        const newSnapshot = await dbFirestore.collection("learning_content").get();
        return res.json(newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      return res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }
  
  // Fallback demo content if no Firestore
  res.json([
    {
      id: "1",
      title: "Stock Market Basics",
      description: "Learn how the Nigerian Stock Exchange works and how to start investing.",
      category: "Beginner",
      image: "https://picsum.photos/seed/stocks1/400/300",
      url: "#"
    }
  ]);
}));

export default router;
