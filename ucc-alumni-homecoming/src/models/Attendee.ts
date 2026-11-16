
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IAttendee {
  registrationId: Types.ObjectId;
  fullName: string;
  email?: string;
  attendeeType: "alumni" | "former_teacher" | "former_staff" | "companion";
  isPrimaryRegistrant: boolean;
  attendanceStatus: "not_checked_in" | "checked_in";
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    attendeeType: {
      type: String,
      enum: ["alumni", "former_teacher", "former_staff", "companion"],
      required: true,
    },
    isPrimaryRegistrant: {
      type: Boolean,
      default: false,
    },
    attendanceStatus: {
      type: String,
      enum: ["not_checked_in", "checked_in"],
      default: "not_checked_in",
    },
  },
  {
    timestamps: true,
  }
);

AttendeeSchema.index(
  { registrationId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

const Attendee: Model<IAttendee> =
  mongoose.models.Attendee ||
  mongoose.model<IAttendee>("Attendee", AttendeeSchema);

export default Attendee;
