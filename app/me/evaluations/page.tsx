"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { FaEye } from "react-icons/fa";
import api from "@/lib/api";

interface EvaluateeAssignment {
  assignmentId: string;
  evaluationName: string;
  evaluatorName: string;
  status: "PENDING" | "COMPLETED";
  totalScorePercentage?: number;
}

export default function EvaluateeEvaluationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<EvaluateeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvals = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await api.get(`/assignments/evaluatee/${user.id}`);
        const mapped = res.data.map((ast: any) => ({
          assignmentId: ast.id,
          evaluationName: ast.evaluation?.name || "การประเมิน",
          evaluatorName: ast.evaluatorName,
          status: ast.gradedIndicators >= ast.totalIndicators && ast.totalIndicators > 0 ? "COMPLETED" : "PENDING",
          totalScorePercentage: ast.totalScorePercentage
        }));
        setAssignments(mapped);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvals();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">รายการผลประเมินของฉัน</h1>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 w-16">ลำดับ</th>
              <th scope="col" className="px-6 py-3">ชื่อแบบประเมิน</th>
              <th scope="col" className="px-6 py-3">ผู้ประเมิน</th>
              <th scope="col" className="px-6 py-3 text-center">สถานะ</th>
              <th scope="col" className="px-6 py-3 text-center text-blue-700">คะแนน (%)</th>
              <th scope="col" className="px-6 py-3 text-right">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">กำลังโหลดข้อมูล...</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4">คุณไม่มีรายการประเมิน</td></tr>
            ) : (
              assignments.map((ast, index) => (
                <tr key={ast.assignmentId} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {ast.evaluationName}
                  </td>
                  <td className="px-6 py-4">{ast.evaluatorName}</td>
                  <td className="px-6 py-4 text-center">
                    {ast.status === "COMPLETED" ? (
                      <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">ประเมินแล้ว</span>
                    ) : (
                      <span className="text-orange-500 font-semibold bg-orange-50 px-2 py-1 rounded">รอประเมิน</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {ast.status === "COMPLETED" ? (
                      <span className="font-bold text-blue-600 text-lg">{ast.totalScorePercentage}%</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" onClick={() => router.push(`/me/evaluations/${ast.assignmentId}`)}>
                      <FaEye className="mr-2" /> ดูข้อมูล
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
