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
  api.get("/accounting/financial-years/", { params: buildParams(params) });
export const createFinancialYear = (data) => api.post("/accounting/financial-years/", data);
export const updateFinancialYear = (id, data) => api.patch(`/accounting/financial-years/${id}/`, data);

// ─── Chart of Accounts ───
export const getAccounts = (params) =>
  api.get("/accounting/accounts/", { params: buildParams(params) });
export const getAccount = (id) => api.get(`/accounting/accounts/${id}/`);
export const createAccount = (data) => api.post("/accounting/accounts/", data);
export const updateAccount = (id, data) => api.patch(`/accounting/accounts/${id}/`, data);
export const deleteAccount = (id) => api.delete(`/accounting/accounts/${id}/`);

// ─── Party ───
export const getParties = (params) =>
  api.get("/accounting/parties/", { params: buildParams(params) });
export const getParty = (id) => api.get(`/accounting/parties/${id}/`);
export const createParty = (data) => api.post("/accounting/parties/", data);
export const updateParty = (id, data) => api.patch(`/accounting/parties/${id}/`, data);
export const deleteParty = (id) => api.delete(`/accounting/parties/${id}/`);

// ─── Item Categories ───
export const getItemCategories = (params) =>
  api.get("/accounting/item-categories/", { params: buildParams(params) });
export const createItemCategory = (data) => api.post("/accounting/item-categories/", data);
export const updateItemCategory = (id, data) => api.patch(`/accounting/item-categories/${id}/`, data);
export const deleteItemCategory = (id) => api.delete(`/accounting/item-categories/${id}/`);

// ─── Godowns ───
export const getGodowns = (params) =>
  api.get("/accounting/godowns/", { params: buildParams(params) });
export const createGodown = (data) => api.post("/accounting/godowns/", data);
export const updateGodown = (id, data) => api.patch(`/accounting/godowns/${id}/`, data);
export const deleteGodown = (id) => api.delete(`/accounting/godowns/${id}/`);

// ─── Items ───
export const getItems = (params) =>
  api.get("/accounting/items/", { params: buildParams(params) });
export const getItem = (id) => api.get(`/accounting/items/${id}/`);
export const createItem = (data) => api.post("/accounting/items/", data);
export const updateItem = (id, data) => api.patch(`/accounting/items/${id}/`, data);
export const deleteItem = (id) => api.delete(`/accounting/items/${id}/`);

// ─── Invoice Settings ───
export const getInvoiceSettings = (params) =>
  api.get("/accounting/invoice-settings/", { params: buildParams(params) });
export const createInvoiceSetting = (data) => api.post("/accounting/invoice-settings/", data);
export const updateInvoiceSetting = (id, data) => api.patch(`/accounting/invoice-settings/${id}/`, data);

// ─── Invoice Preferences ───
export const getInvoicePreferences = () => api.get("/accounting/invoice-preferences/");
export const updateInvoicePreferences = (id, data) => api.patch(`/accounting/invoice-preferences/${id}/`, data);

// ─── Invoice Books ───
export const getInvoiceBooks = (params) =>
  api.get("/accounting/invoice-books/", { params: buildParams(params) });
export const createInvoiceBook = (data) => api.post("/accounting/invoice-books/", data);
export const updateInvoiceBook = (id, data) => api.patch(`/accounting/invoice-books/${id}/`, data);
export const deleteInvoiceBook = (id) => api.delete(`/accounting/invoice-books/${id}/`);

// ─── Sales Invoices ───
export const getSalesInvoices = (params) =>
  api.get("/accounting/sales-invoices/", { params: buildParams(params) });
export const getSalesInvoice = (id) => api.get(`/accounting/sales-invoices/${id}/`);
export const createSalesInvoice = (data) => api.post("/accounting/sales-invoices/", data);
export const updateSalesInvoice = (id, data) => api.patch(`/accounting/sales-invoices/${id}/`, data);
export const deleteSalesInvoice = (id) => api.delete(`/accounting/sales-invoices/${id}/`);
export const postSalesInvoice = (id) => api.post(`/accounting/sales-invoices/${id}/post/`);

// ─── Purchase Bills ───
export const getPurchaseBills = (params) =>
  api.get("/accounting/purchase-bills/", { params: buildParams(params) });
