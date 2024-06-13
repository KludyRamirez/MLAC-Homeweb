const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const schedulesSchema = new mongoose.Schema(
  {
    student: {
      type: ObjectId,
      ref: "Students",
    },

    scheduleId: {
      type: String,
      trim: true,
    },

    nameOfStudent: {
      type: String,
      trim: true,
    },

    isActive: {
      type: String,
      default: "No information yet",
      enum: ["No information yet", "Present", "Absent"],
    },

    isVideoOn: {
      type: Boolean,
      default: false,
    },

    schedType: {
      type: String,
      default: "Permanent",
    },

    studentType: {
      type: String,
      enum: ["Solo", "Dyad"],
    },

    parent: {
      type: String,
      trim: true,
    },

    timing: {
      type: String,
      enum: [
        "8:00 AM - 9:00 AM",
        "9:00 AM - 10:00 AM",
        "10:00 AM - 11:00 AM",
        "11:00 AM - 12:00 NN",
        "12:00 NN - 1:00 PM",
        "1:00 PM - 2:00 PM",
        "2:00 PM - 3:00 PM",
        "3:00 PM - 4:00 PM",
        "4:00 PM - 5:00 PM",
      ],
    },

    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },

    isWaitlisted: {
      type: String,
      default: "No",
      enum: ["Yes", "No"],
    },

    absencesCounter: {
      type: Number,
      default: 0,
    },

    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

schedulesSchema.index(
  { nameOfStudent: 1, day: 1, timing: 1 },
  { unique: true }
);
module.exports = mongoose.model("Schedules", schedulesSchema);
