// Test script pentru gemini_analyze.php
// Simulează un request de la dashboard

const testPayload = {
  q: "Care este ultimul trade?",
  context: {
    global_stats: {
      total_deposits: 1000,
      count_deposits: 5,
      total_withdrawals: 200,
      count_withdrawals: 1,
      net_profit: 150,
      roi_total: 15,
      current_balance: 950
    },
    period_stats: {},
    last_trade: {
      datetime: "2025-12-05 20:30:00",
      type: "profit",
      amount: 45.50,
      event: "Real Madrid vs Barcelona"
    },
    recent_trades: [
      {
        datetime: "2025-12-05 20:30:00",
        type: "profit",
        amount: 45.50,
        event: "Real Madrid vs Barcelona"
      },
      {
        datetime: "2025-12-04 18:15:00",
        type: "pierdere",
        amount: 20.00,
        event: "Liverpool vs Manchester United"
      }
    ],
    transactions_summary: {
      by_type: {
        depunere: { count: 5, sum: 1000 },
        retragere: { count: 1, sum: 200 },
        profit: { count: 8, sum: 350 },
        pierdere: { count: 3, sum: 200 }
      }
    },
    range: "all",
    question: "Care este ultimul trade?"
  }
};

console.log("=== TEST GEMINI ANALYZE ENDPOINT ===");
console.log("Payload trimis:", JSON.stringify(testPayload, null, 2));
console.log("\nFolosește acest payload în dashboard pentru a testa endpointul reparat.");
console.log("\nÎntrebări de testat:");
console.log("1. Care este ultimul trade?");
console.log("2. Ce depuneri am?");
console.log("3. Câte retrageri am făcut și în valoare de cât?");
console.log("4. Cât profit am obținut până în prezent?");
