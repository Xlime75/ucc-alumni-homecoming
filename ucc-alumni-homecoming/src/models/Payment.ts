
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IPayment {
  registrationId: Types.ObjectId;
  amount: number;
  paymentMethod: "gcash" | "bank_transfer" | "cash_onsite";
  referenceNumber?: string;
  proofOfPaymentUrl?: string;
  paymentStatus:
    | "pending"
    | "pending_verification"
    | "verified"
    | "rejected"
    | "paid_onsite"
    | "refunded";
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["gcash", "bank_transfer", "cash_onsite"],
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    proofOfPaymentUrl: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "pending_verification",
        "verified",
        "rejected",
        "paid_onsite",
        "refunded",
      ],
      default: "pending",
    },
    verifiedBy: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate payment reference numbers.
PaymentSchema.index(
  { referenceNumber: 1 },
  { unique: true, sparse: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