export const getPurchaseBill = (id) => api.get(`/accounting/purchase-bills/${id}/`);
export const createPurchaseBill = (data) => api.post("/accounting/purchase-bills/", data);
export const updatePurchaseBill = (id, data) => api.patch(`/accounting/purchase-bills/${id}/`, data);
export const deletePurchaseBill = (id) => api.delete(`/accounting/purchase-bills/${id}/`);
export const postPurchaseBill = (id) => api.post(`/accounting/purchase-bills/${id}/post/`);

// ─── Receipt Vouchers ───
export const getReceiptVouchers = (params) =>
  api.get("/accounting/receipt-vouchers/", { params: buildParams(params) });
export const getReceiptVoucher = (id) => api.get(`/accounting/receipt-vouchers/${id}/`);
export const createReceiptVoucher = (data) => api.post("/accounting/receipt-vouchers/", data);
export const updateReceiptVoucher = (id, data) => api.patch(`/accounting/receipt-vouchers/${id}/`, data);
export const deleteReceiptVoucher = (id) => api.delete(`/accounting/receipt-vouchers/${id}/`);
export const postReceiptVoucher = (id) => api.post(`/accounting/receipt-vouchers/${id}/post/`);

// ─── Payment Vouchers ───
export const getPaymentVouchers = (params) =>
  api.get("/accounting/payment-vouchers/", { params: buildParams(params) });
export const getPaymentVoucher = (id) => api.get(`/accounting/payment-vouchers/${id}/`);
export const createPaymentVoucher = (data) => api.post("/accounting/payment-vouchers/", data);
export const updatePaymentVoucher = (id, data) => api.patch(`/accounting/payment-vouchers/${id}/`, data);
export const deletePaymentVoucher = (id) => api.delete(`/accounting/payment-vouchers/${id}/`);
export const postPaymentVoucher = (id) => api.post(`/accounting/payment-vouchers/${id}/post/`);

// ─── Journal Vouchers ───
export const getJournalVouchers = (params) =>
  api.get("/accounting/journal-vouchers/", { params: buildParams(params) });
export const getJournalVoucher = (id) => api.get(`/accounting/journal-vouchers/${id}/`);
export const createJournalVoucher = (data) => api.post("/accounting/journal-vouchers/", data);
export const updateJournalVoucher = (id, data) => api.patch(`/accounting/journal-vouchers/${id}/`, data);
export const deleteJournalVoucher = (id) => api.delete(`/accounting/journal-vouchers/${id}/`);
export const postJournalVoucher = (id) => api.post(`/accounting/journal-vouchers/${id}/post/`);

// ─── Contra Vouchers ───
export const getContraVouchers = (params) =>
  api.get("/accounting/contra-vouchers/", { params: buildParams(params) });
export const getContraVoucher = (id) => api.get(`/accounting/contra-vouchers/${id}/`);
export const createContraVoucher = (data) => api.post("/accounting/contra-vouchers/", data);
export const updateContraVoucher = (id, data) => api.patch(`/accounting/contra-vouchers/${id}/`, data);
export const deleteContraVoucher = (id) => api.delete(`/accounting/contra-vouchers/${id}/`);
export const postContraVoucher = (id) => api.post(`/accounting/contra-vouchers/${id}/post/`);

// ─── Credit Notes ───
export const getCreditNotes = (params) =>
  api.get("/accounting/credit-notes/", { params: buildParams(params) });
export const getCreditNote = (id) => api.get(`/accounting/credit-notes/${id}/`);
export const createCreditNote = (data) => api.post("/accounting/credit-notes/", data);
export const updateCreditNote = (id, data) => api.patch(`/accounting/credit-notes/${id}/`, data);
export const deleteCreditNote = (id) => api.delete(`/accounting/credit-notes/${id}/`);
export const postCreditNote = (id) => api.post(`/accounting/credit-notes/${id}/post/`);

// ─── Debit Notes ───
export const getDebitNotes = (params) =>
  api.get("/accounting/debit-notes/", { params: buildParams(params) });
export const getDebitNote = (id) => api.get(`/accounting/debit-notes/${id}/`);
export const createDebitNote = (data) => api.post("/accounting/debit-notes/", data);
export const updateDebitNote = (id, data) => api.patch(`/accounting/debit-notes/${id}/`, data);
export const deleteDebitNote = (id) => api.delete(`/accounting/debit-notes/${id}/`);
export const postDebitNote = (id) => api.post(`/accounting/debit-notes/${id}/post/`);

