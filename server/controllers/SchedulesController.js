const Schedule = require("../models/Schedules");
const PastSchedule = require("../models/PastSchedules");
const TempSchedule = require("../models/TempSchedules");
const TempSolo = require("../models/TempSoloSchedules");
const Notification = require("../models/Notifications");
const uniqid = require("uniqid");
const cron = require("node-cron");

// schedule

const createSchedule = async (req, res) => {
  const { day, timing, studentType } = req.body;

  const scheduleExists = await Schedule.exists({
    $and: [{ studentType: "Solo" }, { day: day }, { timing: timing }],
  });

  const isVideoExistsPerm = await Schedule.exists({
    $and: [{ isVideoOn: true }, { day: day }, { timing: timing }],
  });

  const dyadExists = await Schedule.exists({
    $and: [{ studentType: "Dyad" }, { day: day }, { timing: timing }],
  });

  const dyadTempExists = await TempSchedule.exists({
    $and: [{ studentType: "Dyad" }, { tempSoloDay: day }, { timing: timing }],
  });

  const tempSoloScheduleExists = await TempSolo.exists({
    $and: [{ tempSoloDay: day }, { timing: timing }],
  });

  if (scheduleExists) {
    return res.status(409).json({
      message: "You cannot duplicate existing schedules.",
    });
  } else if (dyadExists && studentType === "Solo") {
    return res.status(409).json({
      message:
        "You cannot combine solo-type schedules with any other schedules.",
    });
  } else if (isVideoExistsPerm) {
    return res.status(409).json({
      message: "You cannot combine online schedules with offline schedules.",
    });
  } else if (dyadTempExists && studentType === "Solo") {
    return res.status(409).json({
      message:
        "You cannot combine temporary dyad schedules with solo schedules or temporary solo schedules.",
    });
  } else if (tempSoloScheduleExists) {
    return res.status(409).json({
      message:
        "You cannot combine temporary solo schedules with any other schedules",
    });
  } else {
    try {
      const schedules = await new Schedule({
        ...req.body,
        scheduleId: uniqid(),
      }).save();
      res.status(200).json({
        data: schedules,
        message: "A new schedule has been added to the database.",
      });
    } catch (error) {
      res.status(400).json({
        message: "Error adding new schedule to database.",
      });
    }
  }
};

const getSchedule = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("student", "studentNo studentType parent")
      .exec();
    res.status(200).json({
      schedules,
      message: "Successful getting the schedules!",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error occurred, please try again!" });
  }
};

const isVideoOff = async () => {
  try {
    const currentDay = new Date().toLocaleString("en-us", { weekday: "long" });
    await updateSchedulesForDay(currentDay);
  } catch (error) {
    console.error("Error updating schedules:", error);
  }
};

const updateSchedulesForDay = async (day) => {
  try {
    await Schedule.updateMany({ day }, { isVideoOn: false });
    console.log(`Updated schedules for ${day}`);
  } catch (error) {
    throw new Error(`Failed to update schedules for ${day}: ${error.message}`);
  }
};

const isVideoOffHandler = () => {
  cron.schedule("59 23 * * *", isVideoOff);
};

isVideoOffHandler();

const isActiveDef = async () => {
  try {
    const currentDay = new Date().toLocaleString("en-us", { weekday: "long" });
    await updateSchedulesIsActiveDef(currentDay);
  } catch (error) {
    console.error("Error updating schedules:", error);
  }
};

const updateSchedulesIsActiveDef = async (day) => {
  try {
    await Schedule.updateMany({ day }, { isActive: "No information yet" });
    console.log(`Updated schedules for ${day}`);
  } catch (error) {
    throw new Error(`Failed to update schedules for ${day}: ${error.message}`);
  }
};

const isActiveDefHandler = () => {
  cron.schedule("59 23 * * *", isActiveDef);
};

isActiveDefHandler();

