export interface OrderCancelledPayload {
  customerEmail: string;
  orderCode: string;
  reason: string;
}

export interface ExpressRescheduledPayload {
  customerEmail: string;
  orderCode: string;
  discountCop: number;
  newShippingFee: number;
  newTotal: number;
  reason?: string;
}

export interface NotificationPort {
  notifyOrderCancelled(payload: OrderCancelledPayload): Promise<void>;
  notifyExpressRescheduled(payload: ExpressRescheduledPayload): Promise<void>;
  notifyExpressDowngraded(payload: {
    customerEmail: string;
    orderCode: string;
    newTotal: number;
    discountCop?: number;
    newShippingFee?: number;
  }): Promise<void>;
}