// ─── Sale Orders ───
export const getSaleOrders = (params) =>
  api.get("/accounting/sale-orders/", { params: buildParams(params) });
export const getSaleOrder = (id) => api.get(`/accounting/sale-orders/${id}/`);
export const createSaleOrder = (data) => api.post("/accounting/sale-orders/", data);
export const updateSaleOrder = (id, data) => api.patch(`/accounting/sale-orders/${id}/`, data);
export const deleteSaleOrder = (id) => api.delete(`/accounting/sale-orders/${id}/`);

// ─── Purchase Orders ───
export const getPurchaseOrders = (params) =>
  api.get("/accounting/purchase-orders/", { params: buildParams(params) });
export const getPurchaseOrder = (id) => api.get(`/accounting/purchase-orders/${id}/`);
export const createPurchaseOrder = (data) => api.post("/accounting/purchase-orders/", data);
export const updatePurchaseOrder = (id, data) => api.patch(`/accounting/purchase-orders/${id}/`, data);
export const deletePurchaseOrder = (id) => api.delete(`/accounting/purchase-orders/${id}/`);

// ─── Delivery Challans ───
export const getDeliveryChallans = (params) =>
  api.get("/accounting/delivery-challans/", { params: buildParams(params) });
export const getDeliveryChallan = (id) => api.get(`/accounting/delivery-challans/${id}/`);
export const createDeliveryChallan = (data) => api.post("/accounting/delivery-challans/", data);
export const updateDeliveryChallan = (id, data) => api.patch(`/accounting/delivery-challans/${id}/`, data);
export const deleteDeliveryChallan = (id) => api.delete(`/accounting/delivery-challans/${id}/`);
export const markChallanDelivered = (id) => api.post(`/accounting/delivery-challans/${id}/mark_delivered/`);

// ─── Sale Returns ───
export const getSaleReturns = (params) =>
  api.get("/accounting/sale-returns/", { params: buildParams(params) });
export const getSaleReturn = (id) => api.get(`/accounting/sale-returns/${id}/`);
export const createSaleReturn = (data) => api.post("/accounting/sale-returns/", data);
export const updateSaleReturn = (id, data) => api.patch(`/accounting/sale-returns/${id}/`, data);
export const deleteSaleReturn = (id) => api.delete(`/accounting/sale-returns/${id}/`);

// ─── Purchase Returns ───
export const getPurchaseReturns = (params) =>
  api.get("/accounting/purchase-returns/", { params: buildParams(params) });
export const getPurchaseReturn = (id) => api.get(`/accounting/purchase-returns/${id}/`);
export const createPurchaseReturn = (data) => api.post("/accounting/purchase-returns/", data);
export const updatePurchaseReturn = (id, data) => api.patch(`/accounting/purchase-returns/${id}/`, data);
export const deletePurchaseReturn = (id) => api.delete(`/accounting/purchase-returns/${id}/`);

// ─── Transactions ───
export const getTransactions = (params) =>
  api.get("/accounting/transactions/", { params: buildParams(params) });
export const createTransaction = (data) => api.post("/accounting/transactions/", data);

// ─── Documents ───
export const getDocuments = (params) =>
  api.get("/accounting/documents/", { params: buildParams(params) });
