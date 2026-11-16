
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IAttendance {
  registrationId: Types.ObjectId;
  attendeeId: Types.ObjectId;
  attendeeName: string;
  attendeeType: "alumni" | "former_teacher" | "former_staff" | "companion" | "former_principal";
  checkInMethod: "qr_code" | "manual";
  checkedInBy?: string;
  checkedInAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      index: true,
    },
    attendeeId: {
      type: Schema.Types.ObjectId,
      ref: "Attendee",
      required: true,
      unique: true,
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true,
    },
    attendeeType: {
      type: String,
      enum: ["alumni", "former_teacher", "former_staff", "companion", "former_principal"],
      required: true,
    },
    checkInMethod: {
      type: String,
      enum: ["qr_code", "manual"],
      required: true,
    },
    checkedInBy: {
      type: String,
      trim: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
