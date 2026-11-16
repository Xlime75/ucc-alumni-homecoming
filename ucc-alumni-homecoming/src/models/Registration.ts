
import mongoose, { Schema, Model } from "mongoose";

export interface IRegistration {
  registrationNumber: string;
  primaryRegistrant: {
    attendeeType: "alumni" | "former_teacher" | "former_staff" | "former_principal";
    fullName: string;
    nickname: string;
    batchYear: string;
    schoolLevel:
      | "college"
      | "high_school"
      | "junior_high_school"
      | "senior_high_school"
      | "elementary"
      | "kinder";
    birthday: Date;
    currentAddress: string;
    email: string;
    contactNumber: string;
    facebookProfile: string;
    work: string;
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
      nickname: {
        type: String,
        required: true,
        trim: true,
      },
      batchYear: {
        type: String,
        required: true,
        trim: true,
      },
      schoolLevel: {
        type: String,
        enum: [
          "college",
          "high_school",
          "junior_high_school",
          "senior_high_school",
          "elementary",
          "kinder",
        ],
        required: true,
      },
      birthday: {
        type: Date,
        required: true,
      },
      currentAddress: {
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
      facebookProfile: {
        type: String,
        required: true,
        trim: true,
      },
      work: {
        type: String,
        required: true,
        trim: true,
      },
      attendeeType: {
        type: String,
        enum: ["alumni", "former_teacher", "former_staff", "former_principal"],
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

RegistrationSchema.index(
  { "primaryRegistrant.email": 1 },
  {
    unique: true,
    partialFilterExpression: {
      registrationStatus: { 
        $in: ["pending", "confirmed"] },
    },
  }
);

const Registration: Model<IRegistration> =

  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;
