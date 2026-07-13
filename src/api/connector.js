import api from "./axios";

export async function loadData(serviceFn, params, setState, setLoading, setError) {
  setLoading?.(true);
  setError?.(null);
  try {
    const res = await serviceFn(params);
    setState?.(res.data?.results || res.data || []);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    setError?.(msg);
    console.error("API Error:", msg);
  } finally {
    setLoading?.(false);
  }
}

export async function saveData(serviceFn, payload, onSuccess, onError) {
  try {
    const res = await serviceFn(payload);
    onSuccess?.(res.data);
    return res.data;
  } catch (err) {
    const msg = err.response?.data || err.message;
    onError?.(msg);
    console.error("Save Error:", msg);
    throw err;
  }
}

export async function deleteData(serviceFn, id, onSuccess, onError) {
  try {
    await serviceFn(id);
    onSuccess?.(id);
  } catch (err) {
    const msg = err.response?.data || err.message;
    onError?.(msg);
    console.error("Delete Error:", msg);
    throw err;
  }
}
