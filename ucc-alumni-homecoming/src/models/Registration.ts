
import mongoose, { Schema, Model } from "mongoose";

export interface IRegistration {
  registrationNumber: string;
  primaryRegistrant: { 
    attendeeType: "alumni" | "former_teacher" | "former_staff";
    fullName: string;
    email: string;
    contactNumber: string;
  };
  totalAttendees: number;
  feePerPerson: number;
  totalAmount: number;
  registrationStatus: "pending" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "partial" | "paid" | "overpaid" | "refunded";
  googleFormResponseId?: string;
  registeredAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    primaryRegistrant: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      contactNumber: {
        type: String,
        required: true,
        trim: true,
      },
      attendeeType: {
        type: String,
        enum: ["alumni", "former_teacher", "former_staff"],
        required: true,
      },
    },
    totalAttendees: {
      type: Number,
      required: true,
      min: 1,
    },
    feePerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    registrationStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "overpaid", "refunded"],
      default: "pending",
    },
    googleFormResponseId: {
      type: String,
      unique: true,
      sparse: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;
