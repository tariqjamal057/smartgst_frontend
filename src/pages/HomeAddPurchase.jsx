import React, { useState, useEffect } from "react";
import * as services from "../api/services";
// import "./App.css";s

const HomeAddPurchase = () => {

  const [customersList, setCustomersList] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [companyState, setCompanyState] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, itemsRes, companyRes] = await Promise.all([
          services.getParties({ party_type: "VENDOR" }),
          services.getItems(),
          services.getCompanySettings(),
        ]);
        setCustomersList(customersRes.data.results || customersRes.data);
        setItemsData(itemsRes.data.results || itemsRes.data);
        const companyData = companyRes.data.results || companyRes.data;
        const activeCompany = Array.isArray(companyData) ? companyData[0] : companyData;
        setCompanyState(activeCompany?.state || "");
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ===============================
     TAB + ROW CREATION
  =============================== */

  const createRow = (id = 1) => ({
    id,
    item: "",
    qty: 1,
    unit: "",
    price: 0,
    discount: 0,
    tax: 0,
    amount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
  });

  const createTab = (num) => ({
    id: Date.now() + Math.random(),
    title: `Purchase #${num}`,
    customer: "",
    phone: "",
    invoiceDate: "",
    state: "",
    rows: [createRow(1)],
    roundOff: 0,
  });

  const [tabs, setTabs] = useState([createTab(1)]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [tabCounter, setTabCounter] = useState(1);

  useEffect(() => {
    setActiveTabId(tabs[0].id);
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);

  /* ===============================
     CALCULATION FUNCTION
  =============================== */

  const calculateRow = (row, state) => {
    const subtotal = row.qty * row.price;
    const discountAmt = subtotal * (row.discount / 100);
    const taxable = subtotal - discountAmt;
    const taxAmt = taxable * (row.tax / 100);

    let cgst = 0, sgst = 0, igst = 0;

    if (companyState && state === companyState) {
      cgst = taxAmt / 2;
      sgst = taxAmt / 2;
    } else {
      igst = taxAmt;
    }

    return {
      ...row,
      amount: (taxable + taxAmt).toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2),
    };
  };

  /* ===============================
     HANDLE CUSTOMER
  =============================== */

  const handleCustomer = (name) => {
    const selected = customersList.find(c => c.name === name);

    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? {
          ...tab,
          customer: selected.name,
          phone: selected.phone,
          state: selected.state,
          invoiceDate: new Date().toISOString().split("T")[0],
          rows: tab.rows.map(r => calculateRow(r, selected.state))
        }
        : tab
    ));
  };

  /* ===============================
     HANDLE ITEM SELECT
  =============================== */

  const handleItem = (rowId, name) => {
    const item = itemsData.find(i => i.name === name);

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;

      const updatedRows = tab.rows.map(row => {
        if (row.id !== rowId) return row;

        const updated = {
          ...row,
          item: item.name,
          unit: item.unit,
          price: item.price,
          discount: item.discount,
          tax: item.tax
        };

        return calculateRow(updated, tab.state);
      });

      return { ...tab, rows: updatedRows };
    }));
  };

  /* ===============================
     HANDLE FIELD CHANGE
  =============================== */

  const handleFieldChange = (rowId, field, value) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;

      const updatedRows = tab.rows.map(row => {
        if (row.id !== rowId) return row;

        const updated = { ...row, [field]: Number(value) };
        return calculateRow(updated, tab.state);
      });

      return { ...tab, rows: updatedRows };
    }));
  };

  /* ===============================
     ADD / DELETE ROW
  =============================== */

  const addRow = () => {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === activeTabId
          ? { ...tab, rows: [...tab.rows, createRow(tab.rows.length + 1)] }
          : tab
      )
    );
  };

  const deleteRow = (rowId) => {
    setTabs(prev =>
      prev.map(tab => {
        if (tab.id !== activeTabId) return tab;
        if (tab.rows.length === 1) return tab;

        const filtered = tab.rows
          .filter(r => r.id !== rowId)
          .map((r, i) => ({ ...r, id: i + 1 }));

        return { ...tab, rows: filtered };
      })
    );
  };

  /* ===============================
     TOTALS
  =============================== */

  const subtotal = activeTab?.rows.reduce((s, r) => s + (r.qty * r.price), 0) || 0;
  const totalCGST = activeTab?.rows.reduce((s, r) => s + Number(r.cgst), 0) || 0;
  const totalSGST = activeTab?.rows.reduce((s, r) => s + Number(r.sgst), 0) || 0;
  const totalIGST = activeTab?.rows.reduce((s, r) => s + Number(r.igst), 0) || 0;
  const grandTotal = activeTab?.rows.reduce((s, r) => s + Number(r.amount), 0) || 0;
  const finalTotal = grandTotal + Number(activeTab?.roundOff || 0);

  /* ===============================
     Go on dashboard
  =============================== */

  const handleSave = async () => {
    try {
      const payload = {
        customer_name: activeTab.customer,
        invoice_date: activeTab.invoiceDate,
        invoice_number: activeTab.title.replace("Purchase #", ""),
        state_of_supply: activeTab.state,
        items: activeTab.rows.map(r => ({
          item_name: r.item,
          quantity: r.qty,
          unit: r.unit,
          price: r.price,
          discount_percent: r.discount,
          tax_percent: r.tax,
          amount: r.amount,
        })),
        round_off: activeTab.roundOff,
        grand_total: finalTotal,
      };
      await services.createPurchaseBill(payload);
      alert("Purchase saved successfully!");
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save purchase");
    }
  };

  const goDashboard = () => {
    window.location.href = "/";
  };

  // ✅ Open New Tab (with 1 row)
  const openNewSale = () => {
    const newCount = tabCounter + 1;
    const newTab = createTab(newCount);

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setTabCounter(newCount);
  };

  // ✅ Close Tab (minimum 1 tab)
  const closeTab = (id) => {
    if (tabs.length === 1) return;

    const updatedTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(updatedTabs);

    if (activeTabId === id) {
      setActiveTabId(updatedTabs[0].id);
    }
  };


  return (
    <>

      {/* TOP INFO BAR */}
      <div className="AddSalePurchase_topbar">
        <div>
          <i
            className="fa-solid fa-xmark"
            style={{ cursor: "pointer", marginRight: "10px" }}
            onClick={goDashboard}
          ></i>
          Company · Help · Versions · Shortcuts
        </div>
        <div>
          <a href="#">Request a Callback</a> | +91-1234567891 |
          <a href="#">Get Instant Online Support</a>
        </div>
      </div>



      {/* TAB BAR */}
      <div className="AddSalePurchase_topbar">
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                background: activeTabId === tab.id ? "#fff" : "#ddd",
                borderRadius: "6px 6px 0 0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.title}
              {tabs.length > 1 && (
                <i
                  className="fa-solid fa-xmark"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                ></i>
              )}
            </div>
          ))}

          <i
            className="fa-solid fa-plus"
            style={{ cursor: "pointer", padding: "6px" }}
            onClick={openNewSale}
          ></i>
        </div>
      </div>




      {activeTab && (
        <div className="AddSalePurchase_container">

          <div className="page-title">
            <h2>{activeTab.title}</h2>
            <div className="toggle">
              Credit <input type="checkbox" defaultChecked /> Cash
            </div>
          </div>

          {/* CUSTOMER SECTION */}
          <div className="card">
            <div className="form-grid">
              <div className="input-group">
                <label>Search by Name / Phone *</label>
                <select
                  value={activeTab.customer}
                  onChange={(e) => handleCustomer(e.target.value)}
                >
                  <option value="">Select</option>
                  {customersList.map(c => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Phone No.</label>
                <input value={activeTab.phone} readOnly />
              </div>

              <div className="input-group">
                <label>Invoice No.</label>
                <input value={activeTab.title.replace("Purchase #", "")} readOnly />
              </div>

              <div className="input-group">
                <label>Invoice Date</label>
                <input type="date" value={activeTab.invoiceDate} readOnly />
              </div>

              <div className="input-group">
                <label>State of Supply</label>
                <input value={activeTab.state} readOnly />
              </div>
            </div>
          </div>

          {/* ITEM TABLE */}
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Price / Unit</th>
                  <th>Discount %</th>
                  <th>Tax %</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {activeTab.rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.id}</td>

                    <td>
                      <select
                        value={row.item}
                        onChange={(e) => handleItem(row.id, e.target.value)}
                      >
                        <option value="">Select</option>
                        {itemsData.map(item => (
                          <option key={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => handleFieldChange(row.id, "qty", e.target.value)}
                      />
                    </td>

                    <td><input value={row.unit} readOnly /></td>

                    <td>
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) => handleFieldChange(row.id, "price", e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        value={row.discount}
                        onChange={(e) => handleFieldChange(row.id, "discount", e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        value={row.tax}
                        onChange={(e) => handleFieldChange(row.id, "tax", e.target.value)}
                      />
                    </td>

                    <td>{row.amount}</td>

                    <td>
                      <i
                        className="fa-solid fa-trash row-delete"
                        onClick={() => deleteRow(row.id)}
                      ></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="add-row" onClick={addRow}>
              ADD ROW
            </button>
          </div>

          {/* FOOTER TOTAL */}
          <div className="footer">
            <div>Subtotal: ₹ {subtotal.toFixed(2)}</div>
            <div>CGST: ₹ {totalCGST.toFixed(2)}</div>
            <div>SGST: ₹ {totalSGST.toFixed(2)}</div>
            <div>IGST: ₹ {totalIGST.toFixed(2)}</div>

            <div>
              Round Off:
              <input
                type="number"
                value={activeTab.roundOff}
                onChange={(e) =>
                  setTabs(prev =>
                    prev.map(tab =>
                      tab.id === activeTabId
                        ? { ...tab, roundOff: Number(e.target.value) }
                        : tab
                    )
                  )
                }
              />
            </div>

            <div><strong>Grand Total: ₹ {finalTotal.toFixed(2)}</strong></div>

            <div>
              <button className="btn">Share</button>
              <button className="btn primary" onClick={handleSave}>Save</button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default HomeAddPurchase;
