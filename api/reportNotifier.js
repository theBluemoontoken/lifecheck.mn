// api/reportNotifier.js
const waiters = new Map(); // { invoice_id: [resolve, ...] }

function wait(invoiceId, timeoutMs = 90000) {
  return new Promise((resolve) => {
    if (!waiters.has(invoiceId)) waiters.set(invoiceId, []);
    waiters.get(invoiceId).push(resolve);

    setTimeout(() => {
      resolve({ sent: false, reason: "timeout" });
    }, timeoutMs);
  });
}

function notify(invoiceId) {
  const resolvers = waiters.get(invoiceId) || [];
  resolvers.forEach((r) => r({ sent: true }));
  waiters.delete(invoiceId);
}

module.exports = { wait, notify };
