import React from "react";
import { BsTrash3, BsX } from "react-icons/bs";
import { FaTrashCan } from "react-icons/fa6";

const DeleteManyScheduleModal = ({
  deleteSelectedSchedules,
  handleCloseModalDeleteMany,
}) => {
  const handleDeleteManyAndClose = () => {
    try {
      deleteSelectedSchedules();
    } catch (error) {
      console.error("Error handling delete and close:", error);
    } finally {
      handleCloseModalDeleteMany();
    }
  };
  return (
    <>
      <div className="flex justify-center border-t-[1px] border-l-[1px] border-r-[1px] border-[#22272e] p-4 rounded-tl-[10px] rounded-tr-[10px] backdrop-filter backdrop-blur-md">
        <div className="w-[71px] h-[70px] bg-gradient-to-t from-[#ff3131] to-[#c5d1de] flex justify-center items-center rounded-[58px]">
          <BsX className="text-[56px] text-[#22272e]" />
        </div>
      </div>
      <div className="p-8 flex flex-col gap-2 text-[#c5d1de] bg-[#22272e] rounded-bl-[10px] rounded-br-[10px]">
        <div className="flex flex-col phone:justify-between justify-center items-center gap-6">
          <div className="mt-[-6px] phone:w-[260px] w-[260px] flex justify-center items-center text-[16px] text-[#c5d1de] rounded-[6px]">
            <div>Do you really want to delete these schedules?</div>
          </div>
        </div>
        <div className="text-white flex justify-center items-center gap-4 pt-4">
          <div
            onClick={handleDeleteManyAndClose}
            className="w-[100%] flex justify-start items-center gap-2 bg-gradient-to-br from-[#ff3131] to-[#ff3131] text-[#ffffff] hover:text-[white] border-[1px] border-[#22272e] py-2 px-4 rounded-[8px] cursor-pointer"
          >
            <span className="text-[16px]">Delete</span>
          </div>
          <div
            onClick={handleCloseModalDeleteMany}
            className="w-[100%] flex justify-start items-center gap-2 bg-gradient-to-br from-[#ffffff] to-[#c5d1de] text-[#2d333b] hover:text-[#22272e] border-[1px] border-[#22272e] py-2 px-4 rounded-[8px] cursor-pointer"
          >
            <span className="text-[16px]">Cancel</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteManyScheduleModal;
