"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaDownload, FaHourglassStart } from "react-icons/fa";

const MySwal = withReactContent(Swal);

interface AssessmentForm {
  evaluationName: string;
  evaluateeName: string;
  topics: {
    id: string;
    name: string;
    indicators: {
      id: string;
      name: string;
      type: "SCALE_1_4" | "YES_NO";
      weight: number;
      requiresEvidence: boolean;
      evidenceUrl?: string | null;
      scoreGiven: number | null;
    }[];
  }[];
}

export default function EvaluatorAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<AssessmentForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assignments/${resolvedParams.id}/form`);
        setData(res.data);
      } catch {
        console.error("Failed to load evaluation form");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams.id]);

  const handleScoreChange = (topicId: string, indicatorId: string, score: number) => {
    if (!data) return;
    const newData = { ...data };
    const topic = newData.topics.find(t => t.id === topicId);
    if (!topic) return;
    const ind = topic.indicators.find(i => i.id === indicatorId);
    if (ind) ind.scoreGiven = score;
    setData(newData);
  };

  const handleSave = async () => {
    if (!data) return;
    // Basic verification - checking if evidence constraints passed
    let valid = true;
    for (const t of data.topics) {
      for (const i of t.indicators) {
        if (i.requiresEvidence && !i.evidenceUrl && i.scoreGiven !== null) {
          valid = false;
        }
      }
    }
    
    if (!valid) {
      return MySwal.fire("ข้อผิดพลาด", "ไม่สามารถให้คะแนนข้อที่ขาดหลักฐานจำเป็นได้", "error");
    }

    try {
      setSaving(true);
      const payload = {
        scores: data.topics.flatMap(t => 
          t.indicators.filter(i => i.scoreGiven !== null).map(i => ({
            indicatorId: i.id,
            scoreGiven: i.scoreGiven
          }))
        )
      };
      
      await api.post(`/assignments/${resolvedParams.id}/form`, payload);
      await MySwal.fire("บันทึกสำเร็จ", "ระบบได้บันทึกคะแนนการประเมินแล้ว", "success");
      router.push("/evaluator/evaluations");
    } catch {
      MySwal.fire("ข้อผิดพลาด", "บันทึกข้อมูลไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">กำลังโหลดฟอร์มประเมิน...</div>;
  if (!data) return <div className="text-center text-red-500 py-10">ไม่พบฟอร์มการประเมิน</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>กลับ</Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">การประเมิน: {data.evaluateeName}</h1>
          <p className="text-gray-600 mt-1 pl-3 font-medium">{data.evaluationName}</p>
        </div>
      </div>

      <div className="space-y-8">
        {data.topics.map((topic, tIdx) => (
          <div key={topic.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b px-6 py-4">
              <h3 className="text-lg font-bold text-blue-900">ส่วนที่ {tIdx + 1}: {topic.name}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 w-16">ลำดับ</th>
                    <th className="px-6 py-3 w-1/3">ตัวชี้วัด</th>
                    <th className="px-6 py-3 w-32 text-center">หลักฐานประกอบ</th>
                    <th className="px-6 py-3 w-24 text-center">น้ำหนัก</th>
                    <th className="px-6 py-3 text-center w-64">ให้คะแนน / ผลประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {topic.indicators.map((ind, iIdx) => {
                    const cantGrade = ind.requiresEvidence && !ind.evidenceUrl;
                    
                    return (
                      <tr key={ind.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{iIdx + 1}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 mb-1">{ind.name}</p>
                          <Badge color={ind.type === "SCALE_1_4" ? "blue" : "indigo"}>
                            {ind.type === "SCALE_1_4" ? "ระดับ 1-4" : "ผ่าน/ไม่ผ่าน"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {ind.requiresEvidence ? (
                            ind.evidenceUrl ? (
                              <a href={`${process.env.NEXT_PUBLIC_API_URL}${ind.evidenceUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                                <FaDownload /> ดาวน์โหลด
                              </a>
                            ) : (
                              <span className="text-orange-500 font-semibold flex flex-col items-center justify-center gap-1">
                                <FaHourglassStart /> รอหลักฐาน
                              </span>
                            )
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700 font-semibold">{ind.weight}%</td>
                        <td className="px-6 py-4">
                          {cantGrade ? (
                            <div className="text-center text-sm text-orange-500 bg-orange-50 py-2 rounded">
                              ห้ามประเมิน (รอหลักฐาน)
                            </div>
                          ) : (
                            <select 
                              className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-50"
                              value={ind.scoreGiven || ""}
                              onChange={e => handleScoreChange(topic.id, ind.id, Number(e.target.value))}
                            >
                              <option value="" disabled>-- {ind.type === "YES_NO" ? "ผลประเมิน (ผ่าน/ไม่ผ่าน)" : "ให้คะแนน"} --</option>
                              {ind.type === "SCALE_1_4" ? (
                                <>
                                  <option value={1}>1 - ต้องปรับปรุง</option>
                                  <option value={2}>2 - พอใช้</option>
                                  <option value={3}>3 - ดี</option>
                                  <option value={4}>4 - ดีมาก</option>
                                </>
                              ) : (
                                <>
                                  <option value={0}>ไม่ผ่าน</option>
                                  <option value={1}>ผ่าน</option>
                                </>
                              )}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-6">
        <Button size="lg" onClick={handleSave} isLoading={saving} className="px-10">
          บันทึกผลการประเมิน
        </Button>
      </div>
    </div>
  );
}
