const API_URL = "https://upi-without-internet-fyww.onrender.com/api";

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        let message = `Request failed: ${response.status}`;

        try {
            const data = await response.json();
            message = data.message || data.error || message;
        } catch {
            // Response wasn't JSON
        }

        throw new Error(message);
    }

    return response.json();
}

export const api = {

    // GET /api/accounts
    getAccounts: async () => {
        return request(`${API_URL}/accounts`);
    },

    // GET /api/transactions
    getTransactions: async () => {
        return request(`${API_URL}/transactions`);
    },

    // GET /api/mesh/state
    getMeshState: async () => {
        return request(`${API_URL}/mesh/state`);
    },

    // GET /api/server-key
    getServerKey: async () => {
        return request(`${API_URL}/server-key`);
    },

    // POST /api/demo/send
    sendPayment: async (payment) => {
        return request(`${API_URL}/demo/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payment)
        });
    },

    // POST /api/mesh/gossip
    gossip: async () => {
        return request(`${API_URL}/mesh/gossip`, {
            method: "POST"
        });
    },

    // POST /api/mesh/flush
    flush: async () => {
        return request(`${API_URL}/mesh/flush`, {
            method: "POST"
        });
    },

    // POST /api/mesh/reset
    reset: async () => {
        return request(`${API_URL}/mesh/reset`, {
            method: "POST"
        });
    }

};