const updateSchedulesIsActiveToAbsent = async () => {
  try {
    const today = new Date();

    const todayDay = today.toLocaleString("en-us", { weekday: "long" });

    await updateSchedulesIsActiveToAbsentDef(todayDay);
  } catch (error) {
    console.error("Error updating schedules:", error);
  }
};

const updateSchedulesIsActiveToAbsentDef = async (day) => {
  try {
    const schedules = await Schedule.find({
      day: day,
      isActive: "No information yet",
    });

    if (schedules.length > 0) {
      const pastSchedulesPromises = schedules.map((schedule) => {
        const pastScheduleData = {
          ...schedule.toObject(),
          _id: new mongoose.Types.ObjectId(),
        };

        const pastSchedule = new PastSchedule(pastScheduleData);
        return pastSchedule.save();
      });

      await Promise.all(pastSchedulesPromises);

      const ids = schedules.map((schedule) => schedule._id);
      await Schedule.updateMany(
        { _id: { $in: ids } },
        {
          $set: { isActive: "Absent" },
          $inc: { absentCounter: 1 },
        }
      );
    }
  } catch (error) {
    throw new Error(`Failed to update schedules for ${day}: ${error.message}`);
  }
};

const isActiveAbsentHandler = () => {
  cron.schedule("00 00 * * *", updateSchedulesIsActiveToAbsent);
};

isActiveAbsentHandler();

const getOneSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateOneSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).exec();

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.json(schedule);
  } catch (error) {
    return res.status(400).json({ message: "Error updating schedule" });
  }
};

const deleteOneSchedule = async (req, res) => {
  try {
    const deletedSched = await Schedule.findByIdAndDelete(req.params.id);

    if (!deletedSched) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: "Error deleting schedule" });
  }
};

