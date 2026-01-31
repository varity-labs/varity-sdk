import { Request, Response } from 'express';
import { logger } from '../config/logger.config';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Payment Webhook Handler
 * Handles payment events from blockchain and Thirdweb
 */

export enum PaymentEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  SUBSCRIPTION_RENEWED = 'subscription.renewed',
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',
}

interface PaymentWebhookPayload {
  event: PaymentEventType;
  timestamp: number;
  data: {
    userId?: string;
    walletAddress: string;
    subscriptionId?: string;
    paymentId?: string;
    transactionHash?: string;
    amount?: number;
    currency?: string;
    status?: string;
    planId?: string;
    tier?: string;
  };
  signature?: string;
}

/**
 * Payment Webhook Controller
 */
export class PaymentWebhookController {
  /**
   * Handle payment webhook events
   * POST /api/v1/webhooks/payments
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const payload: PaymentWebhookPayload = req.body;

    // Verify webhook signature
    const isValid = this.verifyWebhookSignature(req);
    if (!isValid) {
      logger.warn('Invalid webhook signature received');
      res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
      });
      return;
    }

    logger.info(`Processing payment webhook: ${payload.event}`, {
      event: payload.event,
      walletAddress: payload.data.walletAddress,
    });

    // Route to appropriate handler
    try {
      switch (payload.event) {
        case PaymentEventType.PAYMENT_COMPLETED:
          await this.handlePaymentCompleted(payload);
          break;

        case PaymentEventType.PAYMENT_FAILED:
          await this.handlePaymentFailed(payload);
          break;

        case PaymentEventType.SUBSCRIPTION_CREATED:
          await this.handleSubscriptionCreated(payload);
          break;

        case PaymentEventType.SUBSCRIPTION_UPDATED:
          await this.handleSubscriptionUpdated(payload);
          break;

        case PaymentEventType.SUBSCRIPTION_CANCELED:
          await this.handleSubscriptionCanceled(payload);
          break;

        case PaymentEventType.SUBSCRIPTION_RENEWED:
          await this.handleSubscriptionRenewed(payload);
          break;

        case PaymentEventType.INVOICE_CREATED:
          await this.handleInvoiceCreated(payload);
          break;

        case PaymentEventType.INVOICE_PAID:
          await this.handleInvoicePaid(payload);
          break;

        default:
          logger.warn(`Unknown webhook event: ${payload.event}`);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      logger.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
      });
    }
  });

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(req: Request): boolean {
    // TODO: Implement signature verification using Thirdweb webhook secret
    // For now, return true for development
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    if (!signature || !timestamp) {
      logger.warn('Missing webhook signature or timestamp');
      return false;
    }

    // TODO: Verify signature using HMAC-SHA256
    // const expectedSignature = crypto
    //   .createHmac('sha256', WEBHOOK_SECRET)
    //   .update(`${timestamp}.${JSON.stringify(req.body)}`)
    //   .digest('hex');
    //
    // return signature === expectedSignature;

    return true; // Development mode
  }

  /**
   * Handle payment completed event
   */
  private async handlePaymentCompleted(payload: PaymentWebhookPayload): Promise<void> {
    const { walletAddress, transactionHash, amount, subscriptionId } = payload.data;

    logger.info('Payment completed', {
      walletAddress,
      transactionHash,
      amount,
      subscriptionId,
    });

    // TODO: Database operations
    // 1. Update payment record status to 'completed'
    // 2. Update subscription status to 'active'
    // 3. Send confirmation email
    // 4. Generate invoice

    // Example:
    // await db.payment.update({
    //   where: { transactionHash },
    //   data: {
    //     status: 'completed',
    //     completedAt: new Date(),
    //   },
    // });
    //
    // if (subscriptionId) {
    //   await db.subscription.update({
    //     where: { id: subscriptionId },
    //     data: {
    //       status: 'active',
    //       currentPeriodStart: new Date(),
    //       currentPeriodEnd: addMonths(new Date(), 1),
    //     },
    //   });
    // }
    //
    // await emailService.sendPaymentConfirmation(walletAddress, amount);
    // await invoiceService.generateInvoice(subscriptionId);
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(payload: PaymentWebhookPayload): Promise<void> {
    const { walletAddress, transactionHash, amount } = payload.data;

    logger.error('Payment failed', {
      walletAddress,
      transactionHash,
      amount,
    });

    // TODO: Database operations
    // 1. Update payment record status to 'failed'
    // 2. Send failure notification email
    // 3. Retry payment if applicable

    // Example:
    // await db.payment.update({
    //   where: { transactionHash },
    //   data: {
    //     status: 'failed',
    //     failedAt: new Date(),
    //     failureReason: 'Transaction failed on blockchain',
    //   },
    // });
    //
    // await emailService.sendPaymentFailureNotification(walletAddress);
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(payload: PaymentWebhookPayload): Promise<void> {
    const { walletAddress, subscriptionId, planId, tier } = payload.data;

    logger.info('Subscription created', {
      walletAddress,
      subscriptionId,
      planId,
      tier,
    });

    // TODO: Database operations
    // 1. Create subscription record
    // 2. Send welcome email
    // 3. Provision dashboard resources

    // Example:
    // await db.subscription.create({
    //   data: {
    //     id: subscriptionId,
    //     walletAddress,
    //     planId,
    //     tier,
    //     status: 'active',
    //     currentPeriodStart: new Date(),
    //     currentPeriodEnd: addMonths(new Date(), 1),
    //   },
    // });
    //
    // await emailService.sendWelcomeEmail(walletAddress, tier);
    // await dashboardService.provisionResources(walletAddress, tier);
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(payload: PaymentWebhookPayload): Promise<void> {
    const { subscriptionId, tier } = payload.data;

    logger.info('Subscription updated', {
      subscriptionId,
      tier,
    });

    // TODO: Database operations
    // 1. Update subscription record
    // 2. Adjust resource limits
    // 3. Send update confirmation email

    // Example:
    // await db.subscription.update({
    //   where: { id: subscriptionId },
    //   data: {
    //     tier,
    //     updatedAt: new Date(),
    //   },
    // });
    //
    // await dashboardService.updateResourceLimits(subscriptionId, tier);
  }

  /**
   * Handle subscription canceled event
   */
  private async handleSubscriptionCanceled(payload: PaymentWebhookPayload): Promise<void> {
    const { subscriptionId, walletAddress } = payload.data;

    logger.info('Subscription canceled', {
      subscriptionId,
      walletAddress,
    });

    // TODO: Database operations
    // 1. Update subscription status to 'canceled'
    // 2. Schedule resource cleanup at period end
    // 3. Send cancellation confirmation email

    // Example:
    // await db.subscription.update({
    //   where: { id: subscriptionId },
    //   data: {
    //     status: 'canceled',
    //     cancelAtPeriodEnd: true,
    //     canceledAt: new Date(),
    //   },
    // });
    //
    // await emailService.sendCancellationConfirmation(walletAddress);
  }

  /**
   * Handle subscription renewed event
   */
  private async handleSubscriptionRenewed(payload: PaymentWebhookPayload): Promise<void> {
    const { subscriptionId, amount } = payload.data;

    logger.info('Subscription renewed', {
      subscriptionId,
      amount,
    });

    // TODO: Database operations
    // 1. Extend subscription period
    // 2. Create new invoice
    // 3. Process payment

    // Example:
    // await db.subscription.update({
    //   where: { id: subscriptionId },
    //   data: {
    //     currentPeriodStart: new Date(),
    //     currentPeriodEnd: addMonths(new Date(), 1),
    //   },
    // });
    //
    // await invoiceService.generateInvoice(subscriptionId);
  }

  /**
   * Handle invoice created event
   */
  private async handleInvoiceCreated(payload: PaymentWebhookPayload): Promise<void> {
    const { subscriptionId, amount } = payload.data;

    logger.info('Invoice created', {
      subscriptionId,
      amount,
    });

    // TODO: Database operations
    // 1. Create invoice record
    // 2. Send invoice email

    // Example:
    // const invoice = await db.invoice.create({
    //   data: {
    //     subscriptionId,
    //     amount,
    //     status: 'open',
    //     invoiceDate: new Date(),
    //     dueDate: addDays(new Date(), 7),
    //   },
    // });
    //
    // await emailService.sendInvoice(subscriptionId, invoice);
  }

  /**
   * Handle invoice paid event
   */
  private async handleInvoicePaid(payload: PaymentWebhookPayload): Promise<void> {
    const { subscriptionId, transactionHash } = payload.data;

    logger.info('Invoice paid', {
      subscriptionId,
      transactionHash,
    });

    // TODO: Database operations
    // 1. Update invoice status to 'paid'
    // 2. Send receipt email

    // Example:
    // await db.invoice.update({
    //   where: { subscriptionId },
    //   data: {
    //     status: 'paid',
    //     paidDate: new Date(),
    //   },
    // });
    //
    // await emailService.sendReceipt(subscriptionId, transactionHash);
  }
}

export const paymentWebhookController = new PaymentWebhookController();
export default paymentWebhookController;
