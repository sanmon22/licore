import { db } from "../../../db/index.js";
import { customers, branches, users, Customer, Branch, User } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { CreateBranchInput } from "../domain/customer.types.js";

export class CustomerService {
  async getBranches(customerId: number) {
    return db.select().from(branches).where(eq(branches.customerId, customerId));
  }

  async addBranch(customerId: number, input: CreateBranchInput) {
    const now = new Date().toISOString();
    const [newBranch] = await db
      .insert(branches)
      .values({
        customerId,
        name: input.name,
        address: input.address,
        city: input.city,
        phone: input.phone || null,
        createdAt: now,
      })
      .returning();

    return newBranch;
  }

  async getAllCustomers() {
    const allCustomers = await db.select().from(customers);
    const allBranches = await db.select().from(branches);
    const allUsers = await db.select().from(users);

    return allCustomers.map((cust: Customer) => {
      const user = allUsers.find((u: User) => u.id === cust.userId);
      const custBranches = allBranches.filter((b: Branch) => b.customerId === cust.id);

      return {
        ...cust,
        userEmail: user?.email,
        userName: user?.name,
        branches: custBranches,
      };
    });
  }
}
