import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useSIWE } from '../SIWE/SIWEProvider';
import {
  UserSubscription,
  Payment,
  Invoice,
  UsageMetrics,
  SubscriptionStatus,
  SubscriptionTier,
} from './types';
import { PAYMENT_ENDPOINTS } from './constants';

/**
 * Payments Hook
 * Provides subscription and payment management functionality
 */

interface UsePaymentsProps {
  apiUrl: string;
}

interface UsePaymentsReturn {
  // Subscription state
  subscription: UserSubscription | null;
  isLoadingSubscription: boolean;
  subscriptionError: string | null;

  // Payment history
  payments: Payment[];
  isLoadingPayments: boolean;
  paymentsError: string | null;

  // Invoices
  invoices: Invoice[];
  isLoadingInvoices: boolean;
  invoicesError: string | null;

  // Usage metrics
  usage: UsageMetrics | null;
  isLoadingUsage: boolean;
  usageError: string | null;

  // Actions
  fetchSubscription: () => Promise<void>;
  fetchPayments: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchUsage: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  upgradeSubscription: (newTier: SubscriptionTier) => Promise<void>;
  downgradeSubscription: (newTier: SubscriptionTier) => Promise<void>;
}

export const usePayments = ({ apiUrl }: UsePaymentsProps): UsePaymentsReturn => {
  const { isAuthenticated, accessToken, user } = useSIWE();

  // State
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  // API client
  const apiClient: AxiosInstance = axios.create({
    baseURL: apiUrl,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  /**
   * Fetch current subscription
   */
  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoadingSubscription(true);
      setSubscriptionError(null);

      const response = await apiClient.get(PAYMENT_ENDPOINTS.GET_SUBSCRIPTION);
      setSubscription(response.data.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch subscription';
      setSubscriptionError(errorMessage);
      console.error('Fetch subscription error:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [isAuthenticated, user, apiClient]);

  /**
   * Fetch payment history
   */
  const fetchPayments = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoadingPayments(true);
      setPaymentsError(null);

      const response = await apiClient.get('/api/v1/payments/history');
      setPayments(response.data.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch payments';
      setPaymentsError(errorMessage);
      console.error('Fetch payments error:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [isAuthenticated, user, apiClient]);

  /**
   * Fetch invoices
   */
  const fetchInvoices = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoadingInvoices(true);
      setInvoicesError(null);

      const response = await apiClient.get(PAYMENT_ENDPOINTS.GET_INVOICES);
      setInvoices(response.data.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch invoices';
      setInvoicesError(errorMessage);
      console.error('Fetch invoices error:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [isAuthenticated, user, apiClient]);

  /**
   * Fetch usage metrics
   */
  const fetchUsage = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoadingUsage(true);
      setUsageError(null);

      const response = await apiClient.get(PAYMENT_ENDPOINTS.GET_USAGE);
      setUsage(response.data.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch usage';
      setUsageError(errorMessage);
      console.error('Fetch usage error:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  }, [isAuthenticated, user, apiClient]);

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async () => {
    if (!isAuthenticated || !subscription) return;

    try {
      setIsLoadingSubscription(true);
      setSubscriptionError(null);

      await apiClient.post(PAYMENT_ENDPOINTS.CANCEL_SUBSCRIPTION);

      // Refresh subscription data
      await fetchSubscription();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to cancel subscription';
      setSubscriptionError(errorMessage);
      console.error('Cancel subscription error:', error);
      throw error;
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [isAuthenticated, subscription, apiClient, fetchSubscription]);

  /**
   * Resume subscription
   */
  const resumeSubscription = useCallback(async () => {
    if (!isAuthenticated || !subscription) return;

    try {
      setIsLoadingSubscription(true);
      setSubscriptionError(null);

      await apiClient.post(PAYMENT_ENDPOINTS.RESUME_SUBSCRIPTION);

      // Refresh subscription data
      await fetchSubscription();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to resume subscription';
      setSubscriptionError(errorMessage);
      console.error('Resume subscription error:', error);
      throw error;
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [isAuthenticated, subscription, apiClient, fetchSubscription]);

  /**
   * Upgrade subscription
   */
  const upgradeSubscription = useCallback(async (newTier: SubscriptionTier) => {
    if (!isAuthenticated || !subscription) return;

    try {
      setIsLoadingSubscription(true);
      setSubscriptionError(null);

      await apiClient.post(PAYMENT_ENDPOINTS.UPGRADE_SUBSCRIPTION, {
        newTier,
      });

      // Refresh subscription data
      await fetchSubscription();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to upgrade subscription';
      setSubscriptionError(errorMessage);
      console.error('Upgrade subscription error:', error);
      throw error;
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [isAuthenticated, subscription, apiClient, fetchSubscription]);

  /**
   * Downgrade subscription
   */
  const downgradeSubscription = useCallback(async (newTier: SubscriptionTier) => {
    if (!isAuthenticated || !subscription) return;

    try {
      setIsLoadingSubscription(true);
      setSubscriptionError(null);

      await apiClient.post(PAYMENT_ENDPOINTS.DOWNGRADE_SUBSCRIPTION, {
        newTier,
      });

      // Refresh subscription data
      await fetchSubscription();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to downgrade subscription';
      setSubscriptionError(errorMessage);
      console.error('Downgrade subscription error:', error);
      throw error;
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [isAuthenticated, subscription, apiClient, fetchSubscription]);

  // Auto-fetch subscription on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSubscription();
      fetchUsage();
    }
  }, [isAuthenticated, user, fetchSubscription, fetchUsage]);

  return {
    // Subscription state
    subscription,
    isLoadingSubscription,
    subscriptionError,

    // Payment history
    payments,
    isLoadingPayments,
    paymentsError,

    // Invoices
    invoices,
    isLoadingInvoices,
    invoicesError,

    // Usage metrics
    usage,
    isLoadingUsage,
    usageError,

    // Actions
    fetchSubscription,
    fetchPayments,
    fetchInvoices,
    fetchUsage,
    cancelSubscription,
    resumeSubscription,
    upgradeSubscription,
    downgradeSubscription,
  };
};

export default usePayments;
