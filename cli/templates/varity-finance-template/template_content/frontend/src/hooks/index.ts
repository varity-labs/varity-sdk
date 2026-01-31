/**
 * Finance Template React Hooks
 * Auto-generated custom hooks for {{ company_name }}
 */

import { useState, useEffect, useCallback } from 'react';
import { complianceAPI, kycAPI, fraudAPI, riskAPI } from '../api/client';

// Compliance Hook
export const useCompliance = (filter: any) => {
  const [reports, setReports] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [amlAlerts, setAmlAlerts] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsRes, metricsRes, alertsRes, statusRes] = await Promise.all([
        complianceAPI.getReports(filter),
        complianceAPI.getMetrics(filter),
        complianceAPI.getAMLAlerts(),
        complianceAPI.getKYCStatus()
      ]);

      if (reportsRes.success) setReports(reportsRes.data);
      if (metricsRes.success) setMetrics(metricsRes.data);
      if (alertsRes.success) setAmlAlerts(alertsRes.data);
      if (statusRes.success) setKycStatus(statusRes.data);

      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { reports, metrics, amlAlerts, kycStatus, loading, error };
};

// KYC Hook
export const useKYC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [appsRes, metricsRes] = await Promise.all([
        kycAPI.getApplications(),
        kycAPI.getMetrics()
      ]);

      if (appsRes.success) setApplications(appsRes.data);
      if (metricsRes.success) setMetrics(metricsRes.data);

      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitDocument = async (applicationId: string, files: File[]) => {
    return kycAPI.submitDocument(applicationId, files);
  };

  const approveApplication = async (applicationId: string) => {
    const result = await kycAPI.approveApplication(applicationId);
    if (result.success) fetchData();
    return result;
  };

  const rejectApplication = async (applicationId: string) => {
    const result = await kycAPI.rejectApplication(applicationId);
    if (result.success) fetchData();
    return result;
  };

  return {
    applications,
    metrics,
    loading,
    error,
    submitDocument,
    approveApplication,
    rejectApplication
  };
};

// Fraud Detection Hook
export const useFraudDetection = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [alertsRes, metricsRes, patternsRes] = await Promise.all([
        fraudAPI.getAlerts(),
        fraudAPI.getMetrics(),
        fraudAPI.getPatterns()
      ]);

      if (alertsRes.success) setAlerts(alertsRes.data);
      if (metricsRes.success) setMetrics(metricsRes.data);
      if (patternsRes.success) setPatterns(patternsRes.data);

      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const investigateAlert = async (alertId: string) => {
    const result = await fraudAPI.investigateAlert(alertId);
    if (result.success) fetchData();
    return result;
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    const result = await fraudAPI.resolveAlert(alertId, resolution);
    if (result.success) fetchData();
    return result;
  };

  return {
    alerts,
    metrics,
    patterns,
    loading,
    error,
    investigateAlert,
    resolveAlert
  };
};

// Risk Metrics Hook
export const useRiskMetrics = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [stressTests, setStressTests] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsRes, portfolioRes, stressRes, forecastRes] = await Promise.all([
        riskAPI.getMetrics(),
        riskAPI.getPortfolio(),
        riskAPI.getStressTests(),
        riskAPI.getForecast()
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (portfolioRes.success) setPortfolio(portfolioRes.data);
      if (stressRes.success) setStressTests(stressRes.data);
      if (forecastRes.success) setForecast(forecastRes.data);

      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    metrics,
    portfolio,
    stressTests,
    forecast,
    loading,
    error
  };
};

export { useTransactions } from './useTransactions';
