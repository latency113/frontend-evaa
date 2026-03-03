"use client";

import React, { useState, useEffect, use } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FaCheckCircle, FaHourglassHalf } from "react-icons/fa";
import { useAuthStore } from "@/stores/authStore";

interface EvaluateeProgress {
  assignmentId: string;
  evaluateeName: string;
  totalIndicators: number;
  gradedIndicators: number;
  status: "PENDING" | "COMPLETED"; // custom frontend state
}

export default function EvaluatorAssignmentListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [evaluatees, setEvaluatees] = useState<EvaluateeProgress[]>([]);
  const [evaluationName, setEvaluationName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await api.get(`/assignments/evaluator/${user.id}`);
        
        // Filter assignments for this specific evaluation
        const evaluationAssignments = res.data.filter((ast: any) => ast.evaluationId === resolvedParams.id);
        
        if (evaluationAssignments.length > 0) {
          setEvaluationName(evaluationAssignments[0].evaluation?.name || "การประเมิน");
          const mapped = evaluationAssignments.map((ast: any) => ({
            assignmentId: ast.id,
            evaluateeName: ast.evaluateeName,
            totalIndicators: ast.totalIndicators || 0,
            gradedIndicators: ast.gradedIndicators || 0,
            status: ast.gradedIndicators >= ast.totalIndicators && ast.totalIndicators > 0 ? "COMPLETED" : "PENDING"
          }));
          setEvaluatees(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch evaluatees", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [resolvedParams.id, user?.id]);

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/evaluator/evaluations")}>
          กลับ
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายการประเมินผู้รับการประเมิน</h1>
          <p className="text-gray-600">{evaluationName}</p>
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 align-middle">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100/50">
            <tr>
              <th scope="col" className="px-6 py-4 w-16">ลำดับ</th>
              <th scope="col" className="px-6 py-4">ชื่อผู้รับการประเมิน</th>
              <th scope="col" className="px-6 py-4 w-1/3">ความคืบหน้าการส่งผล</th>
              <th scope="col" className="px-6 py-4 text-center">สถานะ / การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {!evaluatees || evaluatees.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">ไม่พบข้อมูลคู่ประเมินของคุณ</td></tr>
            ) : (
              evaluatees.map((ev, index) => {
                const percent = Math.round((ev.gradedIndicators / (ev.totalIndicators || 1)) * 100);
                const isCompleted = ev.status === "COMPLETED" || percent === 100;
                
                return (
                  <tr key={ev.assignmentId} className="bg-white border-b hover:bg-blue-50/40 transition-colors group">
                    <td className="px-6 py-5 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {ev.evaluateeName}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">ผู้รับการประเมิน</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-bold text-gray-600">
                          {ev.gradedIndicators} / {ev.totalIndicators} <small className="font-normal opacity-70 ml-0.5">ตัวชี้วัด</small>
                        </span>
                        <span className={`text-sm font-black ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner border border-gray-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-2">
                        {isCompleted ? (
                          <>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 gap-1.5">
                              <FaCheckCircle /> ประเมินเสร็จสิ้น
                            </span>
                            <Button size="sm" variant="outline" className="text-xs h-8 px-4 font-bold border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => router.push(`/evaluator/assignment/${ev.assignmentId}/result`)}>
                              ดูผลการประเมิน
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 gap-1.5 animate-pulse-slow">
                              <FaHourglassHalf /> รอการประเมิน
                            </span>
                            <Button size="sm" className="text-xs h-8 px-5 font-bold shadow-md hover:shadow-lg transition-all" onClick={() => router.push(`/evaluator/assignment/${ev.assignmentId}`)}>
                              ประเมินทันที
                            </Button>
                          </>
                        )
                      }
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
