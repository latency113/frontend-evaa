"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { th } from "date-fns/locale";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuthStore } from "@/stores/authStore";

const MySwal = withReactContent(Swal);

interface Evaluation {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  creatorName: string; // assumed relation mapping
}

const editSchema = yup.object({
  name: yup.string().required("กรุณากรอกชื่อแบบประเมิน"),
  startDate: yup.string().required("กรุณาระบุวันที่เริ่ม"),
  endDate: yup.string().required("กรุณาระบุวันสิ้นสุด"),
});

type FormData = yup.InferType<typeof editSchema>;

export default function AdminEvaluationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create / Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: yupResolver(editSchema)
  });

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/evaluations");
      // Mapped to actual backend array structure (maybe `list`, `data` or direct array)
      setEvaluations(Array.isArray(res.data) ? res.data : (res.data.data || [])); 
    } catch (err: any) {
      if(err.response?.status === 403) {
        MySwal.fire("ถูกระงับสิทธิ์", "คุณไม่มีสิทธิ์เข้าถึงหน้านี้!", "error").then(() => router.push("/home"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/home");
      return;
    }
    fetchEvaluations();
  }, [user]);

  const onDelete = async (id: string) => {
    const result = await MySwal.fire({
      title: "ยืนยันการลบ?",
      text: "คุณต้องการลบแบบประเมินนี้ใช่หรือไม่!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก"
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/evaluations/${id}`);
        MySwal.fire("ลบสำเร็จ!", "แบบประเมินถูกลบแล้ว", "success");
        fetchEvaluations();
      } catch (err) {
        MySwal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
      }
    }
  };

  const openCreateModal = () => {
    reset({ name: "", startDate: "", endDate: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        createdBy: user?.id
      };
      
      if (editingId) {
        await api.patch(`/evaluations/${editingId}`, payload);
        MySwal.fire({ icon: "success", title: "แก้ไขสำเร็จ", timer: 1500, showConfirmButton: false });
        setEditingId(null);
      } else {
        await api.post("/evaluations", payload);
        MySwal.fire({ icon: "success", title: "สร้างแบบประเมินสำเร็จ", timer: 1500, showConfirmButton: false });
        setIsModalOpen(false);
      }
      fetchEvaluations();
    } catch (err: any) {
      MySwal.fire("เกิดข้อผิดพลาด", err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ", "error");
    }
  };

  const handleInlineEdit = (ev: Evaluation) => {
    setEditingId(ev.id);
    setValue("name", ev.name);
    setValue("startDate", format(new Date(ev.startDate), "yyyy-MM-dd"));
    setValue("endDate", format(new Date(ev.endDate), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลการประเมิน</h1>
        <Button onClick={openCreateModal}>+ เพิ่มการประเมิน</Button>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">ลำดับที่</th>
              <th scope="col" className="px-6 py-3">ชื่อแบบประเมิน</th>
              <th scope="col" className="px-6 py-3">วันเปิดประเมิน</th>
              <th scope="col" className="px-6 py-3">วันปิดประเมิน</th>
              <th scope="col" className="px-6 py-3">ชื่อผู้สร้าง</th>
              <th scope="col" className="px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">กำลังโหลดข้อมูล...</td></tr>
            ) : evaluations.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4">ไม่พบข้อมูลการประเมิน</td></tr>
            ) : (
              evaluations.map((ev, index) => (
                <React.Fragment key={ev.id}>
                  {editingId === ev.id ? (
                    <tr className="bg-blue-50 border-b">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4"><Input {...register("name")} error={errors.name?.message} className="mb-0" /></td>
                      <td className="px-6 py-4"><Input type="date" {...register("startDate")} error={errors.startDate?.message} className="mb-0" /></td>
                      <td className="px-6 py-4"><Input type="date" {...register("endDate")} error={errors.endDate?.message} className="mb-0" /></td>
                      <td className="px-6 py-4 text-gray-500">-</td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button size="sm" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>บันทึก</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>ยกเลิก</Button>
                      </td>
                    </tr>
                  ) : (
                    <tr className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {ev.name}
                      </td>
                      <td className="px-6 py-4">
                        {format(new Date(ev.startDate), "dd MMM yyyy", { locale: th })}
                      </td>
                      <td className="px-6 py-4">
                        {format(new Date(ev.endDate), "dd MMM yyyy", { locale: th })}
                      </td>
                      <td className="px-6 py-4">{ev.creatorName || "Admin"}</td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/evaluations/${ev.id}`)}>รายละเอียด</Button>
                        <Button size="sm" variant="outline" onClick={() => handleInlineEdit(ev)}>แก้ไข</Button>
                        <Button size="sm" variant="danger" onClick={() => onDelete(ev.id)}>ลบ</Button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="เพิ่มการประเมินใหม่">
        <form id="createForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="ชื่อแบบประเมิน" placeholder="แบบประเมินประจำปี 2026" {...register("name")} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="วันที่เริ่มต้น" type="date" {...register("startDate")} error={errors.startDate?.message} />
            <Input label="วันที่สิ้นสุด" type="date" {...register("endDate")} error={errors.endDate?.message} />
          </div>
        </form>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
          <Button type="submit" form="createForm" isLoading={isSubmitting}>บันทึก</Button>
        </div>
      </Modal>
    </div>
  );
}
