"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Link from "next/link";

const MySwal = withReactContent(Swal);

const schema = yup.object({
  email: yup.string().email("กรุณากรอกอีเมลให้ถูกต้อง").required("กรุณากรอกอีเมล"),
  password: yup.string().required("กรุณากรอกรหัสผ่าน"),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/login", data);
      
      // Extract token since backend only returns token
      const token = res.data.token || res.data.access_token || res.data;
      
      // Decode JWT token manually
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedUser = JSON.parse(jsonPayload);
      
      const user = {
        id: decodedUser.id,
        username: decodedUser.username,
        role: decodedUser.role,
        name: decodedUser.username, 
        email: decodedUser.email || "",
        department: decodedUser.department || "",
      };

      setAuth(user as any, token);
      
      await MySwal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        text: "ยินดีต้อนรับเข้าสู่ระบบ",
        timer: 1500,
        showConfirmButton: false
      });
      
      router.push("/home");
    } catch (err: any) {
      MySwal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: err.response?.data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow sm:p-6 md:p-8">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <h5 className="text-xl font-medium text-gray-900 text-center">เข้าสู่ระบบ</h5>
        
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

        <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
          เข้าสู่ระบบ
        </Button>
        <div className="text-sm font-medium text-gray-500 text-center">
          ยังไม่ได้ลงทะเบียน? <Link href="/register" className="text-blue-700 hover:underline">สร้างบัญชีผู้ใช้งาน</Link>
        </div>
      </form>
    </div>
  );
}
