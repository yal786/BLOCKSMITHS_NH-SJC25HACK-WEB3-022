import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const GREETING_KEYWORDS = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];

const RELEVANT_KEYWORDS = [
  'protego', 'blockchain', 'crypto', 'cryptocurrency', 'defi', 'dapp', 'fintech', 
  'bitcoin', 'ethereum', 'smart contract', 'wallet', 'token', 'nft',
  'web3', 'decentralized', 'finance', 'payment', 'transaction', 'financial',
  'mev', 'flashbots', 'mempool', 'gas', 'mining', 'staking', 'security',
  'lending', 'borrowing', 'liquidity', 'exchange', 'swap', 'protocol',
  'dao', 'governance', 'consensus', 'node', 'validator', 'alert', 'risk',
  'simulation', 'simulate', 'attack', 'protection', 'protect', 'report',
  'analytics', 'tenderly', 'detection', 'detect', 'forensic'
];

const DISCLAIMER = "⚠️ I can only answer questions related to the Protego DApp, blockchain, fintech, and financial protection.";

const PROTY_PROMPT = `You are Proty, the AI assistant for the Protego DApp.

Answer clearly and politely about blockchain, fintech, transactions, financial security, and Protego's workflow (detect → simulate → protect → report).

ABOUT PROTEGO:
Protego is a middleware DApp that protects users from MEV (Maximal Extractable Value) attacks by:
1. **Detection**: Monitoring mempool for suspicious transactions in real-time
2. **Simulation**: Using Tenderly to simulate transactions and predict risks before execution
3. **Protection**: Routing transactions through Flashbots Protect to avoid public mempool exposure
4. **Reporting**: Generating comprehensive forensic analytics and PDF reports

KEY FEATURES:
- Real-time mempool monitoring and threat detection
- MEV attack prevention (front-running, sandwich attacks, etc.)
- Transaction simulation with risk scoring (LOW, MEDIUM, HIGH, CRITICAL)
- Flashbots integration for secure transaction submission
- Analytics dashboard with threat insights and metrics
- Resimulation of past transactions for analysis
- Downloadable PDF reports with detailed forensics
- Alert system with confidence scoring

PROTEGO WORKFLOW:
1. User submits a transaction
2. Protego detects suspicious activity in mempool
3. Transaction is simulated to predict outcomes and risks
4. If safe, transaction is protected via Flashbots
5. Analytics and reports are generated for user review

IMPORTANT: If the user asks unrelated questions (not about Protego, blockchain, fintech, or financial security), respond ONLY with: "${DISCLAIMER}"

Be clear, polite, and educational. Explain technical terms in simple language.

Answer the following question:`;

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.json({ 
        reply: "👋 Hello! I'm Proty — how can I help you today?" 
      });
    }

    const normalizedQuestion = question.trim().toLowerCase();

    // Check if it's a greeting
    const isGreeting = GREETING_KEYWORDS.some(greeting => 
      normalizedQuestion === greeting || normalizedQuestion.startsWith(greeting + ' ') || normalizedQuestion.startsWith(greeting + '!')
    );

    if (isGreeting) {
      return res.json({ 
        reply: "👋 Hello! I'm Proty — how can I help you today?" 
      });
    }

    // Check if question contains relevant keywords
    const hasRelevantKeywords = RELEVANT_KEYWORDS.some(keyword => 
      normalizedQuestion.includes(keyword)
    );

    if (!hasRelevantKeywords) {
      return res.json({ reply: DISCLAIMER });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ 
        reply: "⚠️ AI service is not configured. Please check with the administrator." 
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using gemini-2.5-flash - fast and cost-effective model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(`${PROTY_PROMPT}\n\n${question}`);
    const response = await result.response;
    const reply = response.text();

    res.json({ reply });

  } catch (error) {
    console.error("Proty API error:", error);
    console.error("Error details:", error.response?.data || error.message);
    
    // Handle quota exceeded errors
    if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED") || 
        error.response?.data?.error?.code === 429) {
      return res.json({ 
        reply: "⚠️ AI quota limit reached. The free tier has a limited number of requests per day. Please try again in a few minutes or upgrade your API plan at https://ai.google.dev/pricing" 
      });
    }
    
    // Handle invalid API key
    if (error.message?.includes("API key") || error.message?.includes("API_KEY_INVALID") ||
        error.response?.data?.error?.code === 400) {
      return res.json({ 
        reply: "⚠️ AI service configuration error. Please check your API key at https://aistudio.google.com/app/apikey" 
      });
    }

    // Handle rate limiting
    if (error.message?.includes("rate limit") || error.message?.includes("429")) {
      return res.json({ 
        reply: "⚠️ Too many requests. Please wait a moment and try again." 
      });
    }
    
    // Generic error
    res.json({ 
      reply: "⚠️ I encountered an error processing your question. Please try again in a few moments." 
    });
  }
});

export default router;