const deleteManySchedule = async (req, res) => {
  try {
    const { schedules } = req.body;
    const userData = req.user;

    await Schedule.deleteMany({ _id: { $in: schedules } });

    await Notification.create({
      userId: userData._id,
      typeOfNotif: "Schedule",
      actionOfNotif: "Delete",
      message: `Selected schedules has been deleted successfully.`,
      createdAt: new Date(),
    });

    res
      .status(200)
      .json({ message: "Selected schedules has been deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const createTempSchedule = async (req, res) => {
//   const { tempSoloDay, timing, dateTime } = req.body;

//   const today = moment().tz("Asia/Manila").format("YYYY-MM-DD");
//   const tomorrow = moment().add(1, "day").startOf("day");

//   if (today === dateTime) {
//     return res.status(409).send("Cannot schedule on same day!");
//   }

//   if (moment(dateTime).isBefore(today, "day")) {
//     return res.status(409).send("Selected date is in the past!");
//   }

//   if (moment(dateTime).isAfter(tomorrow.add(5, "days"), "day")) {
//     return res
//       .status(409)
//       .send("Selected date is more than 6 days from tomorrow!");
//   }

//   const scheduleExists = await Schedule.exists({
//     $and: [{ studentType: "Solo" }, { day: tempSoloDay }, { timing: timing }],
//   });

//   if (scheduleExists) {
//     return res.status(409).send("Conflict with 'Solo' student!");
//   }

//   const tempSoloScheduleExists = await TempSolo.exists({
//     $and: [{ tempSoloDay: tempSoloDay }, { timing: timing }],
//   });

//   if (tempSoloScheduleExists) {
//     return res.status(409).send("Conflict with 'Solo' student!");
//   }

//   try {
//     const newSchedule = await new TempSchedule({
//       ...req.body,
//       cardId: uniqid(),
//     }).save();
//     res.json(newSchedule);
//   } catch (err) {
//     console.log(err);
//     res
//       .status(400)
//       .json("Error creating temporary schedule! Please try again.");
//   }
// };

// const getTempSchedule = async (req, res) => {
//   try {
//     const tempScheds = await TempSchedule.find()
//       .populate(
//         "permanentSched",
//         "day timing parent nameOfStudent cardId isVideoOn"
//       )
//       .populate("tempStudentName", "parent nameOfStudent studentType schedType")
//       .exec();

//     res.json(tempScheds);
//   } catch (error) {
//     return res.status(500).send("Error occured. Please try again");
//   }
// };

// const deleteOneTempSchedule = async (req, res) => {
//   try {
//     const deletedTempSched = await TempSchedule.findByIdAndDelete(
//       req.params.id
//     );
//     if (!deletedTempSched) {
//       return res.status(404).json({ error: "Item not found" });
//     }
//     res.json({ success: true });
//   } catch (err) {
//     res.status(400).json("Deletion failed.");
//   }
// };

// const deleteTempSchedules = async (req, res) => {
//   try {
//     const currentDate = new Date();
//     const formattedDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       currentDate.getDate()
//     );

//     const schedulesToClone = await TempSchedule.find({
//       dateTime: { $lt: formattedDate },
//     });

//     console.log("Schedules to be cloned:", schedulesToClone);

//     const clonedSchedules = await TempLogs.insertMany(schedulesToClone);

//     console.log("Cloned schedules:", clonedSchedules);

//     const deleteResult = await TempSchedule.deleteMany({
//       dateTime: { $lt: formattedDate },
//     });

//     console.log("Schedules deleted:", deleteResult);

//     await Schedule.updateMany(
//       {
//         _id: {
//           $in: schedulesToClone.map((schedule) => schedule.tempStudentName),
//         },
//       },
//       { $set: { isActive: "Present" } }
//     );

//     res.status(200).json("Expired schedules deleted and cloned.");
//   } catch (error) {
//     res.status(500).json("Error deleting expired schedules and cloning.");
//   }
// };

// // temporary solo schedule

// const createTempSoloSchedule = async (req, res) => {
//   const { day, timing, tempSoloDay, dateTime } = req.body;

//   const today = moment().tz("Asia/Manila").format("YYYY-MM-DD");
//   const tomorrow = moment().add(1, "day").startOf("day");

//   if (today === dateTime) {
//     return res.status(409).send("Cannot schedule on same day!");
//   }

//   if (moment(dateTime).isBefore(today, "day")) {
//     return res.status(409).send("Selected date is in the past!");
//   }

//   if (moment(dateTime).isAfter(tomorrow.add(5, "days"), "day")) {
//     return res
//       .status(409)
//       .send("Selected date is more than 6 days from tomorrow!");
//   }

//   const scheduleExists = await Schedule.exists({
//     $and: [
//       { isActive: "Present" && "No information yet" },
//       { day: day },
//       { timing: timing },
//     ],
//   });

//   if (scheduleExists) {
//     return res.status(409).send("Slot Occupied!");
//   }

//   const tempScheduleExists = await TempSchedule.exists({
//     $and: [{ tempSoloDay: tempSoloDay }, { timing: timing }],
//   });

//   if (tempScheduleExists) {
//     return res.status(409).send("Schedule already exists");
//   }

//   try {
//     const newSchedule = await new TempSolo({
//       ...req.body,
//       cardId: uniqid(),
//     }).save();
//     res.json(newSchedule);
//   } catch (err) {
//     console.log(err);
//     res.status(400).json("Temporary schedule create error.");
//   }
// };

// const getTempSoloSchedule = async (req, res) => {
//   try {
//     const tempScheds = await TempSolo.find()
//       .populate("tempStudentName", "parent nameOfStudent studentType schedType")
//       .exec();

//     res.json(tempScheds);
//   } catch (error) {
//     return res.status(500).send("Error occured. Please try again");
//   }
// };

// const deleteOneTempSoloSchedule = async (req, res) => {
//   try {
//     const deletedTempSched = await TempSolo.findByIdAndDelete(req.params.id);
//     if (!deletedTempSched) {
//       return res.status(404).json({ error: "Item not found" });
//     }
//     res.json({ success: true });
//   } catch (err) {
//     res.status(400).json("Deletion failed.");
//   }
// };

// const deleteTempSoloSchedules = async (req, res) => {
//   try {
//     const currentDate = new Date();
//     const formattedDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       currentDate.getDate()
//     );

//     const schedulesToClone = await TempSolo.find({
//       dateTime: { $lt: formattedDate },
//     });

//     console.log("Schedules to be cloned:", schedulesToClone);

//     const clonedSchedules = await TempSoloLogs.insertMany(schedulesToClone);

//     console.log("Cloned schedules:", clonedSchedules);

//     const deleteResult = await TempSolo.deleteMany({
//       dateTime: { $lt: formattedDate },
//     });

//     console.log("Schedules deleted:", deleteResult);

//     await Schedule.updateMany(
//       {
//         _id: {
//           $in: schedulesToClone.map((schedule) => schedule.tempStudentName),
//         },
//       },
//       { $set: { isActive: "Present" } }
//     );

//     res.status(200).json("Expired schedules deleted and cloned.");
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // setting isActive state

// const setActive = async (req, res) => {
//   try {
//     const { isActive } = req.body;
//     await Schedule.findByIdAndUpdate(req.params.id, { isActive });
//     res.status(200).json({ message: "Active status changed." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

// const setActiveTemp = async (req, res) => {
//   try {
//     const { isActive } = req.body;
//     await TempSchedule.findByIdAndUpdate(req.params.id, { isActive });
//     res.status(200).json({ message: "Active status changed." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

// const setActiveTempSolo = async (req, res) => {
//   try {
//     const { isActive } = req.body;
//     await TempSolo.findByIdAndUpdate(req.params.id, { isActive });
//     res.status(200).json({ message: "Active status changed." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

// const setVideo = async (req, res) => {
//   try {
//     const { isVideoOn } = req.body;
//     await Schedule.findByIdAndUpdate(req.params.id, { isVideoOn });
//     res.status(200).json({ message: "Active status changed." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

// const setVideoTempSolo = async (req, res) => {
//   try {
//     const { isVideoOn } = req.body;
//     await TempSolo.findByIdAndUpdate(req.params.id, { isVideoOn });
//     res.status(200).json({ message: "Active status changed." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

// // setting absentCounter

// const setPlusAbsentCounter = async (req, res) => {
//   try {
//     const { absentCounter } = req.body;
//     await Schedule.findByIdAndUpdate(req.params.id, { absentCounter });
//     res.status(200).json({ message: "Active status changed." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

// const setMinusAbsentCounter = async (req, res) => {
//   try {
//     const { absentCounter } = req.body;
//     await Schedule.findByIdAndUpdate(req.params.id, { absentCounter });
//     res.status(200).json({ message: "Active status changed." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

// //progress report

// const setWaitlistStatus = async (req, res) => {
//   try {
//     const { isWaitlisted } = req.body;
//     const updatedSchedule = await Schedule.findByIdAndUpdate(
//       req.params.id,
//       { isWaitlisted },
//       { new: true }
//     );

//     if (!updatedSchedule) {
//       return res.status(404).json({ error: "Schedule not found." });
//     }

//     res.status(200).json({
//       message: "isWaitlisted status changed.",
//       updatedSchedule,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to change active status." });
//   }
// };

module.exports = {
  createSchedule,
  getSchedule,
  getOneSchedule,
  updateOneSchedule,
  deleteOneSchedule,
  deleteManySchedule,

  // createTempSchedule,
  // getTempSchedule,
  // deleteOneTempSchedule,
  // deleteTempSchedules,

  // createTempSoloSchedule,
  // getTempSoloSchedule,
  // deleteOneTempSoloSchedule,
  // deleteTempSoloSchedules,

  // setActive,
  // setActiveTemp,
  // setActiveTempSolo,
  // setVideo,
  // setVideoTempSolo,
  // setWaitlistStatus,

  isVideoOffHandler,
  isActiveDefHandler,

  // setPlusAbsentCounter,
  // setMinusAbsentCounter,
};
