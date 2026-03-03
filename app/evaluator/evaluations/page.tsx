"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";

interface Evaluation {
  id: string;
  name: string;
}

export default function EvaluatorEvaluationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvals = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await api.get(`/assignments/evaluator/${user.id}`);
        // Map assignments to unique evaluations
        const evalsMap = new Map();
        res.data.forEach((ast: any) => {
          if (ast.evaluation) {
            evalsMap.set(ast.evaluation.id, ast.evaluation);
          }
        });
        setEvaluations(Array.from(evalsMap.values()));
      } catch (err) {
        console.error("Failed to fetch evaluations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvals();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">รายการประเมินที่รับผิดชอบ</h1>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-100">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100/50">
            <tr>
              <th scope="col" className="px-6 py-4 w-24">ลำดับที่</th>
              <th scope="col" className="px-6 py-4">ชื่อโครงการ / การประเมิน</th>
              <th scope="col" className="px-6 py-4 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-10 text-gray-400">กำลังโหลดข้อมูล...</td></tr>
            ) : evaluations.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-gray-400">ไม่มีรายการการประเมินที่คุณต้องรับผิดชอบในขณะนี้</td></tr>
            ) : (
              evaluations.map((ev, index) => (
                <tr key={ev.id} className="bg-white border-b hover:bg-blue-50/40 transition-colors group">
                  <td className="px-6 py-5 text-gray-400 font-medium">{index + 1}</td>
                  <td className="px-6 py-5 font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {ev.name}
                  </td>
                  <td className="px-6 py-5 flex justify-center">
                    <Button 
                      size="sm" 
                      className="px-6 font-bold shadow-sm hover:shadow-md transition-all h-9"
                      onClick={() => router.push(`/evaluator/evaluations/${ev.id}`)}
                    >
                      ดำเนินการประเมิน
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
