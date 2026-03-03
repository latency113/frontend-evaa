"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import api from "@/lib/api";
import { FaClipboardList, FaUsers, FaUserCheck } from "react-icons/fa";

interface DashboardStats {
  totalEvaluations?: number;
  totalEvaluators?: number;
  totalEvaluatees?: number;
  assignedEvaluations?: number;
}

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        if (user?.role === "ADMIN") {
          const [evalsRes, usersRes] = await Promise.all([
            api.get("/evaluations"),
            api.get("/users")
          ]);
          
          const totalEvaluations = evalsRes.data.length || 0;
          const totalEvaluators = usersRes.data.filter((u: any) => u.role === "EVALUATOR").length || 0;
          const totalEvaluatees = usersRes.data.filter((u: any) => u.role === "EVALUATEE").length || 0;
          
          setStats({ totalEvaluations, totalEvaluators, totalEvaluatees });
          
        } else if (user?.role === "EVALUATOR") {
          const res = await api.get(`/assignments/evaluator/${user.id}`);
          setStats({ assignedEvaluations: res.data.length || 0 });
          
        } else if (user?.role === "EVALUATEE") {
          const res = await api.get(`/assignments/evaluatee/${user.id}`);
          setStats({ assignedEvaluations: res.data.length || 0 });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user]);

  if (!user || loading) return <div className="text-center py-10">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">หน้าหลัก (Dashboard)</h1>
        <p className="text-gray-600 mt-2">ยินดีต้อนรับคุณ {user.name} ({user.role})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user.role === "ADMIN" && (
          <>
            <Card 
              title="การประเมินทั้งหมด" 
              value={stats.totalEvaluations || 0} 
              description="จำนวนแบบประเมินทั้งหมดในระบบ"
              icon={<FaClipboardList />}
              onClick={() => router.push("/admin/evaluations")}
            />
            <Card 
              title="ผู้ประเมิน" 
              value={stats.totalEvaluators || 0} 
              icon={<FaUserCheck />}
              description="จำนวน EVALUATOR ในระบบ"
            />
            <Card 
              title="ผู้รับการประเมิน" 
              value={stats.totalEvaluatees || 0} 
              icon={<FaUsers />}
              description="จำนวน EVALUATEE ในระบบ"
            />
          </>
        )}

        {user.role === "EVALUATOR" && (
          <Card 
            title="จำนวนแบบประเมินที่ได้รับมอบหมาย" 
            value={stats.assignedEvaluations || 0} 
            icon={<FaClipboardList />}
            onClick={() => router.push("/evaluator/evaluations")}
            className="md:col-span-1"
          />
        )}

        {user.role === "EVALUATEE" && (
          <Card 
            title="รายการประเมินที่ได้รับมอบหมาย" 
            value={stats.assignedEvaluations || 0} 
            icon={<FaClipboardList />}
            onClick={() => router.push("/me/evaluations")}
            className="md:col-span-1"
          />
        )}
      </div>
    </div>
  );
}
