"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import TabIndicator from "@/components/admin/TabIndicator";
import TabAssignment from "@/components/admin/TabAssignment";
import TabResult from "@/components/admin/TabResult";

export default function AdminEvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"indicator" | "assignment" | "result">("indicator");
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    const fetchEval = async () => {
      try {
        const res = await api.get(`/evaluations/${resolvedParams.id}`);
        setEvaluation(res.data);
      } catch (err) {
        // Fallback demo string display
        setEvaluation({ id: resolvedParams.id, name: `Evaluation ${resolvedParams.id}` });
      }
    };
    fetchEval();
  }, [resolvedParams.id]);

  if (!evaluation) return <div className="text-center py-10">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2 mr-4">
            กลับ
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 inline-block align-middle">
            รายละเอียด: {evaluation.name}
          </h1>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("indicator")}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                activeTab === "indicator"
                  ? "text-blue-600 border-blue-600 active"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              หัวข้อประเมิน (Topics & Indicators)
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("assignment")}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                activeTab === "assignment"
                  ? "text-blue-600 border-blue-600 active"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              คู่ประเมิน (Assignments)
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("result")}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                activeTab === "result"
                  ? "text-blue-600 border-blue-600 active"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              ผลการประเมิน
            </button>
          </li>
        </ul>
      </div>

      <div className="mt-4">
        {activeTab === "indicator" && <TabIndicator evaluationId={resolvedParams.id} />}
        {activeTab === "assignment" && <TabAssignment evaluationId={resolvedParams.id} />}
        {activeTab === "result" && <TabResult evaluationId={resolvedParams.id} />}
      </div>
    </div>
  );
}
