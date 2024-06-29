import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import { FaPlus } from "react-icons/fa6";
import { ModalBox } from "../../auth/register/registerComponents/CreateUser";
import CreateTempSoloModalForm from "./CreateTempSoloModalForm";
import NotificationBell from "../../../externalComponents/NotificationBell/NotificationBell";

const initialState = {
  student: "",
  studentName: "",
  studentType: "",
  day: "",
  dateTime: "",
  timings: [
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
  timing: "",
};

const CreateTempSolo = ({
  schedules,
  getTempSoloSchedules,
  allowedRoles,
  auth,
  setLoading,
  toast,
  axios,
}) => {
  const [values, setValues] = useState(initialState);
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();

    try {
      if (!auth?.userDetails?.token) {
        console.error("Authentication token not found.");
        return;
      }

      const res = await axios.post(`/api/temp-solo`, values, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${auth?.userDetails?.token}`,
        },
      });
      await toast.success(res?.data?.message);
      setValues(initialState);
    } catch (err) {
      toast.error(err?.response?.data.message);
    } finally {
      handleCloseModal();
      getTempSoloSchedules();
    }
  };

  // dynamic value getting and DYNAMIC use of error messages -kludy

  const handleStudentChange = (e) => {
    const selectedStudent = e.target.value;
    const selectedStudentName =
      e.target.options[e.target.selectedIndex].getAttribute("data-studentname");
    const selectedStudentType =
      e.target.options[e.target.selectedIndex].getAttribute("data-studenttype");
    const selectedStudentId =
      e.target.options[e.target.selectedIndex].getAttribute("data-studentid");
    setValues({
      ...values,
      student: selectedStudent,
      studentName: selectedStudentName,
      studentType: selectedStudentType,
      studentId: selectedStudentId,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleDateChange = (date) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    setValues({
      ...values,
      dateTime: date,
      day: dayOfWeek,
    });
  };

  // create student modal functions

  const handleOpenModal = () => {
    setShowCreateScheduleModal(true);
  };

  const handleCloseModal = async () => {
    try {
      setShowCreateScheduleModal(false);
      setValues(initialState);
    } catch (error) {
      console.error("An error occurred while handling modal closure:", error);
    } finally {
      getTempSoloSchedules();
    }
  };

  return (
    <>
      <div className="w-100 flex justify-start items-center gap-4 text-[14px] text-[#c5d1de] pb-6 ">
        <span>MLAC / Temporary Solo</span>
        <NotificationBell auth={auth} axios={axios} />
      </div>
      <div className="w-100 text-[26px] text-[#c5d1de] pb-6 flex justify-between items-center">
        <div className="font-bold">Solo List</div>

        {allowedRoles?.find((ar) => auth?.userDetails?.role?.includes(ar)) ? (
          <div
            onClick={handleOpenModal}
            className="font-bold cursor-pointer py-3 px-4 bg-gradient-to-br from-[#ffffff] to-[#c5d1de] text-[#22272e] text-[16px] flex gap-2 items-center rounded-[8px]"
          >
            <FaPlus />
            <div>Add Solo</div>
          </div>
        ) : (
          <div className="font-bold cursor-pointer py-3 px-3 bg-gray-100 text-[white] text-[16px] flex gap-2 items-center rounded-[8px] font-bold">
            <FaPlus />
            <div>Add Solo</div>
          </div>
        )}
      </div>
      <Modal
        sx={{ border: "none", outline: "none" }}
        open={showCreateScheduleModal}
        onClose={handleCloseModal}
        aria-labelledby="parent-modal-title"
        aria-describedby="parent-modal-description"
      >
        <ModalBox>
          <CreateTempSoloModalForm
            schedules={schedules}
            values={values}
            handleChange={handleChange}
            handleCreateSchedule={handleCreateSchedule}
            handleCloseModal={handleCloseModal}
            handleStudentChange={handleStudentChange}
            handleDateChange={handleDateChange}
          />
        </ModalBox>
      </Modal>
    </>
  );
};

export default CreateTempSolo;
