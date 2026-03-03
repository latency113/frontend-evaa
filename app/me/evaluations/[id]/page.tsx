"use client";

import React, { useState, useEffect, use } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaUpload, FaDownload, FaLock } from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function EvaluateeDetailView({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"indicator" | "result">("indicator");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingIndicatorId, setUploadingIndicatorId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assignments/${resolvedParams.id}/form`);
      setData(res.data);
    } catch {
      console.error("Failed to load evaluatee assignment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const handleUploadClick = async (indicatorId: string) => {
    const { value: file } = await MySwal.fire({
      title: "แนบหลักฐานประกอบ",
      input: "file",
      inputAttributes: {
        accept: "application/pdf,image/*",
        "aria-label": "อัปโหลดไฟล์"
      },
      showCancelButton: true,
      confirmButtonText: "อัปโหลด",
      cancelButtonText: "ยกเลิก"
    });

    if (file) {
      try {
        setUploadingIndicatorId(indicatorId);
        // Simulate or do real FormData upload to backend API
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/assignments/${resolvedParams.id}/evidence/${indicatorId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        MySwal.fire("สำเร็จ", "อัปโหลดไฟล์เรียบร้อยแล้ว", "success");
        fetchData();
      } catch {
        MySwal.fire("ข้อผิดพลาด", "ไม่สามารถอัปโหลดไฟล์หลักฐานได้", "error");
      } finally {
        setUploadingIndicatorId(null);
      }
    }
  };

  if (loading || !data) return <div className="text-center py-10">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>กลับ</Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">การประเมิน: {data.evaluationName}</h1>
          <p className="text-gray-600 mt-1 pl-3 font-medium">ผู้ประเมิน: {data.evaluatorName}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("indicator")}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                activeTab === "indicator" ? "text-blue-600 border-blue-600" : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              รายละเอียดตัวชี้วัด (อัปโหลดหลักฐาน)
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => {
                if (data.isCompleted) setActiveTab("result");
                else MySwal.fire("ล็อค", "สามารถดูผลประเมินได้ต่อเมื่อผู้ประเมินให้คะแนนครบทุกข้อแล้ว", "info");
              }}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                activeTab === "result" ? "text-blue-600 border-blue-600" : "border-transparent hover:border-gray-300"
              } ${!data.isCompleted ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {!data.isCompleted && <FaLock className="mr-2" />} ผลการประเมิน
            </button>
          </li>
        </ul>
      </div>

      {activeTab === "indicator" && (
        <div className="space-y-6">
          {data.topics.map((topic: any, tIdx: number) => (
            <div key={topic.id} className="bg-white border rounded-lg shadow-sm">
              <h5 className="font-semibold text-lg p-4 bg-blue-50 text-blue-900 border-b">
                {tIdx + 1}. {topic.name}
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 font-medium w-16">ลำดับ</th>
                      <th className="px-6 py-3 font-medium w-1/3">ตัวชี้วัด</th>
                      <th className="px-6 py-3 font-medium text-center">หลักฐานที่ต้องการ</th>
                      <th className="px-6 py-3 font-medium text-center">จัดการเอกสาร</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topic.indicators.map((ind: any, iIdx: number) => (
                      <tr key={ind.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-6 py-4">{iIdx + 1}</td>
                        <td className="px-6 py-4">{ind.name}</td>
                        <td className="px-6 py-4 text-center">
                          {ind.requiresEvidence ? <span className="text-orange-600 font-semibold">จำเป็น</span> : <span className="text-gray-400">ไม่จำเป็น</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {ind.requiresEvidence ? (
                            ind.evidenceUrl ? (
                              <div className="flex items-center justify-center gap-2">
                                <a href={`${process.env.NEXT_PUBLIC_API_URL}${ind.evidenceUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                  <FaDownload /> เปิดดู
                                </a>
                                <span className="text-gray-300">|</span>
                                <button
                                  className="text-gray-600 hover:text-blue-600 underline text-xs"
                                  onClick={() => handleUploadClick(ind.id)}
                                  disabled={uploadingIndicatorId === ind.id}
                                >
                                  {uploadingIndicatorId === ind.id ? "กำลังโหลด..." : "เปลี่ยนเอกสาร"}
                                </button>
                              </div>
                            ) : (
                              <Button size="sm" onClick={() => handleUploadClick(ind.id)} disabled={uploadingIndicatorId === ind.id}>
                                <FaUpload className="mr-2" /> แนบไฟล์
                              </Button>
                            )
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "result" && data.isCompleted && (
        <div className="bg-white p-6 border rounded-lg shadow-sm animate-fade-in">
          <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200 max-w-xl mx-auto">
            <h4 className="text-lg font-bold mb-2 text-center text-green-800">คะแนนประเมินรวม</h4>
            <div className="text-4xl font-extrabold text-center text-green-600 mb-2">{data.totalScorePercentage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-green-500 h-4 rounded-full" style={{ width: `${data.totalScorePercentage}%` }}></div>
            </div>
          </div>

          <div className="space-y-6">
            {data.topics.map((topic: any, tIdx: number) => (
              <div key={topic.id} className="border rounded-lg overflow-hidden">
                <h5 className="font-semibold text-lg p-4 bg-gray-50 border-b">
                  {tIdx + 1}. {topic.name}
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-700">
                      <tr>
                        <th className="px-6 py-3 border-b border-t-0 font-medium w-16">ลำดับ</th>
                        <th className="px-6 py-3 border-b border-t-0 font-medium">ตัวชี้วัด</th>
                        <th className="px-6 py-3 border-b border-t-0 font-medium text-center">ประเภท</th>
                        <th className="px-6 py-3 border-b border-t-0 font-medium text-center">น้ำหนัก</th>
                        <th className="px-6 py-3 border-b border-t-0 font-medium text-center">คะแนนที่ได้</th>
                        <th className="px-6 py-3 border-b border-t-0 font-medium text-center bg-gray-50">คะแนนปรังปรุง (%)</th>
                        <th className="px-6 py-3 border-b border-t-0 font-medium text-center">หลักฐาน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topic.indicators.map((ind: any, iIdx: number) => (
                        <tr key={ind.id} className="border-b last:border-0">
                          <td className="px-6 py-4 text-center">{iIdx + 1}</td>
                          <td className="px-6 py-4 font-medium">{ind.name}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge color={ind.type === "SCALE_1_4" ? "blue" : "indigo"}>
                              {ind.type === "SCALE_1_4" ? "ระดับ 1-4" : "ผ่าน/ไม่ผ่าน"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-500">{ind.weight}%</td>
                          <td className="px-6 py-4 text-center font-bold text-gray-800">{ind.scoreGiven}</td>
                          <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/10">{ind.scoreAdjusted}%</td>
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
                            ) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
