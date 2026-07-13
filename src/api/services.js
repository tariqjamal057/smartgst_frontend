import api from "./axios";

const buildParams = (params) => {
  const clean = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  });
  return clean;
};

// ─── Financial Year ───
export const getFinancialYears = (params) =>
  api.get("/financial-years/", { params: buildParams(params) });
export const createFinancialYear = (data) => api.post("/financial-years/", data);
export const updateFinancialYear = (id, data) => api.patch(`/financial-years/${id}/`, data);

// ─── Chart of Accounts ───
export const getAccounts = (params) =>
  api.get("/accounts/", { params: buildParams(params) });
export const getAccount = (id) => api.get(`/accounts/${id}/`);
export const createAccount = (data) => api.post("/accounts/", data);
export const updateAccount = (id, data) => api.patch(`/accounts/${id}/`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}/`);

// ─── Party ───
export const getParties = (params) =>
  api.get("/parties/", { params: buildParams(params) });
export const getParty = (id) => api.get(`/parties/${id}/`);
export const createParty = (data) => api.post("/parties/", data);
export const updateParty = (id, data) => api.patch(`/parties/${id}/`, data);
export const deleteParty = (id) => api.delete(`/parties/${id}/`);

// ─── Item Categories ───
export const getItemCategories = (params) =>
  api.get("/item-categories/", { params: buildParams(params) });
export const createItemCategory = (data) => api.post("/item-categories/", data);
export const updateItemCategory = (id, data) => api.patch(`/item-categories/${id}/`, data);
export const deleteItemCategory = (id) => api.delete(`/item-categories/${id}/`);

// ─── Items ───
export const getItems = (params) =>
  api.get("/items/", { params: buildParams(params) });
export const getItem = (id) => api.get(`/items/${id}/`);
export const createItem = (data) => api.post("/items/", data);
export const updateItem = (id, data) => api.patch(`/items/${id}/`, data);
export const deleteItem = (id) => api.delete(`/items/${id}/`);

// ─── Invoice Settings ───
export const getInvoiceSettings = (params) =>
  api.get("/invoice-settings/", { params: buildParams(params) });
export const createInvoiceSetting = (data) => api.post("/invoice-settings/", data);
export const updateInvoiceSetting = (id, data) => api.patch(`/invoice-settings/${id}/`, data);

// ─── Sales Invoices ───
export const getSalesInvoices = (params) =>
  api.get("/sales-invoices/", { params: buildParams(params) });
export const getSalesInvoice = (id) => api.get(`/sales-invoices/${id}/`);
export const createSalesInvoice = (data) => api.post("/sales-invoices/", data);
export const updateSalesInvoice = (id, data) => api.patch(`/sales-invoices/${id}/`, data);
export const deleteSalesInvoice = (id) => api.delete(`/sales-invoices/${id}/`);
export const postSalesInvoice = (id) => api.post(`/sales-invoices/${id}/post/`);

// ─── Purchase Bills ───
export const getPurchaseBills = (params) =>
  api.get("/purchase-bills/", { params: buildParams(params) });
export const getPurchaseBill = (id) => api.get(`/purchase-bills/${id}/`);
export const createPurchaseBill = (data) => api.post("/purchase-bills/", data);
export const updatePurchaseBill = (id, data) => api.patch(`/purchase-bills/${id}/`, data);
export const deletePurchaseBill = (id) => api.delete(`/purchase-bills/${id}/`);
export const postPurchaseBill = (id) => api.post(`/purchase-bills/${id}/post/`);

// ─── Receipt Vouchers ───
export const getReceiptVouchers = (params) =>
  api.get("/receipt-vouchers/", { params: buildParams(params) });
export const getReceiptVoucher = (id) => api.get(`/receipt-vouchers/${id}/`);
export const createReceiptVoucher = (data) => api.post("/receipt-vouchers/", data);
export const updateReceiptVoucher = (id, data) => api.patch(`/receipt-vouchers/${id}/`, data);
export const deleteReceiptVoucher = (id) => api.delete(`/receipt-vouchers/${id}/`);
export const postReceiptVoucher = (id) => api.post(`/receipt-vouchers/${id}/post/`);

// ─── Payment Vouchers ───
export const getPaymentVouchers = (params) =>
  api.get("/payment-vouchers/", { params: buildParams(params) });
export const getPaymentVoucher = (id) => api.get(`/payment-vouchers/${id}/`);
export const createPaymentVoucher = (data) => api.post("/payment-vouchers/", data);
export const updatePaymentVoucher = (id, data) => api.patch(`/payment-vouchers/${id}/`, data);
export const deletePaymentVoucher = (id) => api.delete(`/payment-vouchers/${id}/`);
export const postPaymentVoucher = (id) => api.post(`/payment-vouchers/${id}/post/`);

// ─── Journal Vouchers ───
export const getJournalVouchers = (params) =>
  api.get("/journal-vouchers/", { params: buildParams(params) });
export const getJournalVoucher = (id) => api.get(`/journal-vouchers/${id}/`);
export const createJournalVoucher = (data) => api.post("/journal-vouchers/", data);
export const updateJournalVoucher = (id, data) => api.patch(`/journal-vouchers/${id}/`, data);
export const deleteJournalVoucher = (id) => api.delete(`/journal-vouchers/${id}/`);
export const postJournalVoucher = (id) => api.post(`/journal-vouchers/${id}/post/`);

// ─── Contra Vouchers ───
export const getContraVouchers = (params) =>
  api.get("/contra-vouchers/", { params: buildParams(params) });
export const getContraVoucher = (id) => api.get(`/contra-vouchers/${id}/`);
export const createContraVoucher = (data) => api.post("/contra-vouchers/", data);
export const updateContraVoucher = (id, data) => api.patch(`/contra-vouchers/${id}/`, data);
export const deleteContraVoucher = (id) => api.delete(`/contra-vouchers/${id}/`);
export const postContraVoucher = (id) => api.post(`/contra-vouchers/${id}/post/`);

// ─── Credit Notes ───
export const getCreditNotes = (params) =>
  api.get("/credit-notes/", { params: buildParams(params) });
export const getCreditNote = (id) => api.get(`/credit-notes/${id}/`);
export const createCreditNote = (data) => api.post("/credit-notes/", data);
export const updateCreditNote = (id, data) => api.patch(`/credit-notes/${id}/`, data);
export const deleteCreditNote = (id) => api.delete(`/credit-notes/${id}/`);
export const postCreditNote = (id) => api.post(`/credit-notes/${id}/post/`);

// ─── Debit Notes ───
export const getDebitNotes = (params) =>
  api.get("/debit-notes/", { params: buildParams(params) });
export const getDebitNote = (id) => api.get(`/debit-notes/${id}/`);
export const createDebitNote = (data) => api.post("/debit-notes/", data);
export const updateDebitNote = (id, data) => api.patch(`/debit-notes/${id}/`, data);
export const deleteDebitNote = (id) => api.delete(`/debit-notes/${id}/`);
export const postDebitNote = (id) => api.post(`/debit-notes/${id}/post/`);

// ─── Sale Orders ───
export const getSaleOrders = (params) =>
  api.get("/sale-orders/", { params: buildParams(params) });
export const getSaleOrder = (id) => api.get(`/sale-orders/${id}/`);
export const createSaleOrder = (data) => api.post("/sale-orders/", data);
export const updateSaleOrder = (id, data) => api.patch(`/sale-orders/${id}/`, data);
export const deleteSaleOrder = (id) => api.delete(`/sale-orders/${id}/`);

// ─── Purchase Orders ───
export const getPurchaseOrders = (params) =>
  api.get("/purchase-orders/", { params: buildParams(params) });
export const getPurchaseOrder = (id) => api.get(`/purchase-orders/${id}/`);
export const createPurchaseOrder = (data) => api.post("/purchase-orders/", data);
export const updatePurchaseOrder = (id, data) => api.patch(`/purchase-orders/${id}/`, data);
export const deletePurchaseOrder = (id) => api.delete(`/purchase-orders/${id}/`);

// ─── Delivery Challans ───
export const getDeliveryChallans = (params) =>
  api.get("/delivery-challans/", { params: buildParams(params) });
export const getDeliveryChallan = (id) => api.get(`/delivery-challans/${id}/`);
export const createDeliveryChallan = (data) => api.post("/delivery-challans/", data);
export const updateDeliveryChallan = (id, data) => api.patch(`/delivery-challans/${id}/`, data);
export const deleteDeliveryChallan = (id) => api.delete(`/delivery-challans/${id}/`);
export const markChallanDelivered = (id) => api.post(`/delivery-challans/${id}/mark_delivered/`);

// ─── Sale Returns ───
export const getSaleReturns = (params) =>
  api.get("/sale-returns/", { params: buildParams(params) });
export const getSaleReturn = (id) => api.get(`/sale-returns/${id}/`);
export const createSaleReturn = (data) => api.post("/sale-returns/", data);
export const updateSaleReturn = (id, data) => api.patch(`/sale-returns/${id}/`, data);
export const deleteSaleReturn = (id) => api.delete(`/sale-returns/${id}/`);

// ─── Purchase Returns ───
export const getPurchaseReturns = (params) =>
  api.get("/purchase-returns/", { params: buildParams(params) });
export const getPurchaseReturn = (id) => api.get(`/purchase-returns/${id}/`);
export const createPurchaseReturn = (data) => api.post("/purchase-returns/", data);
export const updatePurchaseReturn = (id, data) => api.patch(`/purchase-returns/${id}/`, data);
export const deletePurchaseReturn = (id) => api.delete(`/purchase-returns/${id}/`);

// ─── Transactions ───
export const getTransactions = (params) =>
  api.get("/transactions/", { params: buildParams(params) });
export const createTransaction = (data) => api.post("/transactions/", data);

// ─── Documents ───
export const getDocuments = (params) =>
  api.get("/documents/", { params: buildParams(params) });
export const createDocument = (formData) =>
  api.post("/documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDocument = (id) => api.delete(`/documents/${id}/`);

// ─── Company Settings ───
export const getCompanySettings = (params) =>
  api.get("/company-settings/", { params: buildParams(params) });
export const createCompanySetting = (data) => api.post("/company-settings/", data);
export const updateCompanySetting = (id, data) => api.patch(`/company-settings/${id}/`, data);

// ─── Bank Reconciliation ───
export const getBankReconciliations = (params) =>
  api.get("/bank-reconciliations/", { params: buildParams(params) });
export const createBankReconciliation = (data) =>
  api.post("/bank-reconciliations/", data);
export const updateBankReconciliation = (id, data) =>
  api.patch(`/bank-reconciliations/${id}/`, data);

// ─── Ledger (read-only report data) ───
export const getLedgerEntries = (params) =>
  api.get("/ledger/", { params: buildParams(params) });

// ─── GST Lookup ───
export const lookupGst = (gstin) => api.get(`/gst/${gstin}/`);

// ─── Reports ───
export const getTrialBalance = (params) =>
  api.get("/reports/trial-balance/", { params: buildParams(params) });
export const getProfitLoss = (params) =>
  api.get("/reports/profit-loss/", { params: buildParams(params) });
export const getBalanceSheet = (params) =>
  api.get("/reports/balance-sheet/", { params: buildParams(params) });
export const getCashFlow = (params) =>
  api.get("/reports/cash-flow/", { params: buildParams(params) });

// ─── Dashboard ───
export const getDashboardSummary = (params) =>
  api.get("/dashboard/summary/", { params: buildParams(params) });