export const createDocument = (formData) =>
  api.post("/accounting/documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDocument = (id) => api.delete(`/accounting/documents/${id}/`);

// ─── Company Settings ───
export const getCompanySettings = (params) =>
  api.get("/accounting/company-settings/", { params: buildParams(params) });
export const getCompanySetting = (id) => api.get(`/accounting/company-settings/${id}/`);
export const createCompanySetting = (data) => api.post("/accounting/company-settings/", data);
export const updateCompanySetting = (id, data) => api.patch(`/accounting/company-settings/${id}/`, data);
export const deleteCompanySetting = (id) => api.delete(`/accounting/company-settings/${id}/`);

// ─── Bank Reconciliation ───
export const getBankReconciliations = (params) =>
  api.get("/accounting/bank-reconciliations/", { params: buildParams(params) });
export const createBankReconciliation = (data) =>
  api.post("/accounting/bank-reconciliations/", data);
export const updateBankReconciliation = (id, data) =>
  api.patch(`/accounting/bank-reconciliations/${id}/`, data);

// ─── Connect CA / Accountant ───
export const connectCA = (email) => api.post("/accounting/connect-ca/", { email });
export const getConnectedUsers = () => api.get("/accounting/connect-ca/");
export const removeConnectedUser = (id) => api.delete(`/accounting/connect-ca/${id}/`);

// ─── Security ───
export const changePassword = (data) => api.post("/accounts/security/change_password/", data);
export const getActiveSessions = () => api.get("/accounts/security/sessions/");
export const revokeSession = (id) => api.post(`/accounts/security/revoke_session/${id}/`);
export const revokeAllSessions = () => api.post("/accounts/security/revoke_all/");
export const getLoginActivity = () => api.get("/accounts/security/login_activity/");

// ─── Backup / Restore / Import ───
export const exportBackup = () =>
  api.get("/accounting/backup/export/", { responseType: "blob" });
export const restoreBackup = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/accounting/backup/restore/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ─── Split Company ───
export const splitCompany = (splitDate) =>
  api.post("/accounting/company-split/", { split_date: splitDate });

// ─── Ledger (read-only report data) ───
export const getLedgerEntries = (params) =>
  api.get("/accounting/ledger/", { params: buildParams(params) });

// ─── GST Lookup ───
export const lookupGst = (gstin) => api.get(`/accounting/gst/${gstin}/`);

// ─── Reports ───
export const getTrialBalance = (params) =>
  api.get("/accounting/reports/trial-balance/", { params: buildParams(params) });
export const getProfitLoss = (params) =>
  api.get("/accounting/reports/profit-loss/", { params: buildParams(params) });
export const getBalanceSheet = (params) =>
  api.get("/accounting/reports/balance-sheet/", { params: buildParams(params) });
export const getCashFlow = (params) =>
  api.get("/accounting/reports/cash-flow/", { params: buildParams(params) });
export const getCashBankBook = (params) =>
  api.get("/accounting/reports/cash-bank-book/", { params: buildParams(params) });

// ─── Summary Reports ───
export const getSaleSummary = (params) =>
  api.get("/accounting/reports/sale-summary/", { params: buildParams(params) });
export const getPurchaseSummary = (params) =>
  api.get("/accounting/reports/purchase-summary/", { params: buildParams(params) });
export const getSaleReturnSummaryRpt = (params) =>
  api.get("/accounting/reports/sale-return-summary/", { params: buildParams(params) });
export const getPurchaseReturnSummaryRpt = (params) =>
  api.get("/accounting/reports/purchase-return-summary/", { params: buildParams(params) });
export const getSaleOrderSummaryRpt = (params) =>
  api.get("/accounting/reports/sale-order-summary/", { params: buildParams(params) });
export const getDeliveryChallanSummaryRpt = (params) =>
  api.get("/accounting/reports/delivery-challan-summary/", { params: buildParams(params) });
export const getStockSummaryRpt = (params) =>
  api.get("/accounting/reports/stock-summary/", { params: buildParams(params) });
export const getHSNSACRpt = (params) =>
  api.get("/accounting/reports/hsn-sac/", { params: buildParams(params) });
export const getCustomerVendorSummaryRpt = (params) =>
  api.get("/accounting/reports/customer-vendor-summary/", { params: buildParams(params) });

// ─── GST Reports ───
export const getGSTR1 = (params) =>
  api.get("/accounting/reports/gstr1/", { params: buildParams(params) });
export const getGSTR2 = (params) =>
  api.get("/accounting/reports/gstr2/", { params: buildParams(params) });
export const getGSTR3B = (params) =>
  api.get("/accounting/reports/gstr3b/", { params: buildParams(params) });
export const getGSTR7 = (params) =>
  api.get("/accounting/reports/gstr7/", { params: buildParams(params) });

// ─── TDS / TCS Reports ───
export const getTDSReport = (params) =>
  api.get("/accounting/reports/tds/", { params: buildParams(params) });
export const getTCSReport = (params) =>
  api.get("/accounting/reports/tcs/", { params: buildParams(params) });

// ─── Daybook ───
export const getDaybook = (params) =>
  api.get("/accounting/reports/daybook/", { params: buildParams(params) });

// ─── Dashboard ───
export const getDashboardSummary = (params) =>
  api.get("/accounting/dashboard/summary/", { params: buildParams(params) });
