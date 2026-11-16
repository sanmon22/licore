import { db } from "../../../db/index.js";
import { customers, deliveryPlaces, users, Customer, DeliveryPlace, User } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { CreateDeliveryPlaceInput } from "../domain/customer.types.js";

export class CustomerService {
  async getDeliveryPlaces(customerId: number) {
    return db.select().from(deliveryPlaces).where(eq(deliveryPlaces.customerId, customerId));
  }

  // Alias for backward compatibility
  async getBranches(customerId: number) {
    return this.getDeliveryPlaces(customerId);
  }

  async addDeliveryPlace(customerId: number, input: CreateDeliveryPlaceInput) {
    const now = new Date().toISOString();
    const [newPlace] = await db
      .insert(deliveryPlaces)
      .values({
        customerId,
        name: input.name,
        address: input.address,
        city: input.city,
        phone: input.phone || null,
        createdAt: now,
      })
      .returning();

    return newPlace;
  }

  // Alias for backward compatibility
  async addBranch(customerId: number, input: CreateDeliveryPlaceInput) {
    return this.addDeliveryPlace(customerId, input);
  }

  async getAllCustomers() {
    const allCustomers = await db.select().from(customers);
    const allDeliveryPlaces = await db.select().from(deliveryPlaces);
    const allUsers = await db.select().from(users);

    return allCustomers.map((cust: Customer) => {
      const user = allUsers.find((u: User) => u.id === cust.userId);
      const custDeliveryPlaces = allDeliveryPlaces.filter((d: DeliveryPlace) => d.customerId === cust.id);

      return {
        ...cust,
        userEmail: user?.email,
        userName: user?.name,
        deliveryPlaces: custDeliveryPlaces,
        branches: custDeliveryPlaces,
      };
    });
  }
}
