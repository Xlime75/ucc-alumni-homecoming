
import mongoose, { Schema, Model } from "mongoose";

export interface IEvent {
  eventName: string;
  formerName: string;
  date: Date;
  venue: string;
  theme: string;
  motto: string;
  feePerPerson: number;
  registrationOpen: boolean;
  checkInEnabled: boolean;
  registrationFormUrl?: string;

  // Payment account details
  gcashAccountName?: string;
  gcashAccountNumber?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}

const EventSchema = new Schema<IEvent>(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    formerName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    theme: {
      type: String,
      required: true,
      trim: true,
    },
    motto: {
      type: String,
      required: true,
      trim: true,
    },
    feePerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    registrationOpen: {
      type: Boolean,
      default: false,
    },
    checkInEnabled: {
      type: Boolean,
      default: false,
    },
    registrationFormUrl: {
      type: String,
      trim: true,
    },

    // GCash details
    gcashAccountName: {
      type: String,
      trim: true,
      default: "",
    },
    gcashAccountNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Bank transfer details
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    bankAccountName: {
      type: String,
      trim: true,
      default: "",
    },
    bankAccountNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Event: Model<IEvent> =
  mongoose.models.Event ||
  mongoose.model<IEvent>("Event", EventSchema);

export default Event;
