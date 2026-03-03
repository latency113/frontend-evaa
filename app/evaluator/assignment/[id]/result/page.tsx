"use client";

import React, { useState, useEffect, use } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { FaDownload } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface ResultData {
  id: string; // assignment id
  evaluatorName: string;
  evaluateeName: string;
  totalScorePercentage: number;
  topics: {
    id: string;
    name: string;
    indicators: {
      id: string;
      name: string;
      type: "SCALE_1_4" | "YES_NO";
      weight: number;
      scoreGiven: number;
      scoreAdjusted: number;
      evidenceUrl?: string;
    }[];
  }[];
}

export default function EvaluatorTabResult({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assignments/${resolvedParams.id}/score`);
        setResult(res.data);
      } catch {
        console.error("Failed to fetch assignment result");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resolvedParams.id]);

  if (loading) return <div className="text-center py-10">กำลังโหลดผลประเมิน...</div>;
  if (!result) return <div className="text-center text-red-500 py-10">ไม่พบผลการประเมิน หรือยังประเมินไม่เสร็จสิ้น</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>กลับ</Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">ผลการประเมิน: {result.evaluateeName}</h1>
        </div>
      </div>

      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border max-w-xl mx-auto">
          <h4 className="text-lg font-bold mb-2 text-center text-blue-800">คะแนนประเมินรวม</h4>
          <div className="text-4xl font-extrabold text-center text-blue-600 mb-2">{result.totalScorePercentage}%</div>
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
            <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${result.totalScorePercentage}%` }}></div>
          </div>
        </div>

        <div className="space-y-6">
          {result.topics.map((topic, tIdx) => (
            <div key={topic.id} className="border rounded-lg overflow-hidden">
              <h5 className="font-semibold text-lg p-4 bg-blue-50 text-blue-900 border-b">
                {tIdx + 1}. {topic.name}
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 border-b border-t-0 font-medium">ลำดับ</th>
                      <th className="px-6 py-3 border-b border-t-0 font-medium w-1/3">ตัวชี้วัด</th>
                      <th className="px-6 py-3 border-b border-t-0 font-medium text-center">ประเภท</th>
                      <th className="px-6 py-3 border-b border-t-0 font-medium text-center">หลักฐาน</th>
                      <th className="px-6 py-3 border-b border-t-0 font-medium text-center">น้ำหนัก</th>
                      <th className="px-6 py-3 border-b border-t-0 font-medium text-center bg-gray-100">คะแนนที่ได้</th>
                      <th className="px-6 py-3 border-b border-t-0 font-medium text-center text-blue-700 bg-blue-50">คะแนนปรังปรุง (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topic.indicators.map((ind, iIdx) => (
                      <tr key={ind.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-6 py-4 text-center">{iIdx + 1}</td>
                        <td className="px-6 py-4 font-medium">{ind.name}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge color={ind.type === "SCALE_1_4" ? "blue" : "indigo"}>
                            {ind.type === "SCALE_1_4" ? "ระดับ 1-4" : "ผ่าน/ไม่ผ่าน"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {ind.evidenceUrl ? (
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_URL}${ind.evidenceUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:underline flex items-center justify-center gap-1"
                            >
                              <FaDownload size={14} /> เปิดดู
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">{ind.weight}%</td>
                        <td className="px-6 py-4 text-center bg-gray-50">{ind.scoreGiven}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/50">{ind.scoreAdjusted}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t border-gray-300">
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-right">คะแนนรวมหมวดนี้:</td>
                      <td className="px-6 py-4 text-center text-blue-800 text-lg">
                        {topic.indicators.reduce((acc, ind) => acc + ind.scoreAdjusted, 0)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
