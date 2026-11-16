
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
  },
  {
    timestamps: true,
  }
);

const Event: Model<IEvent> =
  mongoose.models.Event ||
  mongoose.model<IEvent>("Event", EventSchema);

export default Event;
