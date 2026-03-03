"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const schema = yup.object({
  name: yup.string().required("กรุณากรอกชื่อ-นามสกุล"),
  departmentId: yup.string().required("กรุณาเลือกแผนก"),
  email: yup.string().email("อีเมลไม่ถูกต้อง").required("กรุณากรอกอีเมล"),
  password: yup.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร").required("กรุณากรอกรหัสผ่าน"),
  role: yup.string().oneOf(["EVALUATOR", "EVALUATEE"], "กรุณาเลือกสถานะเข้าร่วม").required("กรุณาเลือก Role"),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/home");
    }
    
    // Fetch departments
    const fetchDepts = async () => {
      try {
        const res = await api.get("/departments");
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepts();
  }, [isAuthenticated, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await api.post("/auth/register", data);
      
      await MySwal.fire({
        icon: "success",
        title: "ลงทะเบียนสำเร็จ",
        text: "คุณสามารถเข้าสู่ระบบด้วยบัญชีนี้ได้ทันที",
        confirmButtonColor: "#2563eb",
      });
      router.push("/login");
    } catch (err: any) {
      MySwal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.response?.data?.message || "ไม่สามารถลงทะเบียนได้ในขณะนี้",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-8">
      <div className="max-w-xl w-full bg-white p-8 border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 text-gray-900">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <h5 className="text-xl font-medium text-gray-900 text-center mb-6">ลงทะเบียนผู้ใช้งานใหม่</h5>
          
          <Input 
            label="ชื่อ-นามสกุล" 
            placeholder="สมชาย ใจดี" 
            {...register("name")}
            error={errors.name?.message}
          />

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 text-left">แผนก</label>
            <select 
              {...register("departmentId")}
              className={`bg-gray-50 border ${errors.departmentId ? "border-red-500" : "border-gray-300"} text-gray-900 rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">-- เลือกแผนก --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            {errors.departmentId && <p className="mt-2 text-sm text-red-600">{errors.departmentId.message}</p>}
          </div>

          <Input 
            label="อีเมล" 
            type="email" 
            placeholder="name@company.com" 
            {...register("email")}
            error={errors.email?.message}
          />

          <Input 
            label="รหัสผ่าน" 
            type="password" 
            placeholder="••••••••" 
            {...register("password")}
            error={errors.password?.message}
          />

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-900 text-left">บทบาท (Role)</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="EVALUATOR" {...register("role")} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                <span>ผู้ประเมิน (EVALUATOR)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="EVALUATEE" {...register("role")} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                <span>ผู้รับการประเมิน (EVALUATEE)</span>
              </label>
            </div>
            {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            ลงทะเบียน
          </Button>
        </form>
      </div>
    </div>
  );
}
