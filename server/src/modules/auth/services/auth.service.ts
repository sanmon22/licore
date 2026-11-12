import { db } from "../../../db/index.js";
import { users, customers, branches } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, AuthUser } from "../../../middlewares/auth.middleware.js";
import { LoginInput, RegisterCustomerInput } from "../domain/auth.types.js";

export class AuthService {
  async login(input: LoginInput) {
    const user = (await db.select().from(users).where(eq(users.email, input.email)))[0];
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    let customerId: number | undefined;
    let customerType: "RETAIL" | "INDUSTRIAL" | undefined;

    if (user.role === "CUSTOMER") {
      const customer = (await db.select().from(customers).where(eq(customers.userId, user.id)))[0];
      if (customer) {
        customerId = customer.id;
        customerType = customer.customerType;
      }
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId,
      customerType,
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: "7d" });

    return {
      token,
      user: authUser,
    };
  }

  async registerCustomer(input: RegisterCustomerInput) {
    const existing = (await db.select().from(users).where(eq(users.email, input.email)))[0];
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(input.password, 10);

    const [newUser] = await db.insert(users).values({
      email: input.email,
      name: input.name,
      passwordHash,
      role: "CUSTOMER",
      createdAt: now,
    }).returning();

    const [newCustomer] = await db.insert(customers).values({
      userId: newUser.id,
      businessName: input.businessName,
      taxId: input.taxId,
      customerType: input.customerType,
      phone: input.phone || null,
      createdAt: now,
    }).returning();

    await db.insert(branches).values({
      customerId: newCustomer.id,
      name: input.branchName,
      address: input.branchAddress,
      city: input.branchCity,
      phone: input.phone || null,
      createdAt: now,
    });

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: "CUSTOMER",
      customerId: newCustomer.id,
      customerType: newCustomer.customerType,
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: "7d" });

    return {
      token,
      user: authUser,
    };
  }

  async getProfile(userId: number) {
    const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
    if (!user) {
      throw new Error("User not found");
    }

    let customerDetails = null;
    let customerBranches: any[] = [];

    if (user.role === "CUSTOMER") {
      const customer = (await db.select().from(customers).where(eq(customers.userId, user.id)))[0];
      if (customer) {
        customerDetails = customer;
        customerBranches = await db.select().from(branches).where(eq(branches.customerId, customer.id));
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customer: customerDetails,
      branches: customerBranches,
    };
  }
}
