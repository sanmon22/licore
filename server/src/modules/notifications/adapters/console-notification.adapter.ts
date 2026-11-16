import {
  NotificationPort,
  OrderCancelledPayload,
  ExpressRescheduledPayload,
} from "../domain/notification.port.js";

export class ConsoleNotificationAdapter implements NotificationPort {
  async notifyOrderCancelled(payload: OrderCancelledPayload): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [NOTIFICATION] [ORDER_CANCELLED] ` +
        `Recipient: ${payload.customerEmail} | ` +
        `Order: ${payload.orderCode} | ` +
        `Reason: ${payload.reason}`
    );
  }

  async notifyExpressRescheduled(payload: ExpressRescheduledPayload): Promise<void> {
    const timestamp = new Date().toISOString();
    const reasonText = payload.reason ? ` (${payload.reason})` : "";
    console.log(
      `[${timestamp}] [NOTIFICATION] [EXPRESS_RESCHEDULED] ` +
        `Recipient: ${payload.customerEmail} | ` +
        `Order: ${payload.orderCode} | ` +
        `Discount Applied: -$${payload.discountCop} COP | ` +
        `New Shipping Fee: $${payload.newShippingFee} COP | ` +
        `New Total: $${payload.newTotal} COP | ` +
        `Notice: Tu pedido ${payload.orderCode} no pudo ser despachado de forma inmediata esta noche por saturación de flota${reasonText}. ` +
        `Ha sido reprogramado como primera prioridad en la ruta de despacho de mañana a primera hora con un descuento de compensación de $${payload.discountCop} COP.`
    );
  }

  async notifyExpressDowngraded(payload: {
    customerEmail: string;
    orderCode: string;
    newTotal: number;
    discountCop?: number;
    newShippingFee?: number;
  }): Promise<void> {
    return this.notifyExpressRescheduled({
      customerEmail: payload.customerEmail,
      orderCode: payload.orderCode,
      discountCop: payload.discountCop ?? 10000,
      newShippingFee: payload.newShippingFee ?? 25000,
      newTotal: payload.newTotal,
      reason: "Saturación de flota nocturna",
    });
  }
}

export const consoleNotificationAdapter = new ConsoleNotificationAdapter();
