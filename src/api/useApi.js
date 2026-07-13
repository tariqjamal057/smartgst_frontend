import { useState, useEffect, useCallback } from "react";
import * as services from "./services";

export function useApi(serviceFn, params) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceFn(params);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceFn, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, setData };
}

export function useCreate(serviceFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceFn(payload);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdate(serviceFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceFn(id, payload);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

export function useDelete(serviceFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const del = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await serviceFn(id);
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { delete: del, loading, error };
}
