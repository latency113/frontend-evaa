import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { FaDownload } from "react-icons/fa";

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
      requiredEvidences?: boolean;
    }[];
  }[];
}

export default function TabResult({ evaluationId }: { evaluationId: string }) {
  const [assignments, setAssignments] = useState<{id: string, name: string}[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get(`/assignments/evaluation/${evaluationId}`);
        setAssignments(res.data.map((a: any) => ({
          id: a.id,
          name: `${a.evaluatorName} ➜ ${a.evaluateeName}`
        })));
      } catch {
        console.error("Failed to fetch assignments");
      }
    };
    fetchAssignments();
  }, [evaluationId]);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setResult(null);
      return;
    }
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assignments/${selectedAssignmentId}/score`);
        setResult(res.data);
      } catch {
        console.error("Failed to fetch results");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [selectedAssignmentId]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <label className="block text-sm font-medium mb-2 text-gray-700">เลือกคู่เพื่อดูผลการประเมิน</label>
        <select className="border-gray-300 rounded block w-full max-w-sm p-2.5 bg-gray-50 border text-gray-900"
          value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)}>
          <option value="">-- กรุณาเลือกคู่ประเมิน --</option>
          {assignments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-4">กำลังโหลดผลประเมิน...</div>}

      {result && !loading && (
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ผู้ประเมิน</p>
              <p className="font-semibold text-lg">{result.evaluatorName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ผู้รับการประเมิน</p>
              <p className="font-semibold text-lg">{result.evaluateeName}</p>
            </div>
          </div>
          
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-lg font-bold mb-2 text-center text-blue-800">คะแนนประเมินรวม</h4>
            <div className="text-4xl font-extrabold text-center text-blue-600 mb-2">{result.totalScorePercentage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${result.totalScorePercentage}%` }}></div>
            </div>
          </div>

          <div className="space-y-6">
            {result.topics.map((topic, tIdx) => (
              <div key={topic.id}>
                <h5 className="font-semibold text-lg mb-3 bg-blue-50 p-2 rounded text-blue-800">
                  {tIdx + 1}. {topic.name}
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 w-12 border-b">ลำดับ</th>
                        <th className="px-4 py-2 w-1/4 border-b">ตัวชี้วัด</th>
                        <th className="px-4 py-2 w-1/6 border-b text-center">ประเภท</th>
                        <th className="px-4 py-2 w-1/12 border-b text-center">น้ำหนัก</th>
                        <th className="px-4 py-2 w-1/6 border-b text-center">คะแนนที่ได้</th>
                        <th className="px-4 py-2 w-1/6 border-b text-center">ปรังปรุง (%)</th>
                        <th className="px-4 py-2 w-1/6 border-b text-center">หลักฐาน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topic.indicators.map((ind, iIdx) => (
                        <tr key={ind.id} className="border-b">
                          <td className="px-4 py-2 text-center">{iIdx + 1}</td>
                          <td className="px-4 py-2">{ind.name}</td>
                          <td className="px-4 py-2 text-center">
                            <Badge color={ind.type === "SCALE_1_4" ? "blue" : "indigo"}>
                              {ind.type === "SCALE_1_4" ? "ระดับ 1-4" : "ผ่าน/ไม่ผ่าน"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center bg-gray-50">{ind.weight}%</td>
                          <td className="px-4 py-2 text-center font-medium">{ind.scoreGiven}</td>
                          <td className="px-4 py-2 text-center font-bold text-blue-600 bg-gray-50">{ind.scoreAdjusted}%</td>
                          <td className="px-4 py-2 text-center">
                            {!ind.requiredEvidences ? (
                              <span className="text-gray-400">ไม่ใช้หลักฐาน</span>
                            ) : ind.evidenceUrl ? (
                              <a href={ind.evidenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                <FaDownload /> ดาวน์โหลด
                              </a>
                            ) : <span className="text-gray-400">ไม่มีหลักฐาน</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-semibold border-t">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right text-gray-700">คะแนนรวมหมวดข้อที่ {tIdx + 1}:</td>
                        <td className="px-4 py-3 text-center text-blue-800">
                          {topic.indicators.reduce((acc, ind) => acc + ind.scoreAdjusted, 0)}%
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
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